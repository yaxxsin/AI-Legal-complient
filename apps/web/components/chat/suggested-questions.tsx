'use client';

import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Shield, 
  Scale, 
  Building2,
  Clock,
  CheckCircle
} from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const suggestions = [
  {
    icon: FileText,
    label: 'Apa saja dokumen izin yang diperlukan untuk usaha saya?',
    category: 'Izin',
  },
  {
    icon: Shield,
    label: 'Bagaimana cara melindungi data pelanggan sesuai UU PDP?',
    category: 'Perlindungan Data',
  },
  {
    icon: Scale,
    label: 'Regulasi apa saja yang berlaku untuk industri makanan & minuman?',
    category: 'Industri',
  },
  {
    icon: Building2,
    label: 'Apa persyaratan NPWP dan NIB untuk usaha baru?',
    category: 'Registrasi',
  },
  {
    icon: Clock,
    label: 'Berapa lama proses pengajuan izin OSS?',
    category: 'Proses',
  },
  {
    icon: CheckCircle,
    label: 'Bagaimana cara compliance checklist tahunan?',
    category: 'Compliance',
  },
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="p-4 border-t border-border bg-muted/30">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Pertanyaan populer
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(item.label)}
            className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
          >
            <item.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-foreground line-clamp-2">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}