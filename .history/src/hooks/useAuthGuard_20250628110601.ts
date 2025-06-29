import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

interface UseAuthGuardOptions {
  redirectMessage?: string;
  redirectTo?: string;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { 
    redirectMessage = "로그인이 필요한 페이지입니다.",
    redirectTo 
  } = options;
  
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 인증 로딩이 완료되고 로그인하지 않은 상태인 경우
    if (!authLoading && !isLoggedIn) {
      console.log(redirectMessage);
      
      if (redirectTo) {
        // 지정된 경로로 리다이렉트
        router.push(redirectTo);
      } else {
        // 히스토리 백
        if (window.history.length > 1) {
          router.back();
        } else {
          // 히스토리가 없는 경우 홈으로 이동
          router.push('/');
        }
      }
      return;
    }
  }, [authLoading, isLoggedIn, router, redirectMessage, redirectTo]);

  return {
    isAuthenticated: isLoggedIn,
    isLoading: authLoading,
    shouldRender: !authLoading && isLoggedIn
  };
}; 