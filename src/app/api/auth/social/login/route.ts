import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { socialId, email, name, picture, provider } = await request.json();

    if (!socialId || !email || !name || !provider) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // TODO: 실제 백엔드 API와 연동
    // 현재는 임시 응답을 반환합니다.
    
    // 기존 사용자 확인 로직 (실제 구현 시)
    // const existingUser = await checkExistingUser(socialId, provider);
    
    // 임시 응답
    const mockResponse = {
      success: true,
      token: `mock_token_${socialId}_${Date.now()}`,
      user: {
        id: socialId,
        email,
        name,
        picture,
        provider
      }
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('소셜 로그인 처리 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
