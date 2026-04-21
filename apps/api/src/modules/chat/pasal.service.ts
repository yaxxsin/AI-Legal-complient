import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Pasal.id search result item */
interface PasalResult {
  title: string;
  type: string;
  number: string;
  year: number;
  about: string;
  frbr_uri: string;
  source_url?: string;
}

/**
 * Service to query Pasal.id REST API for Indonesian legal articles.
 * Used by ComplianceBot to enrich answers with real regulation data.
 */
@Injectable()
export class PasalService {
  private readonly logger = new Logger(PasalService.name);
  private readonly apiUrl: string;
  private readonly apiToken: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.get<string>('PASAL_API_URL') ?? 'https://pasal.id/api/v1';
    this.apiToken = this.config.get<string>('PASAL_API_TOKEN') ?? '';

    if (this.apiToken) {
      this.logger.log(`Pasal.id API configured: ${this.apiUrl}`);
    } else {
      this.logger.warn('Pasal.id API token not configured — legal search disabled');
    }
  }

  /**
   * Search regulations by keyword via Pasal.id API.
   * Returns formatted context string for injection into AI prompt.
   */
  async searchForContext(query: string): Promise<string> {
    if (!this.apiToken) return '';

    const keywords = this.extractLegalKeywords(query);
    if (keywords.length === 0) return '';

    try {
      const searchQuery = keywords.join(' ');
      const url = `${this.apiUrl}/search?q=${encodeURIComponent(searchQuery)}&limit=5`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (!response.ok) {
        this.logger.warn(`Pasal.id API returned ${response.status}`);
        return '';
      }

      const data = await response.json();
      const results: PasalResult[] = data.data ?? data.results ?? data ?? [];

      if (!Array.isArray(results) || results.length === 0) return '';

      return this.formatResults(results);
    } catch (err) {
      this.logger.warn(`Pasal.id search failed: ${(err as Error).message}`);
      return '';
    }
  }

  /** Format API results into prompt context */
  private formatResults(results: PasalResult[]): string {
    let ctx = '\n\n--- DATA PASAL.ID (Sumber Resmi) ---\n';
    ctx += '📚 PASAL & REGULASI TERKAIT:\n';

    for (const r of results.slice(0, 5)) {
      const type = r.type ?? '';
      const number = r.number ?? '';
      const year = r.year ?? '';
      const title = r.title ?? r.about ?? '';
      const uri = r.frbr_uri ?? '';

      ctx += `- ${type} No. ${number} Tahun ${year}: "${title}"`;
      if (uri) {
        ctx += ` [Detail: https://pasal.id${uri}]`;
      }
      ctx += '\n';
    }

    ctx += '--- AKHIR DATA PASAL.ID ---\n';
    return ctx;
  }

  /** Extract legal-relevant keywords from user question */
  private extractLegalKeywords(question: string): string[] {
    const stopWords = new Set([
      'apa', 'adalah', 'yang', 'dan', 'atau', 'di', 'ke',
      'dari', 'untuk', 'dengan', 'ini', 'itu', 'saya',
      'bagaimana', 'cara', 'apakah', 'bisa', 'harus',
      'tolong', 'mohon', 'jelaskan', 'tentang',
    ]);

    return question
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 4);
  }
}
