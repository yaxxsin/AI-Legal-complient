import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/** Condition rule for matching business profiles */
interface ConditionRule {
  field: string;
  op: string;
  value: unknown;
}

/** Top-level condition with AND/OR combinator */
interface RuleCondition {
  operator: 'AND' | 'OR';
  rules: ConditionRule[];
}

/** Profile data used for condition evaluation */
interface ProfileData {
  entityType: string;
  employeeCount: number;
  annualRevenue: string | null;
  sectorId: string | null;
  hasNib: boolean;
  isOnlineBusiness: boolean;
  province: string | null;
  city: string | null;
  [key: string]: unknown;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate checklist items for a business profile
   * by matching published rules against profile data.
   */
  async generateChecklist(profileId: string): Promise<{
    generated: number;
    skipped: number;
  }> {
    const profile = await this.prisma.businessProfile
      .findUnique({ where: { id: profileId } })
      .catch(() => null);

    if (!profile) {
      throw new NotFoundException('Business profile not found');
    }

    const rules = await this.prisma.complianceRule
      .findMany({
        where: { isPublished: true },
        include: { category: true },
      })
      .catch(() => [] as never[]);

    const existing = await this.prisma.complianceItem
      .findMany({
        where: { businessProfileId: profileId },
        select: { ruleId: true },
      })
      .catch(() => [] as { ruleId: string }[]);

    const existingRuleIds = new Set(existing.map((e) => e.ruleId));

    const profileData: ProfileData = {
      entityType: profile.entityType,
      employeeCount: profile.employeeCount,
      annualRevenue: profile.annualRevenue,
      sectorId: profile.sectorId,
      hasNib: profile.hasNib,
      isOnlineBusiness: profile.isOnlineBusiness,
      province: profile.province,
      city: profile.city,
    };

    let generated = 0;
    let skipped = 0;

    for (const rule of rules) {
      if (existingRuleIds.has(rule.id)) {
        skipped++;
        continue;
      }

      const matches = this.evaluateCondition(
        rule.conditions as unknown as RuleCondition,
        profileData,
      );

      if (matches) {
        await this.prisma.complianceItem
          .create({
            data: {
              businessProfileId: profileId,
              ruleId: rule.id,
              categoryId: rule.categoryId,
              title: rule.title,
              description: rule.description,
              legalBasis: rule.legalReferences as object,
              priority: rule.priority,
              status: 'pending',
            },
          })
          .catch((err) => {
            this.logger.warn(`Failed to create item: ${err.message}`);
          });
        generated++;
      }
    }

    this.logger.log(
      `Checklist generated for ${profileId}: ${generated} new, ${skipped} skipped`,
    );
    return { generated, skipped };
  }

  /**
   * Pure function: evaluate rule conditions against profile
   */
  evaluateCondition(
    conditions: RuleCondition | null,
    profile: ProfileData,
  ): boolean {
    if (!conditions || !conditions.rules?.length) {
      return true; // No conditions = applies to all
    }

    const results = conditions.rules.map((rule) =>
      this.evaluateSingle(rule, profile),
    );

    return conditions.operator === 'OR'
      ? results.some(Boolean)
      : results.every(Boolean);
  }

  private evaluateSingle(
    rule: ConditionRule,
    profile: ProfileData,
  ): boolean {
    const fieldValue = (profile as Record<string, unknown>)[rule.field];

    switch (rule.op) {
      case 'eq':
        return fieldValue === rule.value;
      case 'neq':
        return fieldValue !== rule.value;
      case 'gt':
        return Number(fieldValue) > Number(rule.value);
      case 'gte':
        return Number(fieldValue) >= Number(rule.value);
      case 'lt':
        return Number(fieldValue) < Number(rule.value);
      case 'lte':
        return Number(fieldValue) <= Number(rule.value);
      case 'in':
        return Array.isArray(rule.value)
          ? rule.value.includes(fieldValue)
          : false;
      case 'contains':
        return typeof fieldValue === 'string'
          ? fieldValue.includes(String(rule.value))
          : false;
      case 'exists':
        return fieldValue != null && fieldValue !== '';
      default:
        this.logger.warn(`Unknown op: ${rule.op}`);
        return false;
    }
  }

