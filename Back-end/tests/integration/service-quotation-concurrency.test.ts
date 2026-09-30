import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ServiceCategoryModel } from '../../src/modules/services/models/service-category.model';
import { ServiceRequestModel } from '../../src/modules/services/models/service-request.model';
import { QuotationModel } from '../../src/modules/quotations/models/quotation.model';
import { PaymentModel } from '../../src/modules/payments/models/payment.model';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';
import { AuditLogModel } from '../../src/modules/audit/models/audit-log.model';
import { quotationService } from '../../src/modules/quotations/services/quotation.service';
import { serviceService } from '../../src/modules/services/services/service.service';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Service & Quotation Concurrency Tests (Phase 11)', () => {
  let customerId: Types.ObjectId;
  let adminUserId: Types.ObjectId;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    customerId = new Types.ObjectId();
    adminUserId = new Types.ObjectId();

    await ServiceCategoryModel.create({
      slug: 'binding',
      name: { ar: 'تجليد الكتب', en: 'Book Binding' },
      description: { ar: 'تجليد فاخر وعادي', en: 'Binding services' },
      kind: 'binding',
      isActive: true,
      formVersion: 1,
      codAllowed: false,
      fields: [
        {
          key: 'coverType',
          label: { ar: 'نوع الغلاف', en: 'Cover Type' },
          type: 'text',
          required: true,
        },
      ],
    });
  });

  it('handles two simultaneous quotation acceptance attempts with exactly 1 payment created and no race condition', async () => {
    // 1. Create service request
    const { request: serviceRequest } = await serviceService.createServiceRequest(
      'binding',
      {
        description: 'Hardcover binding for Quran commentary',
        submittedFields: { coverType: 'leather' },
        contact: {
          name: 'Tariq',
          phone: '+201011112222',
        },
      },
      {
        userId: customerId.toString(),
        role: 'customer',
      },
    );

    // 2. Admin creates quotation
    const quotation = await quotationService.createAndSendQuotation(
      serviceRequest.reference,
      {
        amountMinor: 12000, // 120.00 EGP
        currency: 'EGP',
        note: 'High quality leather binding',
      },
      {
        userId: adminUserId.toString(),
        role: 'admin',
      },
    );
    expect(quotation.status).toBe('sent');
    expect(quotation.version).toBe(1);

    // 3. Fire 2 simultaneous customer acceptance requests
    const acceptPromises = [
      quotationService.acceptQuotation(
        serviceRequest.reference,
        { expectedVersion: 1 },
        { userId: customerId.toString(), role: 'customer' },
      ),
      quotationService.acceptQuotation(
        serviceRequest.reference,
        { expectedVersion: 1 },
        { userId: customerId.toString(), role: 'customer' },
      ),
    ];

    const results = await Promise.allSettled(acceptPromises);

    // One must succeed, while the second either succeeds idempotently (if it saw status=accepted)
    // or fails with QUOTE_STATE_CONFLICT due to optimistic locking version conflict
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    if (rejected.length > 0) {
      const err = (rejected[0] as PromiseRejectedResult).reason;
      expect([ErrorCodes.QUOTE_STATE_CONFLICT, ErrorCodes.RESOURCE_CONFLICT]).toContain(err.code);
    }

    // Critical assertion: Exactly ONE payment record must exist in MongoDB
    const payments = await PaymentModel.find({ ownerType: 'serviceQuotation', ownerId: quotation._id });
    expect(payments.length).toBe(1);
    expect(payments[0].amountDueMinor).toBe(12000);
    expect(payments[0].currency).toBe('EGP');

    // Service request must be awaiting_payment
    const dbReq = await ServiceRequestModel.findOne({ reference: serviceRequest.reference });
    expect(dbReq?.status).toBe('awaiting_payment');
    expect(dbReq?.paymentId?.toString()).toBe(payments[0]._id.toString());
  });

  it('handles simultaneous accept and reject: exactly one decision wins, no corrupt mixed state', async () => {
    // 1. Create service request
    const { request: serviceRequest } = await serviceService.createServiceRequest(
      'binding',
      {
        description: 'Spiral binding for notes',
        submittedFields: { coverType: 'plastic' },
        contact: {
          name: 'Hassan',
          phone: '+201033334444',
        },
      },
      {
        userId: customerId.toString(),
        role: 'customer',
      },
    );

    // 2. Admin creates quotation
    const quotation = await quotationService.createAndSendQuotation(
      serviceRequest.reference,
      {
        amountMinor: 4000,
        currency: 'EGP',
      },
      {
        userId: adminUserId.toString(),
        role: 'admin',
      },
    );

    // 3. Race accept vs reject simultaneously
    const racePromises = [
      quotationService.acceptQuotation(
        serviceRequest.reference,
        { expectedVersion: 1 },
        { userId: customerId.toString(), role: 'customer' },
      ),
      quotationService.rejectQuotation(
        serviceRequest.reference,
        { expectedVersion: 1, note: 'Changed my mind' },
        { userId: customerId.toString(), role: 'customer' },
      ),
    ];

    const results = await Promise.allSettled(racePromises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one operation must succeed, and the other must be rejected due to conflict
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const failedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect([ErrorCodes.QUOTE_STATE_CONFLICT, ErrorCodes.QUOTATION_ALREADY_DECIDED]).toContain(failedReason.code);

    // Final state check: database must reflect whichever operation won cleanly
    const finalQuote = await QuotationModel.findById(quotation._id);
    const finalReq = await ServiceRequestModel.findOne({ reference: serviceRequest.reference });
    const payments = await PaymentModel.find({ ownerType: 'serviceQuotation', ownerId: quotation._id });

    if (finalQuote?.status === 'accepted') {
      expect(finalReq?.status).toBe('awaiting_payment');
      expect(payments.length).toBe(1);
    } else {
      expect(finalQuote?.status).toBe('rejected');
      expect(finalReq?.status).toBe('closed_not_proceeding');
      expect(payments.length).toBe(0);
    }
  });

  it('persists outbox events and audit logs transactionally upon quote acceptance', async () => {
    const { request: serviceRequest } = await serviceService.createServiceRequest(
      'binding',
      {
        description: 'Hardcover binding',
        submittedFields: { coverType: 'leather' },
        contact: {
          name: 'Zaid',
          phone: '+201055556666',
        },
      },
      {
        userId: customerId.toString(),
        role: 'customer',
      },
    );

    const quotation = await quotationService.createAndSendQuotation(
      serviceRequest.reference,
      {
        amountMinor: 8500,
        currency: 'EGP',
      },
      {
        userId: adminUserId.toString(),
        role: 'admin',
      },
    );

    await quotationService.acceptQuotation(
      serviceRequest.reference,
      {},
      { userId: customerId.toString(), role: 'customer', requestId: 'req-audit-test' },
    );

    // Verify Outbox Event created
    const outbox = await OutboxEventModel.findOne({
      aggregateId: quotation._id.toString(),
      eventType: 'quotation.accepted',
    });
    expect(outbox).toBeDefined();

    // Verify Audit Log created
    const audit = await AuditLogModel.findOne({
      entityId: quotation._id.toString(),
      action: 'quotation_accepted',
    });
    expect(audit).toBeDefined();
    expect(audit?.metadata).toMatchObject({
      amountDueMinor: 8500,
      serviceReference: serviceRequest.reference,
    });
  });
});
