'use client';

import { motion } from 'framer-motion';
import { useHangoutStore } from '@/store/hangoutStore';
import type { HangoutType } from '@memechat/shared';

interface HangoutAction {
  type: HangoutType;
  emoji: string;
  label: string;
  color: string;
  bgGradient: string;
  glowColor: string;
}

const HANGOUT_ACTIONS: HangoutAction[] = [
  {
    type: 'smoke_break',
    emoji: '🚬',
    label: 'Smoke Break',
    color: '#94a3b8',
    bgGradient: 'linear-gradient(135deg, #667eea22, #764ba222)',
    glowColor: 'rgba(148,163,184,0.3)',
  },
  {
    type: 'coffee_break',
    emoji: '☕',
    label: 'Coffee',
    color: '#b45309',
    bgGradient: 'linear-gradient(135deg, #92400e22, #b4530922)',
    glowColor: 'rgba(180,83,9,0.3)',
  },
  {
    type: 'lunch_break',
    emoji: '🍔',
    label: 'Lunch',
    color: '#15803d',
    bgGradient: 'linear-gradient(135deg, #15803d22, #4ade8022)',
    glowColor: 'rgba(21,128,61,0.3)',
  },
  {
    type: 'gaming',
    emoji: '🎮',
    label: 'Gaming',
    color: '#7c3aed',
    bgGradient: 'linear-gradient(135deg, #7c3aed22, #a855f722)',
    glowColor: 'rgba(124,58,237,0.3)',
  },
  {
    type: 'walk_break',
    emoji: '🏃',
    label: 'Walk',
    color: '#0891b2',
    bgGradient: 'linear-gradient(135deg, #0891b222, #06b6d422)',
    glowColor: 'rgba(8,145,178,0.3)',
  },
  {
    type: 'hangout',
    emoji: '🎉',
    label: 'Hangout',
    color: '#db2777',
    bgGradient: 'linear-gradient(135deg, #db277722, #f4338222)',
    glowColor: 'rgba(219,39,119,0.3)',
  },
];

export function HangoutQuickActions() {
  const { openHangoutModal } = useHangoutStore();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {HANGOUT_ACTIONS.map((action, i) => (
        <motion.button
          key={action.type}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: i * 0.06,
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
          whileHover={{ y: -4, scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => openHangoutModal(action.type)}
          className="hangout-btn group"
          style={{
            background: action.bgGradient,
          }}
        >
          {/* Glow ring on hover */}
          <motion.div
            className="absolute inset-0 rounded-neu-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              boxShadow: `0 0 24px ${action.glowColor}`,
            }}
          />

          {/* Emoji */}
          <motion.span
            className="text-3xl"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
          >
            {action.emoji}
          </motion.span>

          {/* Label */}
          <span
            className="text-xs font-semibold text-center"
            style={{ color: action.color }}
          >
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
