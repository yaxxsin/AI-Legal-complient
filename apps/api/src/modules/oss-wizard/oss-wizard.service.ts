import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

/* ──────────────────────────────────────────────
 * Post-NIB Compliance Roadmap Steps
 * User already has NIB + SK from Kemenkumham.
 * This defines "what to do next" obligations.
 * ────────────────────────────────────────────── */

interface RoadmapStepDef {
  stepNumber: number;
  category: 'dokumen' | 'pajak_bulanan' | 'pajak_tahunan';
  title: string;
  description: string;
  isRecurring: boolean;
  deadlineDay?: number;
  deadlineMonth?: number;
}

const ROADMAP_STEPS: RoadmapStepDef[] = [
  // ── Dokumen Wajib (one-time) ──
  {
    stepNumber: 1,
    category: 'dokumen',
    title: 'NPWP Badan Usaha',
    description: 'Pastikan NPWP badan usaha sudah terdaftar di KPP. Upload bukti kartu NPWP.',
    isRecurring: false,
  },
  {
    stepNumber: 2,
    category: 'dokumen',
    title: 'Akta Pendirian & Perubahan Terakhir',
    description: 'Upload akta notaris pendirian perusahaan dan akta perubahan terakhir (jika ada).',
    isRecurring: false,
  },
  {
    stepNumber: 3,
    category: 'dokumen',
    title: 'SK Pengesahan Kemenkumham',
    description: 'Upload Surat Keputusan pengesahan badan hukum dari Kemenkumham.',
    isRecurring: false,
  },
  {
    stepNumber: 4,
    category: 'dokumen',
    title: 'Surat Keterangan Domisili',
    description: 'Upload surat keterangan domisili usaha atau izin lokasi dari kelurahan/kecamatan.',
    isRecurring: false,
  },
  {
    stepNumber: 5,
    category: 'dokumen',
    title: 'BPJS Ketenagakerjaan',
    description: 'Daftarkan perusahaan ke BPJS Ketenagakerjaan jika memiliki karyawan. Upload bukti pendaftaran.',
    isRecurring: false,
  },
  {
    stepNumber: 6,
    category: 'dokumen',
    title: 'BPJS Kesehatan',
    description: 'Daftarkan perusahaan ke BPJS Kesehatan untuk seluruh karyawan. Upload bukti pendaftaran.',
    isRecurring: false,
  },
  {
    stepNumber: 7,
    category: 'dokumen',
    title: 'Izin Usaha Tambahan (Sektor-Spesifik)',
    description: 'Lengkapi izin operasional tambahan sesuai sektor: SIUP, AMDAL/UKL-UPL, Izin PIRT, dll.',
    isRecurring: false,
  },

  // ── Kewajiban Pajak Bulanan (recurring) ──
  {
    stepNumber: 8,
    category: 'pajak_bulanan',
    title: 'PPh Pasal 21 — Pajak Karyawan',
    description: 'Setor dan lapor PPh 21 atas gaji karyawan. Deadline setiap tanggal 10 bulan berikutnya.',
    isRecurring: true,
    deadlineDay: 10,
  },
  {
    stepNumber: 9,
    category: 'pajak_bulanan',
    title: 'PPh Pasal 25 — Angsuran Pajak',
    description: 'Bayar angsuran PPh Badan bulanan. Deadline setiap tanggal 15 bulan berikutnya.',
    isRecurring: true,
    deadlineDay: 15,
  },
  {
    stepNumber: 10,
    category: 'pajak_bulanan',
    title: 'PPN — Pajak Pertambahan Nilai',
    description: 'Lapor dan setor PPN jika PKP. Deadline setiap akhir bulan berikutnya.',
    isRecurring: true,
    deadlineDay: 30,
  },

  // ── Kewajiban Pajak Tahunan (recurring) ──
  {
    stepNumber: 11,
    category: 'pajak_tahunan',
    title: 'PPh Badan (Pasal 29)',
    description: 'Bayar kekurangan pajak penghasilan badan tahunan. Deadline 30 April.',
    isRecurring: true,
    deadlineDay: 30,
    deadlineMonth: 4,
  },
  {
    stepNumber: 12,
    category: 'pajak_tahunan',
    title: 'SPT Tahunan PPh Badan',
    description: 'Lapor SPT Tahunan PPh Badan ke DJP Online. Deadline 30 April.',
    isRecurring: true,
    deadlineDay: 30,
    deadlineMonth: 4,
  },
  {
    stepNumber: 13,
    category: 'pajak_tahunan',
    title: 'Laporan Keuangan Tahunan',
    description: 'Susun dan submit laporan keuangan tahunan (Neraca, Laba Rugi). Wajib untuk PT.',
    isRecurring: true,
    deadlineDay: 30,
    deadlineMonth: 6,
  },
];

