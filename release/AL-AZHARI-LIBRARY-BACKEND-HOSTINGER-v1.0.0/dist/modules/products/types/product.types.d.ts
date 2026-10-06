import { Types, Document } from 'mongoose';
import { LocalizedText } from '../../../common/types';
export type ProductAvailability = 'in_stock' | 'out_of_stock' | 'pre_order_eligible';
export interface IProductImage {
    publicId: string;
    resourceType: 'image';
    format: string;
    bytes: number;
    width: number;
    height: number;
    hash?: string;
}
export interface IProductMetadata {
    author?: string | null;
    grade?: string | null;
    stage?: string | null;
    subject?: string | null;
    publisher?: string | null;
    isbn?: string | null;
    educationType?: string | null;
}
export interface IReturnPolicyFlags {
    eligibleForReturn: boolean;
    windowDays: number;
}
export interface IVariant {
    variantId: string;
    attributes: Record<string, string>;
    label: LocalizedText;
    priceMinor: number;
    currency: 'EGP';
    availability: ProductAvailability;
    stockTotal: number;
    stockReserved: number;
    inventoryVersion?: number;
    preOrderEligible: boolean;
    sku?: string | null;
    images?: IProductImage[];
    updatedAt?: Date;
}
export interface IProduct {
    _id: Types.ObjectId;
    slug: string;
    name: LocalizedText;
    description?: {
        ar?: string;
        en?: string;
    } | null;
    categoryId: Types.ObjectId;
    images: IProductImage[];
    metadata: IProductMetadata;
    hasVariants: boolean;
    variants: IVariant[];
    availability: ProductAvailability;
    priceMinor: number;
    currency: 'EGP';
    preOrderEligible: boolean;
    isPublished: boolean;
    returnPolicyFlags: IReturnPolicyFlags;
    displayOrder: number;
    stockTotal: number;
    stockReserved: number;
    inventoryVersion?: number;
    searchText: string;
    createdAt: Date;
    updatedAt: Date;
}
export type IProductDocument = IProduct & Document<Types.ObjectId>;
export interface SafePublicVariant {
    variantId: string;
    attributes: Record<string, string>;
    label: LocalizedText;
    priceMinor: number;
    currency: 'EGP';
    availability: ProductAvailability;
    preOrderEligible: boolean;
    sku?: string | null;
    images?: IProductImage[];
}
export interface SafePublicProduct {
    id: string;
    slug: string;
    name: LocalizedText;
    description?: {
        ar?: string;
        en?: string;
    } | null;
    categoryId: string;
    images: IProductImage[];
    metadata: IProductMetadata;
    hasVariants: boolean;
    variants?: SafePublicVariant[];
    availability: ProductAvailability;
    priceMinor: number;
    currency: 'EGP';
    preOrderEligible: boolean;
    returnPolicyFlags: IReturnPolicyFlags;
    createdAt: Date;
}
export interface SafeAdminProduct extends SafePublicProduct {
    isPublished: boolean;
    displayOrder: number;
    stockTotal: number;
    stockReserved: number;
    inventoryVersion?: number;
    variants?: (SafePublicVariant & {
        stockTotal: number;
        stockReserved: number;
        inventoryVersion?: number;
    })[];
    updatedAt: Date;
}
export interface CreateVariantInput {
    variantId: string;
    attributes: Record<string, string>;
    label: LocalizedText;
    priceMinor: number;
    currency?: 'EGP';
    availability?: ProductAvailability;
    stockTotal?: number;
    stockReserved?: number;
    preOrderEligible?: boolean;
    sku?: string | null;
    images?: IProductImage[];
}
export interface CreateProductInput {
    slug: string;
    name: LocalizedText;
    description?: {
        ar?: string;
        en?: string;
    } | null;
    categoryId: string;
    images?: IProductImage[];
    metadata?: IProductMetadata;
    hasVariants?: boolean;
    variants?: CreateVariantInput[];
    availability?: ProductAvailability;
    priceMinor?: number;
    currency?: 'EGP';
    preOrderEligible?: boolean;
    isPublished?: boolean;
    returnPolicyFlags?: Partial<IReturnPolicyFlags>;
    displayOrder?: number;
    stockTotal?: number;
    stockReserved?: number;
}
export interface UpdateProductInput {
    slug?: string;
    name?: LocalizedText;
    description?: {
        ar?: string;
        en?: string;
    } | null;
    categoryId?: string;
    images?: IProductImage[];
    metadata?: IProductMetadata;
    hasVariants?: boolean;
    variants?: CreateVariantInput[];
    availability?: ProductAvailability;
    priceMinor?: number;
    currency?: 'EGP';
    preOrderEligible?: boolean;
    isPublished?: boolean;
    returnPolicyFlags?: Partial<IReturnPolicyFlags>;
    displayOrder?: number;
    stockTotal?: number;
    stockReserved?: number;
}
