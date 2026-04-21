'use client';

import { useState, useEffect } from 'react';
import { Flag, Shield, MessageSquare, ClipboardCheck, FileText, FileCode, BriefcaseBusiness, Bell, BookOpen, CreditCard, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  targetPlans: string[];
  targetUsers: string[];
}

const KNOWN_FEATURES = [
  { key: 'menu-dashboard', label: 'Dashboard Home', description: 'Halaman ringkasan utama user', icon: Shield },
  { key: 'menu-chat', label: 'ComplianceBot', description: 'Asisten AI untuk tanya jawab kepatuhan', icon: MessageSquare },
  { key: 'menu-checklist', label: 'Checklist Kepatuhan', description: 'Fitur audit & tracking rules kepatuhan', icon: ClipboardCheck },
  { key: 'menu-documents', label: 'Dokumen Generator', description: 'Generate kontrak dan dokumen hukum', icon: FileText },
  { key: 'menu-doc-review', label: 'Review Dokumen AI', description: 'Analisis kontrak berbasis AI', icon: FileCode },
  { key: 'menu-hr', label: 'Kalkulator HR', description: 'Perhitungan BPJS & Pesangon', icon: BriefcaseBusiness },
  { key: 'menu-notifications', label: 'Notifikasi', description: 'Peringatan deadline dan update', icon: Bell },
  { key: 'menu-knowledge', label: 'Pusat Pengetahuan', label2: 'FAQ', description: 'Artikel aturan dan panduan', icon: BookOpen },
  { key: 'menu-billing', label: 'Langganan', description: 'Manajemen paket dan invoice', icon: CreditCard },
  { key: 'menu-settings', label: 'Pengaturan Profil', description: 'Pengaturan akun dan tim kolaborasi', icon: Settings },
];

const AVAILABLE_PLANS = [
  { id: 'free', label: 'Free' },
  { id: 'starter', label: 'Starter' },
  { id: 'growth', label: 'Growth' },
  { id: 'business', label: 'Business' }
];

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/feature-flags`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) }
      });
      if (res.ok) {
        const data = await res.json();
        setFlags(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (key: string, currentState: boolean, existingId?: string) => {
    setIsUpdating(key);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
      
      if (existingId) {
        // Update existing flag
        await fetch(`${apiUrl}/feature-flags/${existingId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }) 
          },
          body: JSON.stringify({ enabled: !currentState })
        });
      } else {
        // Create new flag
        await fetch(`${apiUrl}/feature-flags`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }) 
          },
          body: JSON.stringify({ key, enabled: !currentState, targetPlans: [], targetUsers: [] })
        });
      }
      
      await fetchFlags();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleTogglePlan = async (key: string, planId: string, currentPlans: string[], isChecked: boolean, existingId?: string) => {
    let newPlans = [...currentPlans];
    if (isChecked) {
      newPlans.push(planId);
    } else {
      newPlans = newPlans.filter(p => p !== planId);
    }
    
    setIsUpdating(key + '-plans');
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
      
      if (existingId) {
        await fetch(`${apiUrl}/feature-flags/${existingId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }) 
          },
          body: JSON.stringify({ targetPlans: newPlans })
        });
      } else {
        await fetch(`${apiUrl}/feature-flags`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }) 
          },
          body: JSON.stringify({ key, enabled: true, targetPlans: newPlans, targetUsers: [] })
        });
      }
      await fetchFlags();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-4" /> Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Flag className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">Feature Management</h1>
            <p className="text-muted-foreground mt-1">Nyalakan atau matikan fitur aplikasi (berlaku global)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {KNOWN_FEATURES.map(feat => {
          const dbFlag = flags.find(f => f.key === feat.key);
          const isEnabled = dbFlag ? dbFlag.enabled : true; // default true
          const Icon = feat.icon;
          const currentPlans = dbFlag?.targetPlans || [];

          return (
            <Card key={feat.key} className={`border transition-all duration-300 ${isEnabled ? 'bg-card border-primary/20 shadow-md' : 'bg-muted/30 border-border opacity-60 grayscale-[0.8]'}`}>
              <CardContent className="p-5 flex flex-col h-full relative">
                
                {/* Switch Toggle */}
                <div className="absolute top-5 right-5">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isEnabled} 
                      onChange={() => handleToggle(feat.key, isEnabled, dbFlag?.id)}
                      disabled={isUpdating === feat.key}
                    />
                    <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary opacity-90 hover:opacity-100"></div>
                  </label>
                </div>

                <div className="flex items-center gap-3 mb-4 pr-12">
                  <div className={`p-2.5 rounded-lg ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{feat.label}</h3>
                    <code className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">{feat.key}</code>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground flex-1 mb-5">
                  {feat.description}
                </p>

                {/* Plan Requirements */}
                <div className="pt-4 border-t border-border mt-auto">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-semibold text-foreground">Target Paket (Tier)</label>
                    <span className="text-[10px] text-muted-foreground">{currentPlans.length === 0 ? 'Tersedia untuk semua' : 'Restricted'}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PLANS.map(plan => {
                      const isChecked = currentPlans.includes(plan.id);
                      return (
                        <label key={plan.id} className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${isChecked ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted/50'} ${!isEnabled && 'pointer-events-none opacity-50'}`}>
                          <span className="text-xs font-medium">{plan.label}</span>
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            onChange={(e) => handleTogglePlan(feat.key, plan.id, currentPlans, e.target.checked, dbFlag?.id)}
                            disabled={!isEnabled || isUpdating === feat.key + '-plans'}
                          />
                          <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${isChecked ? 'bg-primary border-primary' : 'border-input bg-muted/50'}`}>
                            {isChecked && <svg className="w-2 h-2 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
