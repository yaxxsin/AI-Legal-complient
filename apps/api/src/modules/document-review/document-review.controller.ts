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

@ApiTags('document-review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('document-review')
export class DocumentReviewController {
  constructor(private readonly reviewService: DocumentReviewService) {}

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
    return this.reviewService.queueForReview(req.user.sub, file);
  }

  @Get(':id')
  async getReviewStatus(@Req() req: any, @Param('id') id: string) {
    return this.reviewService.getReviewStatus(id, req.user.sub);
  }
}
