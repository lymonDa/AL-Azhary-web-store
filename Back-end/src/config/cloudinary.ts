import { env } from './env';

export const cloudinaryConfig = {
  cloudName: env.CLOUDINARY_CLOUD_NAME,
  apiKey: env.CLOUDINARY_API_KEY,
  apiSecret: env.CLOUDINARY_API_SECRET,
  folders: {
    paymentProofs: env.CLOUDINARY_PAYMENT_PROOF_FOLDER,
    products: env.CLOUDINARY_PRODUCT_FOLDER,
  },
  isConfigured: Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  ),
};
