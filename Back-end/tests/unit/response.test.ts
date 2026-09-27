import { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse } from '../../src/common/http';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendError,
} from '../../src/common/utils/response.util';

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

  describe('Express Response Helpers (sendSuccess, sendCreated, sendNoContent, sendError)', () => {
    const mockRequest = { id: 'req_helper_123' } as unknown as Request;

    it('sendSuccess sends status 200 with standard envelope', () => {
      const mockRes: Record<string, unknown> = {};
      mockRes.status = jest.fn().mockReturnValue(mockRes);
      mockRes.json = jest.fn().mockReturnValue(mockRes);

      sendSuccess(mockRequest, mockRes as unknown as Response, { message: 'ok' });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { message: 'ok' },
          requestId: 'req_helper_123',
        }),
      );
    });

    it('sendCreated sends status 201 with standard envelope', () => {
      const mockRes: Record<string, unknown> = {};
      mockRes.status = jest.fn().mockReturnValue(mockRes);
      mockRes.json = jest.fn().mockReturnValue(mockRes);

      sendCreated(mockRequest, mockRes as unknown as Response, { id: 'item_1' });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { id: 'item_1' },
          requestId: 'req_helper_123',
        }),
      );
    });

    it('sendNoContent sends status 204 with empty body', () => {
      const mockRes: Record<string, unknown> = {};
      mockRes.status = jest.fn().mockReturnValue(mockRes);
      mockRes.send = jest.fn().mockReturnValue(mockRes);

      sendNoContent(mockRes as unknown as Response);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('sendError sends formatted error envelope with appropriate status', () => {
      const mockRes: Record<string, unknown> = {};
      mockRes.status = jest.fn().mockReturnValue(mockRes);
      mockRes.json = jest.fn().mockReturnValue(mockRes);

      sendError(mockRequest, mockRes as unknown as Response, { code: 'FORBIDDEN', message: 'Access denied' }, 403);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'FORBIDDEN',
            message: 'Access denied',
          }),
          requestId: 'req_helper_123',
        }),
      );
    });
  });
});
