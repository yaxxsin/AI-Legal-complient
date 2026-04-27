'use client';

import { useEffect, useState } from 'react';

interface Sector {
  id: string;
  name: string;
  code: string | null;
  icon: string | null;
}

interface Step2Props {
  sectorId: string;
  subSectorIds: string[];
  onSectorChange: (id: string) => void;
  onSubSectorChange: (ids: string[]) => void;
}

export function WizardStep2({
  sectorId,
  subSectorIds,
  onSectorChange,
  onSubSectorChange,
}: Step2Props) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subSectors, setSubSectors] = useState<Sector[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch root sectors
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    fetch(`${apiUrl}/sectors`)
      .then((r) => r.json())
      .then((data) => setSectors(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setSectors([]))
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch sub-sectors when sector changes
  useEffect(() => {
    if (!sectorId) {
      setSubSectors([]);
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    fetch(`${apiUrl}/sectors/${sectorId}/sub-sectors`)
      .then((r) => r.json())
      .then((data) => setSubSectors(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setSubSectors([]));
  }, [sectorId]);

  const filteredSectors = sectors.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleSubSector(id: string) {
    onSubSectorChange(
      subSectorIds.includes(id)
        ? subSectorIds.filter((x) => x !== id)
        : [...subSectorIds, id],
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Pilih Sektor Industri</h2>
        <p className="text-sm text-muted-foreground">
          Sektor menentukan regulasi yang relevan untuk bisnis Anda
        </p>
      </div>

      {/* Sector search + select */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Sektor Utama</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari sektor..."
          className="settings-input"
        />

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Memuat sektor...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto py-1">
            {filteredSectors.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSectorChange(s.id);
                  onSubSectorChange([]);
                  setSearch('');
                }}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${
                  sectorId === s.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <span>{s.icon ?? '📁'}</span>
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sub-sectors (shown after sector selected) */}
      {subSectors.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Sub-sektor (pilih yang relevan)</label>
          <div className="flex flex-wrap gap-2">
            {subSectors.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSubSector(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  subSectorIds.includes(s.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {s.icon ?? '📁'} {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
