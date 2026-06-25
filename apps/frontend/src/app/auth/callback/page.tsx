'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api/authApi';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      router.replace('/auth/login');
      return;
    }

    setTokens(accessToken, refreshToken);

    authApi.me()
      .then((user) => {
        setUser(user);
        router.replace('/');
      })
      .catch(() => {
        router.replace('/auth/login');
      });
  }, [params, router, setTokens, setUser]);

  return null;
}

function LoadingUI() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--neu-bg)' }}
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-neu-xl"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
          boxShadow: '8px 8px 16px var(--neu-shadow-1), -8px -8px 16px var(--neu-shadow-2)',
        }}
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </motion.div>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--neu-text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--neu-text-muted)' }}>
        Signing you in…
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <LoadingUI />
      <CallbackInner />
    </Suspense>
  );
}
