import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Create a new clinical or administrative department' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve departments (optionally filtered by facility branch)' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  findAll(@Query('branchId') branchId?: string) {
    return this.departmentsService.findAll(branchId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 'dept-gen-med-001' })
  @ApiOperation({ summary: 'Retrieve a single department by ID' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', example: 'dept-gen-med-001' })
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Update department details' })
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', example: 'dept-gen-med-001' })
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Delete a department' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
