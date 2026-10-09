import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingStatusDto } from './dto/create-meeting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Meetings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Schedule an individual, branch, or hospital-wide staff meeting' })
  create(@Body() dto: CreateMeetingDto, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve scheduled hospital meetings with scope, tab, and branch filters' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'branch', required: false, type: String, description: 'Branch alias (Accra, Mankessim, All)' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'scope', required: false, type: String, description: 'Individual, Branch, Hospital-wide' })
  @ApiQuery({ name: 'tab', required: false, type: String, enum: ['upcoming', 'past'] })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('branch') branch?: string,
    @Query('status') status?: string,
    @Query('scope') scope?: string,
    @Query('tab') tab?: string,
  ) {
    return this.meetingsService.findAll(branchId || branch, status, scope, tab);
  }

  @Patch(':id/status')
  @Roles('cto', 'admin')
  @ApiParam({ name: 'id', example: 'MTG-001' })
  @ApiOperation({ summary: 'Update meeting status and record minutes' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMeetingStatusDto) {
    return this.meetingsService.updateStatus(id, dto.status, dto.minutes);
  }
}
