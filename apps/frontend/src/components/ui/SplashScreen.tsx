'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export function SplashScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--neu-bg)' }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex items-center justify-center w-24 h-24 rounded-neu-xl"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
          boxShadow: '12px 12px 24px var(--neu-shadow-1), -12px -12px 24px var(--neu-shadow-2)',
        }}
      >
        <MessageCircle className="w-12 h-12 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold"
        style={{ color: 'var(--neu-text)' }}
      >
        MemeChat
      </motion.h1>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-1.5"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--brand)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
