import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BusinessProfilesService } from './business-profiles.service';
import { CreateBusinessProfileDto, UpdateBusinessProfileDto, UpdateStepDto } from './dto';

@ApiTags('business-profiles')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('business-profiles')
export class BusinessProfilesController {
  constructor(private readonly service: BusinessProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Buat profil bisnis baru (check plan limit)' })
  async create(
    @CurrentUser() user: { id: string },
    @Req() req: { dbUser?: { plan: string } },
    @Body() dto: CreateBusinessProfileDto,
  ) {
    const plan = req.dbUser?.plan ?? 'free';
    return this.service.create(user.id, plan, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get semua profil bisnis user' })
  async findAll(@CurrentUser() user: { id: string }) {
    return this.service.findAllByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail profil bisnis' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update profil bisnis (full) + finalize' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateBusinessProfileDto,
  ) {
    return this.service.updateFull(id, user.id, dto);
  }

  @Patch(':id/step')
  @ApiOperation({ summary: 'Auto-save per step onboarding' })
  async updateStep(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateStepDto,
  ) {
    return this.service.updateStep(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus profil bisnis' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    await this.service.remove(id, user.id);
  }
}
