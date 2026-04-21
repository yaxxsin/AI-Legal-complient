import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1/cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ==========================================
  // PUBLIC ENDPOINTS (No Auth Required)
  // ==========================================

  @Get('public/pages/:slug')
  async getPublicPage(@Param('slug') slug: string) {
    return this.cmsService.getPublicPage(slug);
  }

  // ==========================================
  // ADMIN ENDPOINTS (Auth & 'ADMIN' Role Required)
  // ==========================================

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('pages')
  async getAllPages() {
    return this.cmsService.getAllPages();
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('pages/:id')
  async getPageById(@Param('id') id: string) {
    return this.cmsService.getPageById(id);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('pages/:id')
  async updatePage(@Param('id') id: string, @Body() data: any) {
    return this.cmsService.updatePage(id, data);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('pages/:id/sections')
  async updateSections(@Param('id') id: string, @Body() body: { sections: any[] }) {
    return this.cmsService.updateSections(id, body.sections || []);
  }
}
