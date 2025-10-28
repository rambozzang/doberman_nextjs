import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: '액세스 토큰이 필요합니다.' }, { status: 400 });
    }

    // Kakao 사용자 정보 가져오기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('Kakao 사용자 정보 조회 실패:', error);
      return NextResponse.json({ error: '사용자 정보 조회에 실패했습니다.' }, { status: 400 });
    }

    const userData = await userResponse.json();
    return NextResponse.json(userData);

  } catch (error) {
    console.error('Kakao 사용자 정보 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
