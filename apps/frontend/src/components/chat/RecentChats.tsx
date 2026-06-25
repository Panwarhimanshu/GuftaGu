'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CheckCheck, Image, Mic, FileText, Pin } from 'lucide-react';
import { chatApi } from '@/lib/api/chatApi';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';

export function RecentChats() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-neu-sm animate-pulse"
            style={{ background: 'var(--neu-bg-card)' }}
          >
            <div className="w-12 h-12 rounded-full" style={{ background: 'var(--neu-shadow-1)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded w-32" style={{ background: 'var(--neu-shadow-1)' }} />
              <div className="h-3 rounded w-48 opacity-60" style={{ background: 'var(--neu-shadow-1)' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <div className="neu-surface p-8 text-center">
        <p className="text-4xl mb-3">💬</p>
        <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>No conversations yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
          Start chatting with your friends!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv, i) => {
        const otherUser = conv.type === 'private'
          ? conv.participants.find(p => p.userId !== user?.id)?.user
          : null;
        const name = conv.type === 'private' ? otherUser?.displayName : conv.name;
        const avatar = conv.type === 'private' ? otherUser?.avatar : conv.avatar;
        const hasUnread = conv.unreadCount > 0;

        return (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => router.push(`/chat/${conv.id}`)}
            className="flex items-center gap-3 p-3 rounded-neu-sm cursor-pointer transition-all relative"
            style={{
              background: hasUnread ? 'var(--neu-bg-card)' : 'transparent',
              boxShadow: hasUnread
                ? '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)'
                : 'none',
            }}
            whileHover={{
              x: 4,
              boxShadow: '3px 3px 8px var(--neu-shadow-1), -3px -3px 8px var(--neu-shadow-2)',
            }}
          >
            {/* Pinned indicator */}
            {conv.isPinned && (
              <Pin className="absolute top-2 right-2 w-3 h-3 opacity-40" style={{ color: 'var(--brand)' }} />
            )}

            <Avatar
              src={avatar}
              name={name}
              size="md"
              status={otherUser?.isOnline ? 'online' : undefined}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-${hasUnread ? 'bold' : 'medium'} truncate text-sm`}
                  style={{ color: 'var(--neu-text)' }}
                >
                  {name}
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--neu-text-muted)' }}>
                  {conv.lastMessage
                    ? format(new Date(conv.lastMessage.createdAt), 'HH:mm')
                    : ''}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-0.5">
                <div className="flex items-center gap-1 min-w-0">
                  {conv.lastMessage?.senderId === user?.id && (
                    <CheckCheck className="w-3 h-3 flex-shrink-0 text-blue-400" />
                  )}
                  <LastMessagePreview message={conv.lastMessage} />
                </div>

                {hasUnread && (
                  <span
                    className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                    style={{ background: 'var(--brand)' }}
                  >
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function LastMessagePreview({ message }: { message: any }) {
  if (!message) return <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>No messages yet</span>;

  const icons: Record<string, React.ReactNode> = {
    image:      <Image className="w-3 h-3" />,
    voice_note: <Mic className="w-3 h-3" />,
    document:   <FileText className="w-3 h-3" />,
  };

  const labels: Record<string, string> = {
    image:      '📷 Photo',
    video:      '🎥 Video',
    voice_note: '🎤 Voice note',
    document:   '📄 Document',
    gif:        '🎞 GIF',
    sticker:    '🌟 Sticker',
    location:   '📍 Location',
    poll:       '📊 Poll',
  };

  const preview = message.isDeleted
    ? '🚫 Message deleted'
    : labels[message.type] ?? message.content;

  return (
    <p
      className="text-xs truncate flex items-center gap-1"
      style={{
        color: 'var(--neu-text-muted)',
        fontWeight: message.isRead === false ? 600 : 400,
      }}
    >
      {icons[message.type]}
      {preview}
    </p>
  );
}
