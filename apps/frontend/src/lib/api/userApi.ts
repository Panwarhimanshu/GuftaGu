import { apiClient } from './apiClient';
import type { User } from '@memechat/shared';

export const userApi = {
  getOnlineFriends: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users/friends/online');
    return data;
  },

  getFriends: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users/friends');
    return data;
  },

  getProfile: async (userId: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${userId}`);
    return data;
  },

  updateProfile: async (updates: Partial<User> & { avatar?: File }): Promise<User> => {
    const form = new FormData();
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined) form.append(k, v as string | Blob);
    });
    const { data } = await apiClient.patch<User>('/users/me', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateStatus: async (status: string, customStatus?: string): Promise<User> => {
    const { data } = await apiClient.patch<User>('/users/me/status', { status, customStatus });
    return data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users/search', { params: { q: query } });
    return data;
  },

  discoverUsers: async (): Promise<(User & { relationshipStatus: 'none' | 'friends' | 'request_sent' | 'request_received' })[]> => {
    const { data } = await apiClient.get('/users/discover');
    return data;
  },

  getFriendRequests: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users/me/friend-requests');
    return data;
  },

  sendFriendRequest: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/friend-request`);
  },

  acceptFriendRequest: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/friend-request/accept`);
  },

  declineFriendRequest: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/friend-request/decline`);
  },

  blockUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/block`);
  },
};
