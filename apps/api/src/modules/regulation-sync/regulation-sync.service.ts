import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

/** Parsed regulation from external source */
interface ScrapedRegulation {
  title: string;
  regulationNumber: string;
  type: string;
  issuedBy: string;
  issuedDate: string;
  effectiveDate: string;
  status: string;
  sourceUrl: string;
  sectorTags: string[];
  contentRaw: string;
}

/** Result of a single sync operation */
export interface SyncResult {
  source: string;
  totalFetched: number;
  totalNew: number;
  totalUpdated: number;
  totalSkipped: number;
  errors: string[];
}

@Injectable()
export class RegulationSyncService {
  private readonly logger = new Logger(RegulationSyncService.name);

  /** Base URLs for government regulation sources */
  private readonly SOURCES = {
    peraturan: 'https://peraturan.go.id',
    jdih: 'https://jdih.go.id',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Cron Job: Auto-sync every day at 02:00 AM (WIB)
   * Runs scraper → diff → insert → notify
   */
  @Cron('0 19 * * *', { name: 'regulation-sync-daily' })
  async handleDailyCron() {
    this.logger.log('⏰ Cron: Starting daily regulation sync...');
    await this.syncFromAllSources('cron');
  }

  /** Manual trigger (admin) */
  async triggerManualSync() {
    return this.syncFromAllSources('admin_manual');
  }

  /** Orchestrator: sync from all configured sources */
  private async syncFromAllSources(triggeredBy: string) {
    const results: SyncResult[] = [];

    // Source 1: peraturan.go.id
    try {
      const r = await this.syncFromPeraturanGoId(triggeredBy);
      results.push(r);
    } catch (err) {
      this.logger.error(`Sync peraturan.go.id failed: ${(err as Error).message}`);
      results.push({
        source: 'peraturan_go_id',
        totalFetched: 0, totalNew: 0, totalUpdated: 0, totalSkipped: 0,
        errors: [(err as Error).message],
      });
    }

    // Source 2: JDIH
    try {
      const r = await this.syncFromJdih(triggeredBy);
      results.push(r);
    } catch (err) {
      this.logger.error(`Sync JDIH failed: ${(err as Error).message}`);
      results.push({
        source: 'jdih',
        totalFetched: 0, totalNew: 0, totalUpdated: 0, totalSkipped: 0,
        errors: [(err as Error).message],
      });
    }

    return results;
  }

  /** Scraper: peraturan.go.id */
  private async syncFromPeraturanGoId(triggeredBy: string): Promise<SyncResult> {
    const log = await this.createSyncLog('peraturan_go_id', triggeredBy);
    const result: SyncResult = {
      source: 'peraturan_go_id', totalFetched: 0,
      totalNew: 0, totalUpdated: 0, totalSkipped: 0, errors: [],
    };

    try {
      // Fetch recent regulations page
      const url = `${this.SOURCES.peraturan}/id/pp`;
      const { data: html } = await axios.get(url, {
        timeout: 30000,
        headers: { 'User-Agent': 'LocalCompliance-Bot/1.0' },
      });

      const scraped = this.parsePeraturanGoId(html, url);
      result.totalFetched = scraped.length;

      // Diff & upsert
      for (const reg of scraped) {
        const outcome = await this.upsertRegulation(reg);
        if (outcome === 'new') result.totalNew++;
        else if (outcome === 'updated') result.totalUpdated++;
        else result.totalSkipped++;
      }

      await this.completeSyncLog(log.id, 'success', result);
      this.logger.log(`✅ peraturan.go.id sync: ${result.totalNew} new, ${result.totalUpdated} updated, ${result.totalSkipped} skipped`);
    } catch (err) {
      const msg = (err as Error).message;
      result.errors.push(msg);
      await this.completeSyncLog(log.id, 'failed', result, msg);
    }

    return result;
  }

  /** Scraper: jdih.go.id */
  private async syncFromJdih(triggeredBy: string): Promise<SyncResult> {
    const log = await this.createSyncLog('jdih', triggeredBy);
    const result: SyncResult = {
      source: 'jdih', totalFetched: 0,
      totalNew: 0, totalUpdated: 0, totalSkipped: 0, errors: [],
    };

    try {
      const url = `${this.SOURCES.jdih}/pencarian?page=1`;
      const { data: html } = await axios.get(url, {
        timeout: 30000,
        headers: { 'User-Agent': 'LocalCompliance-Bot/1.0' },
      });

      const scraped = this.parseJdih(html, url);
      result.totalFetched = scraped.length;

      for (const reg of scraped) {
        const outcome = await this.upsertRegulation(reg);
        if (outcome === 'new') result.totalNew++;
        else if (outcome === 'updated') result.totalUpdated++;
        else result.totalSkipped++;
      }

      await this.completeSyncLog(log.id, 'success', result);
      this.logger.log(`✅ JDIH sync: ${result.totalNew} new, ${result.totalUpdated} updated, ${result.totalSkipped} skipped`);
    } catch (err) {
      const msg = (err as Error).message;
      result.errors.push(msg);
      await this.completeSyncLog(log.id, 'failed', result, msg);
    }

    return result;
  }

  /**
   * HTML Parser: peraturan.go.id
   * Tolerant parsing — gracefully handles structure changes
   */
  private parsePeraturanGoId(html: string, baseUrl: string): ScrapedRegulation[] {
    const $ = cheerio.load(html);
    const items: ScrapedRegulation[] = [];

    // Common selectors for regulation listing pages
    $('table tbody tr, .regulasi-item, .card, article').each((_, el) => {
      try {
        const $el = $(el);
        const titleEl = $el.find('a, h3, h4, .title, td:nth-child(2)').first();
        const title = titleEl.text().trim();

        if (!title || title.length < 10) return;

        const link = titleEl.attr('href') || '';
        const regNumber = $el.find('.nomor, td:first-child, .reg-number').text().trim()
          || this.extractRegNumber(title);

        const dateText = $el.find('.tanggal, td:nth-child(3), .date, time').text().trim();
        const parsedDate = this.parseDate(dateText);

        items.push({
          title: title.substring(0, 490),
          regulationNumber: regNumber || `SYNC-${Date.now()}-${items.length}`,
          type: this.detectRegType(title),
          issuedBy: this.detectIssuer(title),
          issuedDate: parsedDate,
          effectiveDate: parsedDate,
          status: 'Active',
          sourceUrl: link.startsWith('http') ? link : `${baseUrl}${link}`,
          sectorTags: this.detectSectorTags(title),
          contentRaw: title,
        });
      } catch {
        // Skip malformed items silently
      }
    });

    return items;
  }

  /**
   * HTML Parser: jdih.go.id
   */
  private parseJdih(html: string, baseUrl: string): ScrapedRegulation[] {
    const $ = cheerio.load(html);
    const items: ScrapedRegulation[] = [];

    $('.result-item, .card, table tbody tr, .list-group-item').each((_, el) => {
      try {
        const $el = $(el);
        const titleEl = $el.find('a, h5, h4, .judul, td:nth-child(2)').first();
        const title = titleEl.text().trim();

        if (!title || title.length < 10) return;

        const link = titleEl.attr('href') || '';
        const regNumber = $el.find('.nomor, .reg-number, td:first-child').text().trim()
          || this.extractRegNumber(title);

        const dateText = $el.find('.tanggal, .date, time, td:nth-child(3)').text().trim();
        const parsedDate = this.parseDate(dateText);

        items.push({
          title: title.substring(0, 490),
          regulationNumber: regNumber || `JDIH-${Date.now()}-${items.length}`,
          type: this.detectRegType(title),
          issuedBy: this.detectIssuer(title),
          issuedDate: parsedDate,
          effectiveDate: parsedDate,
          status: 'Active',
          sourceUrl: link.startsWith('http') ? link : `${this.SOURCES.jdih}${link}`,
          sectorTags: this.detectSectorTags(title),
          contentRaw: title,
        });
      } catch {
        // Skip malformed items silently
      }
    });

    return items;
  }

  /**
   * Diff Engine + Upsert: checks if regulation already exists
   * Returns 'new', 'updated', or 'skipped'
   */
  private async upsertRegulation(reg: ScrapedRegulation): Promise<'new' | 'updated' | 'skipped'> {
    // Find by regulationNumber (unique identifier)
    const existing = await this.prisma.regulation.findFirst({
      where: {
        OR: [
          { regulationNumber: reg.regulationNumber },
          { title: reg.title },
        ],
      },
    });

    if (!existing) {
      // New regulation → insert + notify
      const created = await this.prisma.regulation.create({
        data: {
          title: reg.title,
          regulationNumber: reg.regulationNumber,
          type: reg.type,
          issuedBy: reg.issuedBy,
          issuedDate: new Date(reg.issuedDate),
          effectiveDate: new Date(reg.effectiveDate),
          status: reg.status,
          sectorTags: reg.sectorTags,
          sourceUrl: reg.sourceUrl,
          contentRaw: reg.contentRaw,
          pineconeIndexed: false,
        },
      });

      // Notify affected users
      await this.broadcastNewRegulation(created.id);
      return 'new';
    }

    // Check if content changed (simple diff on status/title)
    const hasChanged = existing.status !== reg.status
      || existing.title !== reg.title;

    if (hasChanged) {
      await this.prisma.regulation.update({
        where: { id: existing.id },
        data: {
          title: reg.title,
          status: reg.status,
          sourceUrl: reg.sourceUrl,
        },
      });
      return 'updated';
    }

    return 'skipped';
  }

  /** Broadcast notification to users with matching sector */
  private async broadcastNewRegulation(regulationId: string) {
    try {
      await this.notificationsService.sendRegulatoryAlert(regulationId);
    } catch (err) {
      this.logger.warn(`Failed to broadcast for regulation ${regulationId}: ${(err as Error).message}`);
    }
  }

  /* ────────────── Helper Methods ────────────── */

  private extractRegNumber(title: string): string {
    const match = title.match(/(?:No(?:mor)?\.?\s*)?(\d+)\s*(?:Tahun|\/)\s*(\d{4})/i);
    return match ? `${match[1]} Tahun ${match[2]}` : '';
  }

  private detectRegType(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('undang-undang') || lower.includes(' uu ')) return 'UU';
    if (lower.includes('peraturan pemerintah') || lower.includes(' pp ')) return 'PP';
    if (lower.includes('perpres') || lower.includes('peraturan presiden')) return 'Perpres';
    if (lower.includes('permen') || lower.includes('peraturan menteri')) return 'Permen';
    if (lower.includes('perda') || lower.includes('peraturan daerah')) return 'Perda';
    if (lower.includes('keputusan')) return 'Kepmen';
    if (lower.includes('instruksi')) return 'Inpres';
    return 'Lainnya';
  }

