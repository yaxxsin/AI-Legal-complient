import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// ── Public endpoints (no auth) ─────────────

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'List published articles (public)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') categorySlug?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.articlesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      categorySlug,
      search,
    });

    return { success: true, ...result };
  }

  @Get('categories')
  @ApiOperation({ summary: 'List article categories (public)' })
  async findCategories() {
    const data = await this.articlesService.findCategories();
    return { success: true, data };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get article by slug (public)' })
  async findBySlug(@Param('slug') slug: string) {
    const data = await this.articlesService.findBySlug(slug);
    return { success: true, data };
  }
}

// ── Admin endpoints (auth required) ────────

@ApiTags('admin-articles')
@UseGuards(JwtAuthGuard)
@Controller('admin/articles')
export class AdminArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'List all articles (admin, includes unpublished)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') categorySlug?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.articlesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      categorySlug,
      search,
      isPublished: undefined, // show all
    });

    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by ID (admin)' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.articlesService.findById(id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create article' })
  async create(@Body() body: {
    title: string;
    slug: string;
    body: string;
    categoryId: string;
    tags?: string[];
    metaDescription: string;
    readTimeMinutes?: number;
    isPublished?: boolean;
    author: string;
  }) {
    const data = await this.articlesService.create({
      title: body.title,
      slug: body.slug,
      body: body.body,
      category: { connect: { id: body.categoryId } },
      tags: body.tags ?? [],
      metaDescription: body.metaDescription,
      readTimeMinutes: body.readTimeMinutes,
      isPublished: body.isPublished ?? false,
      publishedAt: body.isPublished ? new Date() : null,
      author: body.author,
    });

    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update article' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      title?: string;
      slug?: string;
      body?: string;
      categoryId?: string;
      tags?: string[];
      metaDescription?: string;
      readTimeMinutes?: number;
      isPublished?: boolean;
      author?: string;
    },
  ) {
    const updateData: Record<string, unknown> = { ...body };

    if (body.categoryId) {
      updateData.category = { connect: { id: body.categoryId } };
      delete updateData.categoryId;
    }

    if (body.isPublished === true) {
      updateData.publishedAt = new Date();
    }

    const data = await this.articlesService.update(id, updateData);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete article' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.articlesService.remove(id);
    return { success: true, data: null };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create article category' })
  async createCategory(@Body() body: { name: string; slug: string; sortOrder?: number }) {
    const data = await this.articlesService.createCategory(body);
    return { success: true, data };
  }
}
