# AL-AZHARI LIBRARY — Design Website Audit (Gap A Resolution)

> **Document Type**: Architecture & Visual Audit  
> **Source Directory**: `design-website/` (34 prototype directories + `img/` assets)  
> **Target System**: Angular 19 Design System (SCSS + CSS Custom Properties)

---

## 1. Executive Summary

The `design-website/` directory contains complete HTML/CSS prototypes, visual notes (`DESIGN.md`), and high-resolution screen mockups (`screen.png`) for all 34 screens of the AL-AZHARI LIBRARY platform.

All screens follow a unified luxury Islamic geometric aesthetic tailored for Azhari academic prestige, combining deep forest green, warm gold accents, and warm ivory paper backgrounds.

---

## 2. Directory & Screen Inventory

### A. Public Storefront (StorefrontShell)
| Prototype Folder | Screen / Feature | Key Components & Primitives |
| :--- | :--- | :--- |
| `home/` | Storefront Landing / Hero | BrandMotif, CategoryGrid, FeaturedProducts, ValueProps, WhatsAppFloat |
| `Catalog/` | Main Catalog / Filtering | FacetFilters, ProductGrid, SortDropdown, Pagination, AvailabilityBadge |
| `PRODUCT DETAILS PAGE/` | Product Detail (PDP) | ImageGallery, QuantityStepper, PriceDisplay, StockBadge, AddToCartCTA |
| `CART PAGE/` | Cart Overview | CartLineItem, CouponField, OrderSummary, ShippingEstimate, CheckoutCTA |
| `CHECKOUT PAGE/` | Multi-step Checkout | StepWizard, AddressSelector, PaymentMethodPicker, UploadProofDropzone |
| `SERVICES PAGE/` | Services Directory | ServiceCard, CategoryTabs, ServicePricingNotice |
| `SERVICE DETAILS PAGE/` | Service Detail | ServiceScopeList, TurnaroundBadge, RequestQuoteCTA |
| `SERVICE REQUEST/` | Service Quotation Form | DynamicFormRenderer, FileUploadDropzone, DeadlinesPicker |
| `pre-order/` | Pre-order Request Form | BookTitleInput, AuthorInput, EditionNote, ExpectedDateEstimate |

### B. Authentication & Identity (AuthShell)
| Prototype Folder | Screen / Feature | Key Components & Primitives |
| :--- | :--- | :--- |
| `LOGIN/` | Customer & Admin Login | PhoneOrEmailInput, PasswordInput, RememberMeCheckbox, ForgotPasswordLink |
| `REGISTER/` | Customer Registration | NameInput, PhoneInput, EmailInput, PasswordConfirmation, TermsCheckbox |

### C. Customer Dashboard (AccountShell)
| Prototype Folder | Screen / Feature | Key Components & Primitives |
| :--- | :--- | :--- |
| `CUSTOMER DASHBOARD/` | Account Overview | QuickStatCards, RecentOrdersWidget, ActiveServiceQuotes, ProfileSummary |
| `PROFILE PAGE/` | Personal Profile & Security | EditableProfileForm, ChangePasswordModal, SessionList |
| `ADDRESSES PAGE/` | Address Book | AddressCardGrid, GovernorateSelect, SetDefaultAction, AddAddressModal |
| `ORDERS PAGE/` | Customer Orders List | OrderStatusTabs, OrderListCard, ReferenceBadge, PaymentStatusBadge |
| `ORDER DETAILS/` | Order Details & Tracking | OrderTimeline, ItemBreakdown, ShippingTracker, ConfirmCodButton, UploadProofCTA |
| `NOTIFICATIONS PAGE/` | Customer Notifications | NotificationList, FilterByType, MarkAllReadCTA |

