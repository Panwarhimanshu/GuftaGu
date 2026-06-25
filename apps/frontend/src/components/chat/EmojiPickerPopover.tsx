'use client';

import { motion } from 'framer-motion';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';

interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPickerPopover({ onSelect, onClose }: EmojiPickerPopoverProps) {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full left-0 mb-2 z-20"
      style={{
        filter: 'drop-shadow(8px 8px 16px var(--neu-shadow-1))',
      }}
    >
      <EmojiPicker
        onEmojiClick={(e) => onSelect(e.emoji)}
        theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
        emojiStyle={EmojiStyle.TWITTER}
        skinTonesDisabled
        searchPlaceholder="Search emoji..."
        width={320}
        height={400}
      />
    </motion.div>
  );
}
