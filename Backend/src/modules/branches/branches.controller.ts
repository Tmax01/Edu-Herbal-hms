import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Branches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Register a new hospital branch facility' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all hospital branches' })
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 'accra-main-branch-001' })
  @ApiOperation({ summary: 'Retrieve details of a specific branch' })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', example: 'accra-main-branch-001' })
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Update facility metadata or operational status' })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', example: 'accra-main-branch-001' })
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Deactivate a branch facility' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
