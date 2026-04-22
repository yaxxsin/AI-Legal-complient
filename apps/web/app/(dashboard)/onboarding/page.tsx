'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WizardProgress } from '@/components/onboarding/wizard-progress';
import { WizardStep1 } from '@/components/onboarding/wizard-step-1';
import { WizardStep2 } from '@/components/onboarding/wizard-step-2';
import { WizardStep3 } from '@/components/onboarding/wizard-step-3';
import { WizardStep4 } from '@/components/onboarding/wizard-step-4';
import { WizardStep5 } from '@/components/onboarding/wizard-step-5';

const STEP_LABELS = ['Jenis Usaha', 'Sektor', 'Detail', 'Skala', 'Legalitas'];

interface WizardData {
  entityType: string;
  sectorId: string;
  subSectorIds: string[];
  businessName: string;
  establishmentDate: string;
  city: string;
  province: string;
  employeeCount: number;
  annualRevenue: string;
  isOnlineBusiness: boolean;
  hasNib: boolean;
  nibNumber: string;
  nibIssuedDate?: string;
  npwp: string;
}

const INITIAL_DATA: WizardData = {
  entityType: '',
  sectorId: '',
  subSectorIds: [],
  businessName: '',
  establishmentDate: '',
  city: '',
  province: '',
  employeeCount: 0,
  annualRevenue: '',
  isOnlineBusiness: false,
  hasNib: false,
  nibNumber: '',
  nibIssuedDate: '',
  npwp: '',
};

