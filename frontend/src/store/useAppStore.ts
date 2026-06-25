import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
}

interface AppState {
  backendUrl: string;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setBackendUrl: (url: string) => void;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      backendUrl: 'https://todo-application-m8ah.onrender.com/api/v1', // Default deployed Render URL
      token: null,
      refreshToken: null,
      user: null,
      setBackendUrl: (url: string) => set({ backendUrl: url }),
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      updateUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'ultratodo-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
