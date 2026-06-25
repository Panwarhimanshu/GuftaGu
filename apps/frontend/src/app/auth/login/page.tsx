'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { NeuInput } from '@/components/ui/NeuInput';
import { NeuButton } from '@/components/ui/NeuButton';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    const success = await login(data.email, data.password);
    if (success) router.replace('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--neu-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-block mb-3"
          >
            <Image src="/logo.svg" alt="GuftaGu" width={100} height={100} priority />
          </motion.div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--neu-text)' }}>
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            Sign in to GuftaGu
          </p>
        </div>

        {/* Form Card */}
        <div className="neu-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                Email
              </label>
              <NeuInput
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                Password
              </label>
              <NeuInput
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="transition-opacity hover:opacity-70"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
              />
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium"
                style={{ color: 'var(--brand)' }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <NeuButton type="submit" variant="primary" className="w-full" loading={isLoading}>
              Sign in
            </NeuButton>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 neu-divider" />
            <span className="px-4 text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
              OR CONTINUE WITH
            </span>
            <div className="flex-1 neu-divider" />
          </div>

          {/* Social */}
          <SocialLoginButtons />
        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          New to MemeChat?{' '}
          <Link href="/auth/register" className="font-semibold" style={{ color: 'var(--brand)' }}>
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
