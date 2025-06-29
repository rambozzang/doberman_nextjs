import { create } from 'zustand';

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
}

export const useStore = create<StoreState>((set) => ({
  count: 0,
  user: null,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setUser: (user: User) => set({ user }),
  clearUser: () => set({ user: null }),
})); 