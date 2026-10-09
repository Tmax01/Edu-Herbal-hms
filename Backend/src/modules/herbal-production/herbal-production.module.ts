import { Module } from '@nestjs/common';
import { HerbalProductionService } from './herbal-production.service';
import { HerbalProductionController } from './herbal-production.controller';

@Module({
  controllers: [HerbalProductionController],
  providers: [HerbalProductionService],
  exports: [HerbalProductionService],
})
export class HerbalProductionModule {}
