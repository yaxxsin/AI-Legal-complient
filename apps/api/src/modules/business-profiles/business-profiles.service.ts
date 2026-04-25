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
const pdfParse = require('pdf-parse');

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
  private tryRegexExtraction(text: string): Record<string, string> {
    const result: Record<string, string> = {
      businessName: '',
      npwp: '',
      nibNumber: '',
      entityType: '',
      city: '',
      province: '',
    };

    // NIB: 13-digit number, often preceded by "NIB" or "Nomor Induk Berusaha"
    const nibMatch = text.match(/(?:NIB|Nomor Induk Berusaha)[:\s]*(\d{13})/i)
      || text.match(/\b(\d{13})\b/); // fallback: any 13-digit number
    if (nibMatch) result.nibNumber = nibMatch[1];

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
    const nameMatch = text.match(/(?:Nama (?:Perusahaan|Usaha|Badan Usaha))[:\s]*([^\n]{3,80})/i)
      || text.match(/(?:PT|CV|UD|Firma|Yayasan|Koperasi)\.?\s+([A-Z][A-Za-z\s&.]{2,60})/);
    if (nameMatch) {
      result.businessName = nameMatch[1].trim().replace(/\s+/g, ' ');
    }

    return result;
  }

  /**
   * Auto-scan document for Onboarding (KTP/NPWP/NIB)
   * Uses pdf-parse or Tesseract.js, then Ollama to extract JSON fields.
   */
  async scanDocument(userId: string, file: Express.Multer.File) {
    let extractedText = '';
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    // 1. Text Extraction
    try {
      if (ext === 'pdf') {
        // Try text-layer extraction first
        try {
          const parsed = await pdfParse(file.buffer);
          extractedText = parsed.text?.trim() || '';
        } catch {
          this.logger.warn('pdf-parse failed, PDF may be scanned/image-based');
        }

        // If PDF has no text layer (scanned document), fall back to OCR
        if (!extractedText) {
          this.logger.log('PDF has no text layer, attempting OCR via Tesseract...');
          try {
            const tesseractResult = await Tesseract.recognize(file.buffer, 'ind', {
              logger: (m: any) => this.logger.debug(`Tesseract: ${m.status} - ${m.progress}`),
            });
            extractedText = tesseractResult.data.text;
          } catch {
            this.logger.warn('Tesseract OCR on PDF also failed');
          }
        }
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        const tesseractResult = await Tesseract.recognize(file.buffer, 'ind', {
          logger: (m: any) => this.logger.debug(`Tesseract: ${m.status} - ${m.progress}`),
        });
        extractedText = tesseractResult.data.text;
      } else {
        throw new BadRequestException('Format file tidak didukung untuk OCR (Hanya PDF/Image)');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      this.logger.error(`OCR Extraction failed: ${(e as Error).message}`);
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

    // Smart truncation: keep first 5000 chars (enough for most NIB/NPWP docs)
    const truncatedText = cleanedText.substring(0, 5000);

    // 2. Try regex extraction first (fast, no AI needed for standard formats)
    const regexResult = this.tryRegexExtraction(truncatedText);

    // 3. AI Extraction via Ollama (for fields regex couldn't find)
    const prompt = `Ekstrak data dari dokumen NIB/NPWP/KTP berikut. Output HANYA JSON, tanpa markdown atau teks lain.
Jika field tidak ditemukan, isi string kosong "".

{"businessName":"","npwp":"","nibNumber":"","entityType":"PT/CV/Firma/Yayasan/Perorangan/Lainnya","city":"","province":""}

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
      return {
        businessName: regexResult.businessName || aiResult.businessName || '',
        npwp: regexResult.npwp || aiResult.npwp || '',
        nibNumber: regexResult.nibNumber || aiResult.nibNumber || '',
        entityType: regexResult.entityType || aiResult.entityType || '',
        city: aiResult.city || '',
        province: aiResult.province || '',
      };
    } catch (e) {
      this.logger.error(`AI Extraction failed: ${(e as Error).message}`);
      // If AI fails but regex found something, return regex results
      if (regexResult.nibNumber || regexResult.npwp || regexResult.businessName) {
        this.logger.log('[OCR] AI failed but regex found data, returning partial result');
        return regexResult;
      }
      throw new BadRequestException('Gagal mengekstrak data dari dokumen. Coba upload gambar (JPG/PNG) yang lebih jelas.');
    }
  }
}
