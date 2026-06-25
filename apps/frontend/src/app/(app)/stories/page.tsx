'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Type, Trash2, Eye } from 'lucide-react';
import { storiesApi } from '@/lib/api/storiesApi';
import { Avatar } from '@/components/ui/Avatar';
import { NeuButton } from '@/components/ui/NeuButton';
import { useAuthStore } from '@/store/authStore';
import type { Story } from '@memechat/shared';

const BG_GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#a855f7)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#6366f1,#06b6d4)',
  'linear-gradient(135deg,#84cc16,#10b981)',
];

export default function StoriesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<'text' | 'photo'>('text');
  const [storyText, setStoryText] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_GRADIENTS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => storiesApi.getFeed(),
    refetchInterval: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => storiesApi.create(
      createMode === 'text'
        ? { type: 'text', text: storyText, backgroundColor: selectedBg }
        : { type: 'photo', file: selectedFile! }
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      setShowCreate(false);
      setStoryText('');
      setSelectedFile(null);
      setPreviewUrl(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storiesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const myStories = stories.filter(s => s.userId === user?.id);
  const friendStories = stories.filter(s => s.userId !== user?.id);

  return (
    <div className="flex-1 overflow-y-auto neu-scroll p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Stories</h1>
        <NeuButton
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreate(true)}
        >
          Add Story
        </NeuButton>
      </div>

      {/* Create story panel */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="neu-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: 'var(--neu-text)' }}>Create Story</h3>
              <button type="button" onClick={() => setShowCreate(false)} style={{ color: 'var(--neu-text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2">
              {(['text', 'photo'] as const).map(mode => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setCreateMode(mode)}
                  className="flex items-center gap-2 px-4 py-2 rounded-neu-sm text-sm font-medium transition-all capitalize"
                  style={{
                    background: createMode === mode ? 'var(--brand)' : 'var(--neu-bg)',
                    color: createMode === mode ? '#fff' : 'var(--neu-text-muted)',
                    boxShadow: '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                  }}
                >
                  {mode === 'text' ? <Type className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                  {mode}
                </button>
              ))}
            </div>

            {createMode === 'text' ? (
              <>
                {/* Preview */}
                <div
                  className="w-full h-40 rounded-neu flex items-center justify-center p-4"
                  style={{ background: selectedBg }}
                >
                  <p className="text-white text-xl font-bold text-center">{storyText || 'Your story...'}</p>
                </div>

                <textarea
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={2}
                  className="neu-input resize-none text-sm"
                  maxLength={200}
                />

                {/* Background picker */}
                <div className="flex gap-2 flex-wrap">
                  {BG_GRADIENTS.map(bg => (
                    <button
                      type="button"
                      key={bg}
                      onClick={() => setSelectedBg(bg)}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        background: bg,
                        outline: selectedBg === bg ? '3px solid var(--brand)' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                {previewUrl ? (
                  <div className="relative w-full h-48 rounded-neu overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-36 rounded-neu border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all"
                    style={{ borderColor: 'var(--neu-shadow-1)', color: 'var(--neu-text-muted)' }}
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">Tap to add photo / video</span>
                  </button>
                )}
              </>
            )}

            <NeuButton
              variant="primary"
              className="w-full"
              loading={createMutation.isPending}
              disabled={createMode === 'text' ? !storyText.trim() : !selectedFile}
              onClick={() => createMutation.mutate()}
            >
              Share Story
            </NeuButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My stories */}
      {myStories.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--neu-text-muted)' }}>
            My Stories
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 neu-scroll">
            {myStories.map(story => (
              <motion.div
                key={story.id}
                className="flex flex-col items-center gap-2 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
              >
                <div className="relative cursor-pointer" onClick={() => setViewingStory(story)}>
                  <Avatar src={user?.avatar} name={user?.displayName} size="xl" storyRing />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); deleteMutation.mutate(story.id); }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium" style={{ color: 'var(--neu-text)', fontSize: '10px' }}>
                    My story
                  </p>
                  <p className="flex items-center gap-0.5 justify-center" style={{ color: 'var(--neu-text-muted)', fontSize: '10px' }}>
                    <Eye className="w-2.5 h-2.5" /> {story.views?.length ?? 0}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Friends' stories */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--neu-text-muted)' }}>
          {isLoading ? 'Loading...' : friendStories.length > 0 ? "Friends' Stories" : 'No stories yet'}
        </h2>

        {isLoading ? (
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                <div className="w-16 h-16 rounded-full" style={{ background: 'var(--neu-bg-card)' }} />
                <div className="w-12 h-2 rounded" style={{ background: 'var(--neu-bg-card)' }} />
              </div>
            ))}
          </div>
        ) : friendStories.length === 0 ? (
          <div className="neu-surface p-8 text-center">
            <p className="text-4xl mb-2">📸</p>
            <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>No stories from friends</p>
            <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
              Stories disappear after 24 hours
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {friendStories.map((story, i) => {
              const seen = story.views?.some((v: any) => v.userId === user?.id);
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setViewingStory(story)}
                  className="neu-card overflow-hidden cursor-pointer group"
                  whileHover={{ y: -2 }}
                >
                  <div
                    className="h-40 flex items-center justify-center relative"
                    style={{ background: story.backgroundColor ?? BG_GRADIENTS[i % BG_GRADIENTS.length] }}
                  >
                    {story.mediaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                    ) : (
                      <p className="text-white font-bold text-center px-3 text-sm line-clamp-4">{story.text}</p>
                    )}
                    {seen && (
                      <div className="absolute inset-0 bg-black/30" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 p-3">
                    <Avatar src={story.user?.avatar} name={story.user?.displayName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--neu-text)' }}>
                        {story.user?.displayName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--neu-text-muted)', fontSize: '10px' }}>
                        {seen ? 'Seen' : 'New'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Story viewer overlay */}
      <AnimatePresence>
        {viewingStory && (
          <StoryViewer story={viewingStory} onClose={() => setViewingStory(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      onClick={onClose}
    >
      {/* Progress bar */}
      <div className="absolute top-4 inset-x-4 h-1 rounded-full bg-white/30">
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: story.duration ?? 5, ease: 'linear' }}
          onAnimationComplete={onClose}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-8 inset-x-4 flex items-center gap-3" onClick={e => e.stopPropagation()}>
        <Avatar src={story.user?.avatar} name={story.user?.displayName} size="sm" />
        <span className="text-white font-semibold">{story.user?.displayName}</span>
        <button type="button" onClick={onClose} className="ml-auto text-white p-1">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      {story.mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.mediaUrl} alt="Story" className="max-h-screen max-w-full object-contain" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: story.backgroundColor ?? 'linear-gradient(135deg,#3b82f6,#a855f7)' }}
        >
          <p className="text-white text-3xl font-bold text-center px-8">{story.text}</p>
        </div>
      )}

      {/* Reply bar */}
      <div className="absolute bottom-8 inset-x-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <input
          className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-full px-4 py-2.5 text-sm outline-none"
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
