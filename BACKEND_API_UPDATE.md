# 🔄 백엔드 API 수정 필요사항

## 🎯 변경 이유

**보안**: Client Secret을 프론트엔드에 노출하지 않기 위해, **인증 코드(code)**를 백엔드로 전달하고 백엔드에서 토큰 교환을 처리하도록 변경했습니다.

## 📋 백엔드 수정 사항

### 1. Request VO 수정

**기존:**

```kotlin
data class SocialLoginRequest(
    val accessToken: String,  // ❌ 액세스 토큰
    val provider: String,
    val deviceId: String? = null,
    val fcmToken: String? = null
)
```

**변경 후:**

```kotlin
data class SocialLoginRequest(
    val code: String,              // ✅ 인증 코드 (추가)
    val redirectUri: String,       // ✅ 리다이렉트 URI (추가)
    val provider: String,
    val deviceId: String? = null,
    val fcmToken: String? = null
)
```

### 2. Service 로직 수정

**기존 흐름:**

```
프론트엔드: 인증 코드 → 액세스 토큰 교환
            ↓
백엔드:     액세스 토큰으로 사용자 정보 조회
```

**변경 후 흐름:**

```
프론트엔드: 인증 코드만 전달
            ↓
백엔드:     인증 코드 → 액세스 토큰 교환 → 사용자 정보 조회
```

### 3. Kotlin 코드 구현

```kotlin
// src/main/kotlin/com/tigerbk/doberman/app/auth/SocialAuthSvc.kt

@Service
class SocialAuthSvc(
    private val jwtTokenProvider: JwtTokenProvider,
    private val userRepository: TbUserRepository,
    private val fcmService: FcmService,
    private val restTemplate: RestTemplate  // HTTP 클라이언트 추가
) {

    @Transactional
    fun socialLogin(request: SocialLoginRequest): SocialLoginResult {
        // 1. 인증 코드로 액세스 토큰 교환
        val accessToken = exchangeCodeForToken(request.provider, request.code, request.redirectUri)

        // 2. 액세스 토큰으로 소셜 제공자로부터 사용자 정보 조회
        val socialUserInfo = getSocialUserInfo(request.provider, accessToken)

        // 3. 나머지 로직 (기존과 동일)
        // ...
    }

    /**
     * 인증 코드를 액세스 토큰으로 교환
     */
    private fun exchangeCodeForToken(provider: String, code: String, redirectUri: String): String {
        return when (provider.lowercase()) {
            "google" -> exchangeGoogleCodeForToken(code, redirectUri)
            "kakao" -> exchangeKakaoCodeForToken(code, redirectUri)
            else -> throw IllegalArgumentException("지원하지 않는 소셜 로그인 제공자입니다: $provider")
        }
    }

    /**
     * Google 인증 코드를 액세스 토큰으로 교환
     */
    private fun exchangeGoogleCodeForToken(code: String, redirectUri: String): String {
        val tokenUrl = "https://oauth2.googleapis.com/token"

        val params = mapOf(
            "client_id" to googleClientId,      // application.yml에서 주입
            "client_secret" to googleClientSecret,
            "code" to code,
            "grant_type" to "authorization_code",
            "redirect_uri" to redirectUri
        )

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_FORM_URLENCODED
        }

        val request = HttpEntity(
            params.entries.joinToString("&") { "${it.key}=${URLEncoder.encode(it.value, "UTF-8")}" },
            headers
        )

        val response = restTemplate.postForEntity(tokenUrl, request, Map::class.java)

        if (!response.statusCode.is2xxSuccessful) {
            throw IllegalStateException("Google 토큰 교환 실패: ${response.body}")
        }

        return response.body?.get("access_token") as? String
            ?: throw IllegalStateException("액세스 토큰을 받지 못했습니다.")
    }

    /**
     * Kakao 인증 코드를 액세스 토큰으로 교환
     */
    private fun exchangeKakaoCodeForToken(code: String, redirectUri: String): String {
        val tokenUrl = "https://kauth.kakao.com/oauth/token"

        val params = mapOf(
            "client_id" to kakaoClientId,       // application.yml에서 주입
            "grant_type" to "authorization_code",
            "redirect_uri" to redirectUri,
            "code" to code
        )

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_FORM_URLENCODED
        }

        val request = HttpEntity(
            params.entries.joinToString("&") { "${it.key}=${URLEncoder.encode(it.value, "UTF-8")}" },
            headers
        )

        val response = restTemplate.postForEntity(tokenUrl, request, Map::class.java)

        if (!response.statusCode.is2xxSuccessful) {
            throw IllegalStateException("Kakao 토큰 교환 실패: ${response.body}")
        }

        return response.body?.get("access_token") as? String
            ?: throw IllegalStateException("액세스 토큰을 받지 못했습니다.")
    }

    /**
     * Google 사용자 정보 조회
     */
    private fun getGoogleUserInfo(accessToken: String): SocialUserInfo {
        val userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo"

        val headers = HttpHeaders().apply {
            set("Authorization", "Bearer $accessToken")
        }

        val request = HttpEntity<String>(headers)
        val response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, request, Map::class.java)

        if (!response.statusCode.is2xxSuccessful) {
            throw IllegalStateException("Google 사용자 정보 조회 실패")
        }

        val userData = response.body ?: throw IllegalStateException("사용자 정보가 없습니다.")

        return SocialUserInfo(
            socialId = userData["id"] as String,
            email = userData["email"] as? String,
            name = userData["name"] as? String,
            profileImage = userData["picture"] as? String,
            provider = "google"
        )
    }

    /**
     * Kakao 사용자 정보 조회
     */
    private fun getKakaoUserInfo(accessToken: String): SocialUserInfo {
        val userInfoUrl = "https://kapi.kakao.com/v2/user/me"

        val headers = HttpHeaders().apply {
            set("Authorization", "Bearer $accessToken")
        }

        val request = HttpEntity<String>(headers)
        val response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, request, Map::class.java)

        if (!response.statusCode.is2xxSuccessful) {
            throw IllegalStateException("Kakao 사용자 정보 조회 실패")
        }

        val userData = response.body ?: throw IllegalStateException("사용자 정보가 없습니다.")
        val kakaoAccount = userData["kakao_account"] as? Map<*, *>
        val profile = kakaoAccount?.get("profile") as? Map<*, *>

        return SocialUserInfo(
            socialId = userData["id"].toString(),
            email = kakaoAccount?.get("email") as? String,
            name = profile?.get("nickname") as? String,
            profileImage = profile?.get("profile_image_url") as? String,
            provider = "kakao"
        )
    }
}
```

