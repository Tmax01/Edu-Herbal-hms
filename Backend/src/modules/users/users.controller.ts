import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UploadCvDto } from './dto/upload-cv.dto';
import { SendAppointmentLetterDto } from './dto/send-appointment-letter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Register a new staff member account' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('cto', 'admin', 'hr')
  @ApiOperation({ summary: 'List all hospital staff (filtered by role, branch, or search)' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 'USR-003' })
  @ApiOperation({ summary: 'Retrieve staff profile with assigned module permissions' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('cto', 'admin')
  @ApiParam({ name: 'id', example: 'USR-003' })
  @ApiOperation({ summary: 'Update staff member profile information' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/toggle-active')
  @Roles('cto', 'admin')
  @ApiParam({ name: 'id', example: 'USR-003' })
  @ApiOperation({ summary: 'Toggle staff active or inactive status' })
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Post(':id/reset-password')
  @Roles('cto', 'admin')
  @ApiParam({ name: 'id', example: 'USR-003' })
  @ApiOperation({ summary: 'Reset staff member password' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto);
  }

  @Post(':id/cv')
  @Roles('cto', 'admin', 'hr')
  @ApiParam({ name: 'id', example: 'USR-003' })
  @ApiOperation({ summary: 'Record and upload staff CV document metadata' })
  uploadCv(@Param('id') id: string, @Body() dto: UploadCvDto) {
    return this.usersService.uploadCv(id, dto);
  }

  @Post(':id/appointment-letter')
  @Roles('cto', 'admin', 'hr')
  @ApiParam({ name: 'id', example: 'USR-003' })
  @ApiOperation({ summary: 'Generate and record official appointment letter' })
  sendAppointmentLetter(@Param('id') id: string, @Body() dto: SendAppointmentLetterDto) {
    return this.usersService.sendAppointmentLetter(id, dto);
  }

  @Post(':id/permissions')
  @Roles('cto', 'admin')
  @ApiParam({ name: 'id', example: 'USR-003' })
  @ApiOperation({ summary: 'Configure granular module permissions for staff user' })
  setPermissions(
    @Param('id') id: string,
    @Body() dto: SetPermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.setPermissions(id, dto, user.id);
  }

  @Post(':id/permissions/reset-default')
  @Roles('cto', 'admin')
  @ApiParam({ name: 'id', example: 'USR-003' })
  @ApiOperation({ summary: 'Reset staff member module permissions to system default for their role' })
  resetPermissionsToDefault(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.resetPermissionsToDefault(id, user.id);
  }
}

