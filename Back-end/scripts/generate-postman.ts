import * as fs from 'fs';
import * as path from 'path';
import { openApiConfig } from '../src/config/openapi';

/**
 * Domain Folder Grouping mapping
 */
const TAG_TO_FOLDER: Record<string, string> = {
  Health: 'Health',
  Auth: 'Auth',
  Users: 'Users',
  Addresses: 'Addresses',
  Categories: 'Categories',
  Products: 'Products',
  Search: 'Products',
  Cart: 'Cart',
  Checkout: 'Orders',
  Orders: 'Orders',
  Payments: 'Payments',
  Inventory: 'Inventory',
  Services: 'Services',
  Quotations: 'Services',
  'Pre-orders': 'Pre-orders',
  Returns: 'Returns',
  Notifications: 'Notifications',
  WhatsApp: 'WhatsApp',
  'Admin Categories': 'Admin',
  'Admin Products': 'Admin',
  'Admin Content': 'Admin',
  'Admin Inventory': 'Admin',
  'Admin Orders': 'Admin',
  'Admin Payments': 'Admin',
  'Admin Coupons': 'Admin',
  'Admin Shipping': 'Admin',
  'Admin Services': 'Admin',
  'Admin Pre-orders': 'Admin',
  'Admin Returns': 'Admin',
  'Admin Refunds': 'Admin',
  'Admin WhatsApp': 'Admin',
  'Admin Audit': 'Admin',
  'Admin Reports': 'Admin',
  Content: 'Content',
};

// Map URL path parameters {param} to Postman variable / path format {{param}}
const PARAM_TO_ENV_VAR: Record<string, string> = {
  slug: 'productSlug',
  reference: 'orderReference',
  orderReference: 'orderReference',
  serviceReference: 'serviceReference',
  id: 'productId',
  itemId: 'cartItemId',
  paymentId: 'paymentId',
  code: 'couponCode',
};

function resolveSchemaRef(ref: string, schemas: Record<string, any>): any {
  if (!ref.startsWith('#/components/schemas/')) return {};
  const name = ref.replace('#/components/schemas/', '');
  return schemas[name] || {};
}

function resolveResponseRef(ref: string, responses: Record<string, any>): any {
  if (!ref.startsWith('#/components/responses/')) return {};
  const name = ref.replace('#/components/responses/', '');
  return responses[name] || {};
}

function generateSchemaExample(schema: any, schemas: Record<string, any>, depth = 0): any {
  if (!schema || depth > 6) return null;
  if (schema.$ref) {
    return generateSchemaExample(resolveSchemaRef(schema.$ref, schemas), schemas, depth + 1);
  }
  if (schema.example !== undefined) {
    return schema.example;
  }
  if (schema.default !== undefined) {
    return schema.default;
  }
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }
  if (schema.type === 'string') {
    if (schema.format === 'email') return 'customer@al-azhari.com';
    if (schema.format === 'date-time') return '2026-10-02T19:00:00.000Z';
    if (schema.format === 'password') return 'SecurePass123!';
    return 'example_string';
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    return schema.minimum !== undefined ? schema.minimum : 1;
  }
  if (schema.type === 'boolean') {
    return true;
  }
  if (schema.type === 'array') {
    if (schema.items) {
      const itemEx = generateSchemaExample(schema.items, schemas, depth + 1);
      return itemEx !== null ? [itemEx] : [];
    }
    return [];
  }
  if (schema.type === 'object' || schema.properties) {
    const obj: Record<string, any> = {};
    const props = schema.properties || {};
    for (const [propName, propDef] of Object.entries(props)) {
      obj[propName] = generateSchemaExample(propDef as any, schemas, depth + 1);
    }
    return obj;
  }
  return null;
}

