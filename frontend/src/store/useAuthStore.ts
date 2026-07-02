import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

export interface UserPayload {
  userId: number;
  email: string;
  name: string;
  exp: number;
}

interface AuthState {
  token: string | null;
  user: UserPayload | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserPayload>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Hydrate from localStorage on initialization
  const storedToken = localStorage.getItem('jwt');
  let initialUser: UserPayload | null = null;
  let isValid = false;

  if (storedToken) {
    try {
      const decoded = jwtDecode<UserPayload>(storedToken);
      // Check expiry
      if (decoded.exp * 1000 > Date.now()) {
        initialUser = decoded;
        isValid = true;
      } else {
        localStorage.removeItem('jwt'); // expired
      }
    } catch {
      localStorage.removeItem('jwt'); // invalid token
    }
  }

  return {
    token: isValid ? storedToken : null,
    user: initialUser,
    isAuthenticated: isValid,
    login: (token: string) => {
      try {
        const decoded = jwtDecode<UserPayload>(token);
        localStorage.setItem('jwt', token);
        set({ token, user: decoded, isAuthenticated: true });
      } catch (err) {
        console.error('Invalid token received during login');
      }
    },
    logout: () => {
      localStorage.removeItem('jwt');
      set({ token: null, user: null, isAuthenticated: false });
    },
    updateUser: (data: Partial<UserPayload>) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      })),
  };
});
