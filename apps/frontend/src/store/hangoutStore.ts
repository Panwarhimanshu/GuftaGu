import { create } from 'zustand';
import type { HangoutEvent, HangoutType, HangoutResponseStatus } from '@memechat/shared';
import { hangoutApi } from '@/lib/api/hangoutApi';
import toast from 'react-hot-toast';

interface CreateHangoutDto {
  type: HangoutType;
  message?: string;
  location?: string;
  durationMinutes: number;
}

interface HangoutState {
  isOpen: boolean;
  type: HangoutType | null;
  activeEvent: HangoutEvent | null;
  pendingInvites: HangoutEvent[];
  isCreator: boolean;

  openHangoutModal: (type: HangoutType) => void;
  openIncomingHangout: (event: HangoutEvent) => void;
  close: () => void;
  startHangout: (dto: CreateHangoutDto) => Promise<void>;
  respond: (eventId: string, status: HangoutResponseStatus, eta?: number) => Promise<void>;
  addPendingInvite: (event: HangoutEvent) => void;
  removePendingInvite: (eventId: string) => void;
  updateActiveEvent: (event: HangoutEvent) => void;
}

export const useHangoutStore = create<HangoutState>((set, get) => ({
  isOpen: false,
  type: null,
  activeEvent: null,
  pendingInvites: [],
  isCreator: false,

  openHangoutModal: (type) => set({ isOpen: true, type, activeEvent: null, isCreator: false }),

  openIncomingHangout: (event) =>
    set({ isOpen: true, type: event.type, activeEvent: event, isCreator: false }),

  close: () => set({ isOpen: false, activeEvent: null, isCreator: false }),

  startHangout: async (dto) => {
    const event = await hangoutApi.create(dto);
    set({ activeEvent: event, isCreator: true });
    toast.success(`${dto.type === 'smoke_break' ? '🚬' : '🎉'} Invite sent to everyone!`);
  },

  respond: async (eventId, status, eta) => {
    const updated = await hangoutApi.respond(eventId, { status, eta });
    set({ activeEvent: updated });

    const labels = { coming: '✅ You are going!', not_coming: '❌ Declined', maybe: '🤔 Maybe!' };
    toast(labels[status]);
  },

  addPendingInvite: (event) =>
    set(state => ({
      pendingInvites: [event, ...state.pendingInvites.filter(e => e.id !== event.id)],
    })),

  removePendingInvite: (eventId) =>
    set(state => ({
      pendingInvites: state.pendingInvites.filter(e => e.id !== eventId),
    })),

  updateActiveEvent: (event) =>
    set(state => ({
      activeEvent: state.activeEvent?.id === event.id ? event : state.activeEvent,
    })),
}));
