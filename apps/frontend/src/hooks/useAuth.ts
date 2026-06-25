import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const store = useAuthStore();
  return {
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading:       store.isLoading,
    login:           store.login,
    register:        store.register,
    logout:          store.logout,
    updateUser:      store.updateUser,
  };
}
