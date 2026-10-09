import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { CallCentreService } from './call-centre.service';
import { CreateCallLogDto, CreatePatientFollowUpDto } from './dto/create-call-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Call Centre')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('call-centre')
export class CallCentreController {
  constructor(private readonly callCentreService: CallCentreService) {}

  @Post('logs')
  @ApiOperation({ summary: 'Log an inbound or outbound patient call interaction' })
  createCallLog(@Body() dto: CreateCallLogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.callCentreService.createCallLog(dto, user.id);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Query patient interaction call logs' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAllCallLogs(@Query('branchId') branchId?: string, @Query('search') search?: string) {
    return this.callCentreService.findAllCallLogs(branchId, search);
  }

  @Post('follow-ups')
  @ApiOperation({ summary: 'Schedule a clinical or medication follow-up tracker for a patient' })
  createFollowUp(@Body() dto: CreatePatientFollowUpDto, @CurrentUser() user: AuthenticatedUser) {
    return this.callCentreService.createFollowUp(dto, user.id);
  }

  @Post('follow-ups/:id/review')
  @ApiParam({ name: 'id', example: 'FU-001' })
  @ApiOperation({ summary: 'Record clinical follow-up review assessment and effectiveness' })
  recordReviewPost(
    @Param('id') id: string,
    @Body() dto: { notes: string; effectiveness?: string; nextDate?: string },
  ) {
    return this.callCentreService.recordReview(id, dto);
  }

  @Patch('follow-ups/:id/review')
  @ApiParam({ name: 'id', example: 'FU-001' })
  @ApiOperation({ summary: 'Record clinical follow-up review assessment and effectiveness (PATCH alias)' })
  recordReviewPatch(
    @Param('id') id: string,
    @Body() dto: { notes: string; effectiveness?: string; nextDate?: string },
  ) {
    return this.callCentreService.recordReview(id, dto);
  }

  @Patch('follow-ups/:id/status')
  @ApiParam({ name: 'id', example: 'FOL-2026-001' })
  @ApiOperation({ summary: 'Update clinical follow-up status (Due, Completed, Overdue)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'Completed' },
        notes: { type: 'string', example: 'Patient reports full recovery.' },
      },
    },
  })
  updateFollowUpStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.callCentreService.updateFollowUpStatus(id, status, notes);
  }


  @Get('follow-ups')
  @ApiOperation({ summary: 'Retrieve scheduled patient follow-up lists' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  findAllFollowUps(@Query('status') status?: string, @Query('branchId') branchId?: string) {
    return this.callCentreService.findAllFollowUps(status, branchId);
  }
}
