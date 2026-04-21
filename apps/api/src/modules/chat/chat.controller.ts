import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

interface ChatRequestDto {
  message: string;
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send message to ComplianceBot' })
  async chat(
    @Body() dto: ChatRequestDto,
    @Req() req: { user: { id: string } },
  ) {
    const reply = await this.chatService.chat(dto.message, req.user.id);
    return { success: true, data: { reply } };
  }
}
