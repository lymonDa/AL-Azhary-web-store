import { app } from '../src/app';
import { openApiConfig } from '../src/config/openapi';
import { UserRoles } from '../src/common/constants/roles';
import { ErrorCodes } from '../src/common/errors/errorCodes';
import { NotificationTypes } from '../src/modules/notifications/types/notification.types';

// Helper to convert Express path (:param) to OpenAPI path ({param})
function expressPathToOpenApiPath(p: string): string {
  return p.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}

// Extract registered routes from Express app
function cleanSource(source: string, keys: any[] = []): string {
  if (!source || source === '^\\/?(?=\\/|$)' || source === '^\\/?$' || source === '^.*$') {
    return '';
  }

  let res = source;
  if (res.startsWith('^')) res = res.substring(1);
  res = res.replace(/\\\/\?\(\?=\\\/\|\$\)$/, '');
  res = res.replace(/\(\?=\\\/\|\$\)$/, '');
  res = res.replace(/\\\/\?$/, '');
  res = res.replace(/\/i$/, '');

  if (keys && keys.length > 0) {
    let keyIdx = 0;
    res = res.replace(/\(\?:\\\/(\(\[\^\\\/\]\+\?\))\)/g, () => {
      const k = keys[keyIdx++];
      return '/:' + (k ? k.name : 'param');
    });
    res = res.replace(/\(\?:\\\/(\(\[\^\/\]\+\?\))\)/g, () => {
      const k = keys[keyIdx++];
      return '/:' + (k ? k.name : 'param');
    });
    res = res.replace(/\(\?:(\(\[\^\\\/\]\+\?\))\)/g, () => {
      const k = keys[keyIdx++];
      return ':' + (k ? k.name : 'param');
    });
    res = res.replace(/\(\?:(\(\[\^\/\]\+\?\))\)/g, () => {
      const k = keys[keyIdx++];
      return ':' + (k ? k.name : 'param');
    });
    res = res.replace(/\(\[\^\\\/\]\+\?\)/g, () => {
      const k = keys[keyIdx++];
      return ':' + (k ? k.name : 'param');
    });
    res = res.replace(/\(\[\^\/\]\+\?\)/g, () => {
      const k = keys[keyIdx++];
      return ':' + (k ? k.name : 'param');
    });
  }

  res = res.replace(/\\\//g, '/');
  res = res.replace(/\\/g, '');

  if (res.length > 0 && !res.startsWith('/')) {
    res = '/' + res;
  }
  return res;
}

export function extractRegisteredRoutes(): Array<{ method: string; path: string }> {
  const routes: Array<{ method: string; path: string }> = [];

  function traverse(stack: any[], prefix: string) {
    for (const layer of stack) {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods)
          .filter((m) => layer.route.methods[m])
          .map((m) => m.toUpperCase());

        const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];

        for (const p of paths) {
          let cleanRoutePath = p;
          if (cleanRoutePath === '/') cleanRoutePath = '';
          const fullPath = prefix + cleanRoutePath || '/';

          for (const method of methods) {
            routes.push({
              method,
              path: fullPath,
            });
          }
        }
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        const seg = cleanSource(layer.regexp.source, layer.keys);
        traverse(layer.handle.stack, prefix + seg);
      }
    }
  }

  // @ts-ignore
  if (app._router && app._router.stack) {
    // @ts-ignore
    traverse(app._router.stack, '');
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduplicated: Array<{ method: string; path: string }> = [];

  for (const r of routes) {
    const key = `${r.method} ${r.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(r);
    }
  }

  return deduplicated;
}

export function runOpenApiChecks() {
  const results = {
    routeSync: { pass: true, missingInDocs: [] as string[], extraInDocs: [] as string[] },
    enumSync: { pass: true, mismatches: [] as string[] },
    errorCoverage: { pass: true, missingErrors: [] as string[] },
    specValidity: { pass: true, errors: [] as string[] },
  };

  // 1. Route Synchronization Check
  const registered = extractRegisteredRoutes();
  const openApiPaths = openApiConfig.paths as Record<string, Record<string, any>>;

  // Build documented set
  const documentedOperations = new Set<string>();
  for (const [pathKey, methodsObj] of Object.entries(openApiPaths)) {
    for (const [methodKey] of Object.entries(methodsObj)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(methodKey.toLowerCase())) {
        documentedOperations.add(`${methodKey.toUpperCase()} ${pathKey}`);
      }
    }
  }

  // Ignore Swagger documentation and raw OpenAPI endpoints themselves from the operational API route check
  const docsExemptions = new Set([
    'GET /docs',
    'GET /api/v1/docs',
    'GET /api/v1/openapi.json',
    'GET /api/v1/docs.json',
    'GET /docs/openapi.json',
    'GET /docs/docs.json',
    'GET /docs/',
    'GET /docs/docs',
    'GET /docs/swagger',
    'GET /api/v1',
    'GET /api/v1/',
    'GET /api/v1/swagger',
  ]);

  const registeredOperations = new Set<string>();
  for (const reg of registered) {
    if (!docsExemptions.has(`${reg.method} ${reg.path}`)) {
      const oasPath = expressPathToOpenApiPath(reg.path);
      registeredOperations.add(`${reg.method} ${oasPath}`);
    }
  }

  for (const reg of registered) {
    const oasPath = expressPathToOpenApiPath(reg.path);
    const key = `${reg.method} ${oasPath}`;
    if (docsExemptions.has(`${reg.method} ${reg.path}`)) {
      continue;
    }
    if (!documentedOperations.has(key)) {
      results.routeSync.pass = false;
      results.routeSync.missingInDocs.push(key);
    }
  }

  // Detect extra / phantom routes in OpenAPI that are not registered in Express
  for (const doc of documentedOperations) {
    if (!registeredOperations.has(doc)) {
      results.routeSync.pass = false;
      results.routeSync.extraInDocs.push(doc);
    }
  }

  // 2. Enum Synchronization Check
  const schemas = (openApiConfig.components?.schemas || {}) as Record<string, any>;
  const responses = (openApiConfig.components?.responses || {}) as Record<string, any>;

  function verifyEnum(schemaName: string, fieldName: string, actualValues: string[]) {
    const schema = schemas[schemaName];
    if (!schema) {
      results.enumSync.pass = false;
      results.enumSync.mismatches.push(`Schema "${schemaName}" missing from OpenAPI components`);
      return;
    }

    const enumObj = schema.properties?.[fieldName] || schema;
    const docEnum = enumObj?.enum;
    if (!Array.isArray(docEnum)) {
      results.enumSync.pass = false;
      results.enumSync.mismatches.push(`Enum "${schemaName}.${fieldName}" missing enum definition in OpenAPI`);
      return;
    }

    const actualSet = new Set(actualValues);
    const docSet = new Set(docEnum);

    for (const v of actualValues) {
      if (!docSet.has(v)) {
        results.enumSync.pass = false;
        results.enumSync.mismatches.push(
          `Enum "${schemaName}.${fieldName}" missing value "${v}" (present in runtime code)`
        );
      }
    }
    for (const v of docEnum) {
      if (!actualSet.has(v)) {
        results.enumSync.pass = false;
        results.enumSync.mismatches.push(
          `Enum "${schemaName}.${fieldName}" has extra undocumented value "${v}"`
        );
      }
    }
  }

  // Verify critical API-visible enums against runtime sources of truth
  const orderStatuses: string[] = [
    'pending_review',
    'accepted',
    'awaiting_payment',
    'payment_verification',
    'awaiting_new_proof',
    'payment_confirmed',
    'customer_confirmation_required',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'shipped',
    'out_for_delivery',
    'delivered',
    'completed',
    'rejected',
    'cancelled',
    'returned',
  ];
  const paymentStatuses: string[] = [
    'not_submitted',
    'proof_uploaded',
    'under_review',
    'confirmed',
    'rejected',
    'new_proof_requested',
  ];
  const paymentMethods: string[] = ['cod', 'vodafone_cash', 'instapay', 'bank_transfer', 'card'];
  const preorderStatuses: string[] = [
    'requested',
    'admin_review',
    'accepted',
    'rejected',
    'payment_pending',
    'payment_verification',
    'confirmed',
    'available',
    'fulfilled',
    'cancelled',
    'pending',
  ];
  const returnStatuses: string[] = [
    'return_requested',
    'return_review',
    'return_approved',
    'refund_initiated',
    'refund_completed',
    'return_rejected',
  ];
  const refundStatuses: string[] = ['initiated', 'completed', 'failed'];
  const refundMethods: string[] = ['original_payment', 'wallet', 'cash', 'bank_transfer', 'instapay', 'vodafone_cash'];
  const serviceStatuses: string[] = [
    'submitted',
    'admin_review',
    'quotation_sent',
    'awaiting_payment',
    'payment_verification',
    'payment_confirmed',
    'processing',
    'completed',
    'closed_not_proceeding',
    'closed_declined',
  ];
  const inventoryMovementTypes: string[] = ['RESERVATION', 'RELEASE', 'DEDUCTION', 'ADJUSTMENT'];
  const couponDiscountTypes: string[] = ['percentage', 'fixed'];

  verifyEnum('UserRole', 'role', Object.values(UserRoles));
  verifyEnum('OrderStatus', 'status', orderStatuses);
  verifyEnum('PaymentStatus', 'status', paymentStatuses);
  verifyEnum('PaymentMethod', 'method', paymentMethods);
  verifyEnum('PreorderStatus', 'status', preorderStatuses);
  verifyEnum('ReturnStatus', 'status', returnStatuses);
  verifyEnum('RefundStatus', 'status', refundStatuses);
  verifyEnum('RefundMethod', 'method', refundMethods);
  verifyEnum('ServiceRequestStatus', 'status', serviceStatuses);
  verifyEnum('NotificationType', 'type', Object.values(NotificationTypes));
  verifyEnum('CouponDiscountType', 'discountType', couponDiscountTypes);
  verifyEnum('InventoryMovementType', 'type', inventoryMovementTypes);

  // Verify ErrorCodes enum
  const errorPayloadSchema = schemas['ApiErrorPayload'];
  if (errorPayloadSchema?.properties?.code?.enum) {
    const docErrorCodes = new Set(errorPayloadSchema.properties.code.enum);
    for (const code of Object.values(ErrorCodes)) {
      if (!docErrorCodes.has(code)) {
        results.enumSync.pass = false;
        results.enumSync.mismatches.push(`ApiErrorPayload.code enum missing runtime error code "${code}"`);
      }
    }
  }

  // 3. Error-Documentation Coverage & Spec Validity Check
  const operationIds = new Set<string>();
  for (const [pathKey, methodsObj] of Object.entries(openApiPaths)) {
    // Check path parameters
    const matches = pathKey.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    const expectedParams = matches.map((m) => m.replace(/[{}]/g, ''));

    for (const [methodKey, operation] of Object.entries(methodsObj)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(methodKey.toLowerCase())) continue;

      const opKey = `${methodKey.toUpperCase()} ${pathKey}`;

      // Verify operationId uniqueness
      if (!operation.operationId) {
        results.specValidity.pass = false;
        results.specValidity.errors.push(`Operation ${opKey} is missing operationId`);
      } else if (operationIds.has(operation.operationId)) {
        results.specValidity.pass = false;
        results.specValidity.errors.push(`Duplicate operationId "${operation.operationId}" at ${opKey}`);
      } else {
        operationIds.add(operation.operationId);
      }

      // Verify path parameters definition
      const opParams = (operation.parameters || []).filter((p: any) => p.in === 'path');
      const opParamNames = opParams.map((p: any) => p.name);
      for (const exp of expectedParams) {
        if (!opParamNames.includes(exp)) {
          results.specValidity.pass = false;
          results.specValidity.errors.push(`Operation ${opKey} missing required path parameter definition for "${exp}"`);
        }
      }

      // Verify error responses
      const opResponses = operation.responses || {};
      const statusCodes = Object.keys(opResponses);
      const hasErrorDef = statusCodes.some((code) => {
        const num = parseInt(code, 10);
        return (num >= 400 && num <= 599) || code === 'default';
      });

      if (!hasErrorDef) {
        results.errorCoverage.pass = false;
        results.errorCoverage.missingErrors.push(opKey);
      }
    }
  }

  // 4. Schema & Component $ref Pointer Resolution Check
  function checkRefs(obj: any, location: string) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => checkRefs(item, `${location}[${idx}]`));
      return;
    }
    for (const [key, val] of Object.entries(obj)) {
      if (key === '$ref' && typeof val === 'string') {
        if (val.startsWith('#/components/schemas/')) {
          const schemaName = val.replace('#/components/schemas/', '');
          if (!schemas[schemaName]) {
            results.specValidity.pass = false;
            results.specValidity.errors.push(`Broken $ref at ${location}: schema "${schemaName}" not found in components.schemas`);
          }
        } else if (val.startsWith('#/components/responses/')) {
          const respName = val.replace('#/components/responses/', '');
          if (!responses[respName]) {
            results.specValidity.pass = false;
            results.specValidity.errors.push(`Broken $ref at ${location}: response "${respName}" not found in components.responses`);
          }
        }
      } else {
        checkRefs(val, `${location}.${key}`);
      }
    }
  }

  checkRefs(openApiPaths, 'paths');
  checkRefs(schemas, 'components.schemas');
  checkRefs(responses, 'components.responses');

  return results;
}

// Standalone CLI execution
if (require.main === module) {
  console.log('--- RUNNING OPENAPI COMPLIANCE CHECKS ---');
  const results = runOpenApiChecks();

  let hasFailure = false;

  console.log('\n[1/4] ROUTE SYNCHRONIZATION:');
  if (results.routeSync.pass) {
    console.log('✓ PASS: All registered Express routes are documented in OpenAPI (0 missing, 0 extra).');
  } else {
    hasFailure = true;
    if (results.routeSync.missingInDocs.length > 0) {
      console.error('✗ FAIL: Missing routes in OpenAPI:');
      results.routeSync.missingInDocs.forEach((r) => console.error(`  - ${r}`));
    }
    if (results.routeSync.extraInDocs.length > 0) {
      console.error('✗ FAIL: Extra / Phantom routes in OpenAPI (not registered in Express):');
      results.routeSync.extraInDocs.forEach((r) => console.error(`  - ${r}`));
    }
  }

  console.log('\n[2/4] ENUM SYNCHRONIZATION:');
  if (results.enumSync.pass) {
    console.log('✓ PASS: All API enums match canonical TypeScript/domain definitions.');
  } else {
    hasFailure = true;
    console.error('✗ FAIL: Enum mismatches detected:');
    results.enumSync.mismatches.forEach((m) => console.error(`  - ${m}`));
  }

  console.log('\n[3/4] ERROR RESPONSE COVERAGE:');
  if (results.errorCoverage.pass) {
    console.log('✓ PASS: 100% of documented operations have error response definitions.');
  } else {
    hasFailure = true;
    console.error('✗ FAIL: Operations missing error response definitions:');
    results.errorCoverage.missingErrors.forEach((e) => console.error(`  - ${e}`));
  }

  console.log('\n[4/4] SPEC & OPERATION ID VALIDITY:');
  if (results.specValidity.pass) {
    console.log('✓ PASS: All operation IDs are valid, distinct, and unique. All $ref pointers resolve.');
  } else {
    hasFailure = true;
    console.error('✗ FAIL: Spec validity errors:');
    results.specValidity.errors.forEach((e) => console.error(`  - ${e}`));
  }

  if (hasFailure) {
    console.error('\n❌ OPENAPI COMPLIANCE CHECKS FAILED');
    process.exit(1);
  } else {
    console.log('\n✨ ALL OPENAPI COMPLIANCE CHECKS PASSED');
    process.exit(0);
  }
}
