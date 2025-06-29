import { create } from 'zustand';
import { toast } from 'react-hot-toast';

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface StoreState {
  count: number;
  user: User | null;
  increment: () => void;
  decrement: () => void;
  setUser: (user: User) => void;
  clearUser: () => void;
  checkLoginAndNavigate: (isLoggedIn: boolean, targetPath: string, onLogin: () => void) => boolean;
}

export const useStore = create<StoreState>((set) => ({
  count: 0,
  user: null,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setUser: (user: User) => set({ user }),
  clearUser: () => set({ user: null }),
  checkLoginAndNavigate: (isLoggedIn: boolean, targetPath: string, onLogin: () => void) => {
    if (!isLoggedIn) {
      toast.error("로그인이 필요한 서비스입니다.", {
        duration: 3000,
        position: 'top-center',
      });
      onLogin();
      return false;
    }
    return true;
  },
})); 