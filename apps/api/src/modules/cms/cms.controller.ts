import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('cms')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('pages')
  async createPage(@Body() data: { title: string; slug: string; metaDescription?: string; isPublished?: boolean }) {
    return this.cmsService.createPage(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('pages/:id')
  async deletePage(@Param('id') id: string) {
    return this.cmsService.deletePage(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('pages')
  async getAllPages() {
    return this.cmsService.getAllPages();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('pages/:id')
  async getPageById(@Param('id') id: string) {
    return this.cmsService.getPageById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('pages/:id')
  async updatePage(@Param('id') id: string, @Body() data: any) {
    return this.cmsService.updatePage(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('pages/:id/sections')
  async updateSections(@Param('id') id: string, @Body() body: { sections: any[] }) {
    return this.cmsService.updateSections(id, body.sections || []);
  }
}
