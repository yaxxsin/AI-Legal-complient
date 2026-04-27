import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBusinessProfileDto, UpdateBusinessProfileDto, UpdateStepDto } from './dto';
import { ChatService } from '../chat/chat.service';
import { ComplianceItemsService } from '../compliance-items/compliance-items.service';
import * as Tesseract from 'tesseract.js';


/** Plan-based profile limits */
const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 1,
  growth: 3,
  business: 10,
};

@Injectable()
export class BusinessProfilesService {
  private readonly logger = new Logger(BusinessProfilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly complianceItemsService: ComplianceItemsService,
  ) {}

  /** Create new business profile (check plan limit) */
  async create(userId: string, userPlan: string, dto: CreateBusinessProfileDto) {
    const limit = PLAN_LIMITS[userPlan] ?? 1;
    const count = await this.prisma.businessProfile.count({
      where: { userId },
    });

    if (count >= limit) {
      // PERBAIKAN: Jika ada draf yang belum selesai, gunakan saja draf itu daripada error
      const draftProfile = await this.prisma.businessProfile.findFirst({
        where: { userId, isDraft: true }
      });
      if (draftProfile) {
        return this.prisma.businessProfile.update({
          where: { id: draftProfile.id },
          data: { entityType: dto.entityType }
        });
      }

      throw new ForbiddenException({
        code: 'PLAN_LIMIT_REACHED',
        message: `Paket ${userPlan} hanya mendukung ${limit} profil bisnis`,
      });
    }

    return this.prisma.businessProfile.create({
      data: {
        userId,
        businessName: '',
        entityType: dto.entityType,
        isDraft: true,
        onboardingStep: 1,
      },
    });
  }

