import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorTitle = 'Internal Server Error';
    let message: string | object = 'Internal server error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && (res as any).message ? (res as any).message : res;
      errorTitle = typeof res === 'object' && (res as any).error ? (res as any).error : 'Http Exception';
    } else {
      // Log full internal error stack for developer visibility
      const rawError = exception as any;
      const rawMsg = String(rawError?.message || rawError || '');
      this.logger.error(`Unhandled Exception: ${rawMsg}`, rawError?.stack);

      const isDbConnError =
        rawMsg.includes("Can't reach database server") ||
        rawMsg.includes('PrismaClient') ||
        rawMsg.includes('invocation in') ||
        rawMsg.includes('ECONNREFUSED') ||
        rawMsg.includes('P1001') ||
        rawMsg.includes('P1002') ||
        rawMsg.includes('P1003') ||
        rawMsg.toLowerCase().includes('database server');

      if (isDbConnError) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        errorTitle = 'Database Service Unavailable';
        message = 'Database server is unreachable. Please ensure your PostgreSQL database server is running at localhost:5432.';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorTitle = 'Internal Server Error';
        message = 'An unexpected server error occurred. Please try again later.';
      }
    }

    const finalMessage = Array.isArray((message as any)?.message)
      ? (message as any).message
      : typeof message === 'object'
      ? (message as any).message || 'Server error'
      : message;

    response.status(status).json({
      statusCode: status,
      error: errorTitle,
      message: finalMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
