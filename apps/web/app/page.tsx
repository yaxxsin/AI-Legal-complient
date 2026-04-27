import Link from 'next/link';

// Get API URL based on context (server-side vs client-side)
const getApiUrl = () => {
  // Server-side: use internal Docker network URL
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || 'http://api:3002/api/v1';
  }
  // Client-side: use public API URL (will be proxied)
  return process.env.NEXT_PUBLIC_API_URL || '/api/v1';
};

export async function generateMetadata() {
  try {
    const res = await fetch(`${getApiUrl()}/cms/public/pages/home`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || 'LocalCompliance',
        description: data.metaDescription || 'AI-Powered Legal Compliance',
      };
    }
  } catch (e) {
    //
  }
  return {
    title: 'LocalCompliance — Urusan Legal Bisnis Jadi Mudah',
    description: 'Platform AI yang membantu UMKM dan startup Indonesia memahami dan memenuhi kewajiban hukum bisnis.',
  };
}

export default async function HomePage() {
  let cmsData = null;
  try {
    const res = await fetch(`${getApiUrl()}/cms/public/pages/home`, { next: { revalidate: 60 } });
    if (res.ok) {
      cmsData = await res.json();
    }
  } catch (e) {
    console.error('Failed to load CMS data:', e);
  }

  // Fallback Hardcoded Sections if no CMS sync available or no active sections
  const fallbackFeatures = [
    { icon: '✅', title: 'Checklist Compliance', description: 'Checklist otomatis berdasarkan profil bisnis Anda.' },
    { icon: '🤖', title: 'ComplianceBot AI', description: 'Tanya apa saja tentang hukum bisnis. Dijawab dalam bahasa yang mudah dipahami.' },
    { icon: '📄', title: 'Generator Dokumen', description: 'Buat dokumen legal standar dalam hitungan menit.' },
  ];

  if (!cmsData || !cmsData.sections || cmsData.sections.length === 0) {
    return (
      <main className="min-h-screen flex flex-col">
        {/* Hero Section Fallback */}
        <section className="relative flex-1 flex items-center justify-center px-6 py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> AI-Powered Legal Compliance
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-foreground">
              Compliance Hukum Bisnis <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Jadi Mudah</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Platform AI yang membantu UMKM dan startup Indonesia memahami dan memenuhi kewajiban hukum bisnis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:scroll-my-0 hover:-translate-y-0.5 transition-all">Mulai Gratis</Link>
            </div>
          </div>
        </section>
        {/* Features Preview Fallback */}
        <section className="px-6 py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {fallbackFeatures.map((feature) => (
              <div key={feature.title} className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-lg font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {cmsData.sections.map((section: any) => {
        const d = section.content || {};
        
        switch (section.type) {
          case 'hero':
            return (
              <section key={section.id} className="relative flex-1 flex items-center justify-center px-6 py-24 overflow-hidden pt-32 pb-24">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    LocalCompliance
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold tracking-tight text-foreground">
                    {d.title}
                  </h1>

                  {d.subtitle && (
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      {d.subtitle}
                    </p>
                  )}

                  {(d.ctaText || d.secondaryCtaText) && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                      {d.ctaText && (
                        <Link
                          href={d.ctaUrl || '/'}
                          className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
                        >
                          {d.ctaText}
                        </Link>
                      )}
                      {d.secondaryCtaText && (
                        <Link
                          href={d.secondaryCtaUrl || '/'}
                          className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-muted/50 transition-all duration-200"
                        >
                          {d.secondaryCtaText}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </section>
            );

          case 'features':
            return (
              <section key={section.id} className="px-6 py-20 bg-muted/30">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold">{d.title}</h2>
                    {d.subtitle && <p className="text-muted-foreground text-lg">{d.subtitle}</p>}
                  </div>
                  
                  {Array.isArray(d.items) && d.items.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {d.items.map((item: any, idx: number) => (
                        <div key={idx} className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 font-bold">
                            {item.icon ? (item.icon.length > 3 ? item.icon.substring(0, 2) : item.icon) : '✨'}
                          </div>
                          <h3 className="text-xl font-heading font-semibold mb-3">{item.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );

          case 'testimonials':
            return (
              <section key={section.id} className="px-6 py-24 border-y border-border/50">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold">{d.title}</h2>
                    {d.subtitle && <p className="text-muted-foreground text-lg">{d.subtitle}</p>}
                  </div>
                  
                  {Array.isArray(d.items) && d.items.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {d.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-8 rounded-3xl bg-surface border border-border shadow-sm">
                          <p className="text-lg italic text-muted-foreground mb-6">&quot;{item.quote}&quot;</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white">
                              {item.name ? item.name[0] : 'U'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{item.name}</h4>
                              <span className="text-sm text-muted-foreground">{item.role}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );

          case 'cta':
            return (
              <section key={section.id} className="px-6 py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5" />
                <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 bg-card/80 backdrop-blur-md p-12 rounded-[3rem] border border-primary/20 shadow-xl shadow-primary/5">
                  <h2 className="text-3xl md:text-5xl font-heading font-bold">{d.title}</h2>
                  {d.subtitle && <p className="text-xl text-muted-foreground">{d.subtitle}</p>}
                  
                  {d.ctaText && (
                    <Link
                      href={d.ctaUrl || '/'}
                      className="inline-flex items-center justify-center h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all duration-300"
                    >
                      {d.ctaText}
                    </Link>
                  )}
                </div>
              </section>
            );

          case 'faq':
            return (
              <section key={section.id} className="px-6 py-20 bg-muted/10">
                <div className="max-w-3xl mx-auto space-y-10">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold">{d.title || 'FAQ'}</h2>
                    {d.subtitle && <p className="text-muted-foreground">{d.subtitle}</p>}
                  </div>
                  <div className="space-y-4">
                     {Array.isArray(d.items) && d.items.map((item: any, idx: number) => (
                       <div key={idx} className="p-6 rounded-2xl bg-card border border-border">
                         <h3 className="font-bold text-lg">{item.question || item.title}</h3>
                         <p className="mt-2 text-muted-foreground">{item.answer || item.description}</p>
                       </div>
                     ))}
                  </div>
                </div>
              </section>
            );

          default:
            return null; // Unknown type
        }
      })}
    </main>
  );
}
