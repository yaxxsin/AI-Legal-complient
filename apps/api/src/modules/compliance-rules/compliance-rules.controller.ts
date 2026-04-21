import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComplianceRulesService } from './compliance-rules.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('compliance-rules (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance-rules')
export class ComplianceRulesController {
  constructor(private readonly complianceRulesService: ComplianceRulesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new compliance rule (Admin)' })
  create(@Body() data: any) {
    return this.complianceRulesService.create(data);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all compliance rules (Admin)' })
  findAll() {
    return this.complianceRulesService.findAll();
  }

  @Get('categories')
  @Roles('admin')
  @ApiOperation({ summary: 'List all categories (Admin)' })
  findAllCategories() {
    return this.complianceRulesService.findAllCategories();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get compliance rule details (Admin)' })
  findOne(@Param('id') id: string) {
    return this.complianceRulesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a compliance rule (Admin)' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.complianceRulesService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a compliance rule (Admin)' })
  remove(@Param('id') id: string) {
    return this.complianceRulesService.remove(id);
  }
}
