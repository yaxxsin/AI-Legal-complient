import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications (paginated)' })
  async list(
    @Req() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
  ) {
    return this.service.list({
      userId: req.user.id,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@Req() req: { user: { id: string } }) {
    const count = await this.service.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.service.markAsRead(id, req.user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: { user: { id: string } }) {
    return this.service.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.service.delete(id, req.user.id);
  }
}
