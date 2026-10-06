import { ServiceCategoryRepository } from '../repositories/service-category.repository';
import { ServiceRequestRepository } from '../repositories/service-request.repository';
import { IServiceRequestDocument, CreateServiceRequestInput, ServiceCategoryPublicProjection } from '../types/service.types';
import { toSafeServiceRequest } from '../utils/service.projection';
import { AuditService } from '../../audit/services/audit.service';
import { OutboxService } from '../../notifications/services/outbox.service';
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
export declare class ServiceService {
    private readonly categoryRepo;
    private readonly requestRepo;
    private readonly audit;
    private readonly outbox;
    constructor(categoryRepo?: ServiceCategoryRepository, requestRepo?: ServiceRequestRepository, audit?: AuditService, outbox?: OutboxService);
    /**
     * Retrieves all active service categories (Public).
     */
    getActiveCategories(): Promise<ServiceCategoryPublicProjection[]>;
    /**
     * Retrieves a single active service category by slug (Public).
     */
    getCategoryBySlug(slug: string): Promise<ServiceCategoryPublicProjection>;
    /**
     * Validates submitted dynamic form fields against the category's active form definition.
     * Strict validation: rejects unknown fields, missing required fields, and type mismatches.
     */
    private validateFormFields;
    /**
     * Submits a new Service Request (Guest or Customer).
     * Generates reference, validates form against active category configuration,
     * rejects attachments, records audit and outbox side effects atomically.
     */
    createServiceRequest(slug: string, input: CreateServiceRequestInput, access: ServiceAccessContext): Promise<{
        request: IServiceRequestDocument;
        guestAccessToken?: string;
    }>;
    /**
     * Retrieves service request by reference with strict ownership validation.
     */
    getServiceRequestByReference(reference: string, access: ServiceAccessContext): Promise<ReturnType<typeof toSafeServiceRequest>>;
}
export declare const serviceService: ServiceService;
