'use client';
// Thin hook — re-exports everything from the auth store with stable selectors.
import {
  useAuthStore,
  selectUser,
  selectIsAuth,
  selectActiveRole,
  selectUserStatus,
  selectIsPending,
  selectNeedsPayment,
  selectInitialized,
} from '@/lib/store/auth.store';

export function useAuth() {
  const user         = useAuthStore(selectUser);
  const isAuth            = useAuthStore(selectIsAuth);
  const profileCompletion  = useAuthStore(s => s.profileCompletion);
  const marketplaceMissing = useAuthStore(s => s.marketplaceMissing);
  const activeRole   = useAuthStore(selectActiveRole);
  const status       = useAuthStore(selectUserStatus);
  const isPending    = useAuthStore(selectIsPending);
  const needsPayment = useAuthStore(selectNeedsPayment);
  const loading      = useAuthStore((s) => s.loading);
  const initialized  = useAuthStore(selectInitialized);
  const error        = useAuthStore((s) => s.error);

  const login          = useAuthStore((s) => s.login);
  const register       = useAuthStore((s) => s.register);
  const logout         = useAuthStore((s) => s.logout);
  const switchRole     = useAuthStore((s) => s.switchRole);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const resetPassword  = useAuthStore((s) => s.resetPassword);
  const updateProfile  = useAuthStore((s) => s.updateProfile);
  const activatePlan   = useAuthStore((s) => s.activatePlan);
  const silentInit     = useAuthStore((s) => s.silentInit);
  const clearError     = useAuthStore((s) => s.clearError);

  return {
    // State
    user,
    isAuth,
    profileCompletion,
    marketplaceMissing,
    activeRole,
    status,
    isPending,
    needsPayment,
    loading,
    initialized,
    error,
    // Actions
    login,
    register,
    logout,
    switchRole,
    forgotPassword,
    resetPassword,
    updateProfile,
    activatePlan,
    silentInit,
    clearError,
  };
}
