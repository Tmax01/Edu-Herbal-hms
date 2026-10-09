import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TelemedicineService } from './telemedicine.service';
import { CreateTelemedicineSessionDto } from './dto/create-telemedicine-session.dto';
import { UpdateTelemedicineSessionDto, CompleteTelemedicineSessionDto } from './dto/update-telemedicine-session.dto';
import { QueryTelemedicineDto } from './dto/query-telemedicine.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Telemedicine')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telemedicine')
export class TelemedicineController {
  constructor(private readonly telemedicineService: TelemedicineService) {}

  @Get('sessions')
  @ApiOperation({
    summary: 'Retrieve telemedicine consultation sessions with stats, tabs, and filters',
  })
  findAll(@Query() query: QueryTelemedicineDto) {
    return this.telemedicineService.findAll(query);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Retrieve details for a single telemedicine consultation session' })
  @ApiParam({ name: 'id', description: 'Telemedicine session ID (e.g. TLM-001)' })
  findOne(@Param('id') id: string) {
    return this.telemedicineService.findOne(id);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Schedule a new telemedicine consultation session' })
  create(@Body() dto: CreateTelemedicineSessionDto) {
    return this.telemedicineService.create(dto);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: 'Update session details or status' })
  @ApiParam({ name: 'id', description: 'Telemedicine session ID' })
  update(@Param('id') id: string, @Body() dto: UpdateTelemedicineSessionDto) {
    return this.telemedicineService.update(id, dto);
  }

  @Post('sessions/:id/complete')
  @Patch('sessions/:id/complete')
  @ApiOperation({ summary: 'Complete session and save consultation notes from the virtual call room' })
  @ApiParam({ name: 'id', description: 'Telemedicine session ID' })
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteTelemedicineSessionDto,
  ) {
    return this.telemedicineService.completeSession(id, dto);
  }

  @Post('sessions/:id/start')
  @Patch('sessions/:id/start')
  @ApiOperation({ summary: 'Start a telemedicine session call' })
  @ApiParam({ name: 'id', description: 'Telemedicine session ID' })
  startSession(@Param('id') id: string) {
    return this.telemedicineService.startSession(id);
  }

  @Patch('sessions/:id/status')
  @ApiOperation({ summary: 'Update session status (e.g. No-show, Cancelled)' })
  @ApiParam({ name: 'id', description: 'Telemedicine session ID' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No-show',
  ) {
    return this.telemedicineService.updateStatus(id, status);
  }
}
