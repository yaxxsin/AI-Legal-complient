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
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { ChatService } from './chat.service';
import {
  CreateConversationDto,
  MessageFeedbackDto,
  SendMessageDto,
  UpdateConversationDto,
} from './dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create new conversation' })
  async create(
    @Req() req: Request,
    @Body() dto: CreateConversationDto,
  ) {
    return this.service.createConversation(
      (req as any).user.id,
      dto,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listConversations(
      (req as any).user.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in conversation' })
  async getMessages(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.service.getMessages((req as any).user.id, id);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation title' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.service.updateConversation(
      (req as any).user.id,
      id,
      dto.title ?? '',
    );
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete conversation' })
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    await this.service.deleteConversation(
      (req as any).user.id,
      id,
    );
  }

  @Post('messages/:id/feedback')
  @ApiOperation({ summary: 'Submit message feedback (thumbs up/down)' })
  async feedback(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: MessageFeedbackDto,
  ) {
    return this.service.submitFeedback(
      (req as any).user.id,
      id,
      dto.feedback,
      dto.comment,
    );
  }

  @Post('send')
  @ApiOperation({ summary: 'Send message + receive AI response (SSE streaming)' })
  async send(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: SendMessageDto,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream = await this.service.sendMessage(
      (req as any).user.id,
      dto,
    );

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }
}
