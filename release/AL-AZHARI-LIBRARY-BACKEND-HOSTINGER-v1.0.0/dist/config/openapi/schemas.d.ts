export declare const openApiSchemas: {
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
