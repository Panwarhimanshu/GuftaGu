'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Check, CheckCheck, Clock, Edit2, Trash2,
  Reply, Forward, Star, Bookmark, Copy, MoreHorizontal,
  FileText, MapPin, Play
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { Message } from '@memechat/shared';
import { clsx } from 'clsx';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

const STATUS_ICONS = {
  sent:      <Clock className="w-3 h-3 opacity-60" />,
  delivered: <CheckCheck className="w-3 h-3 opacity-60" />,
  seen:      <CheckCheck className="w-3 h-3 text-blue-400" />,
};

const REACTION_BAR = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  if (message.isDeleted) {
    return (
      <div className={clsx('flex items-end gap-2 mb-1', isOwn ? 'justify-end' : 'justify-start')}>
        <div
          className="px-4 py-2.5 rounded-2xl text-sm italic"
          style={{
            background: 'var(--neu-bg-card)',
            color: 'var(--neu-text-muted)',
            boxShadow: '2px 2px 6px var(--neu-shadow-1), -2px -2px 6px var(--neu-shadow-2)',
          }}
        >
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={clsx(
        'group flex items-end gap-2 mb-1',
        isOwn ? 'flex-row-reverse' : 'flex-row',
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {/* Avatar (other person) */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && (
            <Avatar src={message.sender?.avatar} name={message.sender?.displayName} size="sm" />
          )}
        </div>
      )}

      <div className={clsx('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start', 'max-w-xs lg:max-w-md')}>
        {/* Sender name (groups) */}
        {!isOwn && showAvatar && message.sender && (
          <span className="text-xs font-semibold px-1" style={{ color: 'var(--brand)' }}>
            {message.sender.displayName}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className="px-3 py-1.5 rounded-t-xl text-xs border-l-2 opacity-80"
            style={{
              background: 'var(--neu-bg)',
              borderColor: isOwn ? '#fff' : 'var(--brand)',
              color: 'var(--neu-text-muted)',
              boxShadow: '2px 2px 4px var(--neu-shadow-1)',
            }}
          >
            ↩ Replying to a message
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div className={isOwn ? 'msg-bubble-own' : 'msg-bubble-other'}>
            <MessageContent message={message} isOwn={isOwn} />

            {/* Timestamp & status */}
            <div className={clsx('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
              {message.isEdited && (
                <span className="text-xs opacity-50">edited</span>
              )}
              <span className="text-xs opacity-50">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {isOwn && STATUS_ICONS[message.status]}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div
              className={clsx(
                'absolute -bottom-3 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs',
                isOwn ? 'right-0' : 'left-0',
              )}
              style={{
                background: 'var(--neu-bg)',
                boxShadow: '2px 2px 4px var(--neu-shadow-1), -2px -2px 4px var(--neu-shadow-2)',
              }}
            >
              {message.reactions.slice(0, 3).map((r, i) => (
                <span key={i}>{r.emoji}</span>
              ))}
              {message.reactions.length > 3 && (
                <span style={{ color: 'var(--neu-text-muted)' }}>+{message.reactions.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Action bar (hover) */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded-neu-sm mt-1',
            )}
            style={{
              background: 'var(--neu-bg)',
              boxShadow: '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
            }}
          >
            {showReactions ? (
              REACTION_BAR.map(emoji => (
                <button
                  key={emoji}
                  className="text-base hover:scale-125 transition-transform"
                  onClick={() => setShowReactions(false)}
                >
                  {emoji}
                </button>
              ))
            ) : (
              <>
                <ActionBtn icon="😊" onClick={() => setShowReactions(true)} />
                <ActionBtn icon={<Reply className="w-3.5 h-3.5" />} onClick={() => {}} />
                <ActionBtn icon={<Forward className="w-3.5 h-3.5" />} onClick={() => {}} />
                <ActionBtn icon={<Star className="w-3.5 h-3.5" />} onClick={() => {}} />
                <ActionBtn icon={<Copy className="w-3.5 h-3.5" />} onClick={() => navigator.clipboard.writeText(message.content)} />
                {isOwn && <ActionBtn icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => {}} />}
                {isOwn && <ActionBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => {}} className="text-red-400" />}
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({
  icon,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-1 rounded-lg transition-colors hover:bg-blue-500/10',
        className,
      )}
      style={{ color: 'var(--neu-text-muted)' }}
    >
      {typeof icon === 'string' ? icon : icon}
    </button>
  );
}

function MessageContent({ message, isOwn }: { message: Message; isOwn: boolean }) {
  switch (message.type) {
    case 'text':
      return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;

    case 'image':
      return (
        <div className="rounded-xl overflow-hidden -mx-1 -mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={message.mediaUrl} alt="Image" className="w-full max-w-xs object-cover" />
          {message.content && <p className="text-sm p-2">{message.content}</p>}
        </div>
      );

    case 'voice_note':
      return (
        <div className="flex items-center gap-3 min-w-[180px]">
          <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 fill-current" />
          </button>
          <div className="flex-1">
            {/* Waveform visualization */}
            <div className="flex items-center gap-0.5 h-8">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full flex-1"
                  style={{
                    height: `${20 + Math.random() * 60}%`,
                    background: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--brand)',
                  }}
                />
              ))}
            </div>
          </div>
          <span className="text-xs opacity-70">{message.duration ?? 0}s</span>
        </div>
      );

    case 'document':
      return (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{message.fileName ?? 'Document'}</p>
            <p className="text-xs opacity-60">
              {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}
            </p>
          </div>
        </div>
      );

    case 'location':
      return (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{message.location?.address ?? 'Shared location'}</p>
        </div>
      );

    default:
      return <p className="text-sm">{message.content}</p>;
  }
}
