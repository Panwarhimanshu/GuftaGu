import { apiClient } from './apiClient';
import type { HangoutEvent, HangoutResponseStatus } from '@memechat/shared';

export const hangoutApi = {
  create: async (dto: {
    type: string;
    message?: string;
    location?: string;
    durationMinutes: number;
    invitedUsers?: string[];
  }): Promise<HangoutEvent> => {
    const { data } = await apiClient.post<HangoutEvent>('/hangouts', dto);
    return data;
  },

  getActive: async (): Promise<HangoutEvent[]> => {
    const { data } = await apiClient.get<HangoutEvent[]>('/hangouts/active');
    return data;
  },

  getById: async (id: string): Promise<HangoutEvent> => {
    const { data } = await apiClient.get<HangoutEvent>(`/hangouts/${id}`);
    return data;
  },

  respond: async (
    id: string,
    dto: { status: HangoutResponseStatus; eta?: number },
  ): Promise<HangoutEvent> => {
    const { data } = await apiClient.post<HangoutEvent>(`/hangouts/${id}/respond`, dto);
    return data;
  },

  startTimer: async (id: string): Promise<HangoutEvent> => {
    const { data } = await apiClient.post<HangoutEvent>(`/hangouts/${id}/timer`);
    return data;
  },

  close: async (id: string): Promise<void> => {
    await apiClient.delete(`/hangouts/${id}`);
  },

  getHistory: async (): Promise<HangoutEvent[]> => {
    const { data } = await apiClient.get<HangoutEvent[]>('/hangouts/history');
    return data;
  },
};
