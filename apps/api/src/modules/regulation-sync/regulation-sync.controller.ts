import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegulationSyncService } from './regulation-sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('regulation-sync (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('regulation-sync')
export class RegulationSyncController {
  constructor(private readonly syncService: RegulationSyncService) {}

  @Post('trigger')
  @Roles('admin')
  @ApiOperation({ summary: 'Manually trigger regulation sync from all sources' })
  async triggerSync() {
    const results = await this.syncService.triggerManualSync();
    return { message: 'Sync completed', results };
  }

  @Get('history')
  @Roles('admin')
  @ApiOperation({ summary: 'Get regulation sync history log' })
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.syncService.getSyncHistory(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
