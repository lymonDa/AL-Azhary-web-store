import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from '../../config/cloudinary';
import { ValidationError, BusinessRuleViolationError } from '../../common/errors';
import { ErrorCodes } from '../../common/errors/errorCodes';
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

export class CloudinaryService {
  constructor() {
    if (cloudinaryConfig.isConfigured) {
      cloudinary.config({
        cloud_name: cloudinaryConfig.cloudName,
        api_key: cloudinaryConfig.apiKey,
        api_secret: cloudinaryConfig.apiSecret,
        secure: true,
      });
    }
  }

  /**
   * Generates a constrained, signed upload policy specifically for payment proof screenshots.
   * Scoped strictly to the payment proof folder and image resource type.
   * NEVER returns the apiSecret.
   */
  generatePaymentProofUploadConfig(_context: {
    orderReference: string;
    customerId?: string | null;
  }): SignedUploadConfig {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = cloudinaryConfig.folders.paymentProofs;
    const allowedFormats = ['png', 'jpeg', 'jpg', 'webp'];

    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    const apiSecret = cloudinaryConfig.apiSecret || 'development_test_secret';
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      cloudName: cloudinaryConfig.cloudName || 'demo',
      apiKey: cloudinaryConfig.apiKey || 'test_api_key',
      timestamp,
      folder,
      signature,
      resourceType: 'image',
      allowedFormats,
    };
  }

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
  }): IPaymentProofFile {
    if (!file.cloudinaryPublicId || typeof file.cloudinaryPublicId !== 'string') {
      throw new ValidationError('cloudinaryPublicId is required');
    }

    const expectedFolder = cloudinaryConfig.folders.paymentProofs;
    if (!file.cloudinaryPublicId.startsWith(expectedFolder)) {
      throw new BusinessRuleViolationError(
        ErrorCodes.CLOUDINARY_METADATA_INVALID,
        `Payment proof file must be uploaded to the dedicated folder "${expectedFolder}"`,
      );
    }

    if (file.resourceType !== 'image') {
      throw new BusinessRuleViolationError(
        ErrorCodes.CLOUDINARY_METADATA_INVALID,
        'Only image resource types are permitted for payment proofs',
      );
    }

    const normalizedFormat = file.format.toLowerCase().trim();
    const ALLOWED_FORMATS = ['png', 'jpeg', 'jpg', 'webp'];
    if (!ALLOWED_FORMATS.includes(normalizedFormat)) {
      throw new BusinessRuleViolationError(
        ErrorCodes.CLOUDINARY_METADATA_INVALID,
        `Unsupported image format "${file.format}". Allowed formats: ${ALLOWED_FORMATS.join(', ')}`,
      );
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10MB limit
    if (!Number.isInteger(file.bytes) || file.bytes <= 0 || file.bytes > MAX_BYTES) {
      throw new BusinessRuleViolationError(
        ErrorCodes.CLOUDINARY_METADATA_INVALID,
        `File size must be positive and not exceed 10MB (${MAX_BYTES} bytes)`,
      );
    }

    return {
      cloudinaryPublicId: file.cloudinaryPublicId.trim(),
      resourceType: 'image',
      format: normalizedFormat as 'png' | 'jpeg' | 'jpg' | 'webp',
      bytes: file.bytes,
      width: file.width ?? null,
      height: file.height ?? null,
    };
  }

  /**
   * Generates a short-lived private download/view URL for an authorized admin to review a proof.
   * Never persists the signed URL.
   */
  generatePrivateDownloadUrl(
    publicId: string,
    format: string,
    expiresInSeconds: number = 300,
  ): { signedUrl: string; expiresAt: Date } {
    const expiresAtUnix = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const expiresAt = new Date(expiresAtUnix * 1000);

    const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: 'image',
      type: 'upload',
      expires_at: expiresAtUnix,
    });

    return { signedUrl, expiresAt };
  }
}

export const cloudinaryService = new CloudinaryService();
