import { AllExceptionsFilter } from './http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter Standard Envelope & Error Mapping Tests', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/api/v1/billing/invoices',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('formats standard HttpException with status, error, message, path, timestamp', () => {
    const exception = new HttpException('Invalid payment amount', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid payment amount',
        path: '/api/v1/billing/invoices',
      }),
    );
  });

  it('ADVERSARIAL: maps unhandled PostgreSQL connection error to 503 Service Unavailable', () => {
    const dbError = new Error("Can't reach database server at localhost:5432");

    filter.catch(dbError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Database Service Unavailable',
        message: expect.stringContaining('Database server is unreachable'),
      }),
    );
  });

  it('handles generic unhandled error with 500 Internal Server Error', () => {
    const error = new Error('Unexpected catastrophic crash');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'An unexpected server error occurred. Please try again later.',
      }),
    );
  });
});
