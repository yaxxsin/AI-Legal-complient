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
  starter: 2,
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
        const parsed = await pdfParse(file.buffer);
        extractedText = parsed.text;
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        const tesseractResult = await Tesseract.recognize(file.buffer, 'ind', {
          logger: (m) => this.logger.debug(`Tesseract: ${m.status} - ${m.progress}`),
        });
        extractedText = tesseractResult.data.text;
      } else {
        throw new BadRequestException('Format file tidak didukung untuk OCR (Hanya PDF/Image)');
      }
    } catch (e) {
      this.logger.error(`OCR Extraction failed: ${(e as Error).message}`);
      throw new BadRequestException('Gagal membaca isi dokumen. Pastikan file jelas dan tidak diproteksi password.');
    }

    if (!extractedText.trim()) {
      throw new BadRequestException('Tidak ada teks yang dapat ditemukan di dokumen tersebut.');
    }

    // Trim text to prevent token overflow (approx limit 3000 chars for local fast extraction)
    const truncatedText = extractedText.substring(0, 3000);

    // 2. AI Extraction via Ollama
    const prompt = `Anda adalah sistem data extraction otomatis OCR.
Ekstrak informasi berikut dari teks acak NIB / NPWP / KTP berikut ini.
Keluarkan HANYA dalam bentuk format JSON persis seperti di bawah ini tanpa markdown, tanpa teks tambahan apapun.
Jika ada field yang tidak ditemukan, beri tanda string kosong "".
{
  "businessName": "Nama Perusahaan (misal PT XYZ / Johan)",
  "npwp": "Nomor NPWP 15/16 digit",
  "nibNumber": "Nomor NIB (biasanya 13 digit angka)",
  "entityType": "Pilih salah satu sesuai jenis badan hukum (PT/CV/Firma/Yayasan/Perorangan/Lainnya)",
  "city": "Kota/Kabupaten alamat",
  "province": "Provinsi alamat"
}

TEKS DOKUMEN:
---
${truncatedText}
---`;

    try {
      const aiResponse = await this.chatService.generateDirectMessage(prompt);
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
      } else {
         return JSON.parse(aiResponse);
      }
    } catch (e) {
      this.logger.error(`AI Extraction failed: ${(e as Error).message}`);
      throw new BadRequestException('Gagal mengekstrak data JSON dari dokumen. Format dokumen mungkin kurang standar.');
    }
  }
}
