import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChannelDto, SendMessageDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('channels')
  @ApiOperation({ summary: 'Create an internal clinical or departmental chat channel' })
  createChannel(@Body() dto: CreateChannelDto) {
    return this.chatService.createChannel(dto);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Retrieve all active internal staff chat channels' })
  findAllChannels() {
    return this.chatService.findAllChannels();
  }

  @Get('staff')
  @ApiOperation({ summary: 'Retrieve list of hospital staff available for 1-on-1 Direct Messaging' })
  getStaffList(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getStaffList(user.id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Post an instant message or clinical file link to a channel or DM' })
  sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.sendMessage(dto, user.id);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Retrieve messages for a channel or direct message thread via query parameter' })
  @ApiQuery({ name: 'channel', required: true, example: 'general' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessagesByQuery(@Query('channel') channel: string, @Query('limit') limit?: number) {
    return this.chatService.getChannelMessages(channel, limit ? Number(limit) : 100);
  }

  @Get('channels/:channelId/messages')
  @ApiParam({ name: 'channelId', example: 'general' })
  @ApiOperation({ summary: 'Retrieve conversation history for a chat channel' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getChannelMessages(@Param('channelId') channelId: string, @Query('limit') limit?: number) {
    return this.chatService.getChannelMessages(channelId, limit ? Number(limit) : 100);
  }
}
