'use client';

import { useState } from 'react';
import { Calculator, BriefcaseBusiness, AlertCircle, ArrowRight } from 'lucide-react';

type Tab = 'bpjs' | 'severance';

export default function HrCalculatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('bpjs');
  
  // BPJS State
  const [baseSalary, setBaseSalary] = useState('');
  const [allowance, setAllowance] = useState('');
  const [riskLevel, setRiskLevel] = useState('sangat_rendah');
  const [bpjsResult, setBpjsResult] = useState<any>(null);

  // Severance State
  const [severanceSalary, setSeveranceSalary] = useState('');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const [reason, setReason] = useState('phk_efisiensi');
  const [severanceResult, setSeveranceResult] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleCalculateBpjs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const res = await fetch('http://localhost:3001/api/v1/hr/calculate-bpjs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          baseSalary: Number(baseSalary) || 0,
          allowances: Number(allowance) || 0,
          jkkRiskLevel: riskLevel
        })
      });
      if (res.ok) setBpjsResult(await res.json());
    } catch (e) {
      alert('Kalkulasi gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateSeverance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const res = await fetch('http://localhost:3001/api/v1/hr/calculate-severance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          salary: Number(severanceSalary) || 0,
          yearsOfService: Number(years) || 0,
          monthsOfService: Number(months) || 0,
          reasonId: reason
        })
      });
      if (res.ok) setSeveranceResult(await res.json());
    } catch (e) {
      alert('Kalkulasi gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Calculator className="w-8 h-8 text-primary" />
            Kalkulator HR Compliance
          </h1>
          <p className="text-muted-foreground mt-1">Hitung simulasi BPJS TK/Kesehatan dan Pesangon berdasarkan regulasi terbaru (PP 35/2021).</p>
        </div>
      </div>

      <div className="flex bg-muted/50 p-1 rounded-xl w-fit border border-border">
        <button
          onClick={() => setActiveTab('bpjs')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'bpjs' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Kalkulator BPJS
        </button>
        <button
          onClick={() => setActiveTab('severance')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'severance' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Kalkulator Pesangon (PHK)
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM SECTION */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {activeTab === 'bpjs' && (
            <form onSubmit={handleCalculateBpjs} className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">Parameter Gaji</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Gaji Pokok (Rp)</label>
                <input 
                  type="number" required min="0"
                  className="w-full h-11 bg-background border border-input rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                  value={baseSalary} onChange={e => setBaseSalary(e.target.value)} 
                  placeholder="Contoh: 5000000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Tunjangan Tetap (Rp)</label>
                <input 
                  type="number" min="0"
                  className="w-full h-11 bg-background border border-input rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                  value={allowance} onChange={e => setAllowance(e.target.value)} 
                  placeholder="Contoh: 1000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Tingkat Risiko Pekerjaan (JKK)</label>
                <select 
                  className="w-full h-11 bg-background border border-input rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all custom-select"
                  value={riskLevel} onChange={e => setRiskLevel(e.target.value)}
                >
                  <option value="sangat_rendah">Sangat Rendah (0.24%)</option>
                  <option value="rendah">Rendah (0.54%)</option>
                  <option value="sedang">Sedang (0.89%)</option>
                  <option value="tinggi">Tinggi (1.27%)</option>
                  <option value="sangat_tinggi">Sangat Tinggi (1.74%)</option>
                </select>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-2">
                  {isLoading ? 'Menghitung...' : 'Hitung BPJS'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {activeTab === 'severance' && (
            <form onSubmit={handleCalculateSeverance} className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">Dasar Perhitungan Pesangon</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Gaji + Tunjangan Tetap Terakhir (Rp)</label>
                <input 
                  type="number" required min="0"
                  className="w-full h-11 bg-background border border-input rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                  value={severanceSalary} onChange={e => setSeveranceSalary(e.target.value)} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Masa Kerja (Tahun)</label>
                  <input 
                    type="number" min="0" max="50" required
                    className="w-full h-11 bg-background border border-input rounded-xl px-4 focus:ring-2 focus:ring-primary outline-none" 
                    value={years} onChange={e => setYears(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bulan Tambahan</label>
                  <input 
                    type="number" min="0" max="11" required
                    className="w-full h-11 bg-background border border-input rounded-xl px-4 focus:ring-2 focus:ring-primary outline-none" 
                    value={months} onChange={e => setMonths(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Alasan Berhenti / PHK</label>
                <select 
                  className="w-full h-11 bg-background border border-input rounded-xl px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all custom-select"
                  value={reason} onChange={e => setReason(e.target.value)}
                >
                  <option value="phk_efisiensi">PHK Efisiensi (Perusahaan tidak rugi)</option>
                  <option value="phk_merugi">PHK Karena Perusahaan Rugi</option>
                  <option value="resign">Mengundurkan Diri (Resign)</option>
                  <option value="pensiun">Memasuki Usia Pensiun</option>
                  <option value="pelanggaran">Pelanggaran Ketentuan Kerja</option>
                  <option value="meninggal">Meninggal Dunia</option>
                </select>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 flex items-center justify-center gap-2">
                  {isLoading ? 'Menghitung...' : 'Hitung Estimasi Kewajiban'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RESULTS SECTION */}
        <div className="bg-muted/30 border border-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <BriefcaseBusiness className="w-48 h-48" />
          </div>

          <h2 className="text-lg font-semibold border-b border-border pb-2 mb-6">Hasil Simulasi</h2>

          {activeTab === 'bpjs' && !bpjsResult && (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
              <Calculator className="w-12 h-12 mb-3 opacity-20" />
              <p>Masukkan gaji untuk melihat rincian pemotongan BPJS</p>
            </div>
          )}

          {activeTab === 'severance' && !severanceResult && (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
              <Calculator className="w-12 h-12 mb-3 opacity-20" />
              <p>Masukkan masa kerja & alasan PHK untuk hitung kewajiban</p>
            </div>
          )}

          {/* Render BPJS Result */}
          {activeTab === 'bpjs' && bpjsResult && (
            <div className="space-y-6 relative z-10 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Potongan Karyawan</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(bpjsResult.summary.employeeTotal)}</p>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Tanggungan Perusahaan</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(bpjsResult.summary.employerTotal)}</p>
                </div>
              </div>

              <div className="bg-success/10 border border-success/30 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-sm text-success font-bold uppercase">Estimasi Take Home Pay</p>
                  <p className="text-xs text-success/80 mt-0.5">*(Belum termasuk pot. PPh 21)</p>
                </div>
                <p className="text-2xl font-bold text-success">{formatCurrency(bpjsResult.summary.takeHomePay)}</p>
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Rincian Komponen</h3>
                {[
                  { name: 'Jaminan Hari Tua (JHT)', ...bpjsResult.breakdown.jht },
                  { name: 'Jaminan Pensiun (JP)', ...bpjsResult.breakdown.jp },
                  { name: 'BPJS Kesehatan', ...bpjsResult.breakdown.kesehatan },
                  { name: 'Jaminan Kes. Kerja (JKK)', ...bpjsResult.breakdown.jkk },
                  { name: 'Jaminan Kematian (JKM)', ...bpjsResult.breakdown.jkm },
                ].map(item => (
                  <div key={item.name} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                    <span className="font-medium">{item.name}</span>
                    <div className="text-right">
                      <div className="text-primary text-xs">Prush: {formatCurrency(item.employer)}</div>
                      <div className="text-destructive text-xs">Karywn: {formatCurrency(item.employee)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Severance Result */}
          {activeTab === 'severance' && severanceResult && (
            <div className="space-y-6 relative z-10 animate-fade-in">
              <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-xl">
                <p className="text-sm text-destructive font-bold uppercase mb-1">Total Hak Pekerja</p>
                <p className="text-4xl font-bold font-heading text-destructive">{formatCurrency(severanceResult.totalSeverance)}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <p className="font-semibold text-sm">Uang Pesangon (UP)</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">Multiplier: {severanceResult.multipliers.UP}x</p>
                  </div>
                  <p className="font-bold">{formatCurrency(severanceResult.breakdown.up_uang_pesangon)}</p>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <p className="font-semibold text-sm">Uang Penghargaan Masa Kerja</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">Multiplier: {severanceResult.multipliers.UPMK}x</p>
                  </div>
                  <p className="font-bold">{formatCurrency(severanceResult.breakdown.upmk_penghargaan_masa_kerja)}</p>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <p className="font-semibold text-sm">Uang Penggantian Hak</p>
                  </div>
                  <p className="font-bold">{formatCurrency(severanceResult.breakdown.uph_penggantian_hak)}</p>
                </div>
              </div>

              <div className="bg-background border border-border p-4 rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Ini adalah nilai estimasi kotor sesuai matriks minimal PP 35/2021 untuk alasan <strong className="text-foreground">{severanceResult.reason}</strong> (Masa Kerja: {severanceResult.servicePeriod}). <br/>
                  <br/><i>Uang Penggantian Hak (cuti) diasumsikan 0 dan dihitung manual terpisah. PPh 21 Final atas Pesangon berlaku.</i>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
