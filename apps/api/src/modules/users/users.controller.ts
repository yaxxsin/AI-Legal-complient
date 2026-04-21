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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (requires old password)' })
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      user.id,
      dto.oldPassword,
      dto.newPassword,
    );
    return { message: 'Password berhasil diubah' };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete account (soft delete)' })
  async deleteAccount(
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    await this.usersService.softDeleteAccount(user.id);
  }

  // =====================================
  // ADMIN ENDPOINTS
  // =====================================

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
    });
  }

  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Change user role, e.g. "banned", "admin", "user"' })
  async updateRole(
    @Param('id') userId: string,
    @Body('role') role: string,
  ) {
    return this.usersService.updateRole(userId, role);
  }
}
