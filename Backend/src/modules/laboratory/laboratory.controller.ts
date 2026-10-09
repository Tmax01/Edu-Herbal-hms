import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LaboratoryService } from './laboratory.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { SubmitResultsDto } from './dto/submit-results.dto';
import { QueryLabOrdersDto } from './dto/query-lab-orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Laboratory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('laboratory')
export class LaboratoryController {
  constructor(private readonly laboratoryService: LaboratoryService) {}

  @Post('orders')
  @Roles('cto', 'admin', 'doctor')
  @ApiOperation({ summary: 'Create a diagnostic laboratory test order from consultation or ward' })
  createOrder(@Body() dto: CreateLabOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.laboratoryService.create(dto, user.id);
  }

  @Post('orders/:id/results')
  @Roles('cto', 'admin', 'lab_tech')
  @ApiParam({ name: 'id', example: 'LAB-002' })
  @ApiOperation({ summary: 'Submit diagnostic test results and optional PDF report attachment' })
  submitResults(
    @Param('id') id: string,
    @Body() dto: SubmitResultsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.laboratoryService.submitResults(id, dto, user.id);
  }

  @Patch('orders/:id/approve')
  @Roles('cto', 'admin', 'doctor')
  @ApiParam({ name: 'id', example: 'LAB-001' })
  @ApiOperation({ summary: 'Physician clinical sign-off and approval of lab report' })
  approveResults(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.laboratoryService.approveResults(id, user.id);
  }

  @Post('orders/:id/attachments')
  @Roles('cto', 'admin', 'lab_tech')
  @ApiParam({ name: 'id', example: 'LAB-004' })
  @ApiOperation({ summary: 'Upload PDF report attachment for a lab order' })
  addAttachment(
    @Param('id') id: string,
    @Body() body: { fileName: string; fileSizeKb?: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.laboratoryService.addAttachment(id, body.fileName, body.fileSizeKb, user.id);
  }

  @Get('orders')
  @Roles('cto', 'admin', 'doctor', 'lab_tech', 'nurse', 'receptionist', 'accountant')
  @ApiOperation({ summary: 'Query laboratory diagnostic orders with branch, status, search, and pagination' })
  findAllOrders(@Query() query: QueryLabOrdersDto) {
    return this.laboratoryService.findAll(query);
  }

  @Get('orders/:id')
  @Roles('cto', 'admin', 'doctor', 'lab_tech', 'nurse', 'receptionist', 'accountant')
  @ApiParam({ name: 'id', example: 'LAB-001' })
  @ApiOperation({ summary: 'Retrieve full laboratory order details, multi-parameter results, and PDF attachments' })
  findOneOrder(@Param('id') id: string) {
    return this.laboratoryService.findOne(id);
  }
}
