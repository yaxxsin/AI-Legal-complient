'use client';

interface Step5Props {
  hasNib: boolean;
  nibNumber: string;
  npwp: string;
  onChange: (field: string, value: unknown) => void;
}

export function WizardStep5({ hasNib, nibNumber, npwp, onChange }: Step5Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Legalitas Existing</h2>
        <p className="text-sm text-muted-foreground">
          Dokumen legalitas yang sudah Anda miliki saat ini
        </p>
      </div>

      <div className="space-y-4">
        {/* NIB Toggle */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">NIB (Nomor Induk Berusaha)</p>
              <p className="text-xs text-muted-foreground">Diterbitkan melalui OSS</p>
            </div>
            <button
              type="button"
              onClick={() => onChange('hasNib', !hasNib)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                hasNib ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  hasNib ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {hasNib && (
            <div className="space-y-2 animate-fade-in">
              <label htmlFor="ob-nib-number" className="text-sm font-medium">Nomor NIB</label>
              <input
                id="ob-nib-number"
                type="text"
                value={nibNumber}
                onChange={(e) => onChange('nibNumber', e.target.value)}
                placeholder="1234567890123"
                maxLength={50}
                className="settings-input"
              />
            </div>
          )}
        </div>

        {/* NPWP */}
        <div className="space-y-2">
          <label htmlFor="ob-npwp" className="text-sm font-medium">NPWP (Opsional)</label>
          <input
            id="ob-npwp"
            type="text"
            value={npwp}
            onChange={(e) => onChange('npwp', e.target.value)}
            placeholder="00.000.000.0-000.000"
            maxLength={50}
            className="settings-input"
          />
          <p className="text-xs text-muted-foreground">
            Nomor Pokok Wajib Pajak perusahaan atau pribadi
          </p>
        </div>

        {/* Summary hint */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-primary font-medium mb-1">🎉 Hampir selesai!</p>
          <p className="text-xs text-muted-foreground">
            Setelah submit, kami akan menganalisis profil bisnis Anda dan menyusun
            checklist compliance yang sesuai.
          </p>
        </div>
      </div>
    </div>
  );
}
