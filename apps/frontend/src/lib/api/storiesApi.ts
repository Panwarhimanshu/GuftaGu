import { apiClient } from './apiClient';
import type { Story } from '@memechat/shared';

export const storiesApi = {
  getFeed: async (): Promise<Story[]> => {
    const { data } = await apiClient.get<Story[]>('/stories');
    return data;
  },

  create: async (payload: { type: string; text?: string; backgroundColor?: string; file?: File }): Promise<Story> => {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined) form.append(k, v as string | Blob);
    });
    const { data } = await apiClient.post<Story>('/stories', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  view: async (storyId: string): Promise<void> => {
    await apiClient.post(`/stories/${storyId}/view`);
  },

  react: async (storyId: string, emoji: string): Promise<void> => {
    await apiClient.post(`/stories/${storyId}/react`, { emoji });
  },

  delete: async (storyId: string): Promise<void> => {
    await apiClient.delete(`/stories/${storyId}`);
  },
};
