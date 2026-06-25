'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, MessageCircle, Users, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { CheckCheck, Image, Mic, FileText, Pin } from 'lucide-react';
import { chatApi } from '@/lib/api/chatApi';
import { Avatar } from '@/components/ui/Avatar';
import { NeuButton } from '@/components/ui/NeuButton';
import { useAuthStore } from '@/store/authStore';

export default function ChatListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
  });

  const filtered = conversations.filter(conv => {
    const otherUser = conv.type === 'private'
      ? conv.participants?.find((p: any) => p.userId !== user?.id)?.user
      : null;
    const name = (conv.type === 'private' ? otherUser?.displayName : conv.name) ?? '';

    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'unread' && !conv.unreadCount) return false;
    if (filter === 'groups' && conv.type !== 'group') return false;
    return true;
  });

  return (
    <div className="flex h-full">
      {/* ── Conversation list ──────────────────────────── */}
      <div
        className="w-full md:w-80 lg:w-96 flex flex-col flex-shrink-0 border-r"
        style={{ borderColor: 'var(--neu-border)', background: 'var(--neu-bg)' }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>
              Messages
            </h1>
            <NeuButton variant="icon" size="sm" icon={<Plus className="w-4 h-4" style={{ color: 'var(--brand)' }} />} />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--neu-text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="neu-input pl-9 py-2.5 text-sm"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 mt-3">
            {(['all', 'unread', 'groups'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize"
                style={{
                  background: filter === f ? 'var(--brand)' : 'var(--neu-bg)',
                  color: filter === f ? '#fff' : 'var(--neu-text-muted)',
                  boxShadow: filter === f
                    ? '0 0 12px rgba(59,130,246,0.3)'
                    : '2px 2px 4px var(--neu-shadow-1), -2px -2px 4px var(--neu-shadow-2)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto neu-scroll px-2 pb-4">
          {isLoading ? (
            <div className="space-y-2 px-2 pt-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-neu-sm animate-pulse" style={{ background: 'var(--neu-bg-card)' }}>
                  <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: 'var(--neu-shadow-1)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded w-28" style={{ background: 'var(--neu-shadow-1)' }} />
                    <div className="h-3 rounded w-40 opacity-50" style={{ background: 'var(--neu-shadow-1)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-60">
              <MessageCircle className="w-10 h-10" style={{ color: 'var(--neu-text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--neu-text-muted)' }}>
                {search ? 'No conversations found' : 'No messages yet'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((conv, i) => {
                const otherUser = conv.type === 'private'
                  ? conv.participants?.find((p: any) => p.userId !== user?.id)?.user
                  : null;
                const name = conv.type === 'private' ? otherUser?.displayName : conv.name;
                const avatar = conv.type === 'private' ? otherUser?.avatar : conv.avatar;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <motion.button
                    key={conv.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => router.push(`/chat/${conv.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-neu-sm cursor-pointer transition-all relative text-left"
                    style={{
                      background: hasUnread ? 'var(--neu-bg-card)' : 'transparent',
                      boxShadow: hasUnread ? '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)' : 'none',
                    }}
                    whileHover={{ x: 3, boxShadow: '3px 3px 8px var(--neu-shadow-1), -3px -3px 8px var(--neu-shadow-2)' }}
                  >
                    {conv.isPinned && (
                      <Pin className="absolute top-2 right-2 w-3 h-3 opacity-30" style={{ color: 'var(--brand)' }} />
                    )}

                    <Avatar src={avatar} name={name} size="md" status={otherUser?.isOnline ? 'online' : undefined} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${hasUnread ? 'font-bold' : 'font-medium'}`} style={{ color: 'var(--neu-text)' }}>
                          {name}
                        </span>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--neu-text-muted)' }}>
                          {conv.lastMessage ? format(new Date(conv.lastMessage.createdAt), 'HH:mm') : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)', fontWeight: hasUnread ? 600 : 400 }}>
                          {conv.lastMessage?.senderId === user?.id && <CheckCheck className="inline w-3 h-3 mr-1 text-blue-400" />}
                          {conv.lastMessage?.content ?? 'No messages yet'}
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Empty state (desktop) ──────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 opacity-50">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-neu-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
            boxShadow: '12px 12px 24px var(--neu-shadow-1), -12px -12px 24px var(--neu-shadow-2)',
          }}
        >
          <MessageCircle className="w-12 h-12 text-white" />
        </motion.div>
        <div className="text-center">
          <p className="font-semibold text-lg" style={{ color: 'var(--neu-text)' }}>Select a conversation</p>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>Pick a chat from the list to start messaging</p>
        </div>
      </div>
    </div>
  );
}
