import { Module } from '@nestjs/common';
import { CallCentreService } from './call-centre.service';
import { CallCentreController } from './call-centre.controller';

@Module({
  controllers: [CallCentreController],
  providers: [CallCentreService],
  exports: [CallCentreService],
})
export class CallCentreModule {}
