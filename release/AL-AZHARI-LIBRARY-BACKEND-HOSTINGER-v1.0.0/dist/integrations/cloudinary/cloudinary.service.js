"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryService = exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
const cloudinary_2 = require("../../config/cloudinary");
const errors_1 = require("../../common/errors");
const errorCodes_1 = require("../../common/errors/errorCodes");
class CloudinaryService {
    constructor() {
        if (cloudinary_2.cloudinaryConfig.isConfigured) {
            cloudinary_1.v2.config({
                cloud_name: cloudinary_2.cloudinaryConfig.cloudName,
                api_key: cloudinary_2.cloudinaryConfig.apiKey,
                api_secret: cloudinary_2.cloudinaryConfig.apiSecret,
                secure: true,
            });
        }
    }
    /**
     * Generates a constrained, signed upload policy specifically for payment proof screenshots.
     * Scoped strictly to the payment proof folder and image resource type.
     * NEVER returns the apiSecret.
     */
    generatePaymentProofUploadConfig(_context) {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = cloudinary_2.cloudinaryConfig.folders.paymentProofs;
        const allowedFormats = ['png', 'jpeg', 'jpg', 'webp'];
        const paramsToSign = {
            folder,
            timestamp,
        };
        const apiSecret = cloudinary_2.cloudinaryConfig.apiSecret || 'development_test_secret';
        const signature = cloudinary_1.v2.utils.api_sign_request(paramsToSign, apiSecret);
        return {
            cloudName: cloudinary_2.cloudinaryConfig.cloudName || 'demo',
            apiKey: cloudinary_2.cloudinaryConfig.apiKey || 'test_api_key',
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
    validatePaymentProofFile(file) {
        if (!file.cloudinaryPublicId || typeof file.cloudinaryPublicId !== 'string') {
            throw new errors_1.ValidationError('cloudinaryPublicId is required');
        }
        const expectedFolder = cloudinary_2.cloudinaryConfig.folders.paymentProofs;
        if (!file.cloudinaryPublicId.startsWith(expectedFolder)) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.CLOUDINARY_METADATA_INVALID, `Payment proof file must be uploaded to the dedicated folder "${expectedFolder}"`);
        }
        if (file.resourceType !== 'image') {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.CLOUDINARY_METADATA_INVALID, 'Only image resource types are permitted for payment proofs');
        }
        const normalizedFormat = file.format.toLowerCase().trim();
        const ALLOWED_FORMATS = ['png', 'jpeg', 'jpg', 'webp'];
        if (!ALLOWED_FORMATS.includes(normalizedFormat)) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.CLOUDINARY_METADATA_INVALID, `Unsupported image format "${file.format}". Allowed formats: ${ALLOWED_FORMATS.join(', ')}`);
        }
        const MAX_BYTES = 10 * 1024 * 1024; // 10MB limit
        if (!Number.isInteger(file.bytes) || file.bytes <= 0 || file.bytes > MAX_BYTES) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.CLOUDINARY_METADATA_INVALID, `File size must be positive and not exceed 10MB (${MAX_BYTES} bytes)`);
        }
        return {
            cloudinaryPublicId: file.cloudinaryPublicId.trim(),
            resourceType: 'image',
            format: normalizedFormat,
            bytes: file.bytes,
            width: file.width ?? null,
            height: file.height ?? null,
        };
    }
    /**
     * Generates a short-lived private download/view URL for an authorized admin to review a proof.
     * Never persists the signed URL.
     */
    generatePrivateDownloadUrl(publicId, format, expiresInSeconds = 300) {
        const expiresAtUnix = Math.floor(Date.now() / 1000) + expiresInSeconds;
        const expiresAt = new Date(expiresAtUnix * 1000);
        const signedUrl = cloudinary_1.v2.utils.private_download_url(publicId, format, {
            resource_type: 'image',
            type: 'upload',
            expires_at: expiresAtUnix,
        });
        return { signedUrl, expiresAt };
    }
}
exports.CloudinaryService = CloudinaryService;
exports.cloudinaryService = new CloudinaryService();
//# sourceMappingURL=cloudinary.service.js.map