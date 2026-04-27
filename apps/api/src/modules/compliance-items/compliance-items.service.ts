import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ComplianceItemsService {
  private readonly logger = new Logger(ComplianceItemsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /** Get compliance items for a specific profile */
  async getItemsByProfile(businessProfileId: string, userId: string) {
    await this.verifyProfileAccess(businessProfileId, userId);
    
    return this.prisma.complianceItem.findMany({
      where: { businessProfileId },
      include: {
        rule: true,
        category: true,
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' }
      ]
    });
  }

  /** Generate compliance items based on the profile's KBLI/Sector */
  async generateChecklist(businessProfileId: string, userId: string) {
    const profile = await this.verifyProfileAccess(businessProfileId, userId);

    const rules = await this.prisma.complianceRule.findMany({
      where: {
        isPublished: true,
        // Wait, for MVP, we will pull all general rules and rules matching the profile sector
        // Right now, if sectorId is empty, we just grab core rules.
        // As a mock/simple matching, we grab all published rules and connect.
      }
    });

    if (rules.length === 0) {
      throw new BadRequestException('No compliance rules found in master data.');
    }

    const newItems = [];
    for (const rule of rules) {
      // Check if it already exists to prevent duplicate
      const exists = await this.prisma.complianceItem.findFirst({
        where: { businessProfileId, ruleId: rule.id }
      });

      if (!exists) {
        newItems.push({
          businessProfileId,
          ruleId: rule.id,
          categoryId: rule.categoryId,
          title: rule.title,
          description: rule.description,
          legalBasis: rule.legalReferences ? (rule.legalReferences as any) : [],
          priority: rule.priority,
          status: 'pending',
        });
      }
    }

    if (newItems.length > 0) {
      await this.prisma.complianceItem.createMany({
        data: newItems
      });
      this.logger.log(`Created ${newItems.length} compliance items for profile ${businessProfileId}`);
    }

    return this.getItemsByProfile(businessProfileId, userId);
  }

  /** Upload evidence file */
  async uploadEvidence(itemId: string, userId: string, file: Express.Multer.File) {
    const item = await this.prisma.complianceItem.findUnique({
      where: { id: itemId },
      include: { businessProfile: true }
    });

    if (!item) {
      throw new NotFoundException('Compliance item not found');
    }

    if (item.businessProfile.userId !== userId) {
      // Free users can upload for their own profile
      throw new ForbiddenException('You do not have access to this compliance item');
    }

    // Minio structure: evidence/{profileId}/{itemId}/{originalname}
    const extName = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
    const objectName = `evidence/${item.businessProfileId}/${item.id}/${Date.now()}.${extName}`;

    // Upload to Minio
    const fileUrl = await this.storageService.uploadFile(objectName, file.buffer, file.mimetype);

    // Update the item status and url
    return this.prisma.complianceItem.update({
      where: { id: itemId },
      data: {
        evidenceUrl: fileUrl,
        status: 'completed',
        completedAt: new Date(),
      }
    });
  }

  private async verifyProfileAccess(businessProfileId: string, userId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
    });
    if (!profile) {
      throw new NotFoundException('Business profile not found');
    }
    if (profile.userId !== userId) {
      throw new ForbiddenException('Access denied to this business profile');
    }
    return profile;
  }
}
