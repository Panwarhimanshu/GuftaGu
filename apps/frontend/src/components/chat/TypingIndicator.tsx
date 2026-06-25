'use client';

import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  const label =
    users.length === 1
      ? 'Someone is typing'
      : `${users.length} people are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2 mb-1"
    >
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{
          background: 'var(--neu-bg-card)',
          boxShadow: '4px 4px 10px var(--neu-shadow-1), -2px -2px 6px var(--neu-shadow-2)',
        }}
      >
        {/* Dots */}
        <div className="flex gap-1">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
          {label}
        </span>
      </div>
    </motion.div>
  );
}
