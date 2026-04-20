'use client';

import { useEffect, useState } from 'react';
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

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
        setError(err.message ?? 'Gagal membuat profil');
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

  return (
    <div className="max-w-2xl mx-auto py-4 animate-fade-in">
      <WizardProgress
        currentStep={currentStep}
        totalSteps={5}
        labels={STEP_LABELS}
      />

      <div className="rounded-xl border border-border bg-card p-6">
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
            npwp={data.npwp}
            onChange={updateField}
          />
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
            {error}
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
