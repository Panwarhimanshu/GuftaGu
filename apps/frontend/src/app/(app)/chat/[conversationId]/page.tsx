'use client';

import { use, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone, Video, MoreVertical, Search, ArrowLeft,
  Smile, Paperclip, Mic, Send, ImageIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { chatApi } from '@/lib/api/chatApi';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { EmojiPickerPopover } from '@/components/chat/EmojiPickerPopover';
import { MediaUploadButton } from '@/components/chat/MediaUploadButton';
import { VoiceNoteRecorder } from '@/components/chat/VoiceNoteRecorder';
import type { Message } from '@memechat/shared';
import { SocketEvents } from '@memechat/shared';
import { NeuButton } from '@/components/ui/NeuButton';

export default function ChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { socket, emit } = useSocket();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  // Conversation info
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId),
  });

  // Messages (cursor-paginated)
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => chatApi.getMessages(conversationId, { cursor: pageParam as string }),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  });

  const messages = messagesData?.pages.flatMap(p => p.messages) ?? [];

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      chatApi.sendMessage(conversationId, { type: 'text', content }),
    onSuccess: (msg) => {
      qc.setQueryData(['messages', conversationId], (old: any) => ({
        ...old,
        pages: old.pages.map((p: any, i: number) =>
          i === old.pages.length - 1
            ? { ...p, messages: [...p.messages, msg] }
            : p,
        ),
      }));
      setMessageText('');
      scrollToBottom();
    },
  });

  // Socket events
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit(SocketEvents.JOIN_ROOM, conversationId);

    const handlers = {
      [SocketEvents.MESSAGE_RECEIVED]: (msg: Message) => {
        if (msg.conversationId !== conversationId) return;
        qc.setQueryData(['messages', conversationId], (old: any) => ({
          ...old,
          pages: old.pages.map((p: any, i: number) =>
            i === old.pages.length - 1
              ? { ...p, messages: [...p.messages, msg] }
              : p,
          ),
        }));
        scrollToBottom();
        socket.emit(SocketEvents.MESSAGE_SEEN, { messageId: msg.id, conversationId });
      },
      [SocketEvents.TYPING_START]: ({ userId }: { userId: string }) => {
        if (userId !== user?.id) setTypingUsers(prev => [...new Set([...prev, userId])]);
      },
      [SocketEvents.TYPING_STOP]: ({ userId }: { userId: string }) => {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      socket.emit(SocketEvents.LEAVE_ROOM, conversationId);
    };
  }, [socket, conversationId, user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const handleTyping = (value: string) => {
    setMessageText(value);

    if (!isTyping) {
      setIsTyping(true);
      emit(SocketEvents.TYPING_START, { conversationId, userId: user?.id });
    }

    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      emit(SocketEvents.TYPING_STOP, { conversationId, userId: user?.id });
    }, 2000);
  };

  const handleSend = () => {
    const text = messageText.trim();
    if (!text) return;
    sendMutation.mutate(text);
    clearTimeout(typingTimer.current);
    setIsTyping(false);
    emit(SocketEvents.TYPING_STOP, { conversationId, userId: user?.id });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherParticipant = conversation?.participants
    .find(p => p.userId !== user?.id)?.user;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--neu-bg)' }}>
      {/* ── Chat Header ──────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{
          borderColor: 'var(--neu-border)',
          background: 'var(--neu-bg)',
          boxShadow: '0 4px 12px var(--neu-shadow-1)',
        }}
      >
        {/* Back (mobile) */}
        <button className="md:hidden neu-btn-icon p-2" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--neu-text)' }} />
        </button>

        {/* Avatar & name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar
            src={conversation?.type === 'private' ? otherParticipant?.avatar : conversation?.avatar}
            name={conversation?.type === 'private' ? otherParticipant?.displayName : conversation?.name}
            size="md"
            status={conversation?.type === 'private' && otherParticipant?.isOnline ? 'online' : undefined}
          />
          <div className="min-w-0">
            <h2 className="font-bold truncate" style={{ color: 'var(--neu-text)', fontSize: '1rem' }}>
              {conversation?.type === 'private'
                ? otherParticipant?.displayName
                : conversation?.name}
            </h2>
            <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>
              {conversation?.type === 'private'
                ? otherParticipant?.isOnline
                  ? '🟢 Online'
                  : `Last seen ${otherParticipant?.lastSeen ? formatDistanceToNow(new Date(otherParticipant.lastSeen), { addSuffix: true }) : 'a while ago'}`
                : `${conversation?.participants.length} members`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <NeuButton variant="icon" size="sm" icon={<Phone className="w-4 h-4" style={{ color: 'var(--brand)' }} />} />
          <NeuButton variant="icon" size="sm" icon={<Video className="w-4 h-4" style={{ color: 'var(--brand)' }} />} />
          <NeuButton variant="icon" size="sm" icon={<Search className="w-4 h-4" style={{ color: 'var(--neu-text-muted)' }} />} />
          <NeuButton variant="icon" size="sm" icon={<MoreVertical className="w-4 h-4" style={{ color: 'var(--neu-text-muted)' }} />} />
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto neu-scroll px-4 py-4 space-y-1">
        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center mb-4">
            <NeuButton
              size="sm"
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              Load earlier
            </NeuButton>
          </div>
        )}

        {/* Message list */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
              showAvatar={
                msg.senderId !== messages[i - 1]?.senderId ||
                (i > 0 && new Date(msg.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 300_000)
              }
            />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ────────────────────────────────── */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{
          background: 'var(--neu-bg)',
          boxShadow: '0 -4px 12px var(--neu-shadow-1)',
        }}
      >
        <div className="flex items-end gap-3">
          {/* Media buttons */}
          <div className="flex items-center gap-2 mb-0.5">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="neu-btn-icon p-2 transition-all"
              style={{ color: showEmoji ? 'var(--brand)' : 'var(--neu-text-muted)' }}
            >
              <Smile className="w-5 h-5" />
            </button>
            <MediaUploadButton conversationId={conversationId} />
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={messageText}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="neu-input pr-3 py-3 resize-none"
              style={{ minHeight: '48px', maxHeight: '160px' }}
            />
          </div>

          {/* Send / Mic */}
          <div className="mb-0.5">
            {messageText.trim() ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  boxShadow: '4px 4px 10px var(--neu-shadow-1), -2px -2px 6px var(--neu-shadow-2), 0 0 16px rgba(59,130,246,0.4)',
                }}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            ) : (
              <button
                onClick={() => setShowVoiceRecorder(true)}
                className="w-12 h-12 rounded-full neu-surface flex items-center justify-center flex-shrink-0"
                style={{ color: 'var(--neu-text-muted)' }}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Emoji picker */}
        <AnimatePresence>
          {showEmoji && (
            <EmojiPickerPopover
              onSelect={emoji => {
                setMessageText(prev => prev + emoji);
                setShowEmoji(false);
                inputRef.current?.focus();
              }}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Voice recorder overlay */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <VoiceNoteRecorder
            conversationId={conversationId}
            onClose={() => setShowVoiceRecorder(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function formatDistanceToNow(date: Date, opts: { addSuffix: boolean }) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return opts.addSuffix ? 'just now' : 'just now';
  if (mins < 60) return opts.addSuffix ? `${mins}m ago` : `${mins}m`;
  if (hrs  < 24) return opts.addSuffix ? `${hrs}h ago` : `${hrs}h`;
  return opts.addSuffix ? `${days}d ago` : `${days}d`;
}
