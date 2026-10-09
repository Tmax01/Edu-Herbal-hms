import { TransformResponseInterceptor } from './transform-response.interceptor';
import { of } from 'rxjs';

describe('TransformResponseInterceptor Standard Envelope Tests', () => {
  let interceptor: TransformResponseInterceptor<any>;
  let mockContext: any;
  let mockCallHandler: any;

  beforeEach(() => {
    interceptor = new TransformResponseInterceptor();
    mockContext = {
      switchToHttp: () => ({
        getResponse: () => ({ statusCode: 200 }),
      }),
    };
  });

  it('wraps raw response payload into standard API envelope', (done) => {
    const rawData = { patientId: 'PAT-1', name: 'Kwame Mensah' };
    mockCallHandler = { handle: () => of(rawData) };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((res) => {
      expect(res.statusCode).toBe(200);
      expect(res.message).toBe('Operation executed successfully');
      expect(res.data).toEqual(rawData);
      expect(res.timestamp).toBeDefined();
      done();
    });
  });

  it('preserves existing custom message and extracts data', (done) => {
    const customData = {
      message: 'Prescription dispensed successfully',
      receipt: { id: 'RCPT-101' },
      items: [{ id: '1' }],
    };
    mockCallHandler = { handle: () => of(customData) };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((res) => {
      expect(res.statusCode).toBe(200);
      expect(res.message).toBe('Prescription dispensed successfully');
      expect(res.data).toEqual(customData);
      done();
    });
  });
});
