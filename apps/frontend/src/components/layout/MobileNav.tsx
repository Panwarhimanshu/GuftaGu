'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, MessageCircle, Zap, Image as ImageIcon, Users } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/app',           icon: Home,          label: 'Home',    color: '#3b82f6' },
  { href: '/app/chat',      icon: MessageCircle, label: 'Chat',    color: '#22c55e' },
  { href: '/app/hangout',   icon: Zap,           label: 'Hangout', color: '#f59e0b' },
  { href: '/app/meme-feed', icon: ImageIcon,     label: 'Memes',   color: '#ec4899' },
  { href: '/app/stories',   icon: Users,         label: 'Stories', color: '#a855f7' },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around px-2 pb-safe"
      style={{
        background: 'var(--neu-bg)',
        boxShadow: '0 -6px 20px var(--neu-shadow-1)',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
        paddingTop: '0.75rem',
      }}
    >
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="relative flex flex-col items-center gap-1 px-3 py-1"
          >
            <div
              className={clsx('relative p-2.5 rounded-neu-sm transition-all')}
              style={{
                background: isActive ? 'var(--neu-bg-card)' : 'transparent',
                boxShadow: isActive
                  ? '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)'
                  : 'none',
                color: isActive ? item.color : 'var(--neu-text-muted)',
              }}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-dot"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: item.color }}
                />
              )}
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: isActive ? item.color : 'var(--neu-text-muted)', fontSize: '10px' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
