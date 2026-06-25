'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { HangoutModal } from '@/components/hangout/HangoutModal';
import { CallOverlay } from '@/components/video-call/CallOverlay';
import { NotificationPanel } from '@/components/ui/NotificationPanel';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--neu-bg)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Global overlays */}
      <HangoutModal />
      <CallOverlay />
      <NotificationPanel />
    </div>
  );
}