  /**
   * Get checklist items grouped by category
   */
  async getChecklist(profileId: string) {
    const items = await this.prisma.complianceItem
      .findMany({
        where: { businessProfileId: profileId },
        include: { category: true, rule: true },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { priority: 'asc' },
        ],
      })
      .catch(() => [] as never[]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grouped: Record<string, { category: { id: string; name: string; icon: string | null }; items: any[] }> = {};

    for (const item of items) {
      const catId = (item as any).categoryId;
      if (!grouped[catId]) {
        grouped[catId] = {
          category: {
            id: (item as any).category.id,
            name: (item as any).category.name,
            icon: (item as any).category.icon,
          },
          items: [],
        };
      }
      grouped[catId].items.push(item);
    }

    return Object.values(grouped);
  }

  /**
   * Update compliance item status + create audit log
   */
  async updateItemStatus(
    itemId: string,
    status: string,
    userId: string,
    notes?: string,
    evidenceUrl?: string,
  ) {
    const item = await this.prisma.complianceItem
      .findUnique({ where: { id: itemId } })
      .catch(() => null);

    if (!item) {
      throw new NotFoundException('Compliance item not found');
    }

    const oldStatus = item.status;

    const updated = await this.prisma.complianceItem.update({
      where: { id: itemId },
      data: {
        status,
        notes: notes ?? item.notes,
        evidenceUrl: evidenceUrl ?? item.evidenceUrl,
        completedAt: status === 'completed' ? new Date() : null,
      },
    });

    await this.prisma.complianceItemAudit
      .create({
        data: {
          complianceItemId: itemId,
          oldStatus,
          newStatus: status,
          notes: notes ?? null,
          changedBy: userId,
        },
      })
      .catch((err) => {
        this.logger.warn(`Audit log failed: ${err.message}`);
      });

    return updated;
  }

  /**
   * Calculate compliance score for a business profile
   */
  async calculateScore(profileId: string) {
    const items = await this.prisma.complianceItem
      .findMany({
        where: { businessProfileId: profileId },
        include: { category: true },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch(() => [] as any[]);

    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const notApplicable = items.filter(
      (i) => i.status === 'not_applicable',
    ).length;
    const applicable = total - notApplicable;
    const score = applicable > 0
      ? Math.round((completed / applicable) * 1000) / 10
      : 0;

    const criticalPending = items.filter(
      (i) => i.priority === 'critical' && i.status === 'pending',
    ).length;

    // Category breakdown
    const catMap: Record<string, { total: number; done: number; name: string }> = {};
    for (const item of items) {
      const cid = item.categoryId;
      if (!catMap[cid]) {
        catMap[cid] = { total: 0, done: 0, name: item.category.name };
      }
      if (item.status !== 'not_applicable') {
        catMap[cid].total++;
        if (item.status === 'completed') catMap[cid].done++;
      }
    }

    const categoryScores = Object.entries(catMap).map(([id, data]) => ({
      categoryId: id,
      name: data.name,
      score: data.total > 0
        ? Math.round((data.done / data.total) * 1000) / 10
        : 0,
      completed: data.done,
      total: data.total,
    }));

    // Save score history
    await this.prisma.complianceScoreHistory
      .create({
        data: {
          businessProfileId: profileId,
          overallScore: score,
          categoryScores: categoryScores,
          totalItems: applicable,
          completedItems: completed,
          criticalPending,
        },
      })
      .catch((err) => {
        this.logger.warn(`Score history save failed: ${err.message}`);
      });

    return {
      overallScore: score,
      totalItems: applicable,
      completedItems: completed,
      criticalPending,
      categoryScores,
    };
  }
}
