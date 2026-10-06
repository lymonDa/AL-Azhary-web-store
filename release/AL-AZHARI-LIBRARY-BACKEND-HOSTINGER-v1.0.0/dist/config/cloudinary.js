"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryConfig = void 0;
const env_1 = require("./env");
exports.cloudinaryConfig = {
    cloudName: env_1.env.CLOUDINARY_CLOUD_NAME,
    apiKey: env_1.env.CLOUDINARY_API_KEY,
    apiSecret: env_1.env.CLOUDINARY_API_SECRET,
    folders: {
        paymentProofs: env_1.env.CLOUDINARY_PAYMENT_PROOF_FOLDER,
        products: env_1.env.CLOUDINARY_PRODUCT_FOLDER,
    },
    isConfigured: Boolean(env_1.env.CLOUDINARY_CLOUD_NAME && env_1.env.CLOUDINARY_API_KEY && env_1.env.CLOUDINARY_API_SECRET),
};
//# sourceMappingURL=cloudinary.js.map