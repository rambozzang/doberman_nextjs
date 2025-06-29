import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export const useClickableToast = () => {
  useEffect(() => {
    // 토스트 요소에 클릭 이벤트 리스너 추가
    const addClickListeners = () => {
      const toastElements = document.querySelectorAll('[data-hot-toast]');
      
      toastElements.forEach((element) => {
        // 이미 클릭 리스너가 추가되었는지 확인
        if (!element.hasAttribute('data-click-listener')) {
          element.setAttribute('data-click-listener', 'true');
          
          element.addEventListener('click', (e) => {
            const toastElement = e.currentTarget as HTMLElement;
            const toastId = toastElement.getAttribute('data-hot-toast');
            
            if (toastId) {
              toast.dismiss(toastId);
            }
          });

          // 호버 효과 추가
          element.addEventListener('mouseenter', () => {
            (element as HTMLElement).style.transform = 'scale(1.02)';
            (element as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          });

          element.addEventListener('mouseleave', () => {
            (element as HTMLElement).style.transform = 'scale(1)';
            (element as HTMLElement).style.boxShadow = '';
          });
        }
      });
    };

    // MutationObserver를 사용하여 새로운 토스트가 추가될 때마다 리스너 추가
    const observer = new MutationObserver(() => {
      addClickListeners();
    });

    // body의 변화를 감지
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 초기 토스트에 리스너 추가
    addClickListeners();

    return () => {
      observer.disconnect();
    };
  }, []);
}; 