import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegulationsService } from './regulations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('regulations (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('regulations')
export class RegulationsController {
  constructor(private readonly regulationsService: RegulationsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new regulation (Admin)' })
  create(@Body() data: any) {
    return this.regulationsService.create(data);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all regulations (Admin)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.regulationsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
    });
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get regulation details (Admin)' })
  findOne(@Param('id') id: string) {
    return this.regulationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a regulation (Admin)' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.regulationsService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a regulation (Admin)' })
  remove(@Param('id') id: string) {
    return this.regulationsService.remove(id);
  }

  @Post(':id/index')
  @Roles('admin')
  @ApiOperation({ summary: 'Trigger Pinecone Indexing for a Regulation (Admin)' })
  triggerIndex(@Param('id') id: string) {
    // Stub implementation for pinecone indexing sync
    return this.regulationsService.triggerIndex(id);
  }
}
