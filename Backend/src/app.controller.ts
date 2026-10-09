import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Root & Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'API Root Information & Service Status' })
  getRoot() {
    return {
      name: 'EduHMS Enterprise Healthcare API',
      status: 'online',
      version: '1.0.0',
      docs: '/api/docs',
      health: `/${process.env.API_PREFIX || 'api/v1'}/health`,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'System health check and uptime status' })
  getHealth() {
    return this.appService.getHealth();
  }
}

