import {
  Controller, Get, Patch, Post, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard }  from '../auth/guards/jwt-auth.guard';
import { AdminService }  from './admin.service';
import { Roles }         from '../../common/decorators/roles.decorator';
import { RolesGuard }    from '../../common/guards/roles.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(Number(page ?? 1), Number(limit ?? 20), search);
  }

  @Post('users/:id/ban')
  banUser(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.banUser(id, reason);
  }

  @Post('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Patch('users/:id/role')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateRole(id, role);
  }
}
