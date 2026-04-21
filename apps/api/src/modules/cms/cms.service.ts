import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  /** Fetch published page by slug, including sorted active sections */
  async getPublicPage(slug: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page || !page.isPublished) {
      throw new NotFoundException(`Page with slug '${slug}' not found or not published.`);
    }

    return page;
  }

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================

  async getAllPages() {
    return this.prisma.cmsPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sections: true },
        },
      },
    });
  }

  async getPageById(id: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) throw new NotFoundException('CMS Page not found');
    return page;
  }

  async updatePage(id: string, data: any) {
    return this.prisma.cmsPage.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        metaDescription: data.metaDescription,
        isPublished: data.isPublished,
      },
    });
  }

  /** Bulk update/upsert sections for a page */
  async updateSections(pageId: string, sections: any[]) {
    // We do this in a transaction:
    // 1. Delete all existing sections for the page
    // 2. Create the new ones based on the order and content passed from frontend
    return this.prisma.$transaction(async (tx) => {
      await tx.cmsSection.deleteMany({
        where: { pageId },
      });

      const creations = sections.map((sec, index) => {
        return tx.cmsSection.create({
          data: {
            pageId,
            type: sec.type,
            sortOrder: index + 1,
            content: sec.content,
            isActive: sec.isActive ?? true,
          },
        });
      });

      return Promise.all(creations);
    });
  }
}
