const ID_LOCALE = 'id-ID';

/** Format date to Indonesian locale string (e.g. "17 April 2026") */
export function formatDate(date: string | Date, style: 'short' | 'long' = 'long'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(ID_LOCALE, {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  });
}

/** Format relative date (e.g. "2 hari lalu", "baru saja") */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return formatDate(d, 'short');
}
