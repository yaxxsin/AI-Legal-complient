import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateTemplateDto, UpdateTemplateDto, GenerateDocumentDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../common/decorators/feature-flag.decorator';
import { UsageLimitService } from '../billing/usage-limits.service';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('menu-documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly usageLimits: UsageLimitService,
  ) {}

  // ── Templates (User) ──────────────────

  /** List published templates for end users */
  @Get('templates')
  async listTemplates() {
    return this.documentsService.listTemplates(true);
  }

  /** Get single template detail */
  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.documentsService.getTemplate(id);
  }

  // ── Templates (Admin) ─────────────────

  /** List all templates including unpublished (admin) */
  @Get('admin/templates')
  async adminListTemplates() {
    return this.documentsService.listTemplates(false);
  }

  /** Create a new template (admin) */
  @Post('admin/templates')
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.documentsService.createTemplate(dto);
  }

  /** Update a template (admin) — auto version bump */
  @Put('admin/templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.documentsService.updateTemplate(id, dto);
  }

  /** Toggle publish/unpublish (admin) */
  @Patch('admin/templates/:id/publish')
  async togglePublish(@Param('id') id: string) {
    return this.documentsService.togglePublish(id);
  }

  /** Delete a template (admin) */
  @Delete('admin/templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.documentsService.deleteTemplate(id);
  }

  // ── Document Generation ────────────────

  /** Generate a document from template + form data */
  @Post('generate')
  async generateDocument(
    @Req() req: { user: { id: string; plan: string } },
    @Body() dto: GenerateDocumentDto,
  ) {
    // Enforce document generation limit per plan
    await this.usageLimits.checkDocumentLimit(req.user.id, req.user.plan);
    return this.documentsService.generateDocument(req.user.id, dto);
  }

  /** List user's generated documents */
  @Get('history')
  async listHistory(@Req() req: { user: { id: string } }) {
    return this.documentsService.listGeneratedDocuments(req.user.id);
  }
}
