import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('feature-flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get active feature flags (no auth required)' })
  findActive() {
    return this.featureFlagsService.findActive();
  }

  // Admin endpoints
  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a feature flag (Admin)' })
  create(@Body() data: any) {
    return this.featureFlagsService.create(data);
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List all feature flags (Admin)' })
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get feature flag details (Admin)' })
  findOne(@Param('id') id: string) {
    return this.featureFlagsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update a feature flag (Admin)' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.featureFlagsService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a feature flag (Admin)' })
  remove(@Param('id') id: string) {
    return this.featureFlagsService.remove(id);
  }
}
