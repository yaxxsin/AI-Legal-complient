'use client';

const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan',
  'Bengkulu', 'Lampung', 'Kep. Bangka Belitung', 'Kep. Riau', 'DKI Jakarta',
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat',
  'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya',
];

interface Step3Props {
  businessName: string;
  establishmentDate: string;
  city: string;
  province: string;
  onChange: (field: string, value: string) => void;
}

export function WizardStep3({ businessName, establishmentDate, city, province, onChange }: Step3Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Detail Bisnis</h2>
        <p className="text-sm text-muted-foreground">
          Informasi dasar tentang bisnis Anda
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="ob-business-name" className="text-sm font-medium">Nama Bisnis / Perusahaan</label>
          <input
            id="ob-business-name"
            type="text"
            value={businessName}
            onChange={(e) => onChange('businessName', e.target.value)}
            placeholder="PT Maju Bersama Indonesia"
            maxLength={200}
            className="settings-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ob-establishment-date" className="text-sm font-medium">Tanggal Pendirian</label>
          <input
            id="ob-establishment-date"
            type="date"
            value={establishmentDate}
            onChange={(e) => onChange('establishmentDate', e.target.value)}
            className="settings-input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="ob-province" className="text-sm font-medium">Provinsi</label>
            <select
              id="ob-province"
              value={province}
              onChange={(e) => onChange('province', e.target.value)}
              className="settings-input"
            >
              <option value="">Pilih provinsi</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="ob-city" className="text-sm font-medium">Kota / Kabupaten</label>
            <input
              id="ob-city"
              type="text"
              value={city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="Jakarta Selatan"
              maxLength={100}
              className="settings-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
