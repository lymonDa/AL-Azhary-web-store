import { formatSuccessResponse, formatErrorResponse } from '../../src/common/http';

describe('Response Envelope Formatting', () => {
  it('formats a success response envelope with requestId, data, and meta', () => {
    const data = { id: 'book_123', title: 'Kitab al-Dirasat' };
    const response = formatSuccessResponse('req_test_123', data, { limit: 10, total: 1 });

    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.requestId).toBe('req_test_123');
    expect(response.meta.requestId).toBe('req_test_123');
    expect(response.meta.pagination).toEqual({ limit: 10, total: 1 });
    expect(response.meta.timestamp).toBeDefined();
  });

  it('formats an error response envelope with code, message, requestId, and meta', () => {
    const errorPayload = {
      code: 'VALIDATION_ERROR',
      message: 'Field is required',
      details: null,
      fields: [{ path: 'name', code: 'required' }],
    };

    const response = formatErrorResponse('req_error_456', errorPayload);

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.message).toBe('Field is required');
    expect(response.error.details).toBeNull();
    expect(response.error.fields).toEqual([{ path: 'name', code: 'required' }]);
    expect(response.requestId).toBe('req_error_456');
    expect(response.meta.requestId).toBe('req_error_456');
    expect(response.meta.timestamp).toBeDefined();
  });
});
