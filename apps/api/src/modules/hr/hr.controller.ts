import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../common/decorators/feature-flag.decorator';

@ApiTags('hr-compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('menu-hr')
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post('calculate-bpjs')
  @ApiOperation({ summary: 'Calculate BPJS contributions' })
  calculateBpjs(
    @Body() dto: { 
      baseSalary: number; 
      allowances: number; 
      jkkRiskLevel: 'sangat_rendah' | 'rendah' | 'sedang' | 'tinggi' | 'sangat_tinggi';
    }
  ) {
    return this.hrService.calculateBpjs(dto);
  }

  @Post('calculate-severance')
  @ApiOperation({ summary: 'Calculate employee severance based on PP 35/2021' })
  calculateSeverance(
    @Body() dto: {
      salary: number;
      yearsOfService: number;
      monthsOfService: number;
      reasonId: 'phk_efisiensi' | 'phk_merugi' | 'resign' | 'pensiun' | 'meninggal' | 'pelanggaran';
    }
  ) {
    return this.hrService.calculateSeverance(dto);
  }
}
