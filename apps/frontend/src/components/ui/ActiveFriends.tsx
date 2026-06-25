'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { userApi } from '@/lib/api/userApi';

export function ActiveFriends() {
  const { data: friends, isLoading } = useQuery({
    queryKey: ['friends', 'online'],
    queryFn: () => userApi.getOnlineFriends(),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 neu-scroll">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div
              className="w-14 h-14 rounded-full animate-pulse"
              style={{ background: 'var(--neu-shadow-1)' }}
            />
            <div className="w-12 h-3 rounded animate-pulse" style={{ background: 'var(--neu-shadow-1)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!friends?.length) {
    return (
      <div className="neu-surface-sm p-4 text-center">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          No friends online right now
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 neu-scroll">
      {friends.map((friend, i) => (
        <motion.div
          key={friend.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
        >
          <div className="relative">
            <Avatar
              src={friend.avatar}
              name={friend.displayName}
              size="lg"
              status="online"
            />
            {/* Presence ping */}
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{
                background: '#22c55e',
                borderColor: 'var(--neu-bg)',
              }}
            >
              <span
                className="absolute inset-0 rounded-full bg-green-500 opacity-75"
                style={{ animation: 'presencePing 1.5s ease-out infinite' }}
              />
            </span>
          </div>
          <span
            className="text-xs font-medium truncate w-14 text-center"
            style={{ color: 'var(--neu-text)' }}
          >
            {friend.displayName.split(' ')[0]}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
