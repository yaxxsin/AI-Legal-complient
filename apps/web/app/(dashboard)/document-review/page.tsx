'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, XCircle, ArrowRight, Loader2 } from 'lucide-react';

interface ReviewResult {
  riskScore: number;
  missingClauses: string[];
  riskyClauses: string[];
  recommendation: string;
}

interface ReviewDocument {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  riskScore?: number;
  analysisResult?: ReviewResult;
  errorMessage?: string;
}

export default function DocumentReviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeReview, setActiveReview] = useState<ReviewDocument | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // Using direct fetch for simplicity (assumes auth token handled automatically, e.g., browser cookies or stored JWT)
      // Since fetch doesn't inject bearer automatically, we'd normally use an axios instance. 
      // For MVP, we will try standard fetch. Wait, we should use getCookie if JWT is in cookies.
      
      const token = document.cookie.split('; ').find(row => row.startsWith('lc_token='))?.split('=')[1];

      const res = await fetch('http://localhost:3002/api/v1/document-review/upload', {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setActiveReview(data);
    } catch (e: any) {
      alert(e.message || 'Gagal mengupload dokumen');
    } finally {
      setIsUploading(false);
    }
  };

  // Poll for status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeReview && ['pending', 'processing'].includes(activeReview.status)) {
      interval = setInterval(async () => {
        try {
          const token = document.cookie.split('; ').find(row => row.startsWith('lc_token='))?.split('=')[1];
          const res = await fetch(`http://localhost:3002/api/v1/document-review/${activeReview.id}`, {
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          });
          
          if (res.ok) {
            const data = await res.json();
            setActiveReview(data);
            if (['completed', 'failed'].includes(data.status)) {
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000); // poll every 3s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeReview]);


  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-heading font-bold">Document Review AI</h1>
        <p className="text-muted-foreground mt-2">
          Upload draf kontrak atau perjanjian bisnis Anda. AI kami akan memindai risiko, klausul yang hilang, dan memberikan rekomendasi perlindungan hukum.
        </p>
      </div>

      {!activeReview && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-card'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg">Pilih Dokumen Kontrak</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Tarik & lepas file Anda di sini, atau klik untuk browse.
                <br />
                Mendukung PDF & DOCX (Max 10MB)
              </p>

              {file && (
                <div className="mt-6 p-4 bg-background border border-border rounded-xl flex items-center gap-3 text-left">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <XCircle className="w-5 h-5 text-muted-foreground hover:text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); setFile(null); }} />
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {isUploading ? 'Mengunggah...' : 'Pindai Dokumen Sekarang'}
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 hidden md:block">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-success" /> Yang AI Periksa:
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p><strong className="block text-foreground">Klausul Kewajiban</strong> Pengecekan keseimbangan hak & kewajiban antara kedua pihak.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p><strong className="block text-foreground">Force Majeure</strong> Memastikan perlindungan dari kejadian tak terduga tersedia.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p><strong className="block text-foreground">Penyelesaian Sengketa</strong> Memastikan yurisdiksi penyelesaian konflik jelas dan tidak merugikan UMKM.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p><strong className="block text-foreground">Terminasi Kontrak</strong> Pasal tentang penghentian kontrak agar Anda tidak terjebak komitmen abadi.</p>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* RESULT & PROGRESS SECTION */}
      {activeReview && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{activeReview.fileName}</h3>
                <div className="flex items-center gap-2 text-sm mt-1">
                  Status: 
                  {activeReview.status === 'pending' && <span className="text-warning flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Masuk Antrean</span>}
                  {activeReview.status === 'processing' && <span className="text-primary flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> AI Sedang Menganalisis...</span>}
                  {activeReview.status === 'completed' && <span className="text-success font-semibold">Selesai</span>}
                  {activeReview.status === 'failed' && <span className="text-destructive font-semibold">Gagal ({activeReview.errorMessage})</span>}
                </div>
              </div>
            </div>

            {activeReview.status === 'completed' && activeReview.riskScore !== undefined && (
              <div className="text-center md:text-right">
                <div className={`text-4xl font-bold font-heading ${getScoreColor(activeReview.riskScore)}`}>
                  {activeReview.riskScore}/100
                </div>
                <p className="text-xs text-muted-foreground uppercase opacity-80 font-semibold tracking-wider mt-1">AI Safety Score</p>
              </div>
            )}
          </div>

          {activeReview.status === 'completed' && activeReview.analysisResult && (
            <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
              {/* Risky Clauses */}
              <div className="bg-card border border-destructive/20 rounded-2xl p-6">
                <h4 className="font-semibold text-destructive flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" /> Klausul Berisiko
                </h4>
                {activeReview.analysisResult.riskyClauses?.length > 0 ? (
                  <ul className="space-y-3">
                    {activeReview.analysisResult.riskyClauses.map((clause, i) => (
                      <li key={i} className="text-sm p-3 bg-background rounded-lg border border-border">
                        {clause}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Tidak ada klausul yang menonjol berisiko tinggi.</p>
                )}
              </div>

              {/* Missing Clauses */}
              <div className="bg-card border border-warning/20 rounded-2xl p-6">
                <h4 className="font-semibold text-warning flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5" /> Klausul yang Hilang
                </h4>
                {activeReview.analysisResult.missingClauses?.length > 0 ? (
                  <ul className="space-y-3">
                    {activeReview.analysisResult.missingClauses.map((clause, i) => (
                      <li key={i} className="text-sm p-3 bg-background rounded-lg border border-border">
                        {clause}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Komponen kontrak dinilai cukup lengkap.</p>
                )}
              </div>

              {/* Recommendation */}
              <div className="md:col-span-2 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
                <h4 className="font-semibold text-primary flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5" /> Rekomendasi AI
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {activeReview.analysisResult.recommendation || 'Kontrak terlihat aman, namun selalu pastikan untuk mengecek rincian komersial sesuai kesepakatan tertulis.'}
                </p>
                
                <div className="mt-8 pt-6 border-t border-primary/10 flex justify-end">
                  <button onClick={() => { setActiveReview(null); setFile(null); }} className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/5 text-sm font-medium transition-colors">
                    Review Dokumen Lain
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
