'use client';

import Image from 'next/image';
import { clsx } from 'clsx';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: Size;
  isOnline?: boolean;
  status?: 'online' | 'busy' | 'away' | 'offline';
  className?: string;
  storyRing?: boolean;
  storySeen?: boolean;
}

const sizeMap: Record<Size, { px: number; class: string; dot: string }> = {
  xs:  { px: 24,  class: 'w-6 h-6 text-xs',    dot: 'w-2 h-2 border' },
  sm:  { px: 32,  class: 'w-8 h-8 text-xs',    dot: 'w-2.5 h-2.5 border' },
  md:  { px: 40,  class: 'w-10 h-10 text-sm',  dot: 'w-3 h-3 border-2' },
  lg:  { px: 48,  class: 'w-12 h-12 text-base', dot: 'w-3.5 h-3.5 border-2' },
  xl:  { px: 64,  class: 'w-16 h-16 text-lg',  dot: 'w-4 h-4 border-2' },
  '2xl':{ px: 80, class: 'w-20 h-20 text-xl',  dot: 'w-5 h-5 border-2' },
};

const statusColors = {
  online:  '#22c55e',
  busy:    '#ef4444',
  away:    '#f59e0b',
  offline: '#6b7280',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name?: string): string {
  const colors = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fccb90,#d57eeb)',
    'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({
  src,
  name,
  size = 'md',
  isOnline,
  status,
  className,
  storyRing,
  storySeen,
}: AvatarProps) {
  const { px, class: sizeClass, dot: dotClass } = sizeMap[size];
  const effectiveStatus = status ?? (isOnline ? 'online' : undefined);

  const inner = (
    <div className={clsx('relative flex-shrink-0 inline-flex', className)}>
      <div className={clsx('relative rounded-full overflow-hidden', sizeClass)}>
        {src ? (
          <Image
            src={src}
            alt={name ?? 'Avatar'}
            width={px}
            height={px}
            className="object-cover w-full h-full"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-bold"
            style={{ background: getAvatarColor(name) }}
          >
            {getInitials(name)}
          </div>
        )}
      </div>

      {/* Status dot */}
      {effectiveStatus && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full',
            dotClass,
          )}
          style={{
            background: statusColors[effectiveStatus],
            borderColor: 'var(--neu-bg)',
          }}
        />
      )}
    </div>
  );

  if (storyRing) {
    return (
      <div
        className={clsx(
          'rounded-full p-0.5',
          storySeen ? 'story-ring-seen' : 'story-ring',
        )}
      >
        {inner}
      </div>
    );
  }

  return inner;
}
