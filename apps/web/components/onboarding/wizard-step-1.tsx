'use client';

const ENTITY_TYPES = [
  { value: 'PT', label: 'PT (Perseroan Terbatas)', icon: '🏢', desc: 'Badan hukum dengan saham' },
  { value: 'CV', label: 'CV (Commanditaire Vennootschap)', icon: '🤝', desc: 'Persekutuan komanditer' },
  { value: 'Firma', label: 'Firma', icon: '📝', desc: 'Persekutuan firma' },
  { value: 'UD', label: 'UD (Usaha Dagang)', icon: '🏪', desc: 'Perusahaan perorangan' },
  { value: 'Perorangan', label: 'Perorangan', icon: '👤', desc: 'Usaha individu tanpa badan hukum' },
  { value: 'Koperasi', label: 'Koperasi', icon: '🤲', desc: 'Badan usaha koperasi' },
  { value: 'Yayasan', label: 'Yayasan', icon: '🏛️', desc: 'Badan hukum nirlaba' },
];

interface Step1Props {
  value: string;
  onChange: (value: string) => void;
}

export function WizardStep1({ value, onChange }: Step1Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Pilih Jenis Usaha</h2>
        <p className="text-sm text-muted-foreground">
          Pilih bentuk badan usaha yang sesuai dengan bisnis Anda
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ENTITY_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
              value === type.value
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
            }`}
          >
            <span className="text-2xl flex-shrink-0 mt-0.5">{type.icon}</span>
            <div>
              <p className="font-medium text-sm">{type.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
