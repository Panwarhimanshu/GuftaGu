'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { VoiceChannel } from '@memechat/shared';

const CHANNEL_ICONS: Record<string, string> = {
  general: '🔊',
  music: '🎵',
  gaming: '🎮',
  study: '📚',
  standup: '☕',
  lounge: '🛋️',
};

export default function VoiceChannelsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [joining, setJoining] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: channels = [], isLoading } = useQuery<VoiceChannel[]>({
    queryKey: ['voice-channels'],
    queryFn: () => apiClient.get('/voice-channels').then(r => r.data.data),
    refetchInterval: 10_000,
  });

  const joinMutation = useMutation({
    mutationFn: (channelId: string) =>
      apiClient.post(`/calls/token`, { channelId }).then(r => r.data.data),
    onSuccess: (data, channelId) => {
      router.push(`/call/${channelId}?token=${data.token}&room=${data.room}`);
    },
    onSettled: () => setJoining(null),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient.post('/voice-channels', { name }).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-channels'] });
      setShowCreate(false);
      setNewName('');
    },
  });

  const handleJoin = (channelId: string) => {
    setJoining(channelId);
    joinMutation.mutate(channelId);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-purple-500"
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neu-200 dark:border-neu-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neu-900 dark:text-neu-50">
              Voice Channels
            </h1>
            <p className="text-sm text-neu-500 mt-1">
              Jump into a voice channel to hang out
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreate(true)}
            className="neu-btn-primary px-4 py-2 text-sm font-medium"
          >
            + New Channel
          </motion.button>
        </div>
      </div>

      {/* Channels grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {channels.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔊</div>
            <p className="text-neu-500 text-lg">No voice channels yet</p>
            <p className="text-neu-400 text-sm mt-1">Create one and start hanging out</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(channel => {
              const icon = CHANNEL_ICONS[channel.name?.toLowerCase()] ?? '🔊';
              const participantCount = channel.participants?.length ?? 0;
              const isActive = participantCount > 0;

              return (
                <motion.div
                  key={channel.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neu-card p-5 cursor-pointer group"
                  onClick={() => handleJoin(channel.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-2xl">
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neu-900 dark:text-neu-50">
                          {channel.name}
                        </h3>
                        <p className="text-xs text-neu-500">
                          {isActive ? `${participantCount} connected` : 'Empty'}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-green-500 font-medium">LIVE</span>
                      </span>
                    )}
                  </div>

                  {/* Participants avatars */}
                  {isActive && channel.participants && (
                    <div className="flex items-center gap-1 mb-4">
                      {channel.participants.slice(0, 5).map((p, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white font-bold -ml-1 first:ml-0 border-2 border-neu-100 dark:border-neu-900"
                        >
                          {typeof p === 'string' ? p[0] : '?'}
                        </div>
                      ))}
                      {participantCount > 5 && (
                        <span className="text-xs text-neu-500 ml-1">
                          +{participantCount - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Join button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={joining === channel.id}
                    className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30'
                        : 'neu-btn text-neu-600 dark:text-neu-400'
                    }`}
                    onClick={e => {
                      e.stopPropagation();
                      handleJoin(channel.id);
                    }}
                  >
                    {joining === channel.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Joining...
                      </span>
                    ) : isActive ? (
                      '📞 Join Voice'
                    ) : (
                      '🔊 Enter Channel'
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create channel modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="neu-card p-6 w-full max-w-sm mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-neu-900 dark:text-neu-50 mb-4">
                Create Voice Channel
              </h2>

              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Channel name (e.g. lounge, gaming...)"
                className="neu-input w-full mb-4"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && newName.trim() && createMutation.mutate(newName.trim())}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 neu-btn py-2.5 text-sm font-medium text-neu-600 dark:text-neu-400"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!newName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate(newName.trim())}
                  className="flex-1 neu-btn-primary py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
