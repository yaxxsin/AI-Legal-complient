'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
  regulation?: {
    id: string;
    title: string;
    category: string;
  } | null;
}

interface NotificationsResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Helper to read cookie value */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function getAuthHeaders(): Record<string, string> {
  const token = getCookie('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Hook for notifications — fetch, mark read, polling */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /** Fetch notifications */
  const fetchNotifications = useCallback(async (p = 1) => {
    try {
      const res = await fetch(
        `${API_URL}/notifications?page=${p}&limit=20`,
        { 
          headers: getAuthHeaders(),
          credentials: 'include',
        },
      );
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setNotifications(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Fetch unread count */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/notifications/unread-count`,
        { 
          headers: getAuthHeaders(),
          credentials: 'include',
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count);
    } catch {
      // silent
    }
  }, []);

  /** Mark single as read */
  async function markAsRead(id: string) {
    const res = await fetch(
      `${API_URL}/notifications/${id}/read`,
      { 
        method: 'PATCH', 
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  /** Mark all as read */
  async function markAllAsRead() {
    const res = await fetch(
      `${API_URL}/notifications/read-all`,
      { 
        method: 'POST', 
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  }

  /** Delete notification */
  async function deleteNotification(id: string) {
    const res = await fetch(
      `${API_URL}/notifications/${id}`,
      { 
        method: 'DELETE', 
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );
    if (res.ok) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  }

  // Initial fetch + polling every 60s
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60_000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    page,
    totalPages,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setPage,
  };
}
