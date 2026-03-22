"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SocialAuthService from '@/services/socialAuthService';
import { toast } from 'react-hot-toast';

// 이 페이지는 동적으로만 렌더링되어야 함 (정적 생성 방지)
export const dynamic = 'force-dynamic';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_LOGIN_ERROR',
              error: 'Google 로그인이 취소되었습니다.'
            }, window.location.origin);
            window.close();
          } else {
            setError('Google 로그인이 취소되었습니다.');
            setIsProcessing(false);
          }
          return;
        }

        if (!code) {
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_LOGIN_ERROR',
              error: '인증 코드를 받지 못했습니다.'
            }, window.location.origin);
            window.close();
          } else {
            setError('인증 코드를 받지 못했습니다.');
            setIsProcessing(false);
          }
          return;
        }

        // Google 콜백 처리 (백엔드 API 연동)
        const result = await SocialAuthService.handleGoogleCallback(code);

        if (result.success) {
          // 팝업창에서 부모 창으로 성공 메시지 전달
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_LOGIN_SUCCESS'
            }, window.location.origin);
            
            // 토스트 없이 즉시 닫기 (더 빠른 UX)
            window.close();
          } else {
            toast.success('Google 로그인이 완료되었습니다!', {
              duration: 2000,
            });
            router.push('/');
          }
        } else {
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_LOGIN_ERROR',
              error: result.error || 'Google 로그인 중 오류가 발생했습니다.'
            }, window.location.origin);
            window.close();
          } else {
            setError(result.error || 'Google 로그인 중 오류가 발생했습니다.');
          }
        }
      } catch (error) {
        console.error('Google 콜백 처리 오류:', error);
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_LOGIN_ERROR',
            error: 'Google 로그인 처리 중 오류가 발생했습니다.'
          }, window.location.origin);
          window.close();
        } else {
          setError('Google 로그인 처리 중 오류가 발생했습니다.');
          setIsProcessing(false);
        }
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Google 로그인 처리 중...</h2>
          <p className="text-slate-400">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">로그인 실패</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Google 로그인 처리 중...</h2>
          <p className="text-slate-400">잠시만 기다려주세요.</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
