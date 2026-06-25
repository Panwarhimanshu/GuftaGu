'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Home, Hash, Radio, Image as ImageIcon,
  Settings, LogOut, Bell, Moon, Sun, Users, Zap,
  ChevronRight, Plus, Search
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useHangoutStore } from '@/store/hangoutStore';
import { StatusSelector } from './StatusSelector';
import { clsx } from 'clsx';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  color?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',               icon: Home,          label: 'Home' },
  { href: '/chat',           icon: MessageCircle, label: 'Chats',   color: '#3b82f6' },
  { href: '/hangout',        icon: Zap,           label: 'Hangout', color: '#f59e0b' },
  { href: '/voice-channels', icon: Radio,         label: 'Voice',   color: '#22c55e' },
  { href: '/stories',        icon: Users,         label: 'Stories', color: '#a855f7' },
  { href: '/meme-feed',      icon: ImageIcon,     label: 'Memes',   color: '#ec4899' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { toggle: toggleNotifs, notifications } = useNotificationStore();
  const [showStatus, setShowStatus] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <motion.nav
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative h-full flex flex-col overflow-hidden flex-shrink-0"
      style={{
        background: 'var(--neu-bg)',
        boxShadow: '8px 0 24px var(--neu-shadow-1)',
      }}
    >
      {/* ── Logo ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--neu-border)' }}>
        <div
          className="w-10 h-10 rounded-neu flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
            boxShadow: '4px 4px 8px var(--neu-shadow-1), -4px -4px 8px var(--neu-shadow-2)',
          }}
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-xl"
              style={{ color: 'var(--neu-text)' }}
            >
              GuftaGu
            </motion.span>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <motion.button
          animate={{ rotate: collapsed ? 0 : 180 }}
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto neu-btn-icon p-1.5"
          style={{ color: 'var(--neu-text-muted)' }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* ── Search ────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 py-3">
          <button
            className="w-full flex items-center gap-3 neu-pressed px-3 py-2.5 rounded-neu-sm"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--neu-shadow-1)' }}>⌘K</kbd>
          </button>
        </div>
      )}

      {/* ── Nav Items ─────────────────────────────── */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto neu-scroll">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <motion.button
              key={item.href}
              whileHover={{ x: collapsed ? 0 : 3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(item.href)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-neu-sm transition-all relative',
                collapsed && 'justify-center',
              )}
              style={{
                background: isActive ? 'var(--neu-bg-card)' : 'transparent',
                boxShadow: isActive
                  ? '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)'
                  : 'none',
                color: isActive ? (item.color ?? 'var(--brand)') : 'var(--neu-text-muted)',
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                  style={{ background: item.color ?? 'var(--brand)' }}
                />
              )}

              <Icon className="w-5 h-5 flex-shrink-0" />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium flex-1 text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {item.badge && !collapsed && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ background: 'var(--brand)' }}
                >
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Bottom controls ───────────────────────── */}
      <div className="border-t px-3 py-4 space-y-2" style={{ borderColor: 'var(--neu-border)' }}>
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={clsx('w-full flex items-center gap-3 px-3 py-2 rounded-neu-sm transition-all', collapsed && 'justify-center')}
          style={{ color: 'var(--neu-text-muted)' }}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        {/* Notifications */}
        <button
          onClick={toggleNotifs}
          className={clsx('w-full flex items-center gap-3 px-3 py-2 rounded-neu-sm relative transition-all', collapsed && 'justify-center')}
          style={{ color: 'var(--neu-text-muted)' }}
        >
          <Bell className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Notifications</span>}
          {unreadNotifs > 0 && (
            <span className="absolute top-1 left-6 w-4 h-4 rounded-full text-xs font-bold text-white flex items-center justify-center bg-red-500">
              {unreadNotifs > 9 ? '9+' : unreadNotifs}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => router.push('/settings')}
          className={clsx('w-full flex items-center gap-3 px-3 py-2 rounded-neu-sm transition-all', collapsed && 'justify-center')}
          style={{ color: 'var(--neu-text-muted)' }}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>
      </div>

      {/* ── User profile strip ────────────────────── */}
      <div
        className="px-3 py-3 border-t"
        style={{ borderColor: 'var(--neu-border)' }}
      >
        <div
          className={clsx(
            'w-full flex items-center gap-3 p-2 rounded-neu-sm transition-all',
            collapsed && 'justify-center',
          )}
        >
          {/* Avatar — click to toggle status */}
          <button
            type="button"
            onClick={() => setShowStatus(!showStatus)}
            className="relative flex-shrink-0 focus:outline-none"
          >
            <Avatar src={user?.avatar} name={user?.displayName} size="sm" status={user?.isOnline ? 'online' : 'offline'} />
          </button>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setShowStatus(!showStatus)}
              className="flex-1 text-left min-w-0 focus:outline-none"
            >
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--neu-text)' }}>
                {user?.displayName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>
                @{user?.username}
              </p>
            </button>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={() => logout()}
              className="p-1 rounded hover:text-red-400 transition-colors flex-shrink-0"
              style={{ color: 'var(--neu-text-muted)' }}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status picker */}
        <AnimatePresence>
          {showStatus && !collapsed && (
            <StatusSelector onClose={() => setShowStatus(false)} />
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
