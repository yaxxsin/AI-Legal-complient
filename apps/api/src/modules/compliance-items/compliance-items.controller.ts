import { Controller, Get, Post, Param, Req, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ComplianceItemsService } from './compliance-items.service';

@ApiTags('Compliance Items (Checklists)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compliance-items')
export class ComplianceItemsController {
  constructor(private readonly service: ComplianceItemsService) {}

  @Get('business-profile/:profileId')
  @ApiOperation({ summary: 'Get compliance checklist for a business profile' })
  async getItems(@Param('profileId') profileId: string, @Req() req: any) {
    const data = await this.service.getItemsByProfile(profileId, req.user.id);
    return { success: true, data };
  }

  @Post('generate/:profileId')
  @ApiOperation({ summary: 'Generate compliance checklist based on KBLI' })
  async generateChecklist(@Param('profileId') profileId: string, @Req() req: any) {
    const data = await this.service.generateChecklist(profileId, req.user.id);
    return { success: true, message: 'Checklist updated', data };
  }

  @Post(':itemId/evidence')
  @ApiOperation({ summary: 'Upload evidence (NIB, NPWP, PDF/Image)' })
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Param('itemId') itemId: string,
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB limit
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const data = await this.service.uploadEvidence(itemId, req.user.id, file);
    return { success: true, message: 'File uploaded successfully', data };
  }
}
