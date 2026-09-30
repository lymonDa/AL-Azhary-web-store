import { Router } from 'express';
import { serviceController } from '../controllers/service.controller';
import { quotationController } from '../../quotations/controllers/quotation.controller';
import { optionalAuthentication } from '../../auth/middleware/auth.middleware';

// Public / Services Catalog Router (mounted at /services)
export const serviceRouter = Router();

// GET /services
serviceRouter.get('/', serviceController.getServices);

// GET /services/:slug
serviceRouter.get('/:slug', serviceController.getServiceBySlug);

// POST /services/:slug/requests
serviceRouter.post('/:slug/requests', optionalAuthentication(), serviceController.createServiceRequest);

// Customer Service Request Router (mounted at /service-requests)
export const serviceRequestRouter = Router();

// GET /service-requests/:reference
serviceRequestRouter.get(
  '/:reference',
  optionalAuthentication(),
  serviceController.getServiceRequestByReference,
);

// POST /service-requests/:reference/quotation/accept
serviceRequestRouter.post(
  '/:reference/quotation/accept',
  optionalAuthentication(),
  quotationController.acceptQuotation,
);

// POST /service-requests/:reference/quotation/reject
serviceRequestRouter.post(
  '/:reference/quotation/reject',
  optionalAuthentication(),
  quotationController.rejectQuotation,
);
