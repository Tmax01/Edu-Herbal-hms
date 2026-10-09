import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to PostgreSQL Database');
    } catch (err: any) {
      this.logger.warn(
        `⚠️ PostgreSQL connection deferred: Could not reach database server (${err.message}). API and Swagger UI are running, but database endpoints will require PostgreSQL to be started.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
