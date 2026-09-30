import { IServiceCategoryDocument, IServiceRequestDocument } from '../types/service.types';
import { IQuotationDocument } from '../../quotations/types/quotation.types';

export function toPublicServiceCategory(category: IServiceCategoryDocument) {
  return {
    slug: category.slug,
    name: category.name,
    description: category.description ?? null,
    kind: category.kind,
    formVersion: category.formVersion,
    fields: (category.fields || [])
      .filter((f) => f.active)
      .map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.options ?? [],
      })),
    communicationChannels: category.communicationChannels,
    pricingMode: category.pricingMode,
    turnaroundText: category.turnaroundText ?? null,
    codAllowed: category.codAllowed ?? null,
  };
}

export function toSafeServiceRequest(
  request: IServiceRequestDocument,
  quotation?: IQuotationDocument | null,
) {
  // Never expose draft quotation to customer
  const safeQuotation =
    quotation && quotation.status !== 'draft'
      ? {
          amountMinor: quotation.amountMinor,
          currency: quotation.currency,
          status: quotation.status,
          version: quotation.version,
          customerDecisionAt: quotation.customerDecisionAt ?? null,
          decisionNote: quotation.decisionNote ?? null,
          acceptedAt: quotation.acceptedAt ?? null,
          rejectedAt: quotation.rejectedAt ?? null,
        }
      : null;

  return {
    reference: request.reference,
    status: request.status,
    serviceCategory: request.serviceCategorySnapshot,
    customer: request.customerSnapshot,
    submittedFields: request.submittedFields || {},
    description: request.description,
    quotation: safeQuotation,
    quotationId: safeQuotation ? request.quotationId : null,
    paymentId: request.paymentId ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}
