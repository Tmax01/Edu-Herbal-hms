import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { CreateLeaveRequestDto, ApproveLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateOffDutyRequestDto, ApproveOffDutyDto } from './dto/create-off-duty-request.dto';
import { QueryHrDto } from './dto/query-hr.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Retrieve HR module dashboard overview statistics and counts' })
  getOverview(@Query('branchId') branchId?: string) {
    return this.hrService.getOverview(branchId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Retrieve HR statistics (alias)' })
  getStats(@Query('branchId') branchId?: string) {
    return this.hrService.getOverview(branchId);
  }

  @Post('leave-requests')
  @ApiOperation({ summary: 'Submit a staff leave application (Annual, Sick, Maternity, Study)' })

  createLeave(@Body() dto: CreateLeaveRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.hrService.createLeaveRequest(dto, user.id);
  }

  @Patch('leave-requests/:id/status')
  @Roles('cto', 'admin', 'hr')
  @ApiParam({ name: 'id', example: 'LV-2026-001' })
  @ApiOperation({ summary: 'Approve or reject a staff leave application' })
  approveLeave(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.hrService.approveLeaveRequest(id, dto, user.id);
  }

  @Get('leave-requests')
  @ApiOperation({ summary: 'Query staff leave applications with status and branch filters' })
  findAllLeave(@Query() query: QueryHrDto) {
    return this.hrService.findAllLeave(query);
  }

  @Post('off-duty-requests')
  @ApiOperation({ summary: 'Submit a shift swap or off-duty scheduling request' })
  createOffDuty(@Body() dto: CreateOffDutyRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.hrService.createOffDutyRequest(dto, user.id);
  }

  @Patch('off-duty-requests/:id/status')
  @Roles('cto', 'admin', 'hr')
  @ApiParam({ name: 'id', example: 'OFF-2026-001' })
  @ApiOperation({ summary: 'Approve or reject an off-duty shift request' })
  approveOffDuty(
    @Param('id') id: string,
    @Body() dto: ApproveOffDutyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.hrService.approveOffDutyRequest(id, dto, user.id);
  }

  @Get('off-duty-requests')
  @ApiOperation({ summary: 'Query staff off-duty requests' })
  findAllOffDuty(@Query() query: QueryHrDto) {
    return this.hrService.findAllOffDuty(query);
  }
}
