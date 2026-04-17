'use client';

const REVENUE_RANGES = [
  { value: '<500jt', label: '< Rp 500 Juta' },
  { value: '500jt-2.5m', label: 'Rp 500 Juta - 2,5 Miliar' },
  { value: '2.5m-50m', label: 'Rp 2,5 - 50 Miliar' },
  { value: '>50m', label: '> Rp 50 Miliar' },
];

interface Step4Props {
  employeeCount: number;
  annualRevenue: string;
  isOnlineBusiness: boolean;
  onChange: (field: string, value: unknown) => void;
}

export function WizardStep4({ employeeCount, annualRevenue, isOnlineBusiness, onChange }: Step4Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Skala Bisnis</h2>
        <p className="text-sm text-muted-foreground">
          Informasi ini membantu menentukan regulasi yang berlaku
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="ob-employee-count" className="text-sm font-medium">Jumlah Karyawan</label>
          <input
            id="ob-employee-count"
            type="number"
            min={0}
            value={employeeCount}
            onChange={(e) => onChange('employeeCount', parseInt(e.target.value) || 0)}
            placeholder="0"
            className="settings-input"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Omzet Tahunan</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REVENUE_RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onChange('annualRevenue', r.value)}
                className={`p-3 rounded-xl border text-sm text-left transition-all ${
                  annualRevenue === r.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 font-medium'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div>
            <p className="text-sm font-medium">Bisnis Online</p>
            <p className="text-xs text-muted-foreground">Apakah bisnis Anda beroperasi secara online?</p>
          </div>
          <button
            type="button"
            onClick={() => onChange('isOnlineBusiness', !isOnlineBusiness)}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              isOnlineBusiness ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isOnlineBusiness ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
