import { apiClient } from './apiClient';
import type { Conversation, Message, PaginatedResponse } from '@memechat/shared';

interface MessagesPage { messages: Message[]; cursor?: string; hasMore: boolean }
interface SendMessageDto { type: string; content?: string; mediaUrl?: string; replyTo?: string }

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const { data } = await apiClient.get<Conversation[]>('/conversations');
    return data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const { data } = await apiClient.get<Conversation>(`/conversations/${id}`);
    return data;
  },

  createPrivateConversation: async (userId: string): Promise<Conversation> => {
    const { data } = await apiClient.post<Conversation>('/conversations/private', { userId });
    return data;
  },

  createGroupConversation: async (payload: {
    name: string;
    participantIds: string[];
    avatar?: string;
  }): Promise<Conversation> => {
    const { data } = await apiClient.post<Conversation>('/conversations/group', payload);
    return data;
  },

  getMessages: async (
    conversationId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<MessagesPage> => {
    const { data } = await apiClient.get<MessagesPage>(
      `/conversations/${conversationId}/messages`,
      { params },
    );
    return data;
  },

  sendMessage: async (conversationId: string, dto: SendMessageDto): Promise<Message> => {
    const { data } = await apiClient.post<Message>(
      `/conversations/${conversationId}/messages`,
      dto,
    );
    return data;
  },

  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const { data } = await apiClient.patch<Message>(`/messages/${messageId}`, { content });
    return data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },

  reactToMessage: async (messageId: string, emoji: string): Promise<void> => {
    await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
  },

  markRead: async (conversationId: string, messageId: string): Promise<void> => {
    await apiClient.post(`/conversations/${conversationId}/read`, { messageId });
  },

  uploadMedia: async (conversationId: string, file: File): Promise<{ url: string; thumbnailUrl?: string }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post(
      `/conversations/${conversationId}/media`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  pinMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await apiClient.post(`/conversations/${conversationId}/pin`, { messageId });
  },

  searchMessages: async (conversationId: string, query: string): Promise<Message[]> => {
    const { data } = await apiClient.get<Message[]>(
      `/conversations/${conversationId}/search`,
      { params: { q: query } },
    );
    return data;
  },
};
