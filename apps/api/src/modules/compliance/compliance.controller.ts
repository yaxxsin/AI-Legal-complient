import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { ComplianceService } from './compliance.service';
import { UpdateItemStatusDto } from './dto';

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('generate/:profileId')
  @ApiOperation({ summary: 'Generate checklist for a business profile' })
  async generate(@Param('profileId') profileId: string) {
    return this.complianceService.generateChecklist(profileId);
  }

  @Get(':profileId')
  @ApiOperation({ summary: 'Get checklist grouped by category' })
  async getChecklist(@Param('profileId') profileId: string) {
    return this.complianceService.getChecklist(profileId);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update compliance item status' })
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemStatusDto,
    @Req() req: { user?: { id: string } },
  ) {
    const userId = req.user?.id ?? 'dev-user-001';
    return this.complianceService.updateItemStatus(
      itemId,
      dto.status,
      userId,
      dto.notes,
      dto.evidenceUrl,
    );
  }

  @Get(':profileId/score')
  @ApiOperation({ summary: 'Calculate and get compliance score' })
  async getScore(@Param('profileId') profileId: string) {
    return this.complianceService.calculateScore(profileId);
  }
}
