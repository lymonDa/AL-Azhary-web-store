import { ErrorCodes } from '../../common/errors/errorCodes';
import { UserRoles } from '../../common/constants/roles';

export const openApiSchemas = {
  // Common Response Envelopes
  PaginationMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 100 },
      totalPages: { type: 'integer', example: 5 },
      hasNextPage: { type: 'boolean', example: true },
      hasPreviousPage: { type: 'boolean', example: false },
      nextCursor: { type: 'string', nullable: true, example: null },
    },
  },
  ResponseMeta: {
    type: 'object',
    required: ['requestId'],
    properties: {
      requestId: { type: 'string', example: 'req_clz123456789' },
      pagination: { $ref: '#/components/schemas/PaginationMeta' },
      timestamp: { type: 'string', format: 'date-time', example: '2026-10-02T19:00:00.000Z' },
    },
  },
  ApiFieldError: {
    type: 'object',
    required: ['path', 'code'],
    properties: {
      path: { type: 'string', example: 'email' },
      code: { type: 'string', example: 'invalid_string' },
      message: { type: 'string', example: 'Invalid email address' },
    },
  },
  ApiErrorPayload: {
    type: 'object',
    required: ['code', 'message'],
    properties: {
      code: {
        type: 'string',
        enum: Object.values(ErrorCodes),
        example: 'VALIDATION_ERROR',
      },
      message: { type: 'string', example: 'Request validation failed' },
      details: { type: 'object', nullable: true },
      fields: {
        type: 'array',
        items: { $ref: '#/components/schemas/ApiFieldError' },
      },
    },
  },
  ApiErrorResponse: {
    type: 'object',
    required: ['success', 'error', 'requestId', 'meta'],
    properties: {
      success: { type: 'boolean', example: false },
      error: { $ref: '#/components/schemas/ApiErrorPayload' },
      requestId: { type: 'string', example: 'req_clz123456789' },
      meta: {
        type: 'object',
        required: ['requestId'],
        properties: {
          requestId: { type: 'string', example: 'req_clz123456789' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-10-02T19:00:00.000Z' },
        },
      },
    },
  },

  // Domain Enums
  UserRole: {
    type: 'string',
    enum: [UserRoles.CUSTOMER, UserRoles.ADMIN, UserRoles.OWNER],
    example: 'customer',
  },
  UserStatus: {
    type: 'string',
    enum: ['active', 'suspended', 'deactivated'],
    example: 'active',
  },
  OrderStatus: {
    type: 'string',
    enum: [
      'pending_review',
      'accepted',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'rejected',
    ],
    example: 'pending_review',
  },
  PaymentStatus: {
    type: 'string',
    enum: [
      'pending',
      'proof_submitted',
      'under_review',
      'confirmed',
      'rejected',
      'refunded',
      'failed',
    ],
    example: 'pending',
  },
  PaymentMethod: {
    type: 'string',
    enum: ['cod', 'vodafone_cash', 'instapay', 'bank_transfer', 'card'],
    example: 'vodafone_cash',
  },
  PreorderStatus: {
    type: 'string',
    enum: [
      'requested',
      'admin_review',
      'accepted',
      'rejected',
      'payment_pending',
      'payment_verification',
      'confirmed',
      'available',
      'fulfilled',
      'cancelled',
      'pending',
    ],
    example: 'requested',
  },
  ReturnStatus: {
    type: 'string',
    enum: [
      'requested',
      'approved',
      'rejected',
      'processing',
      'received',
      'completed',
      'cancelled',
    ],
    example: 'requested',
  },
  RefundStatus: {
    type: 'string',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    example: 'pending',
  },
  RefundMethod: {
    type: 'string',
    enum: ['original_payment', 'wallet', 'cash', 'bank_transfer', 'instapay', 'vodafone_cash'],
    example: 'vodafone_cash',
  },
  ServiceRequestStatus: {
    type: 'string',
    enum: [
      'draft',
      'submitted',
      'review',
      'quoted',
      'accepted',
      'in_progress',
      'completed',
      'cancelled',
      'rejected',
    ],
    example: 'submitted',
  },
  NotificationType: {
    type: 'string',
    enum: [
      'order_created',
      'order_status_changed',
      'order_cancelled',
      'payment_reminder',
      'payment_confirmed',
      'payment_rejected',
      'service_update',
      'return_update',
      'general',
    ],
    example: 'order_status_changed',
  },
  CouponDiscountType: {
    type: 'string',
    enum: ['percentage', 'fixed'],
    example: 'percentage',
  },
  InventoryMovementType: {
    type: 'string',
    enum: ['inbound', 'outbound', 'reservation', 'release', 'adjustment', 'return'],
    example: 'inbound',
  },

  // Auth Schemas
  LoginInput: {
    type: 'object',
    required: ['identifier', 'password'],
    properties: {
      identifier: { type: 'string', example: 'customer@al-azhari.com', description: 'Email address or phone number' },
      password: { type: 'string', format: 'password', example: 'Password123!' },
    },
  },
  RegisterInput: {
    type: 'object',
    required: ['name', 'phone', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100, example: 'أحمد محمد' },
      phone: { type: 'string', minLength: 7, maxLength: 25, example: '+201012345678' },
      email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
      password: { type: 'string', format: 'password', minLength: 8, example: 'SecurePass123!' },
    },
  },
  ForgotPasswordInput: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
    },
  },
  ResetPasswordInput: {
    type: 'object',
    required: ['token', 'password'],
    properties: {
      token: { type: 'string', example: 'tok_reset_abc123' },
      password: { type: 'string', format: 'password', minLength: 8, example: 'NewSecurePass123!' },
    },
  },
  VerifyEmailInput: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', example: 'tok_verify_xyz789' },
    },
  },
  AuthResponseData: {
    type: 'object',
    required: ['user', 'accessToken'],
    properties: {
      user: { $ref: '#/components/schemas/UserProfile' },
      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  },

  // User Profile & Addresses
  UserProfile: {
    type: 'object',
    required: ['id', 'name', 'phone', 'email', 'role', 'status'],
    properties: {
      id: { type: 'string', example: 'usr_652abc123def456' },
      name: { type: 'string', example: 'أحمد محمد' },
      phone: { type: 'string', example: '+201012345678' },
      email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
      role: { $ref: '#/components/schemas/UserRole' },
      status: { $ref: '#/components/schemas/UserStatus' },
      emailVerified: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  UpdateProfileInput: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100, example: 'أحمد محمد الشافعي' },
      phone: { type: 'string', minLength: 7, maxLength: 25, example: '+201012345678' },
    },
  },
  AddressDto: {
    type: 'object',
    required: ['id', 'name', 'phone', 'city', 'line1'],
    properties: {
      id: { type: 'string', example: 'addr_123' },
      name: { type: 'string', example: 'المنزل' },
      phone: { type: 'string', example: '+201012345678' },
      governorate: { type: 'string', example: 'القاهرة' },
      city: { type: 'string', example: 'مدينة نصر' },
      district: { type: 'string', nullable: true, example: 'الحي السابع' },
      line1: { type: 'string', example: 'شارع الطيران، عمارة 15' },
      line2: { type: 'string', nullable: true, example: 'الدور الرابع، شقة 8' },
      postalCode: { type: 'string', nullable: true, example: '11765' },
      isDefault: { type: 'boolean', example: true },
    },
  },
  CreateAddressInput: {
    type: 'object',
    required: ['name', 'phone', 'city', 'line1'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 50, example: 'المنزل' },
      phone: { type: 'string', minLength: 7, maxLength: 25, example: '+201012345678' },
      governorate: { type: 'string', example: 'القاهرة' },
      city: { type: 'string', example: 'مدينة نصر' },
      district: { type: 'string', nullable: true, example: 'الحي السابع' },
      line1: { type: 'string', example: 'شارع الطيران، عمارة 15' },
      line2: { type: 'string', nullable: true, example: 'الدور الرابع، شقة 8' },
      postalCode: { type: 'string', nullable: true, example: '11765' },
      isDefault: { type: 'boolean', default: false },
    },
  },
  UpdateAddressInput: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      phone: { type: 'string', minLength: 7, maxLength: 25 },
      governorate: { type: 'string' },
      city: { type: 'string' },
      district: { type: 'string', nullable: true },
      line1: { type: 'string' },
      line2: { type: 'string', nullable: true },
      postalCode: { type: 'string', nullable: true },
      isDefault: { type: 'boolean' },
    },
  },

  // Catalog: Categories & Products
  CategoryDto: {
    type: 'object',
    required: ['id', 'slug', 'name', 'active'],
    properties: {
      id: { type: 'string', example: 'cat_sharia' },
      slug: { type: 'string', example: 'sharia-islamic-studies' },
      name: {
        type: 'object',
        required: ['ar', 'en'],
        properties: {
          ar: { type: 'string', example: 'الشريعة والدراسات الإسلامية' },
          en: { type: 'string', example: 'Sharia & Islamic Studies' },
        },
      },
      description: {
        type: 'object',
        properties: {
          ar: { type: 'string', example: 'كتب الفقه وأصوله والحديث والتفسير' },
          en: { type: 'string', example: 'Books on Jurisprudence, Hadith and Quranic Exegesis' },
        },
      },
      parentId: { type: 'string', nullable: true, example: null },
      active: { type: 'boolean', example: true },
      sortOrder: { type: 'integer', example: 1 },
    },
  },
  CreateCategoryInput: {
    type: 'object',
    required: ['slug', 'name'],
    properties: {
      slug: { type: 'string', example: 'fiqh' },
      name: {
        type: 'object',
        required: ['ar', 'en'],
        properties: {
          ar: { type: 'string', example: 'الفقه المقارن' },
          en: { type: 'string', example: 'Comparative Jurisprudence' },
        },
      },
      description: {
        type: 'object',
        properties: {
          ar: { type: 'string' },
          en: { type: 'string' },
        },
      },
      parentId: { type: 'string', nullable: true },
      active: { type: 'boolean', default: true },
      sortOrder: { type: 'integer', default: 0 },
    },
  },
  ProductVariantDto: {
    type: 'object',
    required: ['id', 'sku', 'priceMinor', 'stock'],
    properties: {
      id: { type: 'string', example: 'var_001' },
      sku: { type: 'string', example: 'AZH-BK-001-HC' },
      name: {
        type: 'object',
        properties: {
          ar: { type: 'string', example: 'تجليد فاخر' },
          en: { type: 'string', example: 'Hardcover Edition' },
        },
      },
      priceMinor: { type: 'integer', example: 25000, description: 'Price in minor currency units (e.g. 250.00 EGP)' },
      stock: { type: 'integer', example: 15 },
      preOrderEligible: { type: 'boolean', example: true },
    },
  },
  ProductDto: {
    type: 'object',
    required: ['id', 'slug', 'title', 'priceMinor', 'currency', 'published'],
    properties: {
      id: { type: 'string', example: 'prod_987' },
      slug: { type: 'string', example: 'rawdat-al-talibin' },
      title: {
        type: 'object',
        required: ['ar', 'en'],
        properties: {
          ar: { type: 'string', example: 'روضة الطالبين وعمدة المفتين' },
          en: { type: 'string', example: 'Rawdat al-Talibin by Imam al-Nawawi' },
        },
      },
      description: {
        type: 'object',
        properties: {
          ar: { type: 'string', example: 'من أمهات كتب الفقه الشافعي للإمام النووي' },
          en: { type: 'string', example: 'Fundamental Shafi’i jurisprudence reference work' },
        },
      },
      categoryId: { type: 'string', example: 'cat_sharia' },
      author: { type: 'string', example: 'الإمام يحيى بن شرف النووي' },
      publisher: { type: 'string', example: 'دار الفكر' },
      editionYear: { type: 'integer', example: 2024 },
      priceMinor: { type: 'integer', example: 45000, description: '450.00 EGP' },
      currency: { type: 'string', example: 'EGP' },
      published: { type: 'boolean', example: true },
      preOrderEligible: { type: 'boolean', example: false },
      stock: { type: 'integer', example: 10 },
      variants: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductVariantDto' },
      },
      images: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
  CreateProductInput: {
    type: 'object',
    required: ['slug', 'title', 'priceMinor', 'categoryId'],
    properties: {
      slug: { type: 'string', example: 'sharh-sahih-muslim' },
      title: {
        type: 'object',
        required: ['ar', 'en'],
        properties: {
          ar: { type: 'string', example: 'شرح صحيح مسلم للإمام النووي' },
          en: { type: 'string', example: 'Commentary on Sahih Muslim' },
        },
      },
      description: {
        type: 'object',
        properties: {
          ar: { type: 'string' },
          en: { type: 'string' },
        },
      },
      categoryId: { type: 'string' },
      priceMinor: { type: 'integer', minimum: 0, example: 55000 },
      author: { type: 'string' },
      publisher: { type: 'string' },
      stock: { type: 'integer', minimum: 0, default: 0 },
      preOrderEligible: { type: 'boolean', default: false },
      published: { type: 'boolean', default: true },
    },
  },

  // Cart
  CartItemDto: {
    type: 'object',
    required: ['id', 'productId', 'quantity', 'priceMinor', 'subtotalMinor'],
    properties: {
      id: { type: 'string', example: 'item_1' },
      productId: { type: 'string', example: 'prod_987' },
      variantId: { type: 'string', nullable: true, example: 'var_001' },
      quantity: { type: 'integer', example: 2 },
      priceMinor: { type: 'integer', example: 25000 },
      subtotalMinor: { type: 'integer', example: 50000 },
      productTitle: { type: 'string', example: 'روضة الطالبين' },
    },
  },
  CartDto: {
    type: 'object',
    required: ['id', 'items', 'subtotalMinor', 'totalMinor', 'version'],
    properties: {
      id: { type: 'string', example: 'cart_123' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/CartItemDto' },
      },
      subtotalMinor: { type: 'integer', example: 50000 },
      discountMinor: { type: 'integer', example: 5000 },
      totalMinor: { type: 'integer', example: 45000 },
      couponCode: { type: 'string', nullable: true, example: 'AZHARI10' },
      version: { type: 'integer', example: 3 },
    },
  },
  AddToCartInput: {
    type: 'object',
    required: ['productId', 'quantity'],
    properties: {
      productId: { type: 'string', example: 'prod_987' },
      variantId: { type: 'string', nullable: true, example: 'var_001' },
      quantity: { type: 'integer', minimum: 1, maximum: 100, default: 1 },
    },
  },
  UpdateCartItemInput: {
    type: 'object',
    required: ['quantity'],
    properties: {
      quantity: { type: 'integer', minimum: 0, maximum: 100, example: 3 },
    },
  },
  MergeCartInput: {
    type: 'object',
    required: ['guestToken'],
    properties: {
      guestToken: { type: 'string', example: 'gst_abc123xyz' },
    },
  },

  // Checkout & Shipping
  ShippingEstimateInput: {
    type: 'object',
    required: ['city'],
    properties: {
      governorate: { type: 'string', example: 'القاهرة' },
      city: { type: 'string', example: 'مدينة نصر' },
      postalCode: { type: 'string', nullable: true },
    },
  },
  ShippingEstimateResult: {
    type: 'object',
    required: ['deliveryAvailable', 'costMinor', 'currency'],
    properties: {
      deliveryAvailable: { type: 'boolean', example: true },
      costMinor: { type: 'integer', example: 4000, description: '40.00 EGP' },
      currency: { type: 'string', example: 'EGP' },
      estimatedDays: { type: 'string', example: '1-3 business days' },
    },
  },
  ValidateCouponInput: {
    type: 'object',
    required: ['code', 'cartSubtotalMinor'],
    properties: {
      code: { type: 'string', example: 'AZHARI10' },
      cartSubtotalMinor: { type: 'integer', minimum: 1, example: 50000 },
    },
  },
  ValidateCouponResult: {
    type: 'object',
    required: ['valid', 'discountMinor'],
    properties: {
      valid: { type: 'boolean', example: true },
      discountMinor: { type: 'integer', example: 5000 },
      code: { type: 'string', example: 'AZHARI10' },
      message: { type: 'string', example: 'Coupon applied successfully' },
    },
  },

  // Orders
  CustomerContactSnapshot: {
    type: 'object',
    required: ['name', 'phone'],
    properties: {
      name: { type: 'string', example: 'أحمد محمد' },
      phone: { type: 'string', example: '+201012345678' },
      email: { type: 'string', format: 'email', nullable: true, example: 'ahmed@example.com' },
    },
  },
  OrderDto: {
    type: 'object',
    required: ['id', 'reference', 'status', 'totalMinor', 'currency', 'createdAt'],
    properties: {
      id: { type: 'string', example: 'ord_123' },
      reference: { type: 'string', example: 'ORD-20261002-0001' },
      status: { $ref: '#/components/schemas/OrderStatus' },
      paymentStatus: { $ref: '#/components/schemas/PaymentStatus' },
      paymentMethod: { $ref: '#/components/schemas/PaymentMethod' },
      customerSnapshot: { $ref: '#/components/schemas/CustomerContactSnapshot' },
      itemsTotalMinor: { type: 'integer', example: 50000 },
      shippingCostMinor: { type: 'integer', example: 4000 },
      discountMinor: { type: 'integer', example: 5000 },
      totalMinor: { type: 'integer', example: 49000 },
      currency: { type: 'string', example: 'EGP' },
      shippingAddress: { $ref: '#/components/schemas/AddressDto' },
      trackingNumber: { type: 'string', nullable: true },
      carrier: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateOrderInput: {
    type: 'object',
    required: ['fulfillmentType', 'paymentMethod'],
    properties: {
      fulfillmentType: { type: 'string', enum: ['pickup', 'delivery'], example: 'delivery' },
      paymentMethod: { $ref: '#/components/schemas/PaymentMethod' },
      contact: { $ref: '#/components/schemas/CustomerContactSnapshot' },
      shippingAddressId: { type: 'string', nullable: true },
      shippingAddress: { $ref: '#/components/schemas/CreateAddressInput' },
      couponCode: { type: 'string', nullable: true },
      notes: { type: 'string', nullable: true, maxLength: 500 },
      idempotencyKey: { type: 'string', nullable: true },
    },
  },
  AdminUpdateOrderStatusInput: {
    type: 'object',
    required: ['status', 'expectedVersion'],
    properties: {
      status: { $ref: '#/components/schemas/OrderStatus' },
      expectedVersion: { type: 'integer', minimum: 1 },
      note: { type: 'string', nullable: true, maxLength: 500 },
    },
  },
  AdminUpdateShippingInput: {
    type: 'object',
    required: ['carrier', 'trackingNumber', 'expectedVersion'],
    properties: {
      carrier: { type: 'string', example: 'Bosta' },
      trackingNumber: { type: 'string', example: 'BST-EG-99887766' },
      expectedVersion: { type: 'integer', minimum: 1 },
    },
  },

  // Payments & Proofs
  PaymentProofFile: {
    type: 'object',
    required: ['cloudinaryPublicId', 'resourceType', 'format', 'bytes'],
    properties: {
      cloudinaryPublicId: { type: 'string', example: 'al-azhari/payment-proofs/order_123_proof' },
      resourceType: { type: 'string', enum: ['image'], example: 'image' },
      format: { type: 'string', enum: ['png', 'jpeg', 'jpg', 'webp'], example: 'png' },
      bytes: { type: 'integer', example: 1048576 },
      width: { type: 'integer', nullable: true, example: 1080 },
      height: { type: 'integer', nullable: true, example: 1920 },
      sha256: { type: 'string', nullable: true },
    },
  },
  SubmitPaymentProofInput: {
    type: 'object',
    required: ['files'],
    properties: {
      files: {
        type: 'array',
        items: { $ref: '#/components/schemas/PaymentProofFile' },
        minItems: 1,
        maxItems: 5,
      },
      customerNote: { type: 'string', nullable: true, maxLength: 500 },
      idempotencyKey: { type: 'string', nullable: true },
    },
  },
  AdminConfirmPaymentInput: {
    type: 'object',
    required: ['expectedVersion'],
    properties: {
      expectedVersion: { type: 'integer', minimum: 1 },
      note: { type: 'string', nullable: true, maxLength: 500 },
    },
  },
  AdminRejectPaymentInput: {
    type: 'object',
    required: ['reason', 'expectedVersion'],
    properties: {
      reason: { type: 'string', minLength: 3, maxLength: 500 },
      expectedVersion: { type: 'integer', minimum: 1 },
    },
  },
  AdminRequestNewProofInput: {
    type: 'object',
    required: ['note', 'expectedVersion'],
    properties: {
      note: { type: 'string', minLength: 3, maxLength: 500 },
      expectedVersion: { type: 'integer', minimum: 1 },
    },
  },

  // Services & Quotations
  ServiceDto: {
    type: 'object',
    required: ['id', 'slug', 'name', 'active'],
    properties: {
      id: { type: 'string', example: 'srv_print' },
      slug: { type: 'string', example: 'thesis-printing-binding' },
      name: {
        type: 'object',
        required: ['ar', 'en'],
        properties: {
          ar: { type: 'string', example: 'طباعة وتجليد الرسائل العلمية' },
          en: { type: 'string', example: 'Thesis Printing & Binding' },
        },
      },
      description: {
        type: 'object',
        properties: {
          ar: { type: 'string', example: 'طباعة وتجليد رسائل الماجستير والدكتوراه وفق معايير جامعة الأزهر' },
          en: { type: 'string', example: 'Academic thesis printing according to Al-Azhar University standards' },
        },
      },
      formFields: { type: 'array', items: { type: 'object' } },
      active: { type: 'boolean', example: true },
    },
  },
  ServiceRequestDto: {
    type: 'object',
    required: ['id', 'reference', 'serviceSlug', 'status', 'contactSnapshot', 'createdAt'],
    properties: {
      id: { type: 'string', example: 'req_123' },
      reference: { type: 'string', example: 'SRV-20261002-0001' },
      serviceSlug: { type: 'string', example: 'thesis-printing-binding' },
      status: { $ref: '#/components/schemas/ServiceRequestStatus' },
      formData: { type: 'object' },
      contactSnapshot: { $ref: '#/components/schemas/CustomerContactSnapshot' },
      quotation: {
        type: 'object',
        nullable: true,
        properties: {
          amountMinor: { type: 'integer', example: 35000 },
          currency: { type: 'string', example: 'EGP' },
          notes: { type: 'string', example: 'شامل التجليد الفاخر الذهبي' },
          quotedAt: { type: 'string', format: 'date-time' },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateServiceRequestInput: {
    type: 'object',
    required: ['contact', 'formData'],
    properties: {
      contact: { $ref: '#/components/schemas/CustomerContactSnapshot' },
      formData: {
        type: 'object',
        example: { numberOfPages: 250, copies: 5, coverColor: 'navy_blue' },
        description: 'Service parameters without file attachments (files exchanged via WhatsApp/Telegram)',
      },
      customerNotes: { type: 'string', nullable: true, maxLength: 1000 },
    },
  },
  AdminCreateQuoteInput: {
    type: 'object',
    required: ['amountMinor', 'currency'],
    properties: {
      amountMinor: { type: 'integer', minimum: 1, example: 35000 },
      currency: { type: 'string', default: 'EGP', example: 'EGP' },
      turnaroundDays: { type: 'integer', minimum: 1, example: 3 },
      notes: { type: 'string', nullable: true, maxLength: 1000 },
    },
  },

  // Pre-orders
  PreorderDto: {
    type: 'object',
    required: ['id', 'reference', 'status', 'requestedQuantity', 'capturedPriceMinor', 'currency', 'createdAt'],
    properties: {
      id: { type: 'string', example: 'po_123' },
      reference: { type: 'string', example: 'PO-20261002-0001' },
      status: { $ref: '#/components/schemas/PreorderStatus' },
      productId: { type: 'string', example: 'prod_987' },
      variantId: { type: 'string', nullable: true, example: null },
      requestedQuantity: { type: 'integer', example: 2 },
      capturedPriceMinor: { type: 'integer', example: 45000 },
      currency: { type: 'string', example: 'EGP' },
      customerSnapshot: { $ref: '#/components/schemas/CustomerContactSnapshot' },
      expectedAvailabilityAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreatePreorderInput: {
    type: 'object',
    properties: {
      variantId: { type: 'string', nullable: true },
      quantity: { type: 'integer', minimum: 1, maximum: 100, default: 1 },
      customer: { $ref: '#/components/schemas/CustomerContactSnapshot' },
      notes: { type: 'string', nullable: true, maxLength: 500 },
    },
  },
  AcceptPreorderInput: {
    type: 'object',
    properties: {
      expectedVersion: { type: 'integer', minimum: 1 },
      expectedAvailabilityAt: { type: 'string', format: 'date-time', nullable: true },
      adminNotes: { type: 'string', nullable: true, maxLength: 1000 },
    },
  },

  // Returns & Refunds
  ReturnDto: {
    type: 'object',
    required: ['id', 'reference', 'orderReference', 'status', 'items', 'createdAt'],
    properties: {
      id: { type: 'string', example: 'ret_123' },
      reference: { type: 'string', example: 'RET-20261002-0001' },
      orderReference: { type: 'string', example: 'ORD-20261002-0042' },
      status: { $ref: '#/components/schemas/ReturnStatus' },
      reason: { type: 'string', example: 'wrong_item' },
      customerNotes: { type: 'string', nullable: true },
      items: { type: 'array', items: { type: 'object' } },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateReturnInput: {
    type: 'object',
    required: ['reason', 'items'],
    properties: {
      reason: { type: 'string', minLength: 3, maxLength: 200, example: 'تلف أثناء الشحن' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['orderItemId', 'quantity'],
          properties: {
            orderItemId: { type: 'string', example: 'item_1' },
            quantity: { type: 'integer', minimum: 1, example: 1 },
          },
        },
        minItems: 1,
      },
      customerNotes: { type: 'string', nullable: true, maxLength: 500 },
    },
  },
  AdminDecideReturnInput: {
    type: 'object',
    required: ['decision', 'expectedVersion'],
    properties: {
      decision: { type: 'string', enum: ['approved', 'rejected'], example: 'approved' },
      reason: { type: 'string', nullable: true, maxLength: 500 },
      expectedVersion: { type: 'integer', minimum: 1 },
    },
  },
  RefundDto: {
    type: 'object',
    required: ['id', 'returnReference', 'status', 'amountMinor', 'method', 'createdAt'],
    properties: {
      id: { type: 'string', example: 'ref_123' },
      returnReference: { type: 'string', example: 'RET-20261002-0001' },
      status: { $ref: '#/components/schemas/RefundStatus' },
      amountMinor: { type: 'integer', example: 45000 },
      currency: { type: 'string', example: 'EGP' },
      method: { $ref: '#/components/schemas/RefundMethod' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },

  // Notifications
  NotificationDto: {
    type: 'object',
    required: ['id', 'type', 'title', 'message', 'read', 'createdAt'],
    properties: {
      id: { type: 'string', example: 'notif_123' },
      type: { $ref: '#/components/schemas/NotificationType' },
      title: { type: 'string', example: 'تأكيد الطلب' },
      message: { type: 'string', example: 'تم تأكيد طلبك رقم ORD-20261002-0001 وجارٍ تجهيزه' },
      read: { type: 'boolean', example: false },
      data: { type: 'object', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },

  // WhatsApp
  WhatsAppLinkResult: {
    type: 'object',
    required: ['url', 'disclaimer', 'disclaimerEn', 'context'],
    properties: {
      url: { type: 'string', example: 'https://wa.me/201012345678?text=...' },
      disclaimer: { type: 'string', example: 'المحادثة عبر واتساب هي للتواصل والاستفسار فقط، ولا تُنشئ ولا تُعدّل ولا تُؤكد ولا تُلغي أي طلب أو خدمة أو سجل مالي.' },
      disclaimerEn: { type: 'string', example: 'WhatsApp chat is for communication and inquiries only. It does not create, modify, confirm, or cancel any order, service, or payment record.' },
      context: {
        type: 'object',
        properties: {
          product: { type: 'string', nullable: true },
          orderReference: { type: 'string', nullable: true },
          serviceReference: { type: 'string', nullable: true },
        },
      },
    },
  },
  CustomerWhatsAppLinkInput: {
    type: 'object',
    required: ['customerPhone'],
    properties: {
      customerPhone: { type: 'string', example: '+201012345678' },
      product: { type: 'string', nullable: true },
      orderReference: { type: 'string', nullable: true },
      serviceReference: { type: 'string', nullable: true },
    },
  },

  // Inventory & Coupons & Shipping (Admin)
  AdjustInventoryInput: {
    type: 'object',
    required: ['productId', 'quantityDelta', 'type', 'reason'],
    properties: {
      productId: { type: 'string', example: 'prod_987' },
      variantId: { type: 'string', nullable: true },
      quantityDelta: { type: 'integer', example: 25, description: 'Positive for additions, negative for deductions' },
      type: { $ref: '#/components/schemas/InventoryMovementType' },
      reason: { type: 'string', example: 'استلام شحنة جديدة من المطبعة' },
    },
  },
  CouponDto: {
    type: 'object',
    required: ['id', 'code', 'discountType', 'discountValue', 'active'],
    properties: {
      id: { type: 'string', example: 'cpn_123' },
      code: { type: 'string', example: 'RAMADAN2026' },
      discountType: { $ref: '#/components/schemas/CouponDiscountType' },
      discountValue: { type: 'integer', example: 15 },
      minOrderAmountMinor: { type: 'integer', nullable: true, example: 20000 },
      maxDiscountAmountMinor: { type: 'integer', nullable: true, example: 5000 },
      usageLimit: { type: 'integer', nullable: true, example: 500 },
      usageCount: { type: 'integer', example: 42 },
      active: { type: 'boolean', example: true },
      startsAt: { type: 'string', format: 'date-time', nullable: true },
      expiresAt: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  CreateCouponInput: {
    type: 'object',
    required: ['code', 'discountType', 'discountValue'],
    properties: {
      code: { type: 'string', minLength: 3, maxLength: 30, example: 'AZHARI15' },
      discountType: { $ref: '#/components/schemas/CouponDiscountType' },
      discountValue: { type: 'integer', minimum: 1, example: 15 },
      minOrderAmountMinor: { type: 'integer', nullable: true },
      maxDiscountAmountMinor: { type: 'integer', nullable: true },
      usageLimit: { type: 'integer', nullable: true },
      active: { type: 'boolean', default: true },
      startsAt: { type: 'string', format: 'date-time', nullable: true },
      expiresAt: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  ShippingRuleDto: {
    type: 'object',
    required: ['id', 'name', 'governorate', 'baseFeeMinor'],
    properties: {
      id: { type: 'string', example: 'ship_cairo' },
      name: { type: 'string', example: 'شحن القاهرة والجيزة' },
      governorate: { type: 'string', example: 'القاهرة' },
      city: { type: 'string', nullable: true },
      baseFeeMinor: { type: 'integer', example: 3500 },
      freeAboveMinor: { type: 'integer', nullable: true, example: 50000 },
      estimatedDaysMin: { type: 'integer', example: 1 },
      estimatedDaysMax: { type: 'integer', example: 3 },
      active: { type: 'boolean', example: true },
    },
  },
  CreateShippingRuleInput: {
    type: 'object',
    required: ['name', 'governorate', 'baseFeeMinor'],
    properties: {
      name: { type: 'string', example: 'شحن الإسكندرية' },
      governorate: { type: 'string', example: 'الإسكندرية' },
      city: { type: 'string', nullable: true },
      baseFeeMinor: { type: 'integer', minimum: 0, example: 4500 },
      freeAboveMinor: { type: 'integer', nullable: true },
      estimatedDaysMin: { type: 'integer', default: 2 },
      estimatedDaysMax: { type: 'integer', default: 4 },
      active: { type: 'boolean', default: true },
    },
  },

  // Audit Logs & Reports
  AuditLogDto: {
    type: 'object',
    required: ['id', 'action', 'actor', 'entityType', 'entityId', 'timestamp'],
    properties: {
      id: { type: 'string', example: 'aud_123' },
      action: { type: 'string', example: 'order.accept' },
      actor: {
        type: 'object',
        required: ['userId', 'role'],
        properties: {
          userId: { type: 'string', example: 'usr_admin1' },
          role: { type: 'string', example: 'admin' },
          ip: { type: 'string', example: '192.168.1.1' },
        },
      },
      entityType: { type: 'string', example: 'order' },
      entityId: { type: 'string', example: 'ORD-20261002-0001' },
      details: { type: 'object' },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },
  ReportDto: {
    type: 'object',
    required: ['reportType', 'generatedAt', 'data'],
    properties: {
      reportType: { type: 'string', example: 'sales_summary' },
      period: { type: 'string', example: '2026-09-01 to 2026-09-30' },
      generatedAt: { type: 'string', format: 'date-time' },
      data: { type: 'object' },
    },
  },
};
