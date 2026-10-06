import { IServiceCategoryDocument, IServiceRequestDocument } from '../types/service.types';
import { IQuotationDocument } from '../../quotations/types/quotation.types';
export declare function toPublicServiceCategory(category: IServiceCategoryDocument): {
    slug: string;
    name: {
        ar: string;
        en?: string;
    };
    description: {
        ar: string;
        en?: string;
    } | null;
    kind: import("../types/service.types").ServiceCategoryKind;
    formVersion: number;
    fields: {
        key: string;
        label: {
            ar: string;
            en?: string;
        };
        type: import("../types/service.types").ServiceFormFieldType;
        required: boolean;
        options: string[];
    }[];
    communicationChannels: string[];
    pricingMode: "quotation";
    turnaroundText: {
        ar: string;
        en?: string;
    } | null;
    codAllowed: boolean | null;
};
export declare function toSafeServiceRequest(request: IServiceRequestDocument, quotation?: IQuotationDocument | null): {
    reference: string;
    status: import("../types/service.types").ServiceRequestStatus;
    serviceCategory: import("../types/service.types").IServiceCategorySnapshot;
    customer: import("../types/service.types").IServiceRequestCustomerSnapshot;
    submittedFields: Record<string, unknown>;
    description: string;
    quotation: {
        amountMinor: number;
        currency: "EGP";
        status: "accepted" | "rejected" | "sent";
        version: number;
        customerDecisionAt: Date | null;
        decisionNote: string | null;
        acceptedAt: Date | null;
        rejectedAt: Date | null;
    } | null;
    quotationId: import("mongoose").Types.ObjectId | null | undefined;
    paymentId: import("mongoose").Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
};
