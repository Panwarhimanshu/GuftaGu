'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { storiesApi } from '@/lib/api/storiesApi';
import type { Story } from '@memechat/shared';

export function StoriesRow() {
  const { user } = useAuthStore();
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [progress, setProgress] = useState(0);

  const { data: stories } = useQuery({
    queryKey: ['stories'],
    queryFn: () => storiesApi.getFeed(),
    refetchInterval: 60_000,
  });

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 neu-scroll">
        {/* My story (add) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
        >
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.displayName} size="lg" />
            <div
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--brand)',
                boxShadow: '2px 2px 4px var(--neu-shadow-1)',
              }}
            >
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--neu-text)', fontSize: '10px' }}>
            Add Story
          </span>
        </motion.div>

        {/* Friends' stories */}
        {stories?.map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setViewingStory(story)}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <Avatar
              src={story.user?.avatar}
              name={story.user?.displayName}
              size="lg"
              storyRing
              storySeen={story.views.some(v => v.userId === user?.id)}
            />
            <span
              className="text-xs font-medium truncate w-14 text-center"
              style={{ color: 'var(--neu-text)', fontSize: '10px' }}
            >
              {story.user?.displayName?.split(' ')[0]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Story viewer */}
      <AnimatePresence>
        {viewingStory && (
          <StoryViewer
            story={viewingStory}
            onClose={() => setViewingStory(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  const [progress, setProgress] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
    >
      {/* Progress bar */}
      <div className="absolute top-4 inset-x-4 h-1 rounded-full bg-white/30">
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: story.duration, ease: 'linear' }}
          onAnimationComplete={onClose}
        />
      </div>

      {/* Header */}
      <div className="absolute top-8 inset-x-4 flex items-center gap-3">
        <Avatar src={story.user?.avatar} name={story.user?.displayName} size="sm" />
        <span className="text-white font-semibold">{story.user?.displayName}</span>
        <button onClick={onClose} className="ml-auto text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      {story.type === 'photo' && story.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.mediaUrl} alt="Story" className="max-h-screen max-w-full object-contain" />
      )}
      {story.type === 'text' && (
        <div
          className="flex items-center justify-center w-full h-full"
          style={{ background: story.backgroundColor ?? 'linear-gradient(135deg, #3b82f6, #a855f7)' }}
        >
          <p
            className="text-center text-3xl font-bold px-8"
            style={{ color: story.textColor ?? '#fff' }}
          >
            {story.text}
          </p>
        </div>
      )}

      {/* Reactions */}
      <div className="absolute bottom-8 inset-x-4 flex items-center gap-2">
        <input
          className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-full px-4 py-2 text-sm outline-none"
          placeholder="Reply..."
        />
        <div className="flex gap-2">
          {['❤️', '😂', '😮', '🔥'].map(emoji => (
            <button key={emoji} className="text-2xl">{emoji}</button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
