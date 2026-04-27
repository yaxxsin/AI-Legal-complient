'use client';

import { useNotifications } from '@/hooks/use-notifications';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    page,
    totalPages,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  function getTypeIcon(type: string) {
    switch (type) {
      case 'regulatory_alert': return '📋';
      case 'deadline_reminder': return '⏰';
      case 'compliance_update': return '✅';
      case 'system': return '🔔';
      default: return '📌';
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'regulatory_alert': return { label: 'Regulasi', color: 'bg-blue-500/10 text-blue-600' };
      case 'deadline_reminder': return { label: 'Deadline', color: 'bg-orange-500/10 text-orange-600' };
      case 'compliance_update': return { label: 'Compliance', color: 'bg-green-500/10 text-green-600' };
      default: return { label: 'Sistem', color: 'bg-gray-500/10 text-gray-600' };
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Notifikasi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} belum dibaca`
              : 'Semua sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="text-sm text-primary font-medium hover:underline"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">🔔</span>
          <h2 className="text-lg font-semibold mt-4">Belum Ada Notifikasi</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Notifikasi dari regulasi baru dan deadline compliance akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const badge = getTypeBadge(n.type);

            return (
              <div
                key={n.id}
                className={`rounded-xl border border-border p-4 transition-all hover:shadow-sm ${
                  !n.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'
                }`}
              >
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{getTypeIcon(n.type)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <h3 className={`text-sm ${!n.isRead ? 'font-semibold' : ''}`}>
                          {n.title}
                        </h3>
                      </div>

                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">{n.body}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-3">
                      {n.actionUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!n.isRead) markAsRead(n.id);
                            router.push(n.actionUrl!);
                          }}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Lihat Detail →
                        </button>
                      )}
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Tandai dibaca
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(n.id)}
                        className="text-xs text-muted-foreground hover:text-destructive ml-auto"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => fetchNotifications(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Sebelumnya
          </button>
          <span className="text-sm text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => fetchNotifications(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya →
          </button>
        </div>
      )}
    </div>
  );
}
