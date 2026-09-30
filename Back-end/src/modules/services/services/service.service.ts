import { Types, ClientSession } from 'mongoose';
import {
  serviceCategoryRepository,
  ServiceCategoryRepository,
} from '../repositories/service-category.repository';
import {
  serviceRequestRepository,
  ServiceRequestRepository,
} from '../repositories/service-request.repository';
import {
  IServiceCategoryDocument,
  IServiceRequestDocument,
  CreateServiceRequestInput,
  ServiceCategoryPublicProjection,
} from '../types/service.types';
import { toPublicServiceCategory, toSafeServiceRequest } from '../utils/service.projection';
import { generateServiceReference } from '../utils/service.utils';
import { generateGuestAccessToken, hashGuestToken } from '../../orders/utils/order.utils';
import { withTransaction } from '../../../database/transaction';
import { auditService, AuditService } from '../../audit/services/audit.service';
import { outboxService, OutboxService } from '../../notifications/services/outbox.service';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  BusinessRuleViolationError,
} from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { RepositoryContext } from '../../../common/types';
import { QuotationModel } from '../../quotations/models/quotation.model';
import { usersRepository } from '../../users/repositories/users.repository';

export interface ServiceAccessContext {
  userId?: string;
  role?: string;
  guestToken?: string;
  requestId?: string;
  ipHash?: string;
  userSnapshot?: {
    name: string;
    phone: string;
    email?: string | null;
  };
}

export class ServiceService {
  constructor(
    private readonly categoryRepo: ServiceCategoryRepository = serviceCategoryRepository,
    private readonly requestRepo: ServiceRequestRepository = serviceRequestRepository,
    private readonly audit: AuditService = auditService,
    private readonly outbox: OutboxService = outboxService,
  ) {}

  /**
   * Retrieves all active service categories (Public).
   */
  async getActiveCategories(): Promise<ServiceCategoryPublicProjection[]> {
    const categories = await this.categoryRepo.findActive();
    return categories.map(toPublicServiceCategory);
  }

  /**
   * Retrieves a single active service category by slug (Public).
   */
  async getCategoryBySlug(slug: string): Promise<ServiceCategoryPublicProjection> {
    const category = await this.categoryRepo.findBySlug(slug);
    if (!category || !category.isActive) {
      throw new NotFoundError(
        `Service category not found: ${slug}`,
        ErrorCodes.SERVICE_NOT_FOUND,
      );
    }
    return toPublicServiceCategory(category);
  }

  /**
   * Validates submitted dynamic form fields against the category's active form definition.
   * Strict validation: rejects unknown fields, missing required fields, and type mismatches.
   */
  private validateFormFields(
    category: IServiceCategoryDocument,
    submittedFields: Record<string, unknown> = {},
  ): void {
    const activeFields = (category.fields || []).filter((f) => f.active);
    const activeFieldMap = new Map(activeFields.map((f) => [f.key, f]));

    // Check for missing required fields
    for (const field of activeFields) {
      if (field.required) {
        const val = submittedFields[field.key];
        if (val === undefined || val === null || val === '') {
          throw new ValidationError(
            `Missing required field: ${field.key}`,
            { field: field.key },
            ErrorCodes.INVALID_SERVICE_FORM,
          );
        }
      }
    }

    // Check submitted fields for type validity and unknown keys
    for (const [key, val] of Object.entries(submittedFields)) {
      const fieldDef = activeFieldMap.get(key);
      if (!fieldDef) {
        throw new ValidationError(
          `Unknown field submitted for service "${category.slug}": ${key}`,
          { field: key },
          ErrorCodes.INVALID_SERVICE_FORM,
        );
      }

      if (val === undefined || val === null || val === '') {
        continue;
      }

      switch (fieldDef.type) {
        case 'number':
          if (typeof val !== 'number' || isNaN(val)) {
            throw new ValidationError(
              `Field "${key}" must be a number`,
              { field: key, expected: 'number' },
              ErrorCodes.INVALID_SERVICE_FORM,
            );
          }
          break;
        case 'boolean':
          if (typeof val !== 'boolean') {
            throw new ValidationError(
              `Field "${key}" must be a boolean`,
              { field: key, expected: 'boolean' },
              ErrorCodes.INVALID_SERVICE_FORM,
            );
          }
          break;
        case 'select':
          if (typeof val !== 'string' || (fieldDef.options && !fieldDef.options.includes(val))) {
            throw new ValidationError(
              `Invalid option for field "${key}". Allowed: ${fieldDef.options?.join(', ')}`,
              { field: key, allowed: fieldDef.options },
              ErrorCodes.INVALID_SERVICE_FORM,
            );
          }
          break;
        case 'text':
        case 'textarea':
          if (typeof val !== 'string') {
            throw new ValidationError(
              `Field "${key}" must be a string`,
              { field: key, expected: 'string' },
              ErrorCodes.INVALID_SERVICE_FORM,
            );
          }
          break;
      }
    }
  }