@Injectable()
export class OssWizardService {
  private readonly logger = new Logger(OssWizardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Activate NIB — creates roadmap for this profile */
  async activateNib(
    businessProfileId: string,
    userId: string,
    data: { nibNumber: string; nibIssuedDate: string; skNumber?: string },
  ) {
    const profile = await this.verifyProfileAccess(businessProfileId, userId);

    const existing = await this.prisma.ossRegistration.findUnique({
      where: { businessProfileId },
    });

    if (existing) {
      // Update NIB info if already created
      return this.prisma.ossRegistration.update({
        where: { id: existing.id },
        data: {
          nibNumber: data.nibNumber,
          nibIssuedDate: new Date(data.nibIssuedDate),
          skNumber: data.skNumber,
        },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
    }

    const now = new Date();
    const currentMonthPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYearPeriod = `${now.getFullYear()}`;

    const registration = await this.prisma.ossRegistration.create({
      data: {
        businessProfileId,
        status: 'in_progress',
        currentStep: 1,
        nibNumber: data.nibNumber,
        nibIssuedDate: new Date(data.nibIssuedDate),
        skNumber: data.skNumber,
        steps: {
          create: ROADMAP_STEPS.map((step) => ({
            stepNumber: step.stepNumber,
            category: step.category,
            title: step.title,
            description: step.description,
            status: 'pending',
            isRecurring: step.isRecurring,
            deadlineDay: step.deadlineDay,
            deadlineMonth: step.deadlineMonth,
            currentPeriod: step.isRecurring
              ? (step.category === 'pajak_tahunan' ? currentYearPeriod : currentMonthPeriod)
              : null,
          })),
        },
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });

    // Calculate initial score
    await this.recalculateScore(registration.id);

    this.logger.log(`NIB activated for profile ${businessProfileId}: ${data.nibNumber}`);

    return this.getRegistration(businessProfileId, userId);
  }

  /** Get roadmap with score */
  async getRegistration(businessProfileId: string, userId: string) {
    await this.verifyProfileAccess(businessProfileId, userId);

    const registration = await this.prisma.ossRegistration.findUnique({
      where: { businessProfileId },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
        businessProfile: {
          select: { businessName: true, entityType: true, hasNib: true, nibNumber: true },
        },
      },
    });

    if (!registration) {
      return null; // Not activated yet
    }

    return registration;
  }

  /** Get compliance score breakdown */
  async getScore(businessProfileId: string, userId: string) {
    await this.verifyProfileAccess(businessProfileId, userId);

    const reg = await this.prisma.ossRegistration.findUnique({
      where: { businessProfileId },
      include: { steps: true },
    });

    if (!reg) {
      return { score: 0, total: 0, completed: 0, breakdown: [] };
    }

    const breakdown = this.buildScoreBreakdown(reg.steps);

    return {
      score: reg.complianceScore,
      total: reg.steps.length,
      completed: reg.steps.filter((s) => s.status === 'completed').length,
      breakdown,
    };
  }

  /** Build score breakdown by category */
  private buildScoreBreakdown(steps: any[]) {
    const categories = ['dokumen', 'pajak_bulanan', 'pajak_tahunan'];
    return categories.map((cat) => {
      const catSteps = steps.filter((s) => s.category === cat);
      const completed = catSteps.filter((s) => s.status === 'completed').length;
      const total = catSteps.length;
      return {
        category: cat,
        label: this.categoryLabel(cat),
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }

  /** Human-readable category name */
  private categoryLabel(cat: string): string {
    const labels: Record<string, string> = {
      dokumen: 'Kelengkapan Dokumen',
      pajak_bulanan: 'Pajak Bulanan',
      pajak_tahunan: 'Pajak Tahunan',
    };
    return labels[cat] ?? cat;
  }

  /** Update step status */
  async updateStep(
    stepId: string,
    userId: string,
    data: { status?: string; notes?: string },
  ) {
    const step = await this.findStepWithAuth(stepId, userId);

    const updated = await this.prisma.ossStep.update({
      where: { id: stepId },
      data: {
        status: data.status ?? step.status,
        notes: data.notes ?? step.notes,
        completedAt: data.status === 'completed' ? new Date() : step.completedAt,
      },
    });

    await this.recalculateScore(step.registrationId);
    return updated;
  }

  /** Upload evidence for a step */
  async uploadStepEvidence(
    stepId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const step = await this.findStepWithAuth(stepId, userId);

    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
    const profileId = step.registration.businessProfileId;
    const objectName = `oss/${profileId}/${step.stepNumber}/${Date.now()}.${ext}`;

    const fileUrl = await this.storageService.uploadFile(
      objectName,
      file.buffer,
      file.mimetype,
    );

    const updated = await this.prisma.ossStep.update({
      where: { id: stepId },
      data: {
        evidenceUrl: fileUrl,
        evidenceFileName: file.originalname,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    await this.recalculateScore(step.registrationId);
    this.logger.log(`Evidence uploaded for step ${step.stepNumber} (${profileId})`);
    return updated;
  }

  /** Get all evidence gallery */
  async getEvidenceGallery(businessProfileId: string, userId: string) {
    await this.verifyProfileAccess(businessProfileId, userId);

    return this.prisma.ossStep.findMany({
      where: {
        registration: { businessProfileId },
        evidenceUrl: { not: null },
      },
      orderBy: { stepNumber: 'asc' },
      select: {
        id: true,
        stepNumber: true,
        category: true,
        title: true,
        evidenceUrl: true,
        evidenceFileName: true,
        completedAt: true,
      },
    });
  }

  /** Get upcoming tax deadlines (next 60 days) */
  async getUpcomingDeadlines(businessProfileId: string, userId: string) {
    await this.verifyProfileAccess(businessProfileId, userId);

    const reg = await this.prisma.ossRegistration.findUnique({
      where: { businessProfileId },
      include: { steps: { where: { isRecurring: true }, orderBy: { stepNumber: 'asc' } } },
    });

    if (!reg) return [];

    const now = new Date();
    const deadlines: Array<{
      stepId: string;
      title: string;
      category: string;
      deadlineDate: string;
      daysUntil: number;
      status: string;
    }> = [];

    for (const step of reg.steps) {
      const nextDeadline = this.calcNextDeadline(step, now);
      if (!nextDeadline) continue;

      const diffMs = nextDeadline.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysUntil <= 60) {
        deadlines.push({
          stepId: step.id,
          title: step.title,
          category: step.category,
          deadlineDate: nextDeadline.toISOString().split('T')[0],
          daysUntil,
          status: step.status,
        });
      }
    }

    return deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  /** Calculate next deadline date for a recurring step */
  private calcNextDeadline(step: any, now: Date): Date | null {
    if (!step.deadlineDay) return null;

    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    if (step.category === 'pajak_tahunan' && step.deadlineMonth) {
      // Annual: deadline is deadlineMonth/deadlineDay
      let deadlineDate = new Date(year, step.deadlineMonth - 1, step.deadlineDay);
      if (deadlineDate < now) {
        deadlineDate = new Date(year + 1, step.deadlineMonth - 1, step.deadlineDay);
      }
      return deadlineDate;
    }

    // Monthly: deadline is next month's deadlineDay
    let deadlineDate = new Date(year, month + 1, step.deadlineDay);
    if (deadlineDate < now) {
      deadlineDate = new Date(year, month + 2, step.deadlineDay);
    }
    return deadlineDate;
  }

  /** Recalculate and persist compliance score */
  private async recalculateScore(registrationId: string) {
    const steps = await this.prisma.ossStep.findMany({
      where: { registrationId },
    });

    const completed = steps.filter((s) => s.status === 'completed').length;
    const total = steps.length;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;
    const allDone = completed === total;

    const nextStep = steps
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .find((s) => s.status !== 'completed' && s.status !== 'skipped');

    await this.prisma.ossRegistration.update({
      where: { id: registrationId },
      data: {
        complianceScore: score,
        status: allDone ? 'completed' : completed > 0 ? 'in_progress' : 'not_started',
        currentStep: nextStep?.stepNumber ?? total,
        completedAt: allDone ? new Date() : null,
      },
    });
  }

  /** Find step and verify ownership */
  private async findStepWithAuth(stepId: string, userId: string) {
    const step = await this.prisma.ossStep.findUnique({
      where: { id: stepId },
      include: { registration: { include: { businessProfile: true } } },
    });

    if (!step) {
      throw new NotFoundException('Langkah tidak ditemukan.');
    }

    if (step.registration.businessProfile.userId !== userId) {
      throw new ForbiddenException('Akses ditolak.');
    }

    return step;
  }

  /** Verify the user owns the business profile */
  private async verifyProfileAccess(businessProfileId: string, userId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
    });

    if (!profile) {
      throw new NotFoundException('Profil bisnis tidak ditemukan.');
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException('Akses ditolak ke profil bisnis ini.');
    }

    return profile;
  }

  /* ──────────────────────────────────────────────
   * CRON: Daily tax deadline reminders (08:00 WIB = 01:00 UTC)
   * Sends notifications for H-7 and H-1 deadlines.
   * ────────────────────────────────────────────── */
  @Cron('0 1 * * *', { name: 'tax-deadline-reminders' })
  async sendTaxDeadlineReminders() {
    this.logger.log('Running tax deadline reminder cron...');

    const registrations = await this.prisma.ossRegistration.findMany({
      where: { status: { not: 'not_started' } },
      include: {
        steps: { where: { isRecurring: true } },
        businessProfile: { select: { userId: true, businessName: true } },
      },
    });

    const now = new Date();
    const notifications: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      actionUrl: string;
    }> = [];

    for (const reg of registrations) {
      for (const step of reg.steps) {
        const nextDeadline = this.calcNextDeadline(step, now);
        if (!nextDeadline) continue;

        const diffMs = nextDeadline.getTime() - now.getTime();
        const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysUntil === 7 || daysUntil === 1) {
          const urgency = daysUntil === 1 ? '🔴 BESOK' : '🟡 7 Hari Lagi';
          const deadlineStr = nextDeadline.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
          });

          notifications.push({
            userId: reg.businessProfile.userId,
            type: 'tax_deadline',
            title: `${urgency}: ${step.title}`,
            body: `Deadline ${step.title} untuk "${reg.businessProfile.businessName}" jatuh pada ${deadlineStr}. Segera selesaikan kewajiban ini.`,
            actionUrl: '/oss-wizard',
          });
        }
      }
    }

    if (notifications.length > 0) {
      await this.notificationsService.createBatch(notifications);
      this.logger.log(`Sent ${notifications.length} tax deadline reminders.`);
    } else {
      this.logger.log('No tax deadlines approaching. No reminders sent.');
    }
  }
}
