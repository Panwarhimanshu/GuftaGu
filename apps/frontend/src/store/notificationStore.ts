import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  avatar?: string;
  from?: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface NotificationState {
  isOpen: boolean;
  notifications: AppNotification[];

  toggle: () => void;
  add: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      isOpen: false,
      notifications: [],

      toggle: () => set(state => ({ isOpen: !state.isOpen })),

      add: (notif) =>
        set(state => ({
          notifications: [
            {
              ...notif,
              id: crypto.randomUUID(),
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...state.notifications.slice(0, 99),
          ],
        })),

      markRead: (id) =>
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllRead: () =>
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
        })),

      dismiss: (id) =>
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        })),

      clear: () => set({ notifications: [] }),
    }),
    {
      name: 'memechat-notifications',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ notifications: state.notifications.slice(0, 50) }),
    },
  ),
);