/** Helper to read cookie value */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLimitReached, setIsLimitReached] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  useEffect(() => {
    async function checkExistingDraft() {
      try {
        const token = getCookie('access_token');
        if (!token) return;
        const res = await fetch(`${apiUrl}/business-profiles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const body = await res.json();
          // API might return bare array or wrapped in data
          const profiles = Array.isArray(body) ? body : body.data || [];
          if (profiles.length > 0) {
            setProfileId(profiles[0].id);
            // Optionally update state to match draft
            if (profiles[0].entityType) updateField('entityType', profiles[0].entityType);
            if (profiles[0].onboardingStep) setCurrentStep(profiles[0].onboardingStep);
          }
        }
      } catch {
        // silent fail
      }
    }
    checkExistingDraft();
  }, [apiUrl]);

  /** Get auth headers from JWT cookie */
  function getHeaders(): Record<string, string> {
    const token = getCookie('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /** Create draft profile on first next click */
  async function createDraft(): Promise<string | null> {
    try {
      const headers = getHeaders();
      const res = await fetch(`${apiUrl}/business-profiles`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ entityType: data.entityType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.code === 'PLAN_LIMIT_REACHED' || err.message?.includes('hanya mendukung')) {
          setIsLimitReached(true);
        } else {
          setError(err.message ?? 'Gagal membuat profil');
        }
        return null;
      }

      const profile = await res.json();
      return profile.id;
    } catch {
      setError('Terjadi kesalahan jaringan');
      return null;
    }
  }

  /** Auto-save current step data */
  async function saveStep(step: number) {
    if (!profileId) return;

    const stepDataMap: Record<number, Record<string, unknown>> = {
      1: { entityType: data.entityType },
      2: { sectorId: data.sectorId, subSectorIds: data.subSectorIds },
      3: {
        businessName: data.businessName,
        establishmentDate: data.establishmentDate || undefined,
        city: data.city,
        province: data.province,
      },
      4: {
        employeeCount: data.employeeCount,
        annualRevenue: data.annualRevenue,
        isOnlineBusiness: data.isOnlineBusiness,
      },
      5: {
        hasNib: data.hasNib,
        nibNumber: data.nibNumber,
        nibIssuedDate: data.nibIssuedDate,
        npwp: data.npwp,
      },
    };

    try {
      const headers = getHeaders();
      await fetch(`${apiUrl}/business-profiles/${profileId}/step`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ step, data: stepDataMap[step] }),
      });
    } catch {
      // Silent fail — auto-save is best-effort
    }
  }

  /** Go to next step */
  async function handleNext() {
    setError('');
    setIsLimitReached(false);

    // Step 1: validate + create draft
    if (currentStep === 1) {
      if (!data.entityType) {
        setError('Pilih jenis usaha terlebih dahulu');
        return;
      }

      if (!profileId) {
        const id = await createDraft();
        if (!id) return;
        setProfileId(id);
      }
    }

    // Auto-save current step
    await saveStep(currentStep);

    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    }
  }

  /** Go to previous step */
  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }

  /** Submit final profile */
  async function handleSubmit() {
    setError('');
    setIsSubmitting(true);

    try {
      // Save last step first
      await saveStep(5);

      // Finalize profile
      const headers = getHeaders();
      const res = await fetch(`${apiUrl}/business-profiles/${profileId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...data,
          establishmentDate: data.establishmentDate || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message ?? 'Gagal menyimpan profil');
        return;
      }

      // If NIB provided, activate roadmap
      if (data.hasNib) {
        const activateRes = await fetch(`${apiUrl}/oss-wizard/activate/${profileId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            nibNumber: data.nibNumber,
            nibIssuedDate: data.nibIssuedDate,
          }),
        });
        if (!activateRes.ok) {
          const err = await activateRes.json().catch(() => ({}));
          setError(err.message ?? 'Gagal mengaktifkan NIB');
          return;
        }
      }

      // Mark onboarding complete
      await fetch(`${apiUrl}/users/me`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ onboardingCompleted: true }),
      });

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Update wizard data */
  function updateField(field: string, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  /** Scan Upload file (OCR) */
  async function handleScanDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsSubmitting(true);
    try {
      const token = getCookie('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${apiUrl}/business-profiles/ocr/scan`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Gagal scan dokumen. Pastikan gambar jelas atau format PDF.');
      }
      const raw = await res.json();
      const extracted = raw.data;

      // Update state if value exists
      if (extracted.businessName) updateField('businessName', extracted.businessName);
      if (extracted.npwp) updateField('npwp', extracted.npwp);
      if (extracted.nibNumber) updateField('nibNumber', extracted.nibNumber);
      if (extracted.entityType) {
        // Map string to standard ID/value if our combo supports it, currently it's just strings
        updateField('entityType', extracted.entityType.toLowerCase());
      }
      if (extracted.city) updateField('city', extracted.city);
      if (extracted.province) updateField('province', extracted.province);

      alert('Teks berhasil dienkstrak! Cek otomatis field yang terisi.');
    } catch(err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-4 animate-fade-in">
      <WizardProgress
        currentStep={currentStep}
        totalSteps={5}
        labels={STEP_LABELS}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        
        {/* Banner Auto-Scan */}
        {currentStep === 1 && (
          <div className="mb-6 p-5 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center text-center">
              <h3 className="font-heading font-semibold text-lg text-primary mb-1">Mager isi manual? 😎✨</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Upload foto/PDF Nomor Induk Berusaha (NIB) atau NPWP Perusahaan dan Artificial Intelligence kami akan mengisikan form secara otomatis!
              </p>
              
              <label className="relative cursor-pointer bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                {isSubmitting ? 'Menganalisa Milsedetik...' : '📸 Upload Teks & Scan (AI)'}
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleScanDocument}
                  disabled={isSubmitting}
                />
              </label>
            </div>
            
            {/* Background embellishment */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl mix-blend-screen" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl mix-blend-screen" />
          </div>
        )}

        {/* Step content */}
        {currentStep === 1 && (
          <WizardStep1
            value={data.entityType}
            onChange={(v) => updateField('entityType', v)}
          />
        )}

        {currentStep === 2 && (
          <WizardStep2
            sectorId={data.sectorId}
            subSectorIds={data.subSectorIds}
            onSectorChange={(id) => updateField('sectorId', id)}
            onSubSectorChange={(ids) => updateField('subSectorIds', ids)}
          />
        )}

        {currentStep === 3 && (
          <WizardStep3
            businessName={data.businessName}
            establishmentDate={data.establishmentDate}
            city={data.city}
            province={data.province}
            onChange={updateField}
          />
        )}

        {currentStep === 4 && (
          <WizardStep4
            employeeCount={data.employeeCount}
            annualRevenue={data.annualRevenue}
            isOnlineBusiness={data.isOnlineBusiness}
            onChange={updateField}
          />
        )}

        {currentStep === 5 && (
          <WizardStep5
            hasNib={data.hasNib}
            nibNumber={data.nibNumber}
            nibIssuedDate={data.nibIssuedDate || ''}
            npwp={data.npwp}
            onChange={updateField}
          />
        )}

        {/* Error */}
        {error && !isLimitReached && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
            {error}
          </div>
        )}

        {/* Upgrade Paywall Warning */}
        {isLimitReached && (
          <div className="mt-6 p-6 rounded-2xl bg-primary/5 border-2 border-primary/20 text-center animate-fade-in relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <h3 className="text-xl font-heading font-bold text-primary mb-2">
              Kuota Profil Penuh! 🚀
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Paket langganan Anda saat ini tidak mendukung lebih dari jumlah profil bisnis yang Anda miliki. Upgrade ke paket Growth/Business untuk mendapatkan kuota profil bisnis tak terbatas.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link 
                href="/pricing"
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                Lihat Paket Upgrade
              </Link>
              <button 
                onClick={() => setIsLimitReached(false)}
                className="px-6 py-2.5 rounded-xl border border-border font-semibold hover:bg-muted/50 transition-colors"
                type="button"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-all"
            >
              ← Kembali
            </button>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Lanjut →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : '🚀 Mulai Analisis Compliance'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
