'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Users, TrendingUp, Zap } from 'lucide-react';
import { HangoutQuickActions } from '@/components/hangout/HangoutQuickActions';
import { ActiveFriends } from '@/components/ui/ActiveFriends';
import { StoriesRow } from '@/components/stories/StoriesRow';
import { RecentChats } from '@/components/chat/RecentChats';
import { useAuthStore } from '@/store/authStore';

export default function AppHomePage() {
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 overflow-y-auto neu-scroll p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>
            {greeting}, {user?.displayName?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            What do you want to do today?
          </p>
        </div>

        {/* Quick stats */}
        <div className="hidden md:flex items-center gap-3">
          {[
            { icon: MessageCircle, label: '12 chats', color: '#3b82f6' },
            { icon: Users,         label: '5 online',  color: '#22c55e' },
            { icon: TrendingUp,    label: 'Trending',  color: '#a855f7' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="neu-surface-sm px-3 py-2 flex items-center gap-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Hangout Quick Actions — FLAGSHIP */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--neu-text-muted)' }}>
            Quick Hangout
          </h2>
        </div>
        <HangoutQuickActions />
      </motion.section>

      {/* Stories */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--neu-text-muted)' }}>
          Stories
        </h2>
        <StoriesRow />
      </motion.section>

      {/* Active Friends */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--neu-text-muted)' }}>
          Online Now
        </h2>
        <ActiveFriends />
      </motion.section>

      {/* Recent Chats */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--neu-text-muted)' }}>
          Recent
        </h2>
        <RecentChats />
      </motion.section>
    </div>
  );
}
