import request from 'supertest';
import { app } from '../../src/app';
import { openApiConfig } from '../../src/config/openapi';
import { runOpenApiChecks } from '../../scripts/check-openapi';

describe('OpenAPI Compliance & Contract Suite', () => {
  describe('OpenAPI Compliance Engine Checks', () => {
    it('passes all deterministic route-sync, enum-sync, error-coverage, and spec-validity checks', () => {
      const results = runOpenApiChecks();

      expect(results.routeSync.missingInDocs).toEqual([]);
      expect(results.routeSync.extraInDocs).toEqual([]);
      expect(results.routeSync.pass).toBe(true);

      expect(results.enumSync.mismatches).toEqual([]);
      expect(results.enumSync.pass).toBe(true);

      expect(results.errorCoverage.missingErrors).toEqual([]);
      expect(results.errorCoverage.pass).toBe(true);

      expect(results.specValidity.errors).toEqual([]);
      expect(results.specValidity.pass).toBe(true);
    });
  });

  describe('Versioned OpenAPI JSON Endpoint', () => {
    it('serves valid OpenAPI 3.0.3 specification at GET /api/v1/openapi.json', async () => {
      const res = await request(app).get('/api/v1/openapi.json').expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toBe('AL-AZHARI LIBRARY API');
      expect(res.body.info.version).toBe('1.0.0');
      expect(res.body.paths).toBeDefined();
      expect(res.body.components).toBeDefined();
      expect(res.body.components.securitySchemes.BearerAuth).toBeDefined();
      expect(res.body.components.securitySchemes.RefreshTokenCookie).toBeDefined();
    });

    it('serves valid OpenAPI 3.0.3 specification at alias GET /api/v1/docs.json', async () => {
      const res = await request(app).get('/api/v1/docs.json').expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body.openapi).toBe('3.0.3');
    });

    it('serves OpenAPI JSON at root docs route GET /docs/openapi.json', async () => {
      const res = await request(app).get('/docs/openapi.json').expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body.openapi).toBe('3.0.3');
    });
  });

  describe('Interactive Swagger UI Endpoint', () => {
    it('serves Swagger UI HTML page at GET /api/v1/docs in non-production environments', async () => {
      const res = await request(app).get('/api/v1/docs').expect(200);

      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('AL-AZHARI LIBRARY API — Swagger UI');
      expect(res.text).toContain('SwaggerUIBundle');
      expect(res.text).toContain('/api/v1/openapi.json');
    });

    it('serves Swagger UI HTML page at GET /docs in non-production environments', async () => {
      const res = await request(app).get('/docs').expect(200);

      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('SwaggerUIBundle');
    });
  });

  describe('Contract Integrity: Pre-orders Endpoints', () => {
    const paths = openApiConfig.paths as Record<string, Record<string, {
      operationId?: string;
      tags?: string[];
      security?: unknown[];
      responses: Record<string, unknown>;
    }>>;

    it('documents public product preorder submission endpoint', () => {
      const op = paths['/api/v1/products/{slug}/pre-orders']?.post;
      expect(op).toBeDefined();
      expect(op.operationId).toBe('createPreorder');
      expect(op.tags).toContain('Pre-orders');
      expect(op.responses['201']).toBeDefined();
      expect(op.responses['400']).toBeDefined();
    });

    it('documents customer preorder collection and single item endpoints', () => {
      const listOp = paths['/api/v1/pre-orders']?.get;
      expect(listOp).toBeDefined();
      expect(listOp.operationId).toBe('listCustomerPreorders');
      expect(listOp.security).toEqual([{ BearerAuth: [] }]);

      const getOp = paths['/api/v1/pre-orders/{reference}']?.get;
      expect(getOp).toBeDefined();
      expect(getOp.operationId).toBe('getCustomerPreorderByReference');
      expect(getOp.security).toEqual([{ BearerAuth: [] }]);

      const cancelOp = paths['/api/v1/pre-orders/{reference}/cancel']?.post;
      expect(cancelOp).toBeDefined();
      expect(cancelOp.operationId).toBe('cancelCustomerPreorder');
      expect(cancelOp.security).toEqual([{ BearerAuth: [] }]);
    });

    it('documents administrative preorder lifecycle endpoints', () => {
      const acceptOp = paths['/api/v1/admin/pre-orders/{reference}/accept']?.post;
      expect(acceptOp).toBeDefined();
      expect(acceptOp.operationId).toBe('adminAcceptPreorder');
      expect(acceptOp.security).toEqual([{ BearerAuth: [] }]);

      const rejectOp = paths['/api/v1/admin/pre-orders/{reference}/reject']?.post;
      expect(rejectOp).toBeDefined();
      expect(rejectOp.operationId).toBe('adminRejectPreorder');

      const availableOp = paths['/api/v1/admin/pre-orders/{reference}/available']?.post;
      expect(availableOp).toBeDefined();
      expect(availableOp.operationId).toBe('adminMarkPreorderAvailable');
    });
  });

  describe('Contract Integrity: WhatsApp Endpoints', () => {
    const paths = openApiConfig.paths as Record<string, Record<string, {
      operationId?: string;
      tags?: string[];
      security?: unknown[];
      description?: string;
      responses: Record<string, unknown>;
    }>>;

    it('documents customer support link generation endpoint', () => {
      const op = paths['/api/v1/whatsapp/support']?.get;
      expect(op).toBeDefined();
      expect(op.operationId).toBe('getWhatsAppSupportLink');
      expect(op.tags).toContain('WhatsApp');
      expect(op.responses['200']).toBeDefined();
    });

    it('documents customer support link alias endpoint', () => {
      const op = paths['/api/v1/whatsapp/link']?.get;
      expect(op).toBeDefined();
      expect(op.operationId).toBe('getWhatsAppLinkAlias');
    });

    it('documents admin customer contact link generation endpoint with orders.read requirement', () => {
      const op = paths['/api/v1/admin/whatsapp/customer-link']?.post;
      expect(op).toBeDefined();
      expect(op.operationId).toBe('adminGetWhatsAppCustomerLink');
      expect(op.tags).toContain('Admin WhatsApp');
      expect(op.security).toEqual([{ BearerAuth: [] }]);
      expect(op.description).toContain('orders.read');
    });
  });

  describe('Common Error Envelopes & Security Schemes', () => {
    it('defines standard reusable error responses across HTTP 400, 401, 403, 404, 409, 422, 429, 500', () => {
      const responses = openApiConfig.components.responses as Record<string, {
        content: {
          'application/json': {
            schema: { $ref: string };
          };
        };
      }>;
      const expectedResponses = [
        'BadRequest',
        'Unauthorized',
        'Forbidden',
        'NotFound',
        'Conflict',
        'UnprocessableEntity',
        'TooManyRequests',
        'InternalServerError',
      ];

      for (const name of expectedResponses) {
        expect(responses[name]).toBeDefined();
        expect(responses[name].content['application/json'].schema.$ref).toBe(
          '#/components/schemas/ApiErrorResponse',
        );
      }
    });

    it('documents BearerAuth, RefreshTokenCookie, and GuestTokenAuth security schemes', () => {
      const schemes = openApiConfig.components.securitySchemes as Record<string, unknown>;

      expect(schemes.BearerAuth).toMatchObject({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      });

      expect(schemes.RefreshTokenCookie).toMatchObject({
        type: 'apiKey',
        in: 'cookie',
      });

      expect(schemes.GuestTokenAuth).toMatchObject({
        type: 'apiKey',
        in: 'header',
        name: 'X-Guest-Token',
      });
    });
  });
});
