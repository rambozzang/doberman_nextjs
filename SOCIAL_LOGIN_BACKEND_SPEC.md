# Social Login Backend Integration Specification

This document provides the technical requirements for the backend developers (Spring Boot + Kotlin) to support the social login feature implemented in the Next.js frontend.

## 1. Overview
The frontend uses a **Popup-based OAuth 2.0 flow**. After the user authorizes the application in the popup, the frontend receives an `authorization_code` and sends it to the backend. The backend is responsible for:
1.  Exchanging the `code` for an `access_token` from the social provider.
2.  Fetching the user's profile information using the `access_token`.
3.  Upserting (Signup/Login) the user in the database.
4.  Generating a JWT for the frontend to use in subsequent requests.

## 2. API Endpoints

### 2.1 Social Login Request
*   **Method**: `POST`
*   **Endpoints**:
    *   `/auth/social/google/login`
    *   `/auth/social/kakao/login`
    *   `/auth/social/naver/login`

#### Request Body (JSON)
```json
{
  "code": "AUTHORIZATION_CODE_FROM_PROVIDER",
  "redirectUri": "http://localhost:3000/auth/[provider]/callback",
  "provider": "google | kakao | naver",
  "deviceId": "OPTIONAL_DEVICE_ID",
  "fcmToken": "OPTIONAL_PUSH_TOKEN"
}
```

#### Success Response (JSON)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "YOUR_APP_JWT_TOKEN",
    "userInfo": {
      "customerId": 123,
      "customerName": "Hong Gil-dong",
      "customerEmail": "hong@example.com",
      "customerPhone": "01012345678",
      "socialId": "unique_social_id_from_provider",
      "provider": "google | kakao | naver"
    }
  }
}
```

#### Error Response (JSON)
```json
{
  "success": false,
  "message": "Error details (e.g., Invalid code, network error)",
  "error": "ERROR_CODE"
}
```

## 3. Implementation Details (Backend)

### A. Token Exchange & Profile Fetching
For each provider, you need to call their token and profile APIs:

| Provider | Token API URL | Profile API URL |
| :--- | :--- | :--- |
| **Google** | `https://oauth2.googleapis.com/token` | `https://www.googleapis.com/oauth2/v3/userinfo` |
| **Kakao** | `https://kauth.kakao.com/oauth/token` | `https://kapi.kakao.com/v2/user/me` |
| **Naver** | `https://nid.naver.com/oauth2.0/token` | `https://openapi.naver.com/v1/nid/me` |

### B. Logic Flow (service layer)
1.  **Exchange Code**: POST to the provider's token API using `client_id`, `client_secret` (stored in backend `.yml`), `code`, and `redirect_uri`.
2.  **Get Profile**: Use the returned `access_token` to call the profile API.
3.  **Find or Create User**:
    *   Check if a user exists with the `socialId` and `provider`.
    *   If not, create a new user record.
    *   If yes, update any changed information (e.g., name, last login).
4.  **Security Context**: Generate your internal JWT containing the `customerId` or `username`.

### C. Example Kotlin Snippet (Conceptual)
```kotlin
@PostMapping("/auth/social/naver/login")
fun naverLogin(@RequestBody req: SocialLoginRequest): ResponseEntity<ApiResponse> {
    // 1. Exchange code for naver access_token
    val accessToken = naverAuthClient.getAccessToken(req.code, naverClientId, naverClientSecret)
    
    // 2. Fetch profile
    val profile = naverAuthClient.getUserProfile(accessToken)
    
    // 3. Upsert user in DB
    val user = userService.upsertSocialUser(
        socialId = profile.id,
        email = profile.email,
        name = profile.name,
        provider = "naver"
    )
    
    // 4. Create JWT
    val token = jwtProvider.createToken(user.id)
    
    return ResponseEntity.ok(ApiResponse(
        success = true,
        data = LoginResponse(token = token, userInfo = user.toInfoDto())
    ))
}
```

## 4. Environment Variables Required (Backend)
Please add these to your `application.yml` or environment variables:
*   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
*   `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`
*   `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`

## 5. Security Note
*   The `redirectUri` sent by the frontend MUST match EXACTLY with the one registered in the provider's developer console and the one used during the initial authorization request.
*   Validate the `state` parameter if implemented for extra security.
