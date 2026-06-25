import { apiClient } from './apiClient';
import type { MemeFeedPost, MemeComment } from '@memechat/shared';

interface FeedPage { posts: MemeFeedPost[]; cursor?: string; hasMore: boolean }

export const memeFeedApi = {
  getFeed: async (params?: { cursor?: string; limit?: number }): Promise<FeedPage> => {
    const { data } = await apiClient.get<FeedPage>('/meme-feed', { params });
    return data;
  },

  getTrending: async (): Promise<MemeFeedPost[]> => {
    const { data } = await apiClient.get<MemeFeedPost[]>('/meme-feed/trending');
    return data;
  },

  upload: async (file: File, caption?: string, tags?: string[]): Promise<MemeFeedPost> => {
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    if (tags?.length) form.append('tags', JSON.stringify(tags));
    const { data } = await apiClient.post<MemeFeedPost>('/meme-feed', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  like: async (postId: string): Promise<void> => {
    await apiClient.post(`/meme-feed/${postId}/like`);
  },

  save: async (postId: string): Promise<void> => {
    await apiClient.post(`/meme-feed/${postId}/save`);
  },

  share: async (postId: string): Promise<void> => {
    await apiClient.post(`/meme-feed/${postId}/share`);
  },

  getComments: async (postId: string): Promise<MemeComment[]> => {
    const { data } = await apiClient.get<MemeComment[]>(`/meme-feed/${postId}/comments`);
    return data;
  },

  addComment: async (postId: string, content: string): Promise<MemeComment> => {
    const { data } = await apiClient.post<MemeComment>(`/meme-feed/${postId}/comments`, { content });
    return data;
  },

  delete: async (postId: string): Promise<void> => {
    await apiClient.delete(`/meme-feed/${postId}`);
  },
};
