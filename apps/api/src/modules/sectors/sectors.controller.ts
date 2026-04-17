import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SectorsService } from './sectors.service';

@ApiTags('sectors')
@Controller('sectors')
export class SectorsController {
  constructor(private readonly service: SectorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get daftar sektor industri (root level)' })
  async findAll() {
    return this.service.findRootSectors();
  }

  @Get(':id/sub-sectors')
  @ApiOperation({ summary: 'Get sub-sektor dari sektor tertentu' })
  async findSubSectors(@Param('id') id: string) {
    return this.service.findSubSectors(id);
  }
}
