import { IProductDocument, IProduct, SafePublicProduct, SafeAdminProduct, SafePublicVariant, IVariant } from '../types/product.types';
export declare function toSafePublicVariant(variant: IVariant): SafePublicVariant;
export declare function toSafePublicProduct(product: IProductDocument | IProduct | Record<string, unknown>): SafePublicProduct;
export declare function toSafeAdminProduct(product: IProductDocument | IProduct | Record<string, unknown>): SafeAdminProduct;
