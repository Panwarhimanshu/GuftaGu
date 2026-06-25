'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { userApi } from '@/lib/api/userApi';
import { chatApi } from '@/lib/api/chatApi';

export function ActiveFriends() {
  const router = useRouter();

  const { data: onlineUsers = [], isLoading } = useQuery({
    queryKey: ['users', 'online'],
    queryFn: userApi.getOnlineUsers,
    refetchInterval: 20_000,
  });

  const startChat = useMutation({
    mutationFn: (userId: string) => chatApi.createPrivateConversation(userId),
    onSuccess: (conv) => router.push(`/chat/${conv.id}`),
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 neu-scroll">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-14 h-14 rounded-full animate-pulse" style={{ background: 'var(--neu-shadow-1)' }} />
            <div className="w-12 h-3 rounded animate-pulse" style={{ background: 'var(--neu-shadow-1)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!onlineUsers.length) {
    return (
      <div className="neu-surface-sm p-4 text-center">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          No one else is online right now
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 neu-scroll">
      {onlineUsers.map((user, i) => (
        <motion.button
          key={user.id}
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => startChat.mutate(user.id!)}
          className="flex flex-col items-center gap-2 flex-shrink-0 focus:outline-none"
          title={`Chat with ${user.displayName}`}
        >
          <div className="relative">
            <Avatar src={user.avatar} name={user.displayName} size="lg" status="online" />
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{ background: '#22c55e', borderColor: 'var(--neu-bg)' }}
            >
              <span
                className="absolute inset-0 rounded-full bg-green-500 opacity-75"
                style={{ animation: 'presencePing 1.5s ease-out infinite' }}
              />
            </span>
          </div>
          <span className="text-xs font-medium truncate w-14 text-center" style={{ color: 'var(--neu-text)' }}>
            {user.displayName?.split(' ')[0]}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
