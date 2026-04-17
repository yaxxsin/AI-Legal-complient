import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-6 py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered Legal Compliance
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-foreground">
            Compliance Hukum Bisnis{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Jadi Mudah
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Platform AI yang membantu UMKM dan startup Indonesia memahami dan memenuhi kewajiban
            hukum bisnis — dari perizinan, ketenagakerjaan, hingga perpajakan.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Mulai Gratis
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-muted/50 transition-all duration-200"
            >
              Lihat Harga
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            Gratis untuk 1 profil bisnis • Tidak perlu kartu kredit
          </p>
        </div>
      </section>

      {/* Features Preview */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    icon: '✅',
    title: 'Checklist Compliance',
    description:
      'Checklist otomatis berdasarkan profil bisnis Anda. Tahu persis apa yang harus dipenuhi.',
  },
  {
    icon: '🤖',
    title: 'ComplianceBot AI',
    description:
      'Tanya apa saja tentang hukum bisnis. Dijawab dalam bahasa yang mudah dipahami.',
  },
  {
    icon: '📄',
    title: 'Generator Dokumen',
    description:
      'Buat dokumen legal standar dalam hitungan menit. PKWT, NDA, kontrak kerjasama, dan lainnya.',
  },
];