### D. Admin Operations (AdminShell)
| Prototype Folder | Screen / Feature | Key Components & Primitives |
| :--- | :--- | :--- |
| `ADMIN DASHBOARD/` | Executive Operations Overview | RevenueKPIs, PendingOrdersAlert, LowStockWarning, RecentActivityTable |
| `ADMIN ORDERS/` | Orders Management Queue | FilterDrawer, OrderDataTable, BulkStatusUpdate, PaymentProofInspectionCTA |
| `ADMIN ORDER DETAILS/` | Admin Order Inspection | OrderItemsEditor, ShippingFeeAdjustment, PaymentProofModal, StatusWorkflow |
| `ADMIN PAYMENTS/` | Payment Review Queue | ProofImageViewer, ApprovePaymentAction, RejectPaymentDialog, SignedUrlFetcher |
| `ADMIN PRODUCTS/` | Product Catalog Management | ProductDataTable, StockBadge, QuickPriceEdit, AddProductModal |
| `ADMIN CATEGORIES/` | Category Tree Management | TreeView, ReorderHandles, CategoryFormDrawer |
| `ADMIN INVENTORY/` | Stock & Variant Tracking | LowStockFilter, RestockInput, BatchUpdateAction |
| `ADMIN SERVICES/` | Service Requests Queue | QuotationBuilder, SpecificationReview, StatusTransitionActions |
| `ADMIN PRE-ORDERS/` | Pre-orders Queue | SupplierAvailabilityToggle, CustomerNotifyAction, ConversionToOrder |
| `ADMIN RETURNS - REFUNDS/` | Returns & Refunds Review | ConditionInspector, PartialRefundInput, RestockOnReturnToggle |
| `ADMIN COUPONS/` | Promotional Discounts | DiscountTypeSelect, UsageLimitInput, ExpiryDatePicker, CouponDataTable |
| `ADMIN USERS/` | Customer & Staff Management | RoleSelector, PermissionsMatrix, UserStatusBadge, BanAction |
| `ADMIN CONTENT/` | Banners & Announcements | HeroSlideManager, AnnouncementBannerEditor, StaticPageEditor |
| `ADMIN NOTIFICATIONS/` | System & Push Notifications | BroadcastComposer, NotificationQueueTable |
| `ADMIN AUDIT LOGS/` | Compliance & Security Audit | LogViewer, ActorFilter, IpAddressDisplay, ChangesDiffViewer |
| `ADMIN REPORTS/` | Financial & Sales Analytics | DateRangePicker, MetricCards, SalesBreakdownTable, ExportCsvCTA |

---

## 3. Visual Tokens & Design System Alignment

| Design Element | Prototype Value | Angular Token (`src/styles/tokens/`) |
| :--- | :--- | :--- |
| **Primary Brand Green** | `#0F4C3A` | `--color-brand-green-700` / `--color-primary` |
| **Dark Forest Green** | `#083328` | `--color-brand-green-900` / `--color-primary-active` |
| **Accent Gold (Text-safe)** | `#80601D` | `--color-gold-700` |
| **Accent Gold (Branding)** | `#A47925` | `--color-gold-600` / `--color-accent` |
| **Canvas Background** | `#FCFBF8` | `--color-ivory-50` / `--color-background` |
| **Subtle Card Surface** | `#F6F4EE` | `--color-ivory-100` / `--color-surface-subtle` |
| **Card Surface** | `#FFFFFF` | `--color-white` / `--color-surface` |
| **Text Primary** | `#1F2A26` | `--color-text-primary` |
| **Text Secondary** | `#53615B` | `--color-text-secondary` |
| **Border Normal** | `#D7DED9` | `--color-border` |
| **Border Strong** | `#AEBBB4` | `--color-border-strong` |
| **Arabic Typography** | IBM Plex Sans Arabic | `--font-family-arabic` |
| **Latin / Numeric** | Inter | `--font-family-latin` |

---

## 4. Architectural Confirmations

1. **FB-01 (Styling Engine)**:  
   Prototypes use inline utility classes resembling Tailwind; however, to maintain zero runtime bloat, strict design system integrity, and full RTL logical property enforcement, all components will be authored using Angular component-scoped SCSS and the CSS Custom Properties established in `src/styles/tokens/`.
2. **FB-02 (SSR / SPA)**:  
   All prototypes feature rich interactivity (modals, drawers, multi-step wizards). The foundation established in Phase 0 guarantees full SSR safety (`PlatformService`, `SafeStorage`).
3. **FB-12 (Brand Assets)**:  
   Brand identity confirmed via `design-website/img/Brand-Identity.png`. Geometric Azhari motif will be applied as an SVG mask on hero sections at 4–8% opacity.
