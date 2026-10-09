import { Module } from '@nestjs/common';
import { DashboardController, AnalyticsController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController, AnalyticsController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
