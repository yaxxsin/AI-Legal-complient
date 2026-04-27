import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentReviewService } from './document-review.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../common/decorators/feature-flag.decorator';
import { UsageLimitService } from '../billing/usage-limits.service';

@ApiTags('document-review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('menu-doc-review')
@Controller('document-review')
export class DocumentReviewController {
  constructor(
    private readonly reviewService: DocumentReviewService,
    private readonly usageLimits: UsageLimitService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadDocument(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    // Enforce review limit per plan
    await this.usageLimits.checkReviewLimit(req.user.id, req.user.plan);
    return this.reviewService.queueForReview(req.user.id, file);
  }

  @Get(':id')
  async getReviewStatus(@Req() req: any, @Param('id') id: string) {
    return this.reviewService.getReviewStatus(id, req.user.sub);
  }
}
