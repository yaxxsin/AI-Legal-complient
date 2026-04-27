'use client';

import { useState, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────

export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  formSchema: FormField[];
  templateHtml: string;
  isPublished?: boolean;
  version?: number;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  autoFillKey?: string;
}

export interface GeneratedDoc {
  id: string;
  templateId: string;
  templateName: string;
  formData: Record<string, string>;
  generatedAt: string;
  previewHtml: string;
}

// ── Handlebars-like renderer ──────────────

function renderTemplate(
  html: string,
  data: Record<string, string>,
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || `{{${key}}}`);
}

// ── Local fallback templates ──────────────

const COMMON_FIELDS: FormField[] = [
  { name: 'companyName', label: 'Nama Perusahaan', type: 'text', required: true, autoFillKey: 'businessName' },
  { name: 'companyAddress', label: 'Alamat Perusahaan', type: 'text', required: true },
  { name: 'representativeName', label: 'Nama Perwakilan', type: 'text', required: true },
  { name: 'representativePosition', label: 'Jabatan Perwakilan', type: 'text', required: true },
];

const EMPLOYEE_FIELDS: FormField[] = [
  { name: 'employeeName', label: 'Nama Karyawan', type: 'text', required: true },
  { name: 'employeeAddress', label: 'Alamat Karyawan', type: 'text', required: true },
  { name: 'employeeIdNumber', label: 'No. KTP', type: 'text', required: true },
  { name: 'position', label: 'Jabatan', type: 'text', required: true },
  { name: 'department', label: 'Departemen', type: 'text' },
  { name: 'salary', label: 'Gaji Pokok (Rp)', type: 'number', required: true },
  { name: 'startDate', label: 'Tanggal Mulai', type: 'date', required: true },
];

