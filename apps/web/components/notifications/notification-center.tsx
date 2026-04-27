'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';

/** Notification bell icon + dropdown for sidebar/topbar */
export function NotificationCenter() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function getTypeIcon(type: string) {
    switch (type) {
      case 'regulatory_alert': return '📋';
      case 'deadline_reminder': return '⏰';
      case 'compliance_update': return '✅';
      case 'system': return '🔔';
      default: return '📌';
    }
  }

  function handleClick(n: { id: string; isRead: boolean; actionUrl: string | null }) {
    if (!n.isRead) markAsRead(n.id);
    if (n.actionUrl) {
      router.push(n.actionUrl);
      setIsOpen(false);
    }
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-muted/50 transition-colors"
        aria-label="Notifikasi"
      >
        <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs text-primary hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-72">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Memuat...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <span className="text-3xl">🔔</span>
                <p className="text-muted-foreground text-sm mt-2">
                  Belum ada notifikasi
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    !n.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {getTypeIcon(n.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm line-clamp-1 ${!n.isRead ? 'font-semibold' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border text-center">
              <button
                type="button"
                onClick={() => {
                  router.push('/notifications');
                  setIsOpen(false);
                }}
                className="text-xs text-primary font-medium hover:underline"
              >
                Lihat semua notifikasi →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
