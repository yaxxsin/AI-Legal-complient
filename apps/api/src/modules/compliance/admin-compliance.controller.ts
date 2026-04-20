import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { CreateRuleDto, UpdateRuleDto } from './dto';

@ApiTags('Admin — Compliance Rules')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('admin/compliance-rules')
export class AdminComplianceController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a compliance rule' })
  async create(@Body() dto: CreateRuleDto) {
    return this.prisma.complianceRule.create({
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        priority: dto.priority,
        conditions: dto.conditions as object,
        legalReferences: dto.legalReferences as object[],
        dueDateLogic: dto.dueDateLogic as object | undefined,
        guidanceText: dto.guidanceText,
        isPublished: dto.isPublished ?? true,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : undefined,
      },
      include: { category: true },
    });
  }

  @Get()
  @ApiOperation({ summary: 'List compliance rules (paginated)' })
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('categoryId') categoryId?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = categoryId ? { categoryId } : {};

    const [items, total] = await Promise.all([
      this.prisma.complianceRule.findMany({
        where,
        include: { category: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.complianceRule.count({ where }),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get compliance rule detail' })
  async getOne(@Param('id') id: string) {
    return this.prisma.complianceRule.findUniqueOrThrow({
      where: { id },
      include: { category: true },
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a compliance rule' })
  async update(@Param('id') id: string, @Body() dto: UpdateRuleDto) {
    // Build update data — only include defined fields
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.conditions !== undefined) data.conditions = dto.conditions;
    if (dto.legalReferences !== undefined) data.legalReferences = dto.legalReferences;
    if (dto.dueDateLogic !== undefined) data.dueDateLogic = dto.dueDateLogic;
    if (dto.guidanceText !== undefined) data.guidanceText = dto.guidanceText;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (dto.effectiveFrom) data.effectiveFrom = new Date(dto.effectiveFrom);

    return this.prisma.complianceRule.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      include: { category: true },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete (unpublish) a compliance rule' })
  async remove(@Param('id') id: string) {
    return this.prisma.complianceRule.update({
      where: { id },
      data: { isPublished: false },
    });
  }
}

@ApiTags('Admin — Compliance Categories')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('admin/compliance-categories')
export class AdminComplianceCategoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List compliance categories' })
  async list() {
    return this.prisma.complianceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { rules: true } } },
    });
  }
}
