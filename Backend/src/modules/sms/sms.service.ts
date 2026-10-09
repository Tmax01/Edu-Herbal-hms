import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { QuerySmsLogsDto } from './dto/query-sms-logs.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly apiUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('ARKESEL_API_KEY', 'mock_key');
    this.senderId = this.configService.get<string>('ARKESEL_SENDER_ID', 'EduHMS');
    this.apiUrl = this.configService.get<string>('ARKESEL_API_URL', 'https://sms.arkesel.com/api/v2/sms/send');
  }

  async sendSms(dto: SendSmsDto, sentByStaffId?: string) {
    const normalizedPhone = this.normalizeGhanaPhone(dto.recipientPhone);
    let gatewayResponseId = `ARK-${Date.now()}`;
    let deliveryStatus = 'Sent';

    try {
      // In production with real API key, trigger Arkesel HTTP call
      if (this.apiKey && this.apiKey !== 'mock_key') {
        // Real HTTP fetch payload for Arkesel V2 SMS endpoint
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: this.senderId,
            recipients: [normalizedPhone],
            message: dto.message,
          }),
        });

        const data: any = await response.json();
        if (data && data.status === 'success') {
          gatewayResponseId = data.data?.[0]?.id || gatewayResponseId;
          deliveryStatus = 'Delivered';
        } else {
          deliveryStatus = 'Failed';
          this.logger.warn(`Arkesel SMS Gateway Warning: ${JSON.stringify(data)}`);
        }
      } else {
        this.logger.log(`[DEV SMS SIMULATION] To: ${normalizedPhone} | Msg: "${dto.message}"`);
      }
    } catch (err: any) {
      this.logger.error(`SMS Dispatch Exception: ${err.message}`);
      deliveryStatus = 'Failed';
    }

    // Record audit log entry in database
    const log = await this.prisma.smsNotificationLog.create({
      data: {
        patientId: dto.patientId || null,
        recipientPhone: normalizedPhone,
        messageBody: dto.message,
        purpose: dto.purpose || 'General Notification',
        gatewayResponseId,
        deliveryStatus,
        sentBy: sentByStaffId || null,
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true } },
        sentByUser: { select: { id: true, fullName: true } },
      },
    });

    return log;
  }

  async findAllLogs(query: QuerySmsLogsDto) {
    const { patientId, phone, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (phone) where.recipientPhone = { contains: phone };

    const [total, items] = await Promise.all([
      this.prisma.smsNotificationLog.count({ where }),
      this.prisma.smsNotificationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: {
          patient: { select: { id: true, mrn: true, fullName: true } },
          sentByUser: { select: { id: true, fullName: true, role: true } },
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private normalizeGhanaPhone(phone: string): string {
    let clean = phone.replace(/[\s\-()]/g, '');
    if (clean.startsWith('0')) {
      clean = '233' + clean.slice(1);
    } else if (clean.startsWith('+233')) {
      clean = clean.slice(1);
    }
    return clean;
  }
}
