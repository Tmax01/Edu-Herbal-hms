import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Core Providers
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogInterceptor } from './common/interceptors/audit.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature Modules
import { AuditModule } from './modules/audit/audit.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { VitalsModule } from './modules/vitals/vitals.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { StockModule } from './modules/stock/stock.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { WardsModule } from './modules/wards/wards.module';
import { NursingModule } from './modules/nursing/nursing.module';
import { BillingModule } from './modules/billing/billing.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { HerbalProductionModule } from './modules/herbal-production/herbal-production.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { SmsModule } from './modules/sms/sms.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { HrModule } from './modules/hr/hr.module';
import { CallCentreModule } from './modules/call-centre/call-centre.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { DailyReportsModule } from './modules/daily-reports/daily-reports.module';
import { ChatModule } from './modules/chat/chat.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TelemedicineModule } from './modules/telemedicine/telemedicine.module';

@Module({
  imports: [
    // Global Environment Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Database
    PrismaModule,

    // Core & Security Modules
    AuditModule,
    BranchesModule,
    DepartmentsModule,
    UsersModule,
    AuthModule,
    DashboardModule,

    // Clinical Core Modules
    PatientsModule,
    VitalsModule,
    AppointmentsModule,
    ConsultationsModule,

    // Pharmacy, Lab & Inpatient
    StockModule,
    PharmacyModule,
    LaboratoryModule,
    WardsModule,
    NursingModule,

    // Operations, Finance & Herbal
    BillingModule,
    AccountingModule,
    HerbalProductionModule,
    SuppliersModule,

    // HR, Call Centre, Meetings, Reports & Chat
    HrModule,
    CallCentreModule,
    MeetingsModule,
    DailyReportsModule,
    ChatModule,
    ReportsModule,

    // Telephony, AI, Virtual & Messaging
    SmsModule,
    AiAssistantModule,
    CommunicationModule,
    TelemedicineModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Audit Logging on mutating operations
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
