import { IPaymentProofFile } from '../../modules/payments/types/payment.types';
export interface SignedUploadConfig {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    signature: string;
    resourceType: 'image';
    allowedFormats: string[];
}
export declare class CloudinaryService {
    constructor();
    /**
     * Generates a constrained, signed upload policy specifically for payment proof screenshots.
     * Scoped strictly to the payment proof folder and image resource type.
     * NEVER returns the apiSecret.
     */
    generatePaymentProofUploadConfig(_context: {
        orderReference: string;
        customerId?: string | null;
    }): SignedUploadConfig;
    /**
     * Validates metadata of uploaded payment proof files against security constraints.
     */
    validatePaymentProofFile(file: {
        cloudinaryPublicId: string;
        resourceType: string;
        format: string;
        bytes: number;
        width?: number | null;
        height?: number | null;
    }): IPaymentProofFile;
    /**
     * Generates a short-lived private download/view URL for an authorized admin to review a proof.
     * Never persists the signed URL.
     */
    generatePrivateDownloadUrl(publicId: string, format: string, expiresInSeconds?: number): {
        signedUrl: string;
        expiresAt: Date;
    };
}
export declare const cloudinaryService: CloudinaryService;
