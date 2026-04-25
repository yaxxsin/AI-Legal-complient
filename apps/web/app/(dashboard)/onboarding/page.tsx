'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
        const res = await fetch(`${apiUrl}/business-profiles`, {
          credentials: 'include',
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

  /** Get common fetch options with credentials */
  function getFetchOptions(): RequestInit {
    return {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    };
  }

  /** Create draft profile on first next click */
  async function createDraft(): Promise<string | null> {
    try {
      const res = await fetch(`${apiUrl}/business-profiles`, {
        method: 'POST',
        ...getFetchOptions(),
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
      await fetch(`${apiUrl}/business-profiles/${profileId}/step`, {
        method: 'PATCH',
        ...getFetchOptions(),
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
      const res = await fetch(`${apiUrl}/business-profiles/${profileId}`, {
        method: 'PUT',
        ...getFetchOptions(),
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
          ...getFetchOptions(),
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
        ...getFetchOptions(),
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
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${apiUrl}/business-profiles/ocr/scan`, {
        method: 'POST',
        credentials: 'include',
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
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-lg">LC</span>
        </div>
        <h1 className="text-2xl font-heading font-bold">Setup Profil Bisnis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Langkah {currentStep} dari 5 &mdash; {STEP_LABELS[currentStep - 1]}
        </p>
      </div>

      <WizardProgress
        currentStep={currentStep}
        totalSteps={5}
        labels={STEP_LABELS}
      />

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        
        {/* Banner Auto-Scan */}
        {currentStep === 1 && (
          <div className="mb-8 p-5 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border border-primary/15 rounded-2xl relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M20.25 16.5V18A2.25 2.25 0 0118 20.25h-1.5M3.75 16.5V18A2.25 2.25 0 006 20.25h1.5M9 12h6m-3-3v6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-0.5">Scan Dokumen Otomatis</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload NIB atau NPWP (PDF/gambar) dan AI akan mengisi form secara otomatis.
                </p>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-primary text-primary-foreground font-medium px-4 py-2 rounded-xl text-xs shadow-sm hover:bg-primary/90 transition-all">
                  {isSubmitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisa...</>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Upload &amp; Scan
                    </>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleScanDocument}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>
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
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <svg className="w-5 h-5 text-destructive shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Upgrade Paywall Warning */}
        {isLimitReached && (
          <div className="mt-6 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center animate-fade-in">
            <h3 className="text-lg font-heading font-bold text-foreground mb-2">
              Kuota Profil Penuh
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Paket Anda tidak mendukung profil bisnis tambahan. Upgrade untuk menambah kuota.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link 
                href="/pricing"
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
              >
                Lihat Paket
              </Link>
              <button 
                onClick={() => setIsLimitReached(false)}
                className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
                type="button"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-10 pt-6 border-t border-border">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 h-12 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-all"
            >
              Kembali
            </button>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 transition-all duration-200"
            >
              Lanjutkan
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : 'Mulai Analisis Compliance'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