export function generatePostmanCollection(): any {
  const schemas = (openApiConfig.components?.schemas || {}) as Record<string, any>;
  const responses = (openApiConfig.components?.responses || {}) as Record<string, any>;
  const paths = openApiConfig.paths as Record<string, Record<string, any>>;

  const folderMap = new Map<string, any[]>();

  for (const [rawPath, methodsObj] of Object.entries(paths)) {
    for (const [rawMethod, op] of Object.entries(methodsObj)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(rawMethod.toLowerCase())) {
        continue;
      }

      const method = rawMethod.toUpperCase();
      const tag = op.tags?.[0] || 'General';
      const folderName = TAG_TO_FOLDER[tag] || tag;

      // URL decomposition
      // Root endpoints: /health, /health/live, /health/ready use {{rootUrl}}/health
      // All /api/v1 endpoints use {{baseUrl}} + remainder
      let isRootUrl = false;
      let pathSuffix = rawPath;
      if (rawPath.startsWith('/health')) {
        isRootUrl = true;
      } else if (rawPath.startsWith('/api/v1')) {
        pathSuffix = rawPath.replace('/api/v1', '');
      }

      // Convert path params /products/{slug} to Postman format /products/:slug
      const postmanPath = pathSuffix.replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1');

      // Build url object
      const pathSegments = postmanPath.split('/').filter(Boolean);
      const urlHost = isRootUrl ? ['{{rootUrl}}'] : ['{{baseUrl}}'];

      // Query parameters from OpenAPI
      const queryParams: any[] = [];
      const pathVariables: any[] = [];

      if (op.parameters && Array.isArray(op.parameters)) {
        for (const p of op.parameters) {
          if (p.in === 'query') {
            queryParams.push({
              key: p.name,
              value: p.schema?.default !== undefined ? String(p.schema.default) : (p.example !== undefined ? String(p.example) : ''),
              description: p.description || '',
              disabled: !p.required,
            });
          } else if (p.in === 'path') {
            const varName = PARAM_TO_ENV_VAR[p.name] || p.name;
            pathVariables.push({
              key: p.name,
              value: `{{${varName}}}`,
              description: p.description || `Path parameter ${p.name}`,
            });
          }
        }
      }

      // Headers
      const headers: any[] = [];

      // Security / Auth configuration
      const security = op.security;
      let authConfig: any = undefined;
      const requiresBearer = Array.isArray(security) && security.some((s) => s.BearerAuth !== undefined);
      const requiresCookie = Array.isArray(security) && security.some((s) => s.RefreshTokenCookie !== undefined);
      const acceptsGuest = Array.isArray(security) && security.some((s) => s.GuestTokenAuth !== undefined);

      if (requiresBearer) {
        authConfig = {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: folderName === 'Admin' ? '{{adminAccessToken}}' : '{{accessToken}}',
              type: 'string',
            },
          ],
        };
      } else {
        authConfig = {
          type: 'noauth',
        };
      }

      if (requiresCookie) {
        headers.push({
          key: 'Cookie',
          value: 'al_azhari_refresh={{refreshToken}}',
          description: 'Secure HTTP-only refresh token session cookie',
        });
      }

      if (acceptsGuest) {
        headers.push({
          key: 'X-Guest-Token',
          value: '{{guestToken}}',
          description: 'Optional anonymous guest token for unauthenticated cart/checkout',
          disabled: true,
        });
      }

      // Request Body
      let requestBody: any = undefined;
      if (op.requestBody?.content?.['application/json']?.schema) {
        headers.push({
          key: 'Content-Type',
          value: 'application/json',
        });

        const bodySchema = op.requestBody.content['application/json'].schema;
        const bodyExample = generateSchemaExample(bodySchema, schemas);
        requestBody = {
          mode: 'raw',
          raw: JSON.stringify(bodyExample, null, 2),
          options: {
            raw: {
              language: 'json',
            },
          },
        };
      }

      // Test Script
      const testScripts: string[] = [];

      // Generic status code assertions
      const expectedCodes = Object.keys(op.responses || {})
        .filter((c) => /^[23]\d\d$/.test(c))
        .map((c) => Number(c));
      const expectedCodeList = expectedCodes.length > 0 ? expectedCodes : [200];

      testScripts.push(
        `pm.test("Status code is successful (${expectedCodeList.join('/')})", function () {`,
        `    pm.expect(pm.response.code).to.be.oneOf([${expectedCodeList.join(', ')}]);`,
        `});`,
        ``,
        `pm.test("Response envelope adheres to API contract", function () {`,
        `    const jsonData = pm.response.json();`,
        `    pm.expect(jsonData).to.be.an('object');`,
        `    pm.expect(jsonData.success).to.be.true;`,
        `});`
      );

      // Special Token Extraction for Auth Login / Register
      if (op.operationId === 'login' || op.operationId === 'register') {
        testScripts.push(
          ``,
          `pm.test("Extract and persist access token", function () {`,
          `    const jsonData = pm.response.json();`,
          `    if (jsonData.data && jsonData.data.accessToken) {`,
          `        pm.environment.set("accessToken", jsonData.data.accessToken);`,
          `        console.log("Updated accessToken in environment");`,
          `    }`,
          `});`
        );
      } else if (op.operationId === 'refreshToken') {
        testScripts.push(
          ``,
          `pm.test("Extract and update refreshed access token", function () {`,
          `    const jsonData = pm.response.json();`,
          `    if (jsonData.data && jsonData.data.accessToken) {`,
          `        pm.environment.set("accessToken", jsonData.data.accessToken);`,
          `        console.log("Refreshed accessToken in environment");`,
          `    }`,
          `});`
        );
      }

      // Response Examples (Contract & Error Responses)
      const responseExamples: any[] = [];

      // 1. Success Response Example
      for (const code of expectedCodes) {
        const respDef = op.responses[code];
        const contentSchema = respDef?.content?.['application/json']?.schema;
        let respBody = '';
        if (contentSchema) {
          const generated = generateSchemaExample(contentSchema, schemas);
          respBody = JSON.stringify(generated, null, 2);
        } else {
          respBody = JSON.stringify({ success: true, data: {} }, null, 2);
        }

        responseExamples.push({
          name: `${code} - ${respDef.description || 'Success Response'}`,
          originalRequest: {
            method,
            header: headers,
            body: requestBody,
            url: {
              raw: `${isRootUrl ? '{{rootUrl}}' : '{{baseUrl}}'}${postmanPath}`,
              host: urlHost,
              path: pathSegments,
              query: queryParams,
              variable: pathVariables,
            },
          },
          status: code === 201 ? 'Created' : 'OK',
          code,
          _postman_previewlanguage: 'json',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: respBody,
        });
      }

      // 2. Representative Error Response Examples from OpenAPI Responses
      const standardErrorCodes = [400, 401, 403, 404, 409, 422, 500];
      for (const errCode of standardErrorCodes) {
        if (op.responses[errCode]) {
          const errResp = op.responses[errCode];
          let errExample: any = null;
          if (errResp.$ref) {
            const resolved = resolveResponseRef(errResp.$ref, responses);
            errExample = resolved.content?.['application/json']?.example;
          } else if (errResp.content?.['application/json']?.example) {
            errExample = errResp.content['application/json'].example;
          }

          if (errExample) {
            responseExamples.push({
              name: `${errCode} - ${errResp.description || 'Error Response'}`,
              originalRequest: {
                method,
                header: headers,
                body: requestBody,
                url: {
                  raw: `${isRootUrl ? '{{rootUrl}}' : '{{baseUrl}}'}${postmanPath}`,
                  host: urlHost,
                  path: pathSegments,
                  query: queryParams,
                  variable: pathVariables,
                },
              },
              status: errCode === 400 ? 'Bad Request' : errCode === 401 ? 'Unauthorized' : errCode === 403 ? 'Forbidden' : errCode === 404 ? 'Not Found' : 'Error',
              code: errCode,
              _postman_previewlanguage: 'json',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: JSON.stringify(errExample, null, 2),
            });
          }
        }
      }

      const item = {
        name: op.summary || `${method} ${rawPath}`,
        request: {
          auth: authConfig,
          method,
          header: headers,
          body: requestBody,
          url: {
            raw: `${isRootUrl ? '{{rootUrl}}' : '{{baseUrl}}'}${postmanPath}${queryParams.length > 0 ? '?' + queryParams.map((q) => `${q.key}=${q.value}`).join('&') : ''}`,
            host: urlHost,
            path: pathSegments,
            query: queryParams.length > 0 ? queryParams : undefined,
            variable: pathVariables.length > 0 ? pathVariables : undefined,
          },
          description: `${op.description || ''}\n\n**Operation ID**: \`${op.operationId}\`\n**OpenAPI Path**: \`${method} ${rawPath}\``,
        },
        response: responseExamples,
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: testScripts,
            },
          },
        ],
      };

      if (!folderMap.has(folderName)) {
        folderMap.set(folderName, []);
      }
      folderMap.get(folderName)!.push(item);
    }
  }

  // Desired order of domain folders
  const domainOrder = [
    'Health',
    'Auth',
    'Users',
    'Addresses',
    'Categories',
    'Products',
    'Cart',
    'Orders',
    'Payments',
    'Services',
    'Pre-orders',
    'Returns',
    'Notifications',
    'WhatsApp',
    'Content',
    'Admin',
  ];

  const items: any[] = [];
  for (const domain of domainOrder) {
    if (folderMap.has(domain)) {
      items.push({
        name: domain,
        item: folderMap.get(domain),
        description: `Endpoints for ${domain} domain in AL-AZHARI LIBRARY.`,
      });
      folderMap.delete(domain);
    }
  }

  // Any remaining folders
  for (const [folderName, folderItems] of folderMap.entries()) {
    items.push({
      name: folderName,
      item: folderItems,
      description: `Endpoints for ${folderName} in AL-AZHARI LIBRARY.`,
    });
  }

  const collection = {
    info: {
      _postman_id: 'c1d2e3f4-a5b6-4c7d-8e9f-0123456789ab',
      name: 'AL-AZHARI LIBRARY API',
      description:
        '# AL-AZHARI LIBRARY API — Postman Collection v2.1\n\n' +
        'Authoritative Postman Collection generated directly from the canonical OpenAPI 3.0.3 contract (`src/config/openapi.ts`).\n\n' +
        '### Environments & Base URL\n' +
        '- Default Base URL: `{{baseUrl}}` (e.g. `http://localhost:5000/api/v1`)\n' +
        '- Root Base URL: `{{rootUrl}}` (e.g. `http://localhost:5000` for `/health` probes)\n\n' +
        '### Authentication\n' +
        '- **Bearer Token**: Protected routes require `Authorization: Bearer {{accessToken}}` or `{{adminAccessToken}}`.\n' +
        '- **Refresh Cookie**: Session refresh endpoint `/api/v1/auth/refresh` operates via `Cookie: al_azhari_refresh={{refreshToken}}`.\n' +
        '- **Guest Token**: Storefront cart/checkout allows anonymous session tokens via `X-Guest-Token: {{guestToken}}`.\n\n' +
        '### Security & Hygiene\n' +
        '- Zero real credentials, production secrets, or JWT tokens are committed.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: '1.0.0',
    },
    item: items,
  };

  return collection;
}

// Standalone execution to generate Postman collection file
if (require.main === module) {
  const outputPath = path.resolve(__dirname, '../postman/al-azhari-library.postman_collection.json');
  console.log('Generating Postman Collection v2.1 from OpenAPI 3.0.3...');
  const collection = generatePostmanCollection();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`✓ Postman Collection saved successfully to: ${outputPath}`);
}
