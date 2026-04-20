'use client';

import { useState } from 'react';
import {
  FileText,
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useDocGenerator } from '@/hooks/use-doc-generator';
import type { FormField } from '@/hooks/use-doc-generator';

// ──────────────────────────────────────
// Template Gallery
// ──────────────────────────────────────
function TemplateGallery({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { templates, loading } = useDocGenerator();
  const categoryIcons: Record<string, string> = {
    'Ketenagakerjaan': '👷',
    'Kontrak': '📑',
    'Perizinan': '📋',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Document Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Pilih template dan isi form untuk generate dokumen legal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.id)}
            className="group text-left p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {categoryIcons[tpl.category] ?? '📄'} {tpl.category}
              </span>
            </div>
            <h3 className="font-semibold text-sm mb-1">{tpl.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {tpl.description}
            </p>
            <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Gunakan template <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Form Input
// ──────────────────────────────────────
function FormInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (val: string) => void;
}) {
  const baseClass =
    'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all';

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        >
          <option value="">Pilih...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={field.type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={baseClass}
      />
    </div>
  );
}

// ──────────────────────────────────────
// Main Page
// ──────────────────────────────────────
export default function DocumentsPage() {
  const {
    selectedTemplate,
    formData,
    previewHtml,
    generating,
    selectTemplate,
    updateField,
    generateDocument,
    resetForm,
  } = useDocGenerator();

  const [showPreview, setShowPreview] = useState(false);

  // Gallery mode
  if (!selectedTemplate) {
    return <TemplateGallery onSelect={selectTemplate} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={resetForm}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-heading font-bold">{selectedTemplate.name}</h1>
          <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
              showPreview
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={generateDocument}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Generate
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className={`grid gap-4 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>
        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Isi Data
          </h2>
          {selectedTemplate.formSchema.map((field) => (
            <FormInput
              key={field.name}
              field={field}
              value={formData[field.name] ?? ''}
              onChange={(val) => updateField(field.name, val)}
            />
          ))}
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="rounded-2xl border border-border bg-white dark:bg-gray-950 p-1 overflow-auto max-h-[80vh]">
            <div
              className="prose prose-sm max-w-none p-4"
              dangerouslySetInnerHTML={{
                __html:
                  previewHtml ||
                  '<p style="color: #999; text-align: center; padding: 60px 20px;">Isi form di sebelah kiri untuk melihat preview dokumen.</p>',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
