export declare const openApiConfig: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
        };
        license: {
            name: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    tags: {
        name: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            BearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
                description: string;
            };
            RefreshTokenCookie: {
                type: string;
                in: string;
                name: string;
                description: string;
            };
            GuestTokenAuth: {
                type: string;
                in: string;
                name: string;
                description: string;
            };
        };
        responses: {
            BadRequest: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: {
                                code: string;
                                message: string;
                                fields: {
                                    path: string;
                                    code: string;
                                    message: string;
                                }[];
                                details: null;
                            };
                            requestId: string;
                            meta: {
                                requestId: string;
                                timestamp: string;
                            };
                        };
                    };
                };
            };
            Unauthorized: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: {
                                code: string;
                                message: string;
                                details: null;
                            };
                            requestId: string;
                            meta: {
                                requestId: string;
                                timestamp: string;
                            };
                        };
                    };
                };
            };
            Forbidden: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: {
                                code: string;
                                message: string;
                                details: null;
                            };
                            requestId: string;
                            meta: {
                                requestId: string;
                                timestamp: string;
                            };
                        };
                    };
                };
            };
            NotFound: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: {
                                code: string;
                                message: string;
                                details: null;
                            };
                            requestId: string;
                            meta: {
                                requestId: string;
                                timestamp: string;
                            };
                        };
                    };
                };
            };
            Conflict: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: {
                                code: string;
                                message: string;
                                details: null;
                            };
                            requestId: string;
                            meta: {
                                requestId: string;
                                timestamp: string;
                            };
                        };
                    };
                };
            };
            UnprocessableEntity: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: {
                                code: string;
                                message: string;
                                details: null;
                            };
                            requestId: string;
                            meta: {
                                requestId: string;
                                timestamp: string;
                            };
                        };
                    };
                };
            };
            TooManyRequests: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: {
                                code: string;
                                message: string;
                                details: null;
                            };
                            requestId: string;
                            meta: {
                                requestId: string;
                                timestamp: string;
                            };
                        };
                    };
                };
            };
            InternalServerError: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: {
                                code: string;
                                message: string;
                                details: null;
                            };
                            requestId: string;
                            meta: {
                                requestId: string;
                                timestamp: string;
                            };
                        };
                    };
                };
            };
        };
        schemas: {
            PaginationMeta: {
                type: string;
                properties: {
                    page: {
                        type: string;
                        example: number;
                    };
                    limit: {
                        type: string;
                        example: number;
                    };
                    total: {
                        type: string;
                        example: number;
                    };
                    totalPages: {
                        type: string;
                        example: number;
                    };
                    hasNextPage: {
                        type: string;
                        example: boolean;
                    };
                    hasPreviousPage: {
                        type: string;
                        example: boolean;
                    };
                    nextCursor: {
                        type: string;
                        nullable: boolean;
                        example: null;
                    };
                };
            };
            ResponseMeta: {
                type: string;
                required: string[];
                properties: {
                    requestId: {
                        type: string;
                        example: string;
                    };
                    pagination: {
                        $ref: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
            };
            ApiFieldError: {
                type: string;
                required: string[];
                properties: {
                    path: {
                        type: string;
                        example: string;
                    };
                    code: {
                        type: string;
                        example: string;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                };
            };
            ApiErrorPayload: {
                type: string;
                required: string[];
                properties: {
                    code: {
                        type: string;
                        enum: ("VALIDATION_ERROR" | "AUTH_REQUIRED" | "AUTH_INVALID_CREDENTIALS" | "AUTHENTICATION_FAILED" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "RESOURCE_CONFLICT" | "ORDER_STATE_CONFLICT" | "INSUFFICIENT_STOCK" | "IDEMPOTENCY_KEY_REUSED" | "PAYMENT_PROOF_REQUIRED" | "SHIPPING_CONFIGURATION_UNAVAILABLE" | "BUSINESS_RULE_VIOLATION" | "RATE_LIMITED" | "INTERNAL_ERROR" | "DEPENDENCY_UNAVAILABLE" | "BAD_REQUEST" | "PAYLOAD_TOO_LARGE" | "METHOD_NOT_ALLOWED" | "TOKEN_EXPIRED" | "TOKEN_INVALID" | "SESSION_REVOKED" | "AUTH_TOKEN_INVALID" | "AUTH_TOKEN_EXPIRED" | "AUTH_TOKEN_CONSUMED" | "CART_NOT_FOUND" | "CART_VERSION_CONFLICT" | "CART_ITEM_NOT_FOUND" | "PRODUCT_NOT_FOUND" | "PRODUCT_NOT_PURCHASABLE" | "VARIANT_REQUIRED" | "VARIANT_NOT_FOUND" | "VARIANT_NOT_PURCHASABLE" | "INVALID_QUANTITY" | "CART_OWNERSHIP_DENIED" | "CART_MERGE_CONFLICT" | "INVENTORY_NOT_FOUND" | "INVENTORY_VERSION_CONFLICT" | "INVENTORY_INVARIANT_VIOLATION" | "RESERVATION_NOT_FOUND" | "RESERVATION_ALREADY_RELEASED" | "RESERVATION_ALREADY_CONSUMED" | "INVENTORY_ADJUSTMENT_INVALID" | "ORDER_NOT_FOUND" | "ORDER_VERSION_CONFLICT" | "PRICE_CHANGED" | "AVAILABILITY_CHANGED" | "PAYMENT_METHOD_UNAVAILABLE" | "CART_EMPTY" | "PAYMENT_NOT_FOUND" | "PAYMENT_PROOF_NOT_REQUIRED" | "PAYMENT_PROOF_NOT_ALLOWED" | "PAYMENT_PROOF_INVALID" | "PAYMENT_PROOF_STATE_CONFLICT" | "PAYMENT_VERSION_CONFLICT" | "PAYMENT_REVIEW_FORBIDDEN" | "PAYMENT_ALREADY_CONFIRMED" | "PAYMENT_REVIEW_STATE_CONFLICT" | "CLOUDINARY_UPLOAD_CONFIGURATION_ERROR" | "CLOUDINARY_METADATA_INVALID" | "SHIPPING_RULE_NOT_FOUND" | "SHIPPING_NOT_SERVICEABLE" | "INVALID_FULFILLMENT" | "SHIPPING_VERSION_CONFLICT" | "COUPON_NOT_FOUND" | "COUPON_INACTIVE" | "COUPON_EXPIRED" | "COUPON_NOT_STARTED" | "COUPON_MINIMUM_NOT_MET" | "COUPON_NOT_APPLICABLE" | "COUPON_USAGE_LIMIT_REACHED" | "COUPON_ALREADY_REDEEMED" | "COUPON_VERSION_CONFLICT" | "COUPON_CODE_CONFLICT" | "SERVICE_NOT_FOUND" | "SERVICE_INACTIVE" | "INVALID_SERVICE_FORM" | "SERVICE_REQUEST_NOT_FOUND" | "SERVICE_OWNERSHIP_DENIED" | "INVALID_SERVICE_TRANSITION" | "QUOTATION_NOT_FOUND" | "QUOTE_STATE_CONFLICT" | "QUOTATION_OWNERSHIP_DENIED" | "QUOTATION_ALREADY_DECIDED" | "PAYMENT_UNAVAILABLE_BEFORE_ACCEPTANCE" | "UNSUPPORTED_SERVICE_PAYMENT_METHOD" | "ATTACHMENT_NOT_ALLOWED" | "RETURN_NOT_FOUND" | "RETURN_OWNERSHIP_DENIED" | "RETURN_NOT_ELIGIBLE" | "RETURN_ITEM_NOT_FOUND" | "RETURN_QUANTITY_INVALID" | "RETURN_STATE_CONFLICT" | "RETURN_ALREADY_EXISTS" | "RETURN_POLICY_UNAVAILABLE" | "REFUND_NOT_FOUND" | "REFUND_STATE_CONFLICT" | "REFUND_ALREADY_COMPLETED" | "REFUND_METHOD_UNAVAILABLE" | "REFUND_AMOUNT_UNAVAILABLE" | "NOTIFICATION_NOT_FOUND" | "NOTIFICATION_OWNERSHIP_DENIED" | "SOCKET_AUTHENTICATION_FAILED" | "SOCKET_UNAUTHORIZED_ROOM" | "EMAIL_DELIVERY_FAILED" | "PREORDER_NOT_FOUND" | "PREORDER_OWNERSHIP_DENIED" | "PREORDER_NOT_ELIGIBLE" | "PREORDER_NOT_OUT_OF_STOCK" | "PREORDER_STATE_CONFLICT" | "PREORDER_VERSION_CONFLICT" | "PREORDER_ALREADY_ACCEPTED")[];
                        example: string;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                    details: {
                        type: string;
                        nullable: boolean;
                    };
                    fields: {
                        type: string;
                        items: {
                            $ref: string;
                        };
                    };
                };
            };
            ApiErrorResponse: {
                type: string;
                required: string[];
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    error: {
                        $ref: string;
                    };
                    requestId: {
                        type: string;
                        example: string;
                    };
                    meta: {
                        type: string;
                        required: string[];
                        properties: {
                            requestId: {
                                type: string;
                                example: string;
                            };
                            timestamp: {
                                type: string;
                                format: string;
                                example: string;
                            };
                        };
                    };
                };
            };
            UserRole: {
                type: string;
                enum: ("customer" | "admin" | "owner")[];
                example: string;
            };
            UserStatus: {
                type: string;
                enum: string[];
                example: string;
            };
            OrderStatus: {
                type: string;
                enum: string[];
                example: string;
            };
            PaymentStatus: {
                type: string;
                enum: string[];
                example: string;
            };
            PaymentMethod: {
                type: string;
                enum: string[];
                example: string;
            };
            PreorderStatus: {
                type: string;
                enum: string[];
                example: string;
            };
            ReturnStatus: {
                type: string;
                enum: string[];
                example: string;
            };
            RefundStatus: {
                type: string;
                enum: string[];
                example: string;
            };
            RefundMethod: {
                type: string;
                enum: string[];
                example: string;
            };
            ServiceRequestStatus: {
                type: string;
                enum: string[];
                example: string;
            };
            NotificationType: {
                type: string;
                enum: string[];
                example: string;
            };
            CouponDiscountType: {
                type: string;
                enum: string[];
                example: string;
            };
            InventoryMovementType: {
                type: string;
                enum: string[];
                example: string;
            };
            LoginInput: {
                type: string;
                required: string[];
                properties: {
                    identifier: {
                        type: string;
                        example: string;
                        description: string;
                    };
                    password: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
            };
            RegisterInput: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        example: string;
                    };
                    phone: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        example: string;
                    };
                    email: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    password: {
                        type: string;
                        format: string;
                        minLength: number;
                        example: string;
                    };
                };
            };
            ForgotPasswordInput: {
                type: string;
                required: string[];
                properties: {
                    email: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
            };
            ResetPasswordInput: {
                type: string;
                required: string[];
                properties: {
                    token: {
                        type: string;
                        example: string;
                    };
                    password: {
                        type: string;
                        format: string;
                        minLength: number;
                        example: string;
                    };
                };
            };
            VerifyEmailInput: {
                type: string;
                required: string[];
                properties: {
                    token: {
                        type: string;
                        example: string;
                    };
                };
            };
            AuthResponseData: {
                type: string;
                required: string[];
                properties: {
                    user: {
                        $ref: string;
                    };
                    accessToken: {
                        type: string;
                        example: string;
                    };
                };
            };
            UserProfile: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    phone: {
                        type: string;
                        example: string;
                    };
                    email: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    role: {
                        $ref: string;
                    };
                    status: {
                        $ref: string;
                    };
                    emailVerified: {
                        type: string;
                        example: boolean;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            UpdateProfileInput: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        example: string;
                    };
                    phone: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        example: string;
                    };
                };
            };
            AddressDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    phone: {
                        type: string;
                        example: string;
                    };
                    governorate: {
                        type: string;
                        example: string;
                    };
                    city: {
                        type: string;
                        example: string;
                    };
                    district: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    line1: {
                        type: string;
                        example: string;
                    };
                    line2: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    postalCode: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    isDefault: {
                        type: string;
                        example: boolean;
                    };
                };
            };
            CreateAddressInput: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        example: string;
                    };
                    phone: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        example: string;
                    };
                    governorate: {
                        type: string;
                        example: string;
                    };
                    city: {
                        type: string;
                        example: string;
                    };
                    district: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    line1: {
                        type: string;
                        example: string;
                    };
                    line2: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    postalCode: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    isDefault: {
                        type: string;
                        default: boolean;
                    };
                };
            };
            UpdateAddressInput: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                    };
                    phone: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                    };
                    governorate: {
                        type: string;
                    };
                    city: {
                        type: string;
                    };
                    district: {
                        type: string;
                        nullable: boolean;
                    };
                    line1: {
                        type: string;
                    };
                    line2: {
                        type: string;
                        nullable: boolean;
                    };
                    postalCode: {
                        type: string;
                        nullable: boolean;
                    };
                    isDefault: {
                        type: string;
                    };
                };
            };
            CategoryDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    slug: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        required: string[];
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    description: {
                        type: string;
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    parentId: {
                        type: string;
                        nullable: boolean;
                        example: null;
                    };
                    active: {
                        type: string;
                        example: boolean;
                    };
                    sortOrder: {
                        type: string;
                        example: number;
                    };
                };
            };
            CreateCategoryInput: {
                type: string;
                required: string[];
                properties: {
                    slug: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        required: string[];
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    description: {
                        type: string;
                        properties: {
                            ar: {
                                type: string;
                            };
                            en: {
                                type: string;
                            };
                        };
                    };
                    parentId: {
                        type: string;
                        nullable: boolean;
                    };
                    active: {
                        type: string;
                        default: boolean;
                    };
                    sortOrder: {
                        type: string;
                        default: number;
                    };
                };
            };
            ProductVariantDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    sku: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    priceMinor: {
                        type: string;
                        example: number;
                        description: string;
                    };
                    stock: {
                        type: string;
                        example: number;
                    };
                    preOrderEligible: {
                        type: string;
                        example: boolean;
                    };
                };
            };
            ProductDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    slug: {
                        type: string;
                        example: string;
                    };
                    title: {
                        type: string;
                        required: string[];
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    description: {
                        type: string;
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    categoryId: {
                        type: string;
                        example: string;
                    };
                    author: {
                        type: string;
                        example: string;
                    };
                    publisher: {
                        type: string;
                        example: string;
                    };
                    editionYear: {
                        type: string;
                        example: number;
                    };
                    priceMinor: {
                        type: string;
                        example: number;
                        description: string;
                    };
                    currency: {
                        type: string;
                        example: string;
                    };
                    published: {
                        type: string;
                        example: boolean;
                    };
                    preOrderEligible: {
                        type: string;
                        example: boolean;
                    };
                    stock: {
                        type: string;
                        example: number;
                    };
                    variants: {
                        type: string;
                        items: {
                            $ref: string;
                        };
                    };
                    images: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
            };
            CreateProductInput: {
                type: string;
                required: string[];
                properties: {
                    slug: {
                        type: string;
                        example: string;
                    };
                    title: {
                        type: string;
                        required: string[];
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    description: {
                        type: string;
                        properties: {
                            ar: {
                                type: string;
                            };
                            en: {
                                type: string;
                            };
                        };
                    };
                    categoryId: {
                        type: string;
                    };
                    priceMinor: {
                        type: string;
                        minimum: number;
                        example: number;
                    };
                    author: {
                        type: string;
                    };
                    publisher: {
                        type: string;
                    };
                    stock: {
                        type: string;
                        minimum: number;
                        default: number;
                    };
                    preOrderEligible: {
                        type: string;
                        default: boolean;
                    };
                    published: {
                        type: string;
                        default: boolean;
                    };
                };
            };
            CartItemDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    productId: {
                        type: string;
                        example: string;
                    };
                    variantId: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    quantity: {
                        type: string;
                        example: number;
                    };
                    priceMinor: {
                        type: string;
                        example: number;
                    };
                    subtotalMinor: {
                        type: string;
                        example: number;
                    };
                    productTitle: {
                        type: string;
                        example: string;
                    };
                };
            };
            CartDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    items: {
                        type: string;
                        items: {
                            $ref: string;
                        };
                    };
                    subtotalMinor: {
                        type: string;
                        example: number;
                    };
                    discountMinor: {
                        type: string;
                        example: number;
                    };
                    totalMinor: {
                        type: string;
                        example: number;
                    };
                    couponCode: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    version: {
                        type: string;
                        example: number;
                    };
                };
            };
            AddToCartInput: {
                type: string;
                required: string[];
                properties: {
                    productId: {
                        type: string;
                        example: string;
                    };
                    variantId: {
                        type: string;
                        nullable: boolean;
                        example: string;
                    };
                    quantity: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                };
            };
            UpdateCartItemInput: {
                type: string;
                required: string[];
                properties: {
                    quantity: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        example: number;
                    };
                };
            };
            MergeCartInput: {
                type: string;
                required: string[];
                properties: {
                    guestToken: {
                        type: string;
                        example: string;
                    };
                };
            };
            ShippingEstimateInput: {
                type: string;
                required: string[];
                properties: {
                    governorate: {
                        type: string;
                        example: string;
                    };
                    city: {
                        type: string;
                        example: string;
                    };
                    postalCode: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            ShippingEstimateResult: {
                type: string;
                required: string[];
                properties: {
                    deliveryAvailable: {
                        type: string;
                        example: boolean;
                    };
                    costMinor: {
                        type: string;
                        example: number;
                        description: string;
                    };
                    currency: {
                        type: string;
                        example: string;
                    };
                    estimatedDays: {
                        type: string;
                        example: string;
                    };
                };
            };
            ValidateCouponInput: {
                type: string;
                required: string[];
                properties: {
                    code: {
                        type: string;
                        example: string;
                    };
                    cartSubtotalMinor: {
                        type: string;
                        minimum: number;
                        example: number;
                    };
                };
            };
            ValidateCouponResult: {
                type: string;
                required: string[];
                properties: {
                    valid: {
                        type: string;
                        example: boolean;
                    };
                    discountMinor: {
                        type: string;
                        example: number;
                    };
                    code: {
                        type: string;
                        example: string;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                };
            };
            CustomerContactSnapshot: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        example: string;
                    };
                    phone: {
                        type: string;
                        example: string;
                    };
                    email: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        example: string;
                    };
                };
            };
            OrderDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    reference: {
                        type: string;
                        example: string;
                    };
                    status: {
                        $ref: string;
                    };
                    paymentStatus: {
                        $ref: string;
                    };
                    paymentMethod: {
                        $ref: string;
                    };
                    customerSnapshot: {
                        $ref: string;
                    };
                    itemsTotalMinor: {
                        type: string;
                        example: number;
                    };
                    shippingCostMinor: {
                        type: string;
                        example: number;
                    };
                    discountMinor: {
                        type: string;
                        example: number;
                    };
                    totalMinor: {
                        type: string;
                        example: number;
                    };
                    currency: {
                        type: string;
                        example: string;
                    };
                    shippingAddress: {
                        $ref: string;
                    };
                    trackingNumber: {
                        type: string;
                        nullable: boolean;
                    };
                    carrier: {
                        type: string;
                        nullable: boolean;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            CreateOrderInput: {
                type: string;
                required: string[];
                properties: {
                    fulfillmentType: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                    paymentMethod: {
                        $ref: string;
                    };
                    contact: {
                        $ref: string;
                    };
                    shippingAddressId: {
                        type: string;
                        nullable: boolean;
                    };
                    shippingAddress: {
                        $ref: string;
                    };
                    couponCode: {
                        type: string;
                        nullable: boolean;
                    };
                    notes: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                    idempotencyKey: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            AdminUpdateOrderStatusInput: {
                type: string;
                required: string[];
                properties: {
                    status: {
                        $ref: string;
                    };
                    expectedVersion: {
                        type: string;
                        minimum: number;
                    };
                    note: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                };
            };
            AdminUpdateShippingInput: {
                type: string;
                required: string[];
                properties: {
                    carrier: {
                        type: string;
                        example: string;
                    };
                    trackingNumber: {
                        type: string;
                        example: string;
                    };
                    expectedVersion: {
                        type: string;
                        minimum: number;
                    };
                };
            };
            PaymentProofFile: {
                type: string;
                required: string[];
                properties: {
                    cloudinaryPublicId: {
                        type: string;
                        example: string;
                    };
                    resourceType: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                    format: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                    bytes: {
                        type: string;
                        example: number;
                    };
                    width: {
                        type: string;
                        nullable: boolean;
                        example: number;
                    };
                    height: {
                        type: string;
                        nullable: boolean;
                        example: number;
                    };
                    sha256: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            SubmitPaymentProofInput: {
                type: string;
                required: string[];
                properties: {
                    files: {
                        type: string;
                        items: {
                            $ref: string;
                        };
                        minItems: number;
                        maxItems: number;
                    };
                    customerNote: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                    idempotencyKey: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            AdminConfirmPaymentInput: {
                type: string;
                required: string[];
                properties: {
                    expectedVersion: {
                        type: string;
                        minimum: number;
                    };
                    note: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                };
            };
            AdminRejectPaymentInput: {
                type: string;
                required: string[];
                properties: {
                    reason: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                    };
                    expectedVersion: {
                        type: string;
                        minimum: number;
                    };
                };
            };
            AdminRequestNewProofInput: {
                type: string;
                required: string[];
                properties: {
                    note: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                    };
                    expectedVersion: {
                        type: string;
                        minimum: number;
                    };
                };
            };
            ServiceDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    slug: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        required: string[];
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    description: {
                        type: string;
                        properties: {
                            ar: {
                                type: string;
                                example: string;
                            };
                            en: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    formFields: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    active: {
                        type: string;
                        example: boolean;
                    };
                };
            };
            ServiceRequestDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    reference: {
                        type: string;
                        example: string;
                    };
                    serviceSlug: {
                        type: string;
                        example: string;
                    };
                    status: {
                        $ref: string;
                    };
                    formData: {
                        type: string;
                    };
                    contactSnapshot: {
                        $ref: string;
                    };
                    quotation: {
                        type: string;
                        nullable: boolean;
                        properties: {
                            amountMinor: {
                                type: string;
                                example: number;
                            };
                            currency: {
                                type: string;
                                example: string;
                            };
                            notes: {
                                type: string;
                                example: string;
                            };
                            quotedAt: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            CreateServiceRequestInput: {
                type: string;
                required: string[];
                properties: {
                    contact: {
                        $ref: string;
                    };
                    formData: {
                        type: string;
                        example: {
                            numberOfPages: number;
                            copies: number;
                            coverColor: string;
                        };
                        description: string;
                    };
                    customerNotes: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                };
            };
            AdminCreateQuoteInput: {
                type: string;
                required: string[];
                properties: {
                    amountMinor: {
                        type: string;
                        minimum: number;
                        example: number;
                    };
                    currency: {
                        type: string;
                        default: string;
                        example: string;
                    };
                    turnaroundDays: {
                        type: string;
                        minimum: number;
                        example: number;
                    };
                    notes: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                };
            };
            PreorderDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    reference: {
                        type: string;
                        example: string;
                    };
                    status: {
                        $ref: string;
                    };
                    productId: {
                        type: string;
                        example: string;
                    };
                    variantId: {
                        type: string;
                        nullable: boolean;
                        example: null;
                    };
                    requestedQuantity: {
                        type: string;
                        example: number;
                    };
                    capturedPriceMinor: {
                        type: string;
                        example: number;
                    };
                    currency: {
                        type: string;
                        example: string;
                    };
                    customerSnapshot: {
                        $ref: string;
                    };
                    expectedAvailabilityAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            CreatePreorderInput: {
                type: string;
                properties: {
                    variantId: {
                        type: string;
                        nullable: boolean;
                    };
                    quantity: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                    customer: {
                        $ref: string;
                    };
                    notes: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                };
            };
            AcceptPreorderInput: {
                type: string;
                properties: {
                    expectedVersion: {
                        type: string;
                        minimum: number;
                    };
                    expectedAvailabilityAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    adminNotes: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                };
            };
            ReturnDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    reference: {
                        type: string;
                        example: string;
                    };
                    orderReference: {
                        type: string;
                        example: string;
                    };
                    status: {
                        $ref: string;
                    };
                    reason: {
                        type: string;
                        example: string;
                    };
                    customerNotes: {
                        type: string;
                        nullable: boolean;
                    };
                    items: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            CreateReturnInput: {
                type: string;
                required: string[];
                properties: {
                    reason: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        example: string;
                    };
                    items: {
                        type: string;
                        items: {
                            type: string;
                            required: string[];
                            properties: {
                                orderItemId: {
                                    type: string;
                                    example: string;
                                };
                                quantity: {
                                    type: string;
                                    minimum: number;
                                    example: number;
                                };
                            };
                        };
                        minItems: number;
                    };
                    customerNotes: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                };
            };
            AdminDecideReturnInput: {
                type: string;
                required: string[];
                properties: {
                    decision: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                    reason: {
                        type: string;
                        nullable: boolean;
                        maxLength: number;
                    };
                    expectedVersion: {
                        type: string;
                        minimum: number;
                    };
                };
            };
            RefundDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    returnReference: {
                        type: string;
                        example: string;
                    };
                    status: {
                        $ref: string;
                    };
                    amountMinor: {
                        type: string;
                        example: number;
                    };
                    currency: {
                        type: string;
                        example: string;
                    };
                    method: {
                        $ref: string;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            NotificationDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    type: {
                        $ref: string;
                    };
                    title: {
                        type: string;
                        example: string;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                    read: {
                        type: string;
                        example: boolean;
                    };
                    data: {
                        type: string;
                        nullable: boolean;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            WhatsAppLinkResult: {
                type: string;
                required: string[];
                properties: {
                    url: {
                        type: string;
                        example: string;
                    };
                    disclaimer: {
                        type: string;
                        example: string;
                    };
                    disclaimerEn: {
                        type: string;
                        example: string;
                    };
                    context: {
                        type: string;
                        properties: {
                            product: {
                                type: string;
                                nullable: boolean;
                            };
                            orderReference: {
                                type: string;
                                nullable: boolean;
                            };
                            serviceReference: {
                                type: string;
                                nullable: boolean;
                            };
                        };
                    };
                };
            };
            CustomerWhatsAppLinkInput: {
                type: string;
                required: string[];
                properties: {
                    customerPhone: {
                        type: string;
                        example: string;
                    };
                    product: {
                        type: string;
                        nullable: boolean;
                    };
                    orderReference: {
                        type: string;
                        nullable: boolean;
                    };
                    serviceReference: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            AdjustInventoryInput: {
                type: string;
                required: string[];
                properties: {
                    productId: {
                        type: string;
                        example: string;
                    };
                    variantId: {
                        type: string;
                        nullable: boolean;
                    };
                    quantityDelta: {
                        type: string;
                        example: number;
                        description: string;
                    };
                    type: {
                        $ref: string;
                    };
                    reason: {
                        type: string;
                        example: string;
                    };
                };
            };
            CouponDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    code: {
                        type: string;
                        example: string;
                    };
                    discountType: {
                        $ref: string;
                    };
                    discountValue: {
                        type: string;
                        example: number;
                    };
                    minOrderAmountMinor: {
                        type: string;
                        nullable: boolean;
                        example: number;
                    };
                    maxDiscountAmountMinor: {
                        type: string;
                        nullable: boolean;
                        example: number;
                    };
                    usageLimit: {
                        type: string;
                        nullable: boolean;
                        example: number;
                    };
                    usageCount: {
                        type: string;
                        example: number;
                    };
                    active: {
                        type: string;
                        example: boolean;
                    };
                    startsAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    expiresAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                };
            };
            CreateCouponInput: {
                type: string;
                required: string[];
                properties: {
                    code: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                        example: string;
                    };
                    discountType: {
                        $ref: string;
                    };
                    discountValue: {
                        type: string;
                        minimum: number;
                        example: number;
                    };
                    minOrderAmountMinor: {
                        type: string;
                        nullable: boolean;
                    };
                    maxDiscountAmountMinor: {
                        type: string;
                        nullable: boolean;
                    };
                    usageLimit: {
                        type: string;
                        nullable: boolean;
                    };
                    active: {
                        type: string;
                        default: boolean;
                    };
                    startsAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    expiresAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                };
            };
            ShippingRuleDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    governorate: {
                        type: string;
                        example: string;
                    };
                    city: {
                        type: string;
                        nullable: boolean;
                    };
                    baseFeeMinor: {
                        type: string;
                        example: number;
                    };
                    freeAboveMinor: {
                        type: string;
                        nullable: boolean;
                        example: number;
                    };
                    estimatedDaysMin: {
                        type: string;
                        example: number;
                    };
                    estimatedDaysMax: {
                        type: string;
                        example: number;
                    };
                    active: {
                        type: string;
                        example: boolean;
                    };
                };
            };
            CreateShippingRuleInput: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        example: string;
                    };
                    governorate: {
                        type: string;
                        example: string;
                    };
                    city: {
                        type: string;
                        nullable: boolean;
                    };
                    baseFeeMinor: {
                        type: string;
                        minimum: number;
                        example: number;
                    };
                    freeAboveMinor: {
                        type: string;
                        nullable: boolean;
                    };
                    estimatedDaysMin: {
                        type: string;
                        default: number;
                    };
                    estimatedDaysMax: {
                        type: string;
                        default: number;
                    };
                    active: {
                        type: string;
                        default: boolean;
                    };
                };
            };
            AuditLogDto: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        example: string;
                    };
                    action: {
                        type: string;
                        example: string;
                    };
                    actor: {
                        type: string;
                        required: string[];
                        properties: {
                            userId: {
                                type: string;
                                example: string;
                            };
                            role: {
                                type: string;
                                example: string;
                            };
                            ip: {
                                type: string;
                                example: string;
                            };
                        };
                    };
                    entityType: {
                        type: string;
                        example: string;
                    };
                    entityId: {
                        type: string;
                        example: string;
                    };
                    details: {
                        type: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
            };
            ReportDto: {
                type: string;
                required: string[];
                properties: {
                    reportType: {
                        type: string;
                        example: string;
                    };
                    period: {
                        type: string;
                        example: string;
                    };
                    generatedAt: {
                        type: string;
                        format: string;
                    };
                    data: {
                        type: string;
                    };
                };
            };
        };
    };
    paths: {
        '/api/v1/admin/categories': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                categories: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                category: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/categories/{id}': {
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    name: {
                                        type: string;
                                    };
                                    description: {
                                        type: string;
                                    };
                                    active: {
                                        type: string;
                                    };
                                    sortOrder: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                category: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            delete: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                deleted: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/products': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                products: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                product: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/products/{id}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                product: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    title: {
                                        type: string;
                                    };
                                    description: {
                                        type: string;
                                    };
                                    priceMinor: {
                                        type: string;
                                    };
                                    published: {
                                        type: string;
                                    };
                                    preOrderEligible: {
                                        type: string;
                                    };
                                    expectedVersion: {
                                        type: string;
                                        minimum: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                product: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/content': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                modules: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    type: {
                                        type: string;
                                        example: string;
                                    };
                                    title: {
                                        type: string;
                                    };
                                    active: {
                                        type: string;
                                        default: boolean;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                module: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/content/{id}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                module: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    title: {
                                        type: string;
                                    };
                                    active: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                module: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            delete: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                deleted: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/inventory/{productId}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                inventory: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/inventory/{productId}/ledger': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                ledger: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/inventory/adjust': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                inventory: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/orders': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        $ref: string;
                        type?: undefined;
                        default?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        $ref?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                orders: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/orders/{reference}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/orders/{reference}/accept': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    expectedVersion: {
                                        type: string;
                                        minimum: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/orders/{reference}/reject': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    reason: {
                                        type: string;
                                        minLength: number;
                                        maxLength: number;
                                    };
                                    expectedVersion: {
                                        type: string;
                                        minimum: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/orders/{reference}/status': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/orders/{reference}/shipping': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/payments': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        $ref: string;
                        type?: undefined;
                        default?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        $ref?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                payments: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/payments/{paymentId}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                payment: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/payments/{paymentId}/confirm': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                payment: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/payments/{paymentId}/reject': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                payment: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/payments/{paymentId}/request-new-proof': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                payment: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/payments/{paymentId}/proofs/{submissionNumber}/signed-url': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                signedUrl: {
                                                    type: string;
                                                };
                                                expiresAt: {
                                                    type: string;
                                                    format: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/coupons': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                coupons: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                coupon: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/coupons/{id}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                coupon: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    discountValue: {
                                        type: string;
                                    };
                                    minOrderAmountMinor: {
                                        type: string;
                                    };
                                    maxDiscountAmountMinor: {
                                        type: string;
                                    };
                                    usageLimit: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                coupon: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/coupons/{id}/activate': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                coupon: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/coupons/{id}/deactivate': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                coupon: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/coupons/{id}/redemptions': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                redemptions: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/shipping/rules': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                rules: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                rule: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/shipping/rules/{id}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                rule: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    baseFeeMinor: {
                                        type: string;
                                    };
                                    freeAboveMinor: {
                                        type: string;
                                    };
                                    active: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                rule: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            delete: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                deleted: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/service-requests/{reference}/quotes': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                serviceRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/returns': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        $ref: string;
                        type?: undefined;
                        default?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        $ref?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                returns: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/returns/{reference}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                returnRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/returns/{reference}/approve': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    expectedVersion: {
                                        type: string;
                                        minimum: number;
                                    };
                                    instructions: {
                                        type: string;
                                        maxLength: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                returnRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/returns/{reference}/reject': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    reason: {
                                        type: string;
                                        minLength: number;
                                        maxLength: number;
                                    };
                                    expectedVersion: {
                                        type: string;
                                        minimum: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                returnRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/refunds': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        $ref: string;
                        type?: undefined;
                        default?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        $ref?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                refunds: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/refunds/{id}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                refund: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/refunds/{id}/complete': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    referenceNumber: {
                                        type: string;
                                        example: string;
                                    };
                                    expectedVersion: {
                                        type: string;
                                        minimum: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                refund: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/refunds/{id}/fail': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    reason: {
                                        type: string;
                                        minLength: number;
                                        maxLength: number;
                                    };
                                    expectedVersion: {
                                        type: string;
                                        minimum: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                refund: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/pre-orders': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        $ref: string;
                        type?: undefined;
                        default?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        $ref?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorders: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/pre-orders/{reference}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorder: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/pre-orders/{reference}/accept': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorder: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/pre-orders/{reference}/reject': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    reason: {
                                        type: string;
                                        minLength: number;
                                        maxLength: number;
                                    };
                                    expectedVersion: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorder: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/pre-orders/{reference}/available': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorder: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/pre-orders/{reference}/cancel': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    reason: {
                                        type: string;
                                        maxLength: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorder: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/whatsapp/customer-link': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/audit-logs': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                        default?: undefined;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        format?: undefined;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        maximum: number;
                        format?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                logs: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/admin/reports/{report}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        enum: string[];
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        enum?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/whatsapp/support': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        maxLength: number;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    422: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/whatsapp/link': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        maxLength: number;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    422: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/notifications': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                notifications: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/notifications/unread-count': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                unreadCount: {
                                                    type: string;
                                                    example: number;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/notifications/read-all': {
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                modifiedCount: {
                                                    type: string;
                                                    example: number;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/notifications/{id}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                notification: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/notifications/{id}/read': {
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                notification: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/returns': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        $ref: string;
                        type?: undefined;
                        default?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        $ref?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                returns: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/returns/{reference}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                returnRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/pre-orders': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        $ref: string;
                        type?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        $ref?: undefined;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        maximum: number;
                        $ref?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorders: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/pre-orders/{reference}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorder: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/pre-orders/{reference}/cancel': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    reason: {
                                        type: string;
                                        maxLength: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorder: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/services': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                services: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/services/{slug}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                service: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/services/{slug}/requests': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                } | {
                    BearerAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                serviceRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/service-requests/{reference}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                } | {
                    BearerAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                serviceRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/service-requests/{reference}/quotation/accept': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                } | {
                    BearerAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                serviceRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/service-requests/{reference}/quotation/reject': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                } | {
                    BearerAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    reason: {
                                        type: string;
                                        maxLength: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                serviceRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/orders': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    422: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/orders/{reference}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    shippingAddress: {
                                        $ref: string;
                                    };
                                    contact: {
                                        $ref: string;
                                    };
                                    notes: {
                                        type: string;
                                        maxLength: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/orders/{reference}/cancel': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/orders/{reference}/confirm-cod': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                order: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/orders/{reference}/payment': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                payment: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/orders/{reference}/payment-proof/upload-config': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                uploadConfig: {
                                                    type: string;
                                                    properties: {
                                                        cloudName: {
                                                            type: string;
                                                        };
                                                        apiKey: {
                                                            type: string;
                                                        };
                                                        timestamp: {
                                                            type: string;
                                                        };
                                                        folder: {
                                                            type: string;
                                                        };
                                                        signature: {
                                                            type: string;
                                                        };
                                                        resourceType: {
                                                            type: string;
                                                            example: string;
                                                        };
                                                        allowedFormats: {
                                                            type: string;
                                                            items: {
                                                                type: string;
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/orders/{reference}/payment-proofs': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                payment: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/orders/{orderReference}/returns': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                returnRequest: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/checkout/shipping-estimate': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    422: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/checkout/validate': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    422: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/cart': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                cart: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/cart/items': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                cart: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/cart/items/{itemId}': {
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                cart: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            delete: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                    GuestTokenAuth?: undefined;
                } | {
                    GuestTokenAuth: never[];
                    BearerAuth?: undefined;
                } | {
                    BearerAuth?: undefined;
                    GuestTokenAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                cart: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/categories': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                categories: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/products': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        enum?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                    description: string;
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        enum?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                    description?: undefined;
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        enum: string[];
                        default?: undefined;
                        maximum?: undefined;
                    };
                    description?: undefined;
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        enum?: undefined;
                        maximum?: undefined;
                    };
                    description?: undefined;
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        maximum: number;
                        enum?: undefined;
                    };
                    description?: undefined;
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                products: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        meta: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/products/{slug}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                product: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/products/{slug}/pre-orders': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: ({
                    BearerAuth: never[];
                } | {
                    BearerAuth?: undefined;
                })[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                preorder: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    422: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/search': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        minLength: number;
                        default?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default: number;
                        minLength?: undefined;
                    };
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                products: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                                categories: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/content/home': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                modules: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/me': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/addresses': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                addresses: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                address: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/addresses/{id}': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                address: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            patch: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                address: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
            delete: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                deleted: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    403: {
                        $ref: string;
                    };
                    404: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/cart/merge': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                cart: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/auth/register': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    409: {
                        $ref: string;
                    };
                    429: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/auth/login': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    401: {
                        $ref: string;
                    };
                    429: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/auth/refresh': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    RefreshTokenCookie: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                accessToken: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/auth/logout': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                security: {
                    BearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    allSessions: {
                                        type: string;
                                        default: boolean;
                                        description: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                message: {
                                                    type: string;
                                                    example: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/auth/verify-email': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                verified: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/auth/forgot-password': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                message: {
                                                    type: string;
                                                    example: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    429: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/auth/reset-password': {
            post: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                reset: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/health': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                example: {
                                    success: boolean;
                                    data: {
                                        status: string;
                                        database: string;
                                    };
                                    requestId: string;
                                    meta: {
                                        requestId: string;
                                        timestamp: string;
                                    };
                                };
                            };
                        };
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/health/live': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                example: {
                                    success: boolean;
                                    data: {
                                        status: string;
                                    };
                                    requestId: string;
                                };
                            };
                        };
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/health/ready': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                example: {
                                    success: boolean;
                                    data: {
                                        status: string;
                                        database: string;
                                    };
                                    requestId: string;
                                };
                            };
                        };
                    };
                    503: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/v1/health': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                example: {
                                    success: boolean;
                                    data: {
                                        status: string;
                                        version: string;
                                        database: string;
                                    };
                                    requestId: string;
                                };
                            };
                        };
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/health/live': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                example: {
                                    success: boolean;
                                    data: {
                                        status: string;
                                    };
                                };
                            };
                        };
                    };
                    500: {
                        $ref: string;
                    };
                };
            };
        };
        '/api/v1/health/ready': {
            get: {
                operationId: string;
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                example: {
                                    success: boolean;
                                    data: {
                                        status: string;
                                        database: string;
                                    };
                                };
                            };
                        };
                    };
                    503: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
};
