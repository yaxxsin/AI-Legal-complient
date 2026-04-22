import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OssWizardService } from './oss-wizard.service';

@ApiTags('Post-NIB Compliance Roadmap')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('oss-wizard')
export class OssWizardController {
  constructor(private readonly service: OssWizardService) {}

  @Post('activate/:profileId')
  @ApiOperation({ summary: 'Activate NIB and generate compliance roadmap' })
  async activateNib(
    @Param('profileId') profileId: string,
    @Body() body: { nibNumber: string; nibIssuedDate: string; skNumber?: string },
    @Req() req: any,
  ) {
    const data = await this.service.activateNib(profileId, req.user.id, body);
    return { success: true, message: 'Roadmap kepatuhan berhasil dibuat', data };
  }

  @Get('registration/:profileId')
  @ApiOperation({ summary: 'Get compliance roadmap for a profile' })
  async getRegistration(
    @Param('profileId') profileId: string,
    @Req() req: any,
  ) {
    const data = await this.service.getRegistration(profileId, req.user.id);
    return { success: true, data };
  }

  @Get('score/:profileId')
  @ApiOperation({ summary: 'Get compliance score breakdown' })
  async getScore(
    @Param('profileId') profileId: string,
    @Req() req: any,
  ) {
    const data = await this.service.getScore(profileId, req.user.id);
    return { success: true, data };
  }

  @Get('deadlines/:profileId')
  @ApiOperation({ summary: 'Get upcoming tax deadlines (next 60 days)' })
  async getDeadlines(
    @Param('profileId') profileId: string,
    @Req() req: any,
  ) {
    const data = await this.service.getUpcomingDeadlines(profileId, req.user.id);
    return { success: true, data };
  }

  @Patch('step/:stepId')
  @ApiOperation({ summary: 'Update roadmap step status/notes' })
  async updateStep(
    @Param('stepId') stepId: string,
    @Body() body: { status?: string; notes?: string },
    @Req() req: any,
  ) {
    const data = await this.service.updateStep(stepId, req.user.id, body);
    return { success: true, data };
  }

  @Post('step/:stepId/evidence')
  @ApiOperation({ summary: 'Upload evidence document for a step' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Param('stepId') stepId: string,
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const data = await this.service.uploadStepEvidence(stepId, req.user.id, file);
    return { success: true, message: 'Bukti berhasil diunggah', data };
  }

  @Get('evidence/:profileId')
  @ApiOperation({ summary: 'Get all uploaded evidence documents' })
  async getEvidence(
    @Param('profileId') profileId: string,
    @Req() req: any,
  ) {
    const data = await this.service.getEvidenceGallery(profileId, req.user.id);
    return { success: true, data };
  }
}
