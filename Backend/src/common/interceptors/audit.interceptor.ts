import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Only log state mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const sanitizedBody = this.sanitizePayload(body);
      const moduleName = this.extractModuleFromUrl(url);

      return next.handle().pipe(
        tap(async (response) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                actorId: user?.id || null,
                moduleName,
                actionType: `${method} ${url}`,
                ipAddress: (request.headers['x-forwarded-for'] as string) || request.ip || '127.0.0.1',
                userAgent: request.headers['user-agent'] || 'Unknown',
                diffState: {
                  request: sanitizedBody,
                  responseStatus: 'SUCCESS',
                },
              },
            });
          } catch (err: any) {
            this.logger.error(`Failed to record audit log: ${err.message}`);
          }
        }),
      );
    }

    return next.handle();
  }

  private sanitizePayload(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const copy = { ...body };
    const sensitiveKeys = ['password', 'passwordHash', 'refreshToken', 'token', 'secret'];

    for (const key of Object.keys(copy)) {
      if (sensitiveKeys.includes(key)) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object') {
        copy[key] = this.sanitizePayload(copy[key]);
      }
    }

    return copy;
  }

  private extractModuleFromUrl(url: string): string {
    const segments = url.split('/').filter(Boolean);
    if (segments.length >= 3) {
      return segments[2];
    }
    return segments[1] || 'SYSTEM';
  }
}