const FALLBACK_TEMPLATES: DocTemplate[] = [
  {
    id: 'pkwt',
    name: 'Perjanjian Kerja Waktu Tertentu (PKWT)',
    description: 'Kontrak kerja dengan jangka waktu tertentu. Sesuai PP 35/2021.',
    category: 'Ketenagakerjaan',
    formSchema: [
      ...COMMON_FIELDS,
      ...EMPLOYEE_FIELDS,
      { name: 'endDate', label: 'Tanggal Berakhir', type: 'date', required: true },
      { name: 'contractDuration', label: 'Durasi (bulan)', type: 'number', required: true },
      { name: 'jobDescription', label: 'Uraian Pekerjaan', type: 'textarea', required: true },
    ],
    templateHtml: '<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8"><h1 style="text-align:center;font-size:18px">PERJANJIAN KERJA WAKTU TERTENTU</h1><p style="text-align:center;font-size:13px;color:#666">No: PKWT/{{companyName}}/{{startDate}}</p><p>Yang bertanda tangan di bawah ini:</p><p><strong>PIHAK PERTAMA</strong>: {{representativeName}} ({{representativePosition}}) — {{companyName}}, {{companyAddress}}</p><p><strong>PIHAK KEDUA</strong>: {{employeeName}} (KTP: {{employeeIdNumber}}) — {{employeeAddress}}</p><h3>Pasal 1</h3><p>Jabatan: <strong>{{position}}</strong>, Dept: {{department}}. Uraian: {{jobDescription}}</p><h3>Pasal 2</h3><p>Berlaku {{contractDuration}} bulan: {{startDate}} s.d. {{endDate}}</p><h3>Pasal 3</h3><p>Gaji: <strong>Rp {{salary}}</strong>/bulan</p></div>',
  },
  {
    id: 'pkwtt',
    name: 'Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)',
    description: 'Kontrak kerja permanen tanpa batas waktu. Sesuai UU 13/2003.',
    category: 'Ketenagakerjaan',
    formSchema: [
      ...COMMON_FIELDS,
      ...EMPLOYEE_FIELDS,
      { name: 'probationMonths', label: 'Masa Percobaan (bulan)', type: 'number', placeholder: '3' },
      { name: 'jobDescription', label: 'Uraian Pekerjaan', type: 'textarea', required: true },
    ],
    templateHtml: '<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8"><h1 style="text-align:center;font-size:18px">PERJANJIAN KERJA WAKTU TIDAK TERTENTU</h1><p style="text-align:center;font-size:13px;color:#666">No: PKWTT/{{companyName}}/{{startDate}}</p><p><strong>PIHAK PERTAMA</strong>: {{representativeName}} — {{companyName}}</p><p><strong>PIHAK KEDUA</strong>: {{employeeName}} (KTP: {{employeeIdNumber}})</p><h3>Pasal 1</h3><p>Karyawan tetap, jabatan: <strong>{{position}}</strong></p><h3>Pasal 2</h3><p>Masa percobaan: {{probationMonths}} bulan sejak {{startDate}}</p><h3>Pasal 3</h3><p>Gaji: <strong>Rp {{salary}}</strong>/bulan</p><h3>Pasal 4</h3><p>{{jobDescription}}</p></div>',
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement (NDA)',
    description: 'Perjanjian kerahasiaan untuk melindungi informasi bisnis.',
    category: 'Kontrak',
    formSchema: [
      ...COMMON_FIELDS,
      { name: 'secondPartyName', label: 'Nama Pihak Kedua', type: 'text', required: true },
      { name: 'secondPartyCompany', label: 'Perusahaan Pihak Kedua', type: 'text' },
      { name: 'secondPartyAddress', label: 'Alamat Pihak Kedua', type: 'text', required: true },
      { name: 'effectiveDate', label: 'Tanggal Efektif', type: 'date', required: true },
      { name: 'ndaDuration', label: 'Durasi NDA (tahun)', type: 'number', required: true, placeholder: '2' },
      { name: 'confidentialScope', label: 'Lingkup Informasi Rahasia', type: 'textarea', required: true },
      { name: 'penaltyAmount', label: 'Denda Pelanggaran (Rp)', type: 'number' },
    ],
    templateHtml: '<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8"><h1 style="text-align:center;font-size:18px">PERJANJIAN KERAHASIAAN (NDA)</h1><p style="text-align:center;font-size:13px;color:#666">Tanggal: {{effectiveDate}}</p><p><strong>Pihak Pengungkap</strong>: {{representativeName}} — {{companyName}}</p><p><strong>Pihak Penerima</strong>: {{secondPartyName}} — {{secondPartyCompany}}</p><h3>Pasal 1</h3><p>{{confidentialScope}}</p><h3>Pasal 2</h3><p>Berlaku {{ndaDuration}} tahun sejak {{effectiveDate}}</p><h3>Pasal 3</h3><p>Denda: <strong>Rp {{penaltyAmount}}</strong></p></div>',
  },
  {
    id: 'pks',
    name: 'Perjanjian Kerjasama (PKS)',
    description: 'Perjanjian kerjasama bisnis antar dua pihak.',
    category: 'Kontrak',
    formSchema: [
      ...COMMON_FIELDS,
      { name: 'partnerName', label: 'Nama Pihak Kedua', type: 'text', required: true },
      { name: 'partnerCompany', label: 'Perusahaan Pihak Kedua', type: 'text', required: true },
      { name: 'partnerAddress', label: 'Alamat Pihak Kedua', type: 'text', required: true },
      { name: 'partnerPosition', label: 'Jabatan Pihak Kedua', type: 'text', required: true },
      { name: 'cooperationScope', label: 'Ruang Lingkup Kerjasama', type: 'textarea', required: true },
      { name: 'effectiveDate', label: 'Tanggal Efektif', type: 'date', required: true },
      { name: 'pksDuration', label: 'Durasi (bulan)', type: 'number', required: true },
      { name: 'revenueSharing', label: 'Pembagian Keuntungan', type: 'text', placeholder: '50:50' },
      { name: 'firstPartyObligation', label: 'Kewajiban Pihak Pertama', type: 'textarea', required: true },
      { name: 'secondPartyObligation', label: 'Kewajiban Pihak Kedua', type: 'textarea', required: true },
    ],
    templateHtml: '<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8"><h1 style="text-align:center;font-size:18px">PERJANJIAN KERJASAMA</h1><p style="text-align:center;font-size:13px;color:#666">No: PKS/{{companyName}}/{{effectiveDate}}</p><p><strong>PIHAK PERTAMA</strong>: {{representativeName}} ({{representativePosition}}) — {{companyName}}</p><p><strong>PIHAK KEDUA</strong>: {{partnerName}} ({{partnerPosition}}) — {{partnerCompany}}</p><h3>Pasal 1 — Ruang Lingkup</h3><p>{{cooperationScope}}</p><h3>Pasal 2 — Jangka Waktu</h3><p>{{pksDuration}} bulan sejak {{effectiveDate}}</p><h3>Pasal 3 — Kewajiban</h3><p>P1: {{firstPartyObligation}}</p><p>P2: {{secondPartyObligation}}</p><h3>Pasal 4 — Pembagian</h3><p>Rasio: <strong>{{revenueSharing}}</strong></p></div>',
  },
  {
    id: 'freelance',
    name: 'Kontrak Freelance / Jasa',
    description: 'Perjanjian kerja lepas untuk freelancer atau konsultan.',
    category: 'Kontrak',
    formSchema: [
      ...COMMON_FIELDS,
      { name: 'freelancerName', label: 'Nama Freelancer', type: 'text', required: true },
      { name: 'freelancerAddress', label: 'Alamat Freelancer', type: 'text', required: true },
      { name: 'freelancerIdNumber', label: 'No. KTP Freelancer', type: 'text', required: true },
      { name: 'projectName', label: 'Nama Proyek', type: 'text', required: true },
      { name: 'scopeOfWork', label: 'Lingkup Pekerjaan', type: 'textarea', required: true },
      { name: 'deliverables', label: 'Deliverables', type: 'textarea', required: true },
      { name: 'startDate', label: 'Tanggal Mulai', type: 'date', required: true },
      { name: 'endDate', label: 'Tanggal Selesai', type: 'date', required: true },
      { name: 'totalFee', label: 'Total Fee (Rp)', type: 'number', required: true },
      { name: 'paymentTerms', label: 'Termin Pembayaran', type: 'select', required: true, options: [
        { label: '100% di muka', value: 'upfront' },
        { label: '50% DP + 50% selesai', value: 'half' },
        { label: '30/40/30 milestone', value: 'milestone' },
        { label: '100% setelah selesai', value: 'completion' },
      ]},
      { name: 'revisionLimit', label: 'Batas Revisi', type: 'number', placeholder: '3' },
    ],
    templateHtml: '<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8"><h1 style="text-align:center;font-size:18px">PERJANJIAN KERJA LEPAS / FREELANCE</h1><p style="text-align:center;font-size:13px;color:#666">No: FRL/{{companyName}}/{{startDate}}</p><p><strong>KLIEN</strong>: {{representativeName}} — {{companyName}}</p><p><strong>FREELANCER</strong>: {{freelancerName}} (KTP: {{freelancerIdNumber}})</p><h3>Pasal 1</h3><p>Proyek: <strong>{{projectName}}</strong></p><h3>Pasal 2</h3><p>{{scopeOfWork}}</p><h3>Pasal 3</h3><p>Deliverables: {{deliverables}}</p><h3>Pasal 4</h3><p>{{startDate}} s.d. {{endDate}}</p><h3>Pasal 5</h3><p>Fee: <strong>Rp {{totalFee}}</strong>, termin: {{paymentTerms}}</p><h3>Pasal 6</h3><p>Maks {{revisionLimit}} revisi</p></div>',
  },
];

