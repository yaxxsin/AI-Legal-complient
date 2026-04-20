'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

/** Compliance item from the API */
export interface ComplianceItem {
  id: string;
  ruleId: string;
  categoryId: string;
  title: string;
  description: string;
  legalBasis: { name: string; url?: string }[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  dueDate: string | null;
  completedAt: string | null;
  evidenceUrl: string | null;
  notes: string | null;
  category: { id: string; name: string; icon: string | null };
  rule: { guidanceText: string | null };
}

/** Grouped checklist response */
export interface ChecklistGroup {
  category: { id: string; name: string; icon: string | null };
  items: ComplianceItem[];
}

/** Score response */
export interface ComplianceScore {
  overallScore: number;
  totalItems: number;
  completedItems: number;
  criticalPending: number;
  categoryScores: {
    categoryId: string;
    name: string;
    score: number;
    completed: number;
    total: number;
  }[];
}

const MOCK_GROUPS: ChecklistGroup[] = [
  {
    category: { id: '1', name: 'Perizinan', icon: '📋' },
    items: [
      { id: '1', ruleId: 'r1', categoryId: '1', title: 'Nomor Induk Berusaha (NIB)', description: 'Setiap pelaku usaha wajib memiliki NIB melalui sistem OSS.', legalBasis: [{ name: 'PP 5/2021' }], priority: 'critical', status: 'pending', dueDate: null, completedAt: null, evidenceUrl: null, notes: null, category: { id: '1', name: 'Perizinan', icon: '📋' }, rule: { guidanceText: 'Daftarkan di oss.go.id' } },
      { id: '2', ruleId: 'r2', categoryId: '1', title: 'Akta Pendirian PT', description: 'PT wajib memiliki akta pendirian dari notaris.', legalBasis: [{ name: 'UU 40/2007' }], priority: 'critical', status: 'completed', dueDate: null, completedAt: '2026-04-10', evidenceUrl: null, notes: null, category: { id: '1', name: 'Perizinan', icon: '📋' }, rule: { guidanceText: null } },
      { id: '3', ruleId: 'r3', categoryId: '1', title: 'Izin Lokasi / Peruntukan', description: 'Usaha dengan lokasi fisik wajib izin lokasi.', legalBasis: [{ name: 'Permen ATR 17/2019' }], priority: 'high', status: 'in_progress', dueDate: null, completedAt: null, evidenceUrl: null, notes: null, category: { id: '1', name: 'Perizinan', icon: '📋' }, rule: { guidanceText: null } },
    ],
  },
  {
    category: { id: '2', name: 'Ketenagakerjaan', icon: '👷' },
    items: [
      { id: '4', ruleId: 'r4', categoryId: '2', title: 'BPJS Ketenagakerjaan', description: 'Wajib mendaftarkan pekerja ke BPJS TK.', legalBasis: [{ name: 'UU 24/2011' }], priority: 'critical', status: 'pending', dueDate: null, completedAt: null, evidenceUrl: null, notes: null, category: { id: '2', name: 'Ketenagakerjaan', icon: '👷' }, rule: { guidanceText: 'Daftar di bpjsketenagakerjaan.go.id' } },
      { id: '5', ruleId: 'r5', categoryId: '2', title: 'BPJS Kesehatan', description: 'Wajib mendaftarkan pekerja BPJS Kes.', legalBasis: [{ name: 'UU 24/2011' }], priority: 'critical', status: 'pending', dueDate: null, completedAt: null, evidenceUrl: null, notes: null, category: { id: '2', name: 'Ketenagakerjaan', icon: '👷' }, rule: { guidanceText: null } },
      { id: '6', ruleId: 'r6', categoryId: '2', title: 'Peraturan Perusahaan (PP)', description: 'Perusahaan ≥10 karyawan wajib PP.', legalBasis: [{ name: 'UU 13/2003' }], priority: 'high', status: 'not_applicable', dueDate: null, completedAt: null, evidenceUrl: null, notes: 'Karyawan < 10', category: { id: '2', name: 'Ketenagakerjaan', icon: '👷' }, rule: { guidanceText: null } },
    ],
  },
  {
    category: { id: '3', name: 'Perpajakan', icon: '💰' },
    items: [
      { id: '7', ruleId: 'r7', categoryId: '3', title: 'NPWP Badan Usaha', description: 'Setiap badan usaha wajib NPWP.', legalBasis: [{ name: 'UU 28/2007' }], priority: 'critical', status: 'completed', dueDate: null, completedAt: '2026-03-15', evidenceUrl: null, notes: null, category: { id: '3', name: 'Perpajakan', icon: '💰' }, rule: { guidanceText: null } },
      { id: '8', ruleId: 'r8', categoryId: '3', title: 'PPh Pasal 21', description: 'Pemotongan PPh 21 karyawan.', legalBasis: [{ name: 'UU 36/2008' }], priority: 'critical', status: 'in_progress', dueDate: null, completedAt: null, evidenceUrl: null, notes: null, category: { id: '3', name: 'Perpajakan', icon: '💰' }, rule: { guidanceText: 'Lapor dan setor bulanan' } },
    ],
  },
  {
    category: { id: '4', name: 'Perlindungan Data', icon: '🔒' },
    items: [
      { id: '9', ruleId: 'r9', categoryId: '4', title: 'Privacy Policy', description: 'Wajib mempublikasikan kebijakan privasi.', legalBasis: [{ name: 'UU 27/2022' }], priority: 'critical', status: 'pending', dueDate: null, completedAt: null, evidenceUrl: null, notes: null, category: { id: '4', name: 'Perlindungan Data', icon: '🔒' }, rule: { guidanceText: null } },
      { id: '10', ruleId: 'r10', categoryId: '4', title: 'Consent Management', description: 'Persetujuan eksplisit sebelum memproses data.', legalBasis: [{ name: 'UU 27/2022 Pasal 20' }], priority: 'critical', status: 'pending', dueDate: null, completedAt: null, evidenceUrl: null, notes: null, category: { id: '4', name: 'Perlindungan Data', icon: '🔒' }, rule: { guidanceText: 'Implementasikan consent form' } },
    ],
  },
];

const MOCK_SCORE: ComplianceScore = {
  overallScore: 27.5,
  totalItems: 8,
  completedItems: 2,
  criticalPending: 5,
  categoryScores: [
    { categoryId: '1', name: 'Perizinan', score: 33.3, completed: 1, total: 3 },
    { categoryId: '2', name: 'Ketenagakerjaan', score: 0, completed: 0, total: 2 },
    { categoryId: '3', name: 'Perpajakan', score: 50, completed: 1, total: 2 },
    { categoryId: '4', name: 'Perlindungan Data', score: 0, completed: 0, total: 2 },
  ],
};

export function useChecklist(profileId?: string) {
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchChecklist = useCallback(async () => {
    if (!profileId) {
      setGroups(MOCK_GROUPS);
      setScore(MOCK_SCORE);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [checklistRes, scoreRes] = await Promise.all([
        apiClient.get<ChecklistGroup[]>(`/compliance/${profileId}`),
        apiClient.get<ComplianceScore>(`/compliance/${profileId}/score`),
      ]);
      setGroups(checklistRes.data ?? MOCK_GROUPS);
      setScore(scoreRes.data ?? MOCK_SCORE);
    } catch {
      setGroups(MOCK_GROUPS);
      setScore(MOCK_SCORE);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const updateStatus = useCallback(
    async (
      itemId: string,
      newStatus: ComplianceItem['status'],
      notes?: string,
      evidenceUrl?: string,
    ) => {
      // Optimistic update
      const prevGroups = [...groups];
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: newStatus,
                  completedAt: newStatus === 'completed'
                    ? new Date().toISOString()
                    : null,
                  notes: notes ?? item.notes,
                }
              : item,
          ),
        })),
      );
      setUpdating(itemId);

      try {
        if (profileId) {
          await apiClient.patch(`/compliance/items/${itemId}`, {
            status: newStatus,
            notes,
            evidenceUrl,
          });
        }
      } catch {
        // Rollback on error
        setGroups(prevGroups);
      } finally {
        setUpdating(null);
      }
    },
    [groups, profileId],
  );

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  return {
    groups,
    score,
    loading,
    updating,
    updateStatus,
    refresh: fetchChecklist,
  };
}