  /**
   * Submits a new Service Request (Guest or Customer).
   * Generates reference, validates form against active category configuration,
   * rejects attachments, records audit and outbox side effects atomically.
   */
  async createServiceRequest(
    slug: string,
    input: CreateServiceRequestInput,
    access: ServiceAccessContext,
  ): Promise<{
    request: IServiceRequestDocument;
    guestAccessToken?: string;
  }> {
    const category = await this.categoryRepo.findBySlug(slug);
    if (!category) {
      throw new NotFoundError(
        `Service category not found: ${slug}`,
        ErrorCodes.SERVICE_NOT_FOUND,
      );
    }

    if (!category.isActive) {
      throw new BusinessRuleViolationError(
        ErrorCodes.SERVICE_INACTIVE,
        `Service category "${slug}" is currently inactive`,
      );
    }

    // Server-authoritative dynamic form validation
    const submittedFields = input.submittedFields || {};
    this.validateFormFields(category, submittedFields);

    // Resolve customer / guest contact information
    let customerId: Types.ObjectId | null = null;
    let guestAccessToken: string | undefined;
    let guestAccessTokenHash: string | null = null;
    let contactName: string;
    let contactPhone: string;
    let contactEmail: string | null = null;

    if (access.userId) {
      customerId = new Types.ObjectId(access.userId);
      let userDoc = null;
      if (!input.contact?.phone || !input.contact?.name) {
        userDoc = await usersRepository.findById(access.userId);
      }
      contactName = input.contact?.name || access.userSnapshot?.name || userDoc?.name || 'Customer';
      contactPhone = input.contact?.phone || access.userSnapshot?.phone || userDoc?.phone || '';
      contactEmail = input.contact?.email ?? access.userSnapshot?.email ?? userDoc?.email ?? null;

      if (!contactPhone) {
        throw new ValidationError(
          'Contact phone is required for service request',
          { field: 'contact.phone' },
        );
      }
    } else {
      // Guest submission requires explicit contact details
      if (!input.contact?.name || !input.contact?.phone) {
        throw new ValidationError(
          'Guest service requests require contact name and phone number',
          { field: 'contact' },
        );
      }
      contactName = input.contact.name.trim();
      contactPhone = input.contact.phone.trim();
      contactEmail = input.contact.email?.trim() || null;

      const guestTokens = generateGuestAccessToken();
      guestAccessToken = guestTokens.rawToken;
      guestAccessTokenHash = guestTokens.tokenHash;
    }

    const reference = generateServiceReference();

    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session, requestId: access.requestId };

      const request = await this.requestRepo.create(
        {
          reference,
          customerId,
          guestAccessTokenHash,
          customerSnapshot: {
            name: contactName,
            phone: contactPhone,
            email: contactEmail,
          },
          serviceCategoryId: category._id,
          serviceCategorySnapshot: {
            slug: category.slug,
            name: category.name,
            formVersion: category.formVersion,
          },
          submittedFields,
          description: input.description.trim(),
          status: 'admin_review',
          quotationId: null,
          paymentId: null,
          communicationContext: input.communicationContext ?? null,
          statusHistory: [
            {
              status: 'admin_review',
              changedBy: customerId,
              changedAt: new Date(),
              reason: 'Service request submitted by customer',
            },
          ],
          version: 1,
        },
        ctx,
      );

      // Persist outbox event for downstream notification (Phase 13/14)
      await this.outbox.record(
        {
          eventType: 'service_request.created',
          aggregateType: 'ServiceRequest',
          aggregateId: request._id.toString(),
          payload: {
            reference: request.reference,
            serviceCategoryId: category._id.toString(),
            serviceSlug: category.slug,
            customerId: customerId ? customerId.toString() : null,
            status: request.status,
            customerName: contactName,
            customerPhone: contactPhone,
          },
          dedupeKey: `service_request_created:${request._id.toString()}`,
        },
        session,
      );

      // Record audit log
      await this.audit.record({
        actorId: access.userId ?? undefined,
        actorRole: access.role ?? 'guest',
        action: 'service_request_created',
        entityType: 'serviceRequest',
        entityId: request.reference,
        newState: { status: 'admin_review' },
        metadata: {
          reference: request.reference,
          categorySlug: category.slug,
          formVersion: category.formVersion,
        },
        requestId: access.requestId,
        ipHash: access.ipHash,
      });

      return { request, guestAccessToken };
    });
  }

  /**
   * Retrieves service request by reference with strict ownership validation.
   */
  async getServiceRequestByReference(
    reference: string,
    access: ServiceAccessContext,
  ): Promise<ReturnType<typeof toSafeServiceRequest>> {
    const request = await this.requestRepo.findByReference(reference);
    if (!request) {
      throw new NotFoundError(
        `Service request not found: ${reference}`,
        ErrorCodes.SERVICE_REQUEST_NOT_FOUND,
      );
    }

    // Admin / Owner bypass
    if (access.role === 'admin' || access.role === 'owner') {
      let quoteDoc = null;
      if (request.quotationId) {
        quoteDoc = await QuotationModel.findById(request.quotationId);
      }
      return toSafeServiceRequest(request, quoteDoc);
    }

    // Registered Customer ownership
    if (access.userId) {
      if (request.customerId && request.customerId.toString() === access.userId) {
        let quoteDoc = null;
        if (request.quotationId) {
          quoteDoc = await QuotationModel.findById(request.quotationId);
        }
        return toSafeServiceRequest(request, quoteDoc);
      }
      throw new ForbiddenError(
        'You do not have permission to view this service request',
        ErrorCodes.SERVICE_OWNERSHIP_DENIED,
      );
    }

    // Guest Token Access
    if (access.guestToken) {
      const hashed = hashGuestToken(access.guestToken);
      if (request.guestAccessTokenHash === hashed) {
        let quoteDoc = null;
        if (request.quotationId) {
          quoteDoc = await QuotationModel.findById(request.quotationId);
        }
        return toSafeServiceRequest(request, quoteDoc);
      }
      throw new ForbiddenError(
        'Invalid guest service access token',
        ErrorCodes.SERVICE_OWNERSHIP_DENIED,
      );
    }

    throw new ForbiddenError(
      'Authentication or guest access token required to view this service request',
      ErrorCodes.SERVICE_OWNERSHIP_DENIED,
    );
  }
}

export const serviceService = new ServiceService();
