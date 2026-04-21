import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../common/decorators/feature-flag.decorator';
import { ChatService } from './chat.service';

interface ChatRequestDto {
  message: string;
  conversationId?: string;
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('menu-chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversation history' })
  async getConversations(@Req() req: { user: { id: string } }) {
    const data = await this.chatService.listConversations(req.user.id);
    return { success: true, data };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get specific conversation details' })
  async getConversationDetails(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    const data = await this.chatService.getConversation(id, req.user.id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Send message to ComplianceBot' })
  async chat(
    @Body() dto: ChatRequestDto,
    @Req() req: { user: { id: string } },
  ) {
    const result = await this.chatService.chat(dto.message, req.user.id, dto.conversationId);
    return { success: true, data: result }; // result includes conversationId and reply
  }
}
