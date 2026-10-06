import { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/service.service';
export declare class ServiceController {
    private readonly services;
    constructor(services?: ServiceService);
    /**
     * GET /api/v1/services
     * Public list of active service categories
     */
    getServices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/services/:slug
     * Public service category details and active form configuration
     */
    getServiceBySlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/services/:slug/requests
     * Customer / Guest creates a new service request
     */
    createServiceRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/service-requests/:reference
     * Retrieves a single service request with strict customer ownership / admin validation
     */
    getServiceRequestByReference: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const serviceController: ServiceController;
