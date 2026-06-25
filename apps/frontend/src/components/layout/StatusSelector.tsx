'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/lib/api/userApi';
import type { UserStatus } from '@memechat/shared';

const STATUSES: { value: UserStatus; emoji: string; label: string; color: string }[] = [
  { value: 'available',  emoji: '🟢', label: 'Available',   color: '#22c55e' },
  { value: 'busy',       emoji: '🔴', label: 'Busy',         color: '#ef4444' },
  { value: 'in_meeting', emoji: '📅', label: 'In Meeting',   color: '#f59e0b' },
  { value: 'at_lunch',   emoji: '🍔', label: 'At Lunch',     color: '#15803d' },
  { value: 'smoking',    emoji: '🚬', label: 'Smoking',      color: '#94a3b8' },
  { value: 'working',    emoji: '💻', label: 'Working',      color: '#6366f1' },
  { value: 'gaming',     emoji: '🎮', label: 'Gaming',       color: '#7c3aed' },
  { value: 'offline',    emoji: '⚫', label: 'Appear Offline', color: '#6b7280' },
];

export function StatusSelector({ onClose }: { onClose: () => void }) {
  const { user, updateUser } = useAuthStore();

  const handleSelect = async (status: UserStatus) => {
    try {
      const updated = await userApi.updateStatus(status);
      updateUser(updated);
      onClose();
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-2 rounded-neu-sm overflow-hidden"
      style={{
        background: 'var(--neu-bg-card)',
        boxShadow: '6px 6px 12px var(--neu-shadow-1), -6px -6px 12px var(--neu-shadow-2)',
      }}
    >
      {STATUSES.map(s => (
        <button
          key={s.value}
          onClick={() => handleSelect(s.value)}
          className="w-full flex items-center gap-3 px-3 py-2.5 transition-all hover:opacity-80 text-left"
          style={{
            background: user?.status === s.value ? `${s.color}15` : 'transparent',
          }}
        >
          <span className="text-sm">{s.emoji}</span>
          <span
            className="text-sm font-medium"
            style={{ color: user?.status === s.value ? s.color : 'var(--neu-text)' }}
          >
            {s.label}
          </span>
          {user?.status === s.value && (
            <span className="ml-auto text-xs font-bold" style={{ color: s.color }}>✓</span>
          )}
        </button>
      ))}
    </motion.div>
  );
}