### 4. application.yml 설정

```yaml
social:
  google:
    client-id: ${GOOGLE_CLIENT_ID}
    client-secret: ${GOOGLE_CLIENT_SECRET}
  kakao:
    client-id: ${KAKAO_CLIENT_ID}
```

### 5. Configuration 클래스

a

```kotlin
@Configuration
class SocialConfig {
    @Value("\${social.google.client-id}")
    lateinit var googleClientId: String

    @Value("\${social.google.client-secret}")
    lateinit var googleClientSecret: String

    @Value("\${social.kakao.client-id}")
    lateinit var kakaoClientId: String

    @Bean
    fun restTemplate(): RestTemplate {
        return RestTemplate()
    }
}
```

## 📝 프론트엔드 요청 예시

### Google 로그인

```http
POST /api/auth/social/google/login
Content-Type: application/json

{
  "code": "4/0AY0e-g7...",
  "redirectUri": "http://localhost:3000/auth/google/callback",
  "provider": "google",
  "deviceId": "web_1234567890_abc123",
  "fcmToken": ""
}
```

### Kakao 로그인

```http
POST /api/auth/social/kakao/login
Content-Type: application/json

{
  "code": "xAbCdEfG...",
  "redirectUri": "http://localhost:3000/auth/kakao/callback",
  "provider": "kakao",
  "deviceId": "web_1234567890_abc123",
  "fcmToken": ""
}
```

## ✅ 체크리스트

- [ ] `SocialLoginRequest` VO에 `code`, `redirectUri` 필드 추가
- [ ] `exchangeCodeForToken()` 메서드 구현
- [ ] `exchangeGoogleCodeForToken()` 메서드 구현
- [ ] `exchangeKakaoCodeForToken()` 메서드 구현
- [ ] `getGoogleUserInfo()` 메서드 구현 (기존 TODO)
- [ ] `getKakaoUserInfo()` 메서드 구현 (기존 TODO)
- [ ] `application.yml`에 Client ID, Secret 설정
- [ ] `RestTemplate` Bean 등록
- [ ] CORS 설정 확인

## 🎉 완료 후

백엔드 수정 완료 후, 프론트엔드는 그대로 사용하면 됩니다!

프론트엔드 환경변수에서 `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET`는 **더 이상 필요 없습니다**.

```bash
# .env.local (필요한 것만)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=814801233548-fggqiq4s3ne3vc5l1lqv6r31phpes55c.apps.googleusercontent.com
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_rest_api_key_here
NEXT_PUBLIC_API_BASE_URL=https://www.tigerbk.com/api-doman/web
```
