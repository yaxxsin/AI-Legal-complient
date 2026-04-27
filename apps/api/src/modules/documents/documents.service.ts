import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto, GenerateDocumentDto } from './dto';

/** Handlebars-like template renderer: replaces {{key}} with data values */
function renderTemplate(
  html: string,
  data: Record<string, string>,
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || `{{${key}}}`);
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Template CRUD ──────────────────────

  /** List all templates (admin: all, user: published only) */
  async listTemplates(publishedOnly = true) {
    const where = publishedOnly ? { isPublished: true } : {};
    return this.prisma.documentTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        formSchema: true,
        isPublished: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /** Get a single template by id (includes templateHtml) */
  async getTemplate(id: string) {
    const tpl = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });
    if (!tpl) throw new NotFoundException(`Template ${id} not found`);
    return tpl;
  }

  /** Create a new template */
  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.documentTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        templateHtml: dto.templateHtml,
        formSchema: dto.formSchema as object,
        isPublished: dto.isPublished ?? false,
        version: 1,
      },
    });
  }

  /** Update template — auto-increments version */
  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const existing = await this.getTemplate(id);
    const hasContentChange =
      dto.templateHtml !== undefined || dto.formSchema !== undefined;

    return this.prisma.documentTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.templateHtml !== undefined && {
          templateHtml: dto.templateHtml,
        }),
        ...(dto.formSchema !== undefined && {
          formSchema: dto.formSchema as object,
        }),
        ...(dto.isPublished !== undefined && {
          isPublished: dto.isPublished,
        }),
        ...(hasContentChange && { version: existing.version + 1 }),
      },
    });
  }

  /** Delete a template */
  async deleteTemplate(id: string) {
    await this.getTemplate(id);
    return this.prisma.documentTemplate.delete({ where: { id } });
  }

  /** Toggle publish status */
  async togglePublish(id: string) {
    const tpl = await this.getTemplate(id);
    return this.prisma.documentTemplate.update({
      where: { id },
      data: { isPublished: !tpl.isPublished },
    });
  }

  // ── Document Generation ────────────────

  /** Generate a document from a template */
  async generateDocument(userId: string, dto: GenerateDocumentDto) {
    const tpl = await this.getTemplate(dto.templateId);
    const html = renderTemplate(tpl.templateHtml, dto.formData);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const doc = await this.prisma.generatedDocument.create({
      data: {
        userId,
        templateId: dto.templateId,
        businessProfileId: dto.businessProfileId,
        formData: dto.formData as object,
        outputFormat: { html: true },
        expiresAt: expiry,
      },
    });

    this.logger.log(`Document generated: ${doc.id} from template ${tpl.name}`);
    return { ...doc, previewHtml: html };
  }

  /** List generated documents for a user */
  async listGeneratedDocuments(userId: string) {
    return this.prisma.generatedDocument.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      include: { template: { select: { name: true, category: true } } },
    });
  }
}
