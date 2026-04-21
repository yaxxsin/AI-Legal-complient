'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Clock, CheckCircle2, XCircle, Loader2, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SyncLog {
  id: string;
  source: string;
  status: string;
  totalFetched: number;
  totalNew: number;
  totalUpdated: number;
  totalSkipped: number;
  errorMessage: string | null;
  triggeredBy: string;
  startedAt: string;
  completedAt: string | null;
}

export default function AdminRegulationSyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  const getToken = () =>
    document.cookie.split('; ').find(r => r.startsWith('access_token='))?.split('=')[1];

  const fetchHistory = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${apiUrl}/regulation-sync/history?limit=30`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items ?? []);
      }
    } catch (e) {
      console.error('Failed to fetch sync history:', e);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const token = getToken();
      const res = await fetch(`${apiUrl}/regulation-sync/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const results = data.results ?? [];
        const totalNew = results.reduce((s: number, r: any) => s + (r.totalNew ?? 0), 0);
        const totalUpdated = results.reduce((s: number, r: any) => s + (r.totalUpdated ?? 0), 0);
        setSyncResult(`✅ Sync selesai! ${totalNew} regulasi baru, ${totalUpdated} diperbarui.`);
        fetchHistory();
      } else {
        const err = await res.json().catch(() => ({}));
        setSyncResult(`❌ Gagal: ${err.message ?? 'Unknown error'}`);
      }
    } catch (e) {
      setSyncResult(`❌ Error: ${(e as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const statusBadge = (status: string) => {
    if (status === 'success') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
        <CheckCircle2 className="w-3 h-3" /> Sukses
      </span>
    );
    if (status === 'failed') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500">
        <XCircle className="w-3 h-3" /> Gagal
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500">
        <Loader2 className="w-3 h-3 animate-spin" /> Berjalan
      </span>
    );
  };

  const sourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      peraturan_go_id: 'bg-blue-500/10 text-blue-500',
      jdih: 'bg-violet-500/10 text-violet-500',
      manual_csv: 'bg-orange-500/10 text-orange-500',
    };
    const labels: Record<string, string> = {
      peraturan_go_id: 'peraturan.go.id',
      jdih: 'JDIH',
      manual_csv: 'CSV Import',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[source] ?? 'bg-muted text-muted-foreground'}`}>
        {labels[source] ?? source}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <RefreshCw className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">Regulation Sync</h1>
            <p className="text-muted-foreground mt-1">
              Auto-pull regulasi terbaru dari sumber pemerintah (peraturan.go.id, JDIH)
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isSyncing ? 'Menyinkronkan...' : 'Sync Sekarang'}
        </button>
      </div>

      {/* Sync Result Banner */}
      {syncResult && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          syncResult.startsWith('✅')
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
            : 'bg-red-500/5 border-red-500/20 text-red-500'
        }`}>
          {syncResult}
        </div>
      )}

      {/* Stats Summary */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold text-primary">{logs.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Sync Jobs</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold text-emerald-500">
                {logs.filter(l => l.status === 'success').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sukses</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold text-red-500">
                {logs.filter(l => l.status === 'failed').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Gagal</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold text-blue-500">
                {logs.reduce((s, l) => s + l.totalNew, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Regulasi Baru</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync History Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-heading font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Riwayat Sinkronisasi
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Database className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Belum ada riwayat sinkronisasi.</p>
              <p className="text-xs mt-1">Klik &quot;Sync Sekarang&quot; untuk memulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Waktu</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sumber</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Fetched</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Baru</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Update</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Skip</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trigger</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(log.startedAt)}</td>
                      <td className="px-4 py-3">{sourceBadge(log.source)}</td>
                      <td className="px-4 py-3">{statusBadge(log.status)}</td>
                      <td className="px-4 py-3 text-center font-mono">{log.totalFetched}</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-500 font-semibold">
                        {log.totalNew > 0 ? `+${log.totalNew}` : '0'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-blue-500">
                        {log.totalUpdated > 0 ? `~${log.totalUpdated}` : '0'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">{log.totalSkipped}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          log.triggeredBy === 'cron'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-sky-500/10 text-sky-600'
                        }`}>
                          {log.triggeredBy === 'cron' ? '⏰ Cron' : '👤 Manual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-red-400 max-w-[200px] truncate" title={log.errorMessage ?? ''}>
                        {log.errorMessage ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