  private detectIssuer(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('presiden')) return 'Presiden RI';
    if (lower.includes('keuangan')) return 'Kementerian Keuangan';
    if (lower.includes('ketenagakerjaan') || lower.includes('tenaga kerja')) return 'Kemenaker';
    if (lower.includes('perdagangan')) return 'Kemendag';
    if (lower.includes('investasi') || lower.includes('bkpm')) return 'BKPM';
    if (lower.includes('kesehatan')) return 'Kemenkes';
    if (lower.includes('lingkungan')) return 'KLHK';
    return 'Pemerintah RI';
  }

  private detectSectorTags(title: string): string[] {
    const tags: string[] = [];
    const lower = title.toLowerCase();
    if (lower.includes('pajak') || lower.includes('ppn') || lower.includes('pph')) tags.push('perpajakan');
    if (lower.includes('tenaga kerja') || lower.includes('ketenagakerjaan') || lower.includes('upah')) tags.push('ketenagakerjaan');
    if (lower.includes('investasi') || lower.includes('penanaman modal')) tags.push('investasi');
    if (lower.includes('lingkungan') || lower.includes('amdal')) tags.push('lingkungan');
    if (lower.includes('perdagangan') || lower.includes('ekspor') || lower.includes('impor')) tags.push('perdagangan');
    if (lower.includes('kesehatan') || lower.includes('obat') || lower.includes('farmasi')) tags.push('kesehatan');
    if (lower.includes('teknologi') || lower.includes('digital') || lower.includes('elektronik')) tags.push('teknologi');
    if (lower.includes('pertanahan') || lower.includes('agraria')) tags.push('pertanahan');
    if (lower.includes('perizinan') || lower.includes('oss') || lower.includes('nib')) tags.push('perizinan');
    if (tags.length === 0) tags.push('umum');
    return tags;
  }

  private parseDate(text: string): string {
    if (!text) return new Date().toISOString().split('T')[0];
    // Try common Indonesian date formats
    const match = text.match(/(\d{1,2})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
    // Try "1 Januari 2024" format
    const months: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04',
      mei: '05', juni: '06', juli: '07', agustus: '08',
      september: '09', oktober: '10', november: '11', desember: '12',
    };
    const idMatch = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (idMatch && months[idMatch[2].toLowerCase()]) {
      return `${idMatch[3]}-${months[idMatch[2].toLowerCase()]}-${idMatch[1].padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  /* ────────────── Sync Log CRUD ────────────── */

  private async createSyncLog(source: string, triggeredBy: string) {
    return this.prisma.regulationSyncLog.create({
      data: { source, status: 'running', triggeredBy },
    });
  }

  private async completeSyncLog(
    id: string, status: string, result: SyncResult, errorMessage?: string,
  ) {
    return this.prisma.regulationSyncLog.update({
      where: { id },
      data: {
        status,
        totalFetched: result.totalFetched,
        totalNew: result.totalNew,
        totalUpdated: result.totalUpdated,
        totalSkipped: result.totalSkipped,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  /** Get sync history for admin dashboard */
  async getSyncHistory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.regulationSyncLog.findMany({
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.regulationSyncLog.count(),
    ]);
    return { items, total, page, limit };
  }
}
