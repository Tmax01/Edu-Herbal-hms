import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communication')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('announcements')
  @Roles('cto', 'admin', 'doctor')
  @ApiOperation({ summary: 'Post an internal bulletin announcement or facility-wide alert' })
  createAnnouncement(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communicationService.createAnnouncement(dto, user.id);
  }

  @Get('announcements')
  @ApiOperation({ summary: 'Retrieve active bulletin announcements tailored for the authenticated user role' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  findActiveAnnouncements(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.communicationService.findActiveAnnouncements(user.role, branchId || user.primaryBranchId);
  }
}
