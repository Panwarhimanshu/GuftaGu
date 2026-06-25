'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Upload, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { NeuButton } from '@/components/ui/NeuButton';
import { useAuthStore } from '@/store/authStore';
import { memeFeedApi } from '@/lib/api/memeFeedApi';
import type { MemeFeedPost } from '@memechat/shared';
import { formatDistanceToNow } from 'date-fns';

export default function MemeFeedPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['meme-feed'],
    queryFn: ({ pageParam }) => memeFeedApi.getFeed({ cursor: pageParam as string }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.cursor,
  });

  const posts = data?.pages.flatMap(p => p.posts) ?? [];

  const likeMutation = useMutation({
    mutationFn: (postId: string) => memeFeedApi.like(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ['meme-feed'] });
      qc.setQueryData(['meme-feed'], (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: MemeFeedPost) =>
            p.id === postId
              ? {
                  ...p,
                  likesCount: p.likes.includes(user?.id ?? '') ? p.likesCount - 1 : p.likesCount + 1,
                  likes: p.likes.includes(user?.id ?? '')
                    ? p.likes.filter((id: string) => id !== user?.id)
                    : [...p.likes, user?.id],
                }
              : p,
          ),
        })),
      }));
    },
  });

  return (
    <div className="flex-1 overflow-y-auto neu-scroll">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b"
        style={{
          background: 'var(--neu-bg)',
          borderColor: 'var(--neu-border)',
          boxShadow: '0 4px 12px var(--neu-shadow-1)',
        }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#ec4899' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Meme Feed</h1>
        </div>
        <NeuButton
          variant="primary"
          size="sm"
          icon={<Upload className="w-4 h-4" />}
        >
          Upload
        </NeuButton>
      </div>

      {/* Feed */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {posts.map((post, i) => (
          <MemeCard
            key={post.id}
            post={post}
            currentUserId={user?.id ?? ''}
            onLike={() => likeMutation.mutate(post.id)}
          />
        ))}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <NeuButton loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
              Load more
            </NeuButton>
          </div>
        )}
      </div>
    </div>
  );
}

function MemeCard({
  post,
  currentUserId,
  onLike,
}: {
  post: MemeFeedPost;
  currentUserId: string;
  onLike: () => void;
}) {
  const isLiked = post.likes.includes(currentUserId);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="neu-card overflow-hidden"
    >
      {/* Author row */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar src={post.author?.avatar} name={post.author?.displayName} size="md" status="online" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>
            {post.author?.displayName}
          </p>
          <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ color: 'var(--neu-text-muted)' }}
        >
          •••
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="px-4 pb-3 text-sm" style={{ color: 'var(--neu-text)' }}>
          {post.caption}
        </p>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="text-xs font-medium"
              style={{ color: 'var(--brand)' }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Image */}
      <div className="relative bg-black aspect-square">
        <Image
          src={post.imageUrl}
          alt={post.caption ?? 'Meme'}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 512px"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 p-4">
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={onLike}
          className="flex items-center gap-1.5"
        >
          <Heart
            className={`w-6 h-6 transition-all ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
            style={{ color: isLiked ? '#ef4444' : 'var(--neu-text-muted)' }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--neu-text-muted)' }}>
            {post.likesCount}
          </span>
        </motion.button>

        <button className="flex items-center gap-1.5" style={{ color: 'var(--neu-text-muted)' }}>
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-medium">{post.commentsCount}</span>
        </button>

        <button className="flex items-center gap-1.5" style={{ color: 'var(--neu-text-muted)' }}>
          <Share2 className="w-6 h-6" />
          <span className="text-sm font-medium">{post.sharesCount}</span>
        </button>

        <button className="ml-auto" style={{ color: post.isSaved ? 'var(--brand)' : 'var(--neu-text-muted)' }}>
          <Bookmark className={`w-6 h-6 ${post.isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </motion.article>
  );
}