// ── API URL ───────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// ── Hook ──────────────────────────────────

export function useDocGenerator() {
  const [templates, setTemplates] = useState<DocTemplate[]>(FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [generating, setGenerating] = useState(false);

  /** Fetch templates from API, fallback to local */
  useEffect(() => {
    let cancelled = false;
    async function fetchTemplates(): Promise<void> {
      try {
        const res = await fetch(`${API_BASE}/documents/templates`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setTemplates(data);
        }
      } catch {
        // Graceful degradation — keep fallback templates
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTemplates();
    return () => { cancelled = true; };
  }, []);

  const selectTemplate = useCallback(
    (id: string) => {
      const tpl = templates.find((t) => t.id === id) ?? null;
      setSelectedTemplate(tpl);
      setFormData({});
      setPreviewHtml('');
    },
    [templates],
  );

  const updateField = useCallback(
    (name: string, value: string) => {
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        if (selectedTemplate) {
          setPreviewHtml(
            renderTemplate(selectedTemplate.templateHtml, next),
          );
        }
        return next;
      });
    },
    [selectedTemplate],
  );

  const generateDocument = useCallback(async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 800));
    const html = renderTemplate(selectedTemplate.templateHtml, formData);
    setPreviewHtml(html);
    setGenerating(false);
  }, [selectedTemplate, formData]);

  const resetForm = useCallback(() => {
    setSelectedTemplate(null);
    setFormData({});
    setPreviewHtml('');
  }, []);

  return {
    templates,
    loading,
    selectedTemplate,
    formData,
    previewHtml,
    generating,
    selectTemplate,
    updateField,
    generateDocument,
    resetForm,
  };
}
