"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SocialAuthService from '@/services/socialAuthService';
import { toast } from 'react-hot-toast';

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          if (window.opener) {
            window.opener.postMessage({
              type: 'SOCIAL_LOGIN_ERROR',
              provider: 'kakao',
              message: 'Kakao 로그인이 취소되었습니다.'
            }, window.location.origin);
            window.close();
          } else {
            setError('Kakao 로그인이 취소되었습니다.');
            setIsProcessing(false);
          }
          return;
        }

        if (!code) {
          if (window.opener) {
            window.opener.postMessage({
              type: 'SOCIAL_LOGIN_ERROR',
              provider: 'kakao',
              message: '인증 코드를 받지 못했습니다.'
            }, window.location.origin);
            window.close();
          } else {
            setError('인증 코드를 받지 못했습니다.');
            setIsProcessing(false);
          }
          return;
        }

        // Kakao 콜백 처리
        const result = await SocialAuthService.handleKakaoCallback(code);

        if (result.success && result.user) {
          // 소셜 로그인 처리 (기존 사용자면 로그인, 신규 사용자면 회원가입)
          const loginResult = await SocialAuthService.processSocialLogin(result.user, false);
          
          if (loginResult.success) {
            // 팝업창에서 부모 창으로 성공 메시지 전달
            if (window.opener) {
              window.opener.postMessage({
                type: 'SOCIAL_LOGIN_SUCCESS',
                provider: 'kakao',
                message: 'Kakao 로그인이 완료되었습니다!'
              }, window.location.origin);
              window.close();
            } else {
              toast.success('Kakao 로그인이 완료되었습니다!', {
                duration: 3000,
                position: 'top-center',
              });
              router.push('/');
            }
          } else {
            // 로그인 실패 시 회원가입 시도
            const signupResult = await SocialAuthService.processSocialLogin(result.user, true);
            
            if (signupResult.success) {
              // 팝업창에서 부모 창으로 성공 메시지 전달
              if (window.opener) {
                window.opener.postMessage({
                  type: 'SOCIAL_LOGIN_SUCCESS',
                  provider: 'kakao',
                  message: 'Kakao 회원가입이 완료되었습니다!'
                }, window.location.origin);
                window.close();
              } else {
                toast.success('Kakao 회원가입이 완료되었습니다!', {
                  duration: 3000,
                  position: 'top-center',
                });
                router.push('/');
              }
            } else {
              setError(signupResult.error || '회원가입 중 오류가 발생했습니다.');
            }
          }
        } else {
          setError(result.error || 'Kakao 로그인 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('Kakao 콜백 처리 오류:', error);
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_LOGIN_ERROR',
            provider: 'kakao',
            message: 'Kakao 로그인 처리 중 오류가 발생했습니다.'
          }, window.location.origin);
          window.close();
        } else {
          setError('Kakao 로그인 처리 중 오류가 발생했습니다.');
          setIsProcessing(false);
        }
      }
    };

    handleKakaoCallback();
  }, [searchParams, router]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Kakao 로그인 처리 중...</h2>
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
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
