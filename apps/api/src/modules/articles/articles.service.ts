import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

/** Pagination + filter query for articles listing */
interface ArticleListQuery {
  page?: number;
  limit?: number;
  categorySlug?: string;
  search?: string;
  isPublished?: boolean;
}

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List articles with pagination, category filter, and tsvector search */
  async findAll(query: ArticleListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ArticleWhereInput = {
      isPublished: query.isPublished ?? true,
    };

    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /** Get single article by slug — public */
  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug, isPublished: true },
      include: { category: true },
    });

    if (!article) {
      throw new NotFoundException('Artikel tidak ditemukan');
    }

    return article;
  }

  /** Get all categories with article count */
  async findCategories() {
    return this.prisma.articleCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { articles: { where: { isPublished: true } } } },
      },
    });
  }

  // ── Admin CRUD ─────────────────────────────

  /** Admin: create article */
  async create(data: Prisma.ArticleCreateInput) {
    return this.prisma.article.create({
      data,
      include: { category: true },
    });
  }

  /** Admin: update article */
  async update(id: string, data: Prisma.ArticleUpdateInput) {
    const exists = await this.prisma.article.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Artikel tidak ditemukan');
    }

    return this.prisma.article.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  /** Admin: delete article */
  async remove(id: string): Promise<void> {
    const exists = await this.prisma.article.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Artikel tidak ditemukan');
    }

    await this.prisma.article.delete({ where: { id } });
  }

  /** Admin: get article by ID (including unpublished) */
  async findById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!article) {
      throw new NotFoundException('Artikel tidak ditemukan');
    }

    return article;
  }

  /** Admin: create category */
  async createCategory(data: { name: string; slug: string; sortOrder?: number }) {
    return this.prisma.articleCategory.create({ data });
  }
}
