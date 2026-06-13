import { create } from "zustand";
import type { Notification } from "@prisma/client";

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));

interface SearchStore {
  filters: {
    query: string;
    difficulty: string;
    topicId: string;
    status: string;
    facultyName: string;
    dateFrom: string;
    dateTo: string;
  };
  setFilter: (key: string, value: string) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  query: "",
  difficulty: "",
  topicId: "",
  status: "",
  facultyName: "",
  dateFrom: "",
  dateTo: "",
};

export const useSearchStore = create<SearchStore>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
