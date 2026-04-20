'use client';

import { useState, useCallback } from 'react';

export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  formSchema: FormField[];
  templateHtml: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  autoFillKey?: string; // Maps to business profile field
}

export interface GeneratedDoc {
  id: string;
  templateId: string;
  templateName: string;
  formData: Record<string, string>;
  generatedAt: string;
  previewHtml: string;
}

// ──────────────────────────────────────
// 3 MVP Templates: PKWT, PKWTT, NDA
// ──────────────────────────────────────
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

const MOCK_TEMPLATES: DocTemplate[] = [
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
    templateHtml: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">PERJANJIAN KERJA WAKTU TERTENTU</h1>
<p style="text-align:center;font-size:13px;color:#666;margin-bottom:30px">No: PKWT/{{companyName}}/{{startDate}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{representativeName}}</strong></td></tr><tr><td>Jabatan</td><td>: {{representativePosition}}</td></tr><tr><td>Perusahaan</td><td>: {{companyName}}</td></tr><tr><td>Alamat</td><td>: {{companyAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK PERTAMA</strong>, dan:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{employeeName}}</strong></td></tr><tr><td>No. KTP</td><td>: {{employeeIdNumber}}</td></tr><tr><td>Alamat</td><td>: {{employeeAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</p>
<h3 style="margin-top:25px">Pasal 1 — Ruang Lingkup</h3>
<p>PIHAK PERTAMA mempekerjakan PIHAK KEDUA sebagai <strong>{{position}}</strong> di departemen {{department}} dengan uraian pekerjaan: {{jobDescription}}</p>
<h3>Pasal 2 — Jangka Waktu</h3>
<p>Perjanjian berlaku selama <strong>{{contractDuration}} bulan</strong>, dari {{startDate}} sampai {{endDate}}.</p>
<h3>Pasal 3 — Kompensasi</h3>
<p>Gaji pokok sebesar <strong>Rp {{salary}}</strong> per bulan, dibayarkan setiap akhir bulan.</p>
<div style="margin-top:50px;display:flex;justify-content:space-between"><div style="text-align:center"><p>PIHAK PERTAMA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{representativeName}}</p></div><div style="text-align:center"><p>PIHAK KEDUA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{employeeName}}</p></div></div></div>`,
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
    templateHtml: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">PERJANJIAN KERJA WAKTU TIDAK TERTENTU</h1>
<p style="text-align:center;font-size:13px;color:#666;margin-bottom:30px">No: PKWTT/{{companyName}}/{{startDate}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{representativeName}}</strong></td></tr><tr><td>Jabatan</td><td>: {{representativePosition}}</td></tr><tr><td>Perusahaan</td><td>: {{companyName}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK PERTAMA</strong>, dan:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{employeeName}}</strong></td></tr><tr><td>No. KTP</td><td>: {{employeeIdNumber}}</td></tr><tr><td>Alamat</td><td>: {{employeeAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</p>
<h3 style="margin-top:25px">Pasal 1 — Pengangkatan</h3>
<p>PIHAK PERTAMA mengangkat PIHAK KEDUA sebagai karyawan tetap dengan jabatan <strong>{{position}}</strong> di departemen {{department}}.</p>
<h3>Pasal 2 — Masa Percobaan</h3>
<p>Masa percobaan selama <strong>{{probationMonths}} bulan</strong> terhitung sejak {{startDate}}.</p>
<h3>Pasal 3 — Kompensasi</h3>
<p>Gaji pokok sebesar <strong>Rp {{salary}}</strong> per bulan.</p>
<h3>Pasal 4 — Uraian Pekerjaan</h3>
<p>{{jobDescription}}</p>
<div style="margin-top:50px;display:flex;justify-content:space-between"><div style="text-align:center"><p>PIHAK PERTAMA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{representativeName}}</p></div><div style="text-align:center"><p>PIHAK KEDUA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{employeeName}}</p></div></div></div>`,
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
    templateHtml: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8">
<h1 style="text-align:center;font-size:18px;margin-bottom:4px">PERJANJIAN KERAHASIAAN<br/>(NON-DISCLOSURE AGREEMENT)</h1>
<p style="text-align:center;font-size:13px;color:#666;margin-bottom:30px">Tanggal: {{effectiveDate}}</p>
<p>Perjanjian ini dibuat oleh dan antara:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{representativeName}}</strong></td></tr><tr><td>Perusahaan</td><td>: {{companyName}}</td></tr><tr><td>Alamat</td><td>: {{companyAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>"Pihak Pengungkap"</strong>, dan:</p>
<table style="margin:15px 0"><tr><td style="width:160px">Nama</td><td>: <strong>{{secondPartyName}}</strong></td></tr><tr><td>Perusahaan</td><td>: {{secondPartyCompany}}</td></tr><tr><td>Alamat</td><td>: {{secondPartyAddress}}</td></tr></table>
<p>Selanjutnya disebut <strong>"Pihak Penerima"</strong>.</p>
<h3 style="margin-top:25px">Pasal 1 — Definisi Informasi Rahasia</h3>
<p>{{confidentialScope}}</p>
<h3>Pasal 2 — Jangka Waktu</h3>
<p>NDA berlaku selama <strong>{{ndaDuration}} tahun</strong> sejak {{effectiveDate}}.</p>
<h3>Pasal 3 — Kewajiban</h3>
<p>Pihak Penerima wajib menjaga kerahasiaan dan tidak mengungkapkan informasi tanpa persetujuan tertulis.</p>
<h3>Pasal 4 — Sanksi</h3>
<p>Pelanggaran dikenakan denda sebesar <strong>Rp {{penaltyAmount}}</strong> dan/atau tuntutan hukum.</p>
<div style="margin-top:50px;display:flex;justify-content:space-between"><div style="text-align:center"><p>PIHAK PENGUNGKAP</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{representativeName}}</p></div><div style="text-align:center"><p>PIHAK PENERIMA</p><br/><br/><p style="border-top:1px solid #000;padding-top:5px">{{secondPartyName}}</p></div></div></div>`,
  },
];

/** Simple Handlebars-like template renderer */
function renderTemplate(
  html: string,
  data: Record<string, string>,
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || `{{${key}}}`);
}

export function useDocGenerator() {
  const [templates] = useState<DocTemplate[]>(MOCK_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [generating, setGenerating] = useState(false);

  const selectTemplate = useCallback((id: string) => {
    const tpl = MOCK_TEMPLATES.find((t) => t.id === id) ?? null;
    setSelectedTemplate(tpl);
    setFormData({});
    setPreviewHtml('');
  }, []);

  const updateField = useCallback(
    (name: string, value: string) => {
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        if (selectedTemplate) {
          setPreviewHtml(renderTemplate(selectedTemplate.templateHtml, next));
        }
        return next;
      });
    },
    [selectedTemplate],
  );

  const generateDocument = useCallback(async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    // Simulate generation delay
    await new Promise((r) => setTimeout(r, 1500));
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
