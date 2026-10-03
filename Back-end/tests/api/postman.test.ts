/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';
import { runPostmanContractChecks } from '../../scripts/check-postman';

describe('Postman Compliance & Contract Verification Suite', () => {
  const collectionPath = path.resolve(__dirname, '../../postman/al-azhari-library.postman_collection.json');
  const envPath = path.resolve(__dirname, '../../postman/al-azhari-library.postman_environment.json');

  describe('Postman Contract Synchronization Engine', () => {
    it('achieves 100% route contract synchronization with OpenAPI 3.0.3 (0 missing, 0 extra, 0 duplicates)', () => {
      const results = runPostmanContractChecks();

      expect(results.openApiCount).toBeGreaterThanOrEqual(118);
      expect(results.postmanCount).toBe(results.openApiCount);
      expect(results.missingInPostman).toEqual([]);
      expect(results.extraInPostman).toEqual([]);
      expect(results.duplicatePostmanKeys).toEqual([]);
      expect(results.pass).toBe(true);
    });

    it('verifies that collection contains zero sensitive credentials, secrets, or real JWTs', () => {
      const results = runPostmanContractChecks();

      expect(results.secretViolations).toEqual([]);
    });

    it('verifies Postman Collection schema adheres strictly to v2.1.0 specification', () => {
      const results = runPostmanContractChecks();

      expect(results.schemaViolations).toEqual([]);
    });
  });

  describe('Postman Collection File & Schema Structure', () => {
    let collection: any;

    beforeAll(() => {
      const raw = fs.readFileSync(collectionPath, 'utf8');
      collection = JSON.parse(raw);
    });

    it('defines Postman Collection metadata and v2.1 schema', () => {
      expect(collection.info.name).toBe('AL-AZHARI LIBRARY API');
      expect(collection.info.schema).toBe('https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
      expect(collection.info.version).toBe('1.0.0');
    });

    it('organizes endpoints into standard domain folders', () => {
      const folderNames = collection.item.map((f: any) => f.name);

      expect(folderNames).toContain('Auth');
      expect(folderNames).toContain('Users');
      expect(folderNames).toContain('Addresses');
      expect(folderNames).toContain('Categories');
      expect(folderNames).toContain('Products');
      expect(folderNames).toContain('Cart');
      expect(folderNames).toContain('Orders');
      expect(folderNames).toContain('Payments');
      expect(folderNames).toContain('Services');
      expect(folderNames).toContain('Pre-orders');
      expect(folderNames).toContain('Returns');
      expect(folderNames).toContain('Notifications');
      expect(folderNames).toContain('WhatsApp');
      expect(folderNames).toContain('Admin');
      expect(folderNames).toContain('Health');
    });

    it('includes all 10 Pre-order operations (customer and admin)', () => {
      const preOrderRequests: string[] = [];

      function findPreorders(items: any[]) {
        for (const it of items) {
          if (it.request) {
            const desc = it.request.description || '';
            if (desc.includes('pre-orders')) {
              preOrderRequests.push(it.name);
            }
          }
          if (it.item) findPreorders(it.item);
        }
      }

      findPreorders(collection.item);
      expect(preOrderRequests.length).toBeGreaterThanOrEqual(10);
    });

    it('includes all 3 WhatsApp operations (support link, alias, and admin customer link)', () => {
      const whatsappRequests: string[] = [];

      function findWhatsApp(items: any[]) {
        for (const it of items) {
          if (it.request) {
            const desc = it.request.description || '';
            if (desc.includes('POST /api/v1/admin/whatsapp') || desc.includes('GET /api/v1/whatsapp')) {
              whatsappRequests.push(it.name);
            }
          }
          if (it.item) findWhatsApp(it.item);
        }
      }

      findWhatsApp(collection.item);
      expect(whatsappRequests.length).toBe(3);
    });

    it('configures {{baseUrl}} and {{rootUrl}} environment variables across all requests', () => {
      function checkUrls(items: any[]) {
        for (const it of items) {
          if (it.request) {
            const rawUrl = it.request.url.raw;
            expect(rawUrl.startsWith('{{baseUrl}}') || rawUrl.startsWith('{{rootUrl}}')).toBe(true);
          }
          if (it.item) checkUrls(it.item);
        }
      }

      checkUrls(collection.item);
    });

    it('attaches Bearer authentication to protected endpoints and noauth to public endpoints', () => {
      function checkAuth(items: any[]) {
        for (const it of items) {
          if (it.request) {
            const auth = it.request.auth;
            expect(auth).toBeDefined();
            expect(['bearer', 'noauth']).toContain(auth.type);
          }
          if (it.item) checkAuth(it.item);
        }
      }

      checkAuth(collection.item);
    });

    it('includes token extraction test scripts for authentication login & register flows', () => {
      const authFolder = collection.item.find((f: any) => f.name === 'Auth');
      expect(authFolder).toBeDefined();

      const loginReq = authFolder.item.find((it: any) => it.request.description.includes('Operation ID**: `login`'));
      expect(loginReq).toBeDefined();
      const loginScript = loginReq.event[0].script.exec.join('\n');
      expect(loginScript).toContain('pm.environment.set("accessToken"');

      const registerReq = authFolder.item.find((it: any) => it.request.description.includes('Operation ID**: `register`'));
      expect(registerReq).toBeDefined();
      const registerScript = registerReq.event[0].script.exec.join('\n');
      expect(registerScript).toContain('pm.environment.set("accessToken"');
    });

    it('contains representative response examples for success and error envelopes across operations', () => {
      let totalResponses = 0;
      function countResponses(items: any[]) {
        for (const it of items) {
          if (it.response && Array.isArray(it.response)) {
            totalResponses += it.response.length;
          }
          if (it.item) countResponses(it.item);
        }
      }
      countResponses(collection.item);
      expect(totalResponses).toBeGreaterThan(500);
    });
  });

  describe('Postman Environment Template Verification', () => {
    let environment: any;

    beforeAll(() => {
      const raw = fs.readFileSync(envPath, 'utf8');
      environment = JSON.parse(raw);
    });

    it('defines required variables with safe placeholders and no secrets', () => {
      const keys = environment.values.map((v: any) => v.key);

      expect(keys).toContain('baseUrl');
      expect(keys).toContain('rootUrl');
      expect(keys).toContain('accessToken');
      expect(keys).toContain('refreshToken');
      expect(keys).toContain('adminAccessToken');
      expect(keys).toContain('guestToken');
      expect(keys).toContain('productSlug');
      expect(keys).toContain('orderReference');
      expect(keys).toContain('serviceReference');
      expect(keys).toContain('preOrderReference');
      expect(keys).toContain('returnReference');

      const accessTokenVar = environment.values.find((v: any) => v.key === 'accessToken');
      expect(accessTokenVar.value).toBe('CHANGE_ME_ACCESS_TOKEN');

      const refreshTokenVar = environment.values.find((v: any) => v.key === 'refreshToken');
      expect(refreshTokenVar.value).toBe('CHANGE_ME_REFRESH_TOKEN');
    });
  });
});
