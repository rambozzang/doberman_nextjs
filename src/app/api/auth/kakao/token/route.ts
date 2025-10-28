import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code) {
      return NextResponse.json({ error: '인증 코드가 필요합니다.' }, { status: 400 });
    }

    // Kakao OAuth 토큰 교환
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Kakao 토큰 교환 실패:', error);
      return NextResponse.json({ error: '토큰 교환에 실패했습니다.' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    return NextResponse.json({ access_token: tokenData.access_token });

  } catch (error) {
    console.error('Kakao 토큰 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