  /** List all profiles for a user */
  async findAllByUser(userId: string) {
    return this.prisma.businessProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { sector: { select: { id: true, name: true, icon: true } } },
    });
  }

  /** Get single profile by ID (with ownership check) */
  async findOne(id: string, userId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { id },
      include: { sector: { select: { id: true, name: true, icon: true } } },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Profil bisnis tidak ditemukan',
      });
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Akses ditolak',
      });
    }

    return profile;
  }

  /** Full update + finalize (set isDraft = false) */
  async updateFull(id: string, userId: string, dto: UpdateBusinessProfileDto) {
    await this.findOne(id, userId);

    return this.prisma.businessProfile.update({
      where: { id },
      data: {
        ...(dto.entityType && { entityType: dto.entityType }),
        ...(dto.businessName !== undefined && { businessName: dto.businessName }),
        ...(dto.establishmentDate ? {
          establishmentDate: new Date(dto.establishmentDate),
        } : {}),
        ...(dto.sectorId ? { sectorId: dto.sectorId } : {}),
        ...(dto.subSectorIds ? { subSectorIds: dto.subSectorIds } : {}),
        ...(dto.employeeCount !== undefined && { employeeCount: typeof dto.employeeCount === 'string' ? parseInt(dto.employeeCount as string, 10) : dto.employeeCount }),
        ...(dto.annualRevenue !== undefined && { annualRevenue: dto.annualRevenue }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.province !== undefined && { province: dto.province }),
        ...(dto.hasNib !== undefined && { hasNib: dto.hasNib }),
        ...(dto.nibNumber !== undefined && { nibNumber: dto.nibNumber }),
        ...(dto.npwp !== undefined && { npwp: dto.npwp }),
        ...(dto.kbliCodes !== undefined && { kbliCodes: dto.kbliCodes }),
        ...(dto.kbliDescriptions !== undefined && { kbliDescriptions: dto.kbliDescriptions }),
        ...(dto.isOnlineBusiness !== undefined && { isOnlineBusiness: dto.isOnlineBusiness }),
        isDraft: false,
        onboardingStep: 5,
      },
    }).then(async (profile) => {
      // Auto-generate checklist + mark NIB/NPWP completed
      await this.autoPopulateChecklist(profile.id, userId, dto);
      return profile;
    });
  }

  /**
   * Auto-generate compliance checklist and mark NIB/NPWP items as completed
   * when detected from onboarding data.
   */
  private async autoPopulateChecklist(
    profileId: string, userId: string, dto: UpdateBusinessProfileDto,
  ) {
    try {
      // 1. Generate the full checklist
      await this.complianceItemsService.generateChecklist(profileId, userId);

      // 2. Auto-complete items matching detected documents
      const items = await this.prisma.complianceItem.findMany({
        where: { businessProfileId: profileId },
      });

      for (const item of items) {
        const titleLower = item.title.toLowerCase();

        // NIB detected → mark NIB items completed
        if (dto.nibNumber && (titleLower.includes('nib') || titleLower.includes('nomor induk berusaha'))) {
          await this.prisma.complianceItem.update({
            where: { id: item.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              notes: `Auto-verified dari onboarding. NIB: ${dto.nibNumber}`,
            },
          });
        }

        // NPWP detected → mark NPWP items completed
        if (dto.npwp && (titleLower.includes('npwp'))) {
          await this.prisma.complianceItem.update({
            where: { id: item.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              notes: `Auto-verified dari onboarding. NPWP: ${dto.npwp}`,
            },
          });
        }
      }

      this.logger.log(`Auto-populated checklist for profile ${profileId}`);
    } catch (err) {
      this.logger.warn(`Failed to auto-populate checklist: ${(err as Error).message}`);
      // Non-blocking — don't fail the update even if checklist fails
    }
  }

  /** Auto-save per wizard step */
  async updateStep(id: string, userId: string, dto: UpdateStepDto) {
    await this.findOne(id, userId);

    const stepData = this.mapStepData(dto.step, dto.data ?? {});

    return this.prisma.businessProfile.update({
      where: { id },
      data: {
        ...stepData,
        onboardingStep: dto.step,
      },
    });
  }

  /** Delete profile (ownership check) */
  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.businessProfile.delete({ where: { id } });
    this.logger.log(`Profile deleted: ${id}`);
  }

  /** Map wizard step number to DB fields */
  private mapStepData(
    step: number,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    switch (step) {
      case 1:
        return {
          ...(data.entityType !== undefined && { entityType: data.entityType }),
        };
      case 2:
        return {
          ...(data.sectorId ? { sectorId: data.sectorId } : {}),
          ...(data.subSectorIds ? { subSectorIds: data.subSectorIds } : {}),
          ...(data.kbliCodes ? { kbliCodes: data.kbliCodes } : {}),
          ...(data.kbliDescriptions ? { kbliDescriptions: data.kbliDescriptions } : {}),
        };
      case 3:
        return {
          ...(data.businessName !== undefined && { businessName: data.businessName }),
          ...(data.establishmentDate ? {
            establishmentDate: new Date(data.establishmentDate as string),
          } : {}),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.province !== undefined && { province: data.province }),
        };
      case 4:
        return {
          ...(data.employeeCount !== undefined && { employeeCount: Number(data.employeeCount) }),
          ...(data.annualRevenue !== undefined && { annualRevenue: data.annualRevenue }),
          ...(data.isOnlineBusiness !== undefined && { isOnlineBusiness: data.isOnlineBusiness }),
        };
      case 5:
        return {
          ...(data.hasNib !== undefined && { hasNib: data.hasNib }),
          ...(data.nibNumber !== undefined && { nibNumber: data.nibNumber }),
          ...(data.npwp !== undefined && { npwp: data.npwp }),
        };
      default:
        throw new BadRequestException('Step tidak valid (1-5)');
    }
  }

  /** Try to extract structured data using regex patterns (fast, no AI) */
  private tryRegexExtraction(text: string): Record<string, any> {
    const result: Record<string, any> = {
      businessName: '',
      npwp: '',
      nibNumber: '',
      entityType: '',
      city: '',
      province: '',
      kbliCodes: [] as string[],
      kbliDescriptions: [] as string[],
    };

    // NIB: 13-digit number, multiple patterns for different NIB formats
    const nibPatterns = [
      /(?:NIB|Nomor Induk Berusaha)[:\s]*([\d\s]{13,16})/i,
      /(?:Nomor\s+Induk)[:\s]*([\d\s]{13,16})/i,
      /(?:NIB)[:\s.]*([\d]{13})/i,
    ];
    for (const pattern of nibPatterns) {
      const m = text.match(pattern);
      if (m) {
        result.nibNumber = m[1].replace(/\s/g, '').substring(0, 13);
        break;
      }
    }
    // Fallback: any standalone 13-digit number
    if (!result.nibNumber) {
      const fallback = text.match(/\b(\d{13})\b/);
      if (fallback) result.nibNumber = fallback[1];
    }

    // NPWP: 15 or 16 digits, with or without dots/dashes
    const npwpMatch = text.match(/(?:NPWP)[:\s]*([\d.\-]{15,25})/i)
      || text.match(/(\d{2}[.\-]?\d{3}[.\-]?\d{3}[.\-]?\d[.\-]?\d{3}[.\-]?\d{3})/);
    if (npwpMatch) result.npwp = npwpMatch[1].replace(/[.\-\s]/g, '');

    // Entity type detection
    const upperText = text.toUpperCase();
    if (upperText.includes('PERSEROAN TERBATAS') || /\bPT\b/.test(upperText)) {
      result.entityType = 'PT';
    } else if (upperText.includes('COMMANDITAIRE') || /\bCV\b/.test(upperText)) {
      result.entityType = 'CV';
    } else if (upperText.includes('FIRMA')) {
      result.entityType = 'Firma';
    } else if (upperText.includes('YAYASAN')) {
      result.entityType = 'Yayasan';
    } else if (upperText.includes('KOPERASI')) {
      result.entityType = 'Koperasi';
    } else if (upperText.includes('PERORANGAN') || upperText.includes('USAHA DAGANG') || /\bUD\b/.test(upperText)) {
      result.entityType = 'Perorangan';
    }

    // Business name: look for "Nama Perusahaan", "Nama Usaha", or after PT/CV
    const nameMatch = text.match(/(?:Nama (?:Perusahaan|Usaha|Badan Usaha|Pelaku Usaha))[:\s]*([^\n]{3,80})/i)
      || text.match(/(?:PT|CV|UD|Firma|Yayasan|Koperasi)\.?\s+([A-Z][A-Za-z\s&.]{2,60})/);
    if (nameMatch) {
      result.businessName = nameMatch[1].trim().replace(/\s+/g, ' ');
    }

    // City/Province from common NIB patterns
    const cityMatch = text.match(/(?:Kota|Kabupaten|Kab\.)[:\s/]*([A-Za-z\s]{3,30})/i);
    if (cityMatch) result.city = cityMatch[1].trim();
    const provMatch = text.match(/(?:Provinsi|Prov\.)[:\s/]*([A-Za-z\s]{3,30})/i);
    if (provMatch) result.province = provMatch[1].trim();

    // KBLI: 5-digit codes with optional description
    this.extractKbliFromText(text, result);

    return result;
  }

  /** Extract KBLI codes and descriptions from OCR text */
  private extractKbliFromText(
    text: string,
    result: Record<string, any>,
  ): void {
    const codes: string[] = [];
    const descriptions: string[] = [];

    // Pattern 1: "KBLI: 47111 - Perdagangan Eceran ..."
    const kbliLabelPattern = /(?:KBLI)[:\s]*(\d{5})\s*[-–]\s*([^\n]{5,100})/gi;
    let match: RegExpExecArray | null;
    while ((match = kbliLabelPattern.exec(text)) !== null) {
      if (!codes.includes(match[1])) {
        codes.push(match[1]);
        descriptions.push(match[2].trim());
      }
    }

    // Pattern 2: "47111 Perdagangan Eceran ..." (numbered list or plain)
    if (codes.length === 0) {
      const listPattern = /(?:^|\n)\s*(?:\d+\.\s*)?(\d{5})\s+([A-Z][^\n]{5,100})/g;
      while ((match = listPattern.exec(text)) !== null) {
        const desc = match[2].trim();
        // Filter: description must look like a business activity
        if (/(?:Perdagangan|Industri|Jasa|Aktivitas|Pengolahan|Penyediaan|Konstruksi|Pertanian|Pertambangan|Pendidikan|Kesehatan|Keuangan|Real|Transportasi)/i.test(desc)) {
          if (!codes.includes(match[1])) {
            codes.push(match[1]);
            descriptions.push(desc);
          }
        }
      }
    }

    // Pattern 3: "Kegiatan Usaha" section with 5-digit codes
    if (codes.length === 0) {
      const sectionMatch = text.match(
        /(?:Kegiatan Usaha|Bidang Usaha|Klasifikasi)[:\s]*\n([\s\S]{10,500}?)(?:\n\n|$)/i,
      );
      if (sectionMatch) {
        const codePattern = /(\d{5})\s+([^\n]{5,100})/g;
        while ((match = codePattern.exec(sectionMatch[1])) !== null) {
          if (!codes.includes(match[1])) {
            codes.push(match[1]);
            descriptions.push(match[2].trim());
          }
        }
      }
    }

    result.kbliCodes = codes;
    result.kbliDescriptions = descriptions;
  }

  /**
   * Smart truncation: extract relevant sections from long text for AI prompt.
   * Instead of dumb substring(0, N), find paragraphs containing key terms.
   */
  private smartTruncateForAi(fullText: string, maxChars = 4000): string {
    if (fullText.length <= maxChars) return fullText;

    const keywords = [
      'NIB', 'Nomor Induk', 'NPWP', 'Nama Perusahaan', 'Nama Usaha',
      'Nama Pelaku', 'Badan Usaha', 'Perseroan', 'Kota', 'Provinsi',
      'Kabupaten', 'Alamat', 'KBLI', 'Kegiatan Usaha', 'Modal',
    ];

    const lines = fullText.split('\n');
    const relevantLines: { idx: number; line: string }[] = [];

    // Collect lines containing keywords + surrounding context (±2 lines)
    for (let i = 0; i < lines.length; i++) {
      const hasKeyword = keywords.some((kw) =>
        lines[i].toUpperCase().includes(kw.toUpperCase()),
      );
      if (hasKeyword) {
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length - 1, i + 2);
        for (let j = start; j <= end; j++) {
          if (!relevantLines.some((r) => r.idx === j)) {
            relevantLines.push({ idx: j, line: lines[j] });
          }
        }
      }
    }

    // Sort by line index to preserve order
    relevantLines.sort((a, b) => a.idx - b.idx);

    if (relevantLines.length === 0) {
      // No keywords found — fall back to first chunk
      return fullText.substring(0, maxChars);
    }

    // Build output, insert separator when lines are non-contiguous
    let result = '';
    for (let i = 0; i < relevantLines.length; i++) {
      if (i > 0 && relevantLines[i].idx - relevantLines[i - 1].idx > 1) {
        result += '\n[...]\n';
      }
      result += relevantLines[i].line + '\n';
      if (result.length >= maxChars) break;
    }

    return result.trim();
  }

  /**
   * Extract text from PDF using pdf-parse v2 (page by page).
   * pdf-parse v2 API: new PDFParse({ buffer }) → .getText()
   */
  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      const text = result?.text?.trim() || '';
      this.logger.log(`[PDF] Extracted ${text.length} chars, ${result?.pages ?? '?'} page(s)`);
      return text;
    } catch (err) {
      this.logger.error(`[PDF] pdf-parse extraction failed: ${(err as Error).message}`);
      return '';
    }
  }

  /**
   * Auto-scan document for Onboarding (KTP/NPWP/NIB)
   * Uses pdfjs-dist or Tesseract.js, then Ollama to extract JSON fields.
   */
  async scanDocument(userId: string, file: Express.Multer.File) {
    let extractedText = '';
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    // 1. Text Extraction
    try {
      if (ext === 'pdf') {
        extractedText = await this.extractTextFromPdf(file.buffer);
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        const tesseractResult = await Tesseract.recognize(file.buffer, 'ind', {
          logger: (m: any) => this.logger.debug(`Tesseract: ${m.status} - ${m.progress}`),
        });
        extractedText = tesseractResult.data.text;
      } else {
        throw new BadRequestException('Format file tidak didukung (PDF/JPG/PNG/WebP)');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      this.logger.error(`Extraction failed: ${(e as Error).message}`);
      throw new BadRequestException('Gagal membaca isi dokumen. Pastikan file jelas dan tidak diproteksi password.');
    }

    if (!extractedText.trim()) {
      throw new BadRequestException('Tidak ada teks yang dapat ditemukan di dokumen. Pastikan dokumen berisi teks yang jelas atau coba upload gambar (JPG/PNG) dari dokumen.');
    }

    // Clean extracted text: collapse whitespace, remove noise
    const cleanedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')           // collapse horizontal whitespace
      .replace(/\n{3,}/g, '\n\n')         // max 2 consecutive newlines
      .replace(/^[ \t]+$/gm, '')          // remove blank-ish lines
      .trim();

    this.logger.log(`[OCR] Extracted ${cleanedText.length} chars from ${ext} file`);

    // 2. Try regex extraction on FULL text first (fast, no AI, scans all pages)
    const regexResult = this.tryRegexExtraction(cleanedText);
    this.logger.log(`[OCR] Regex found: NIB=${regexResult.nibNumber ? 'YES' : 'NO'}, NPWP=${regexResult.npwp ? 'YES' : 'NO'}, Name=${regexResult.businessName ? 'YES' : 'NO'}`);

    // 3. Smart truncation for AI prompt: extract relevant sections only
    const truncatedText = this.smartTruncateForAi(cleanedText, 4000);

    // 4. AI Extraction via Ollama (for fields regex couldn't find)
    const prompt = `Ekstrak data dari dokumen NIB/NPWP/KTP berikut. Output HANYA JSON, tanpa markdown.
Jika field tidak ditemukan, isi string kosong "" atau array kosong [].
Format: {"businessName":"","npwp":"","nibNumber":"","entityType":"","city":"","province":"","kbliCodes":[],"kbliDescriptions":[]}
kbliCodes = array kode KBLI 5 digit. kbliDescriptions = array nama kegiatan usaha.

Teks:
${truncatedText}`;

    try {
      const aiResponse = await this.chatService.generateDirectMessage(prompt);
      const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
      let aiResult: Record<string, string> = {};
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        aiResult = JSON.parse(aiResponse);
      }

      // Merge: regex results take priority (more reliable), AI fills gaps
      const kbliCodes = regexResult.kbliCodes?.length
        ? regexResult.kbliCodes
        : (aiResult.kbliCodes || []);
      const kbliDescriptions = regexResult.kbliDescriptions?.length
        ? regexResult.kbliDescriptions
        : (aiResult.kbliDescriptions || []);

      this.logger.log(`[OCR] KBLI found: ${kbliCodes.length} code(s): ${kbliCodes.join(', ')}`);

      // Auto-match KBLI → Sector
      const sectorMatch = await this.matchKbliToSector(kbliCodes);

      return {
        businessName: regexResult.businessName || aiResult.businessName || '',
        npwp: regexResult.npwp || aiResult.npwp || '',
        nibNumber: regexResult.nibNumber || aiResult.nibNumber || '',
        entityType: regexResult.entityType || aiResult.entityType || '',
        city: regexResult.city || aiResult.city || '',
        province: regexResult.province || aiResult.province || '',
        kbliCodes,
        kbliDescriptions,
        suggestedSectorId: sectorMatch.sectorId,
        suggestedSubSectorIds: sectorMatch.subSectorIds,
      };
    } catch (e) {
      this.logger.error(`AI Extraction failed: ${(e as Error).message}`);
      // If AI fails but regex found something, return regex results
      if (regexResult.nibNumber || regexResult.npwp || regexResult.businessName) {
        this.logger.log('[OCR] AI failed but regex found data, returning partial result');
        const sectorMatch = await this.matchKbliToSector(regexResult.kbliCodes || []);
        return {
          ...regexResult,
          suggestedSectorId: sectorMatch.sectorId,
          suggestedSubSectorIds: sectorMatch.subSectorIds,
        };
      }
      throw new BadRequestException('Gagal mengekstrak data dari dokumen. Coba upload gambar (JPG/PNG) yang lebih jelas.');
    }
  }

  /**
   * Map KBLI 5-digit codes to Sector in DB.
   * Uses first 2 digits → ISIC section letter → Sector.code
   */
  private async matchKbliToSector(kbliCodes: string[]): Promise<{
    sectorId: string | null;
    subSectorIds: string[];
  }> {
    if (!kbliCodes?.length) return { sectorId: null, subSectorIds: [] };

    const prefix = parseInt(kbliCodes[0].substring(0, 2), 10);
    const sectionCode = this.kbliPrefixToSection(prefix);
    if (!sectionCode) return { sectorId: null, subSectorIds: [] };

    // Find root sector by ISIC section code
    const sector = await this.prisma.sector.findFirst({
      where: { code: sectionCode, parentId: null },
    });
    if (!sector) return { sectorId: null, subSectorIds: [] };

    // Try to match sub-sectors by code prefix
    const subSectors = await this.prisma.sector.findMany({
      where: { parentId: sector.id },
    });

    const matchedSubIds = subSectors
      .filter((sub) => {
        if (!sub.code) return false;
        // Sub-sector code like "G47", "C10", "J62" — extract numeric part
        const subNumeric = sub.code.replace(/[A-Z]/gi, '');
        return kbliCodes.some((code) => code.startsWith(subNumeric));
      })
      .map((sub) => sub.id);

    this.logger.log(
      `[KBLI] Matched sector: ${sector.name} (${sectionCode}), sub-sectors: ${matchedSubIds.length}`,
    );

    return { sectorId: sector.id, subSectorIds: matchedSubIds };
  }

  /** Map KBLI first-2-digit prefix to ISIC section letter */
  private kbliPrefixToSection(prefix: number): string | null {
    if (prefix >= 1 && prefix <= 3) return 'A';
    if (prefix >= 5 && prefix <= 9) return 'B';
    if (prefix >= 10 && prefix <= 33) return 'C';
    if (prefix >= 35 && prefix <= 39) return 'D'; // Listrik, Gas
    if (prefix >= 41 && prefix <= 43) return 'F';
    if (prefix >= 45 && prefix <= 47) return 'G';
    if (prefix >= 49 && prefix <= 53) return 'H';
    if (prefix >= 55 && prefix <= 56) return 'I';
    if (prefix >= 58 && prefix <= 63) return 'J';
    if (prefix >= 64 && prefix <= 66) return 'K';
    if (prefix === 68) return 'L';
    if (prefix >= 69 && prefix <= 75) return 'M';
    if (prefix >= 77 && prefix <= 82) return 'N'; // Jasa Administrasi
    if (prefix === 84) return 'O'; // Pemerintahan
    if (prefix === 85) return 'P';
    if (prefix >= 86 && prefix <= 88) return 'Q';
    if (prefix >= 90 && prefix <= 93) return 'R';
    if (prefix >= 94 && prefix <= 96) return 'S';
    return null;
  }
}
