AL-AZHARI LIBRARY

Product Requirements Document

1. Document Control

Field	Value

Document title	AL-AZHARI LIBRARY — Product Requirements Document

Version	1.0

Status	Draft — for stakeholder review

Purpose	Defines how the AL-AZHARI LIBRARY online platform must behave from a functional/product-requirements perspective

Source of truth (business/why)	Master Product Brief (مكتبة الأزهري — Source of Truth, v2.0)

Source of truth (functional/how)	This document

Priority order used throughout	(1) Explicit decisions provided in the PRD brief → (2) Master Product Brief → (3) Product Recommendations → (4) Open Decisions

Audience	Product Manager, UX/UI Designer, Frontend Developer, Backend Developer, QA Engineer, Project Manager, Business Owner

Labeling convention used throughout this document:



[CONFIRMED] — stated directly in the Master Product Brief or explicitly decided in the PRD brief.

[PRODUCT RECOMMENDATION] — analysis built on confirmed facts; requires owner approval before being treated as a requirement.

[OPEN DECISION] — not yet resolved; must not be treated as settled.

This PRD does not restate the Master Product Brief's business narrative, brand strategy, or market reasoning — it translates confirmed and decided points into functional product behavior. Where the PRD is silent on a business rule, the Master Product Brief governs; where both are silent, the item is an Open Decision.



2. Product Overview

Product summary

AL-AZHARI LIBRARY's online platform is the digital extension of an operating, physical, Azhar-specialized library and store in Qena, Egypt. It is a full e-commerce store, a customer self-service experience, a student-services request platform, an order-management interface, and a customer relationship channel — built on Angular, Node.js/Express.js, and MongoDB. [CONFIRMED]



Business context

The library currently runs its entire sales and service process through manual, one-to-one conversation (Facebook, WhatsApp, phone). This works but does not scale, consumes staff time on repetitive questions, and caps how many out-of-Qena customers can be served. [CONFIRMED — Master Product Brief §1, §4]



Product vision

مكتبة الأزهري، ولكن أونلاين — the same trusted library, discoverable and purchasable online, with WhatsApp support still available when a customer needs a person. [CONFIRMED — Master Product Brief §11]



Problem statement

Customers have no self-served way to check availability, price, or order status; every such question currently requires a live conversation with staff. This is the single largest constraint on order throughput and on serving customers outside Qena. [CONFIRMED — Master Product Brief §9, §20]



Opportunity

Convert the informational parts of the existing customer journey (availability, price, product detail, order status) into self-service, while keeping the relational parts (service pricing, order review, support) staffed by people. [CONFIRMED — Master Product Brief §20]



Product principles (functional-level restatement)

The website is the source of truth for orders and service requests; WhatsApp is a communication channel, not the transactional record. [CONFIRMED — PRD brief §4]

Books remain the primary product; other categories, services, and seasonal content must never visually or structurally overshadow books. [CONFIRMED — Master Product Brief §6, §7]

Services (variable-priced) are never forced into the fixed-price product/cart/checkout model. [CONFIRMED — Master Product Brief §13]

Every payment confirmation step is manual admin review (proof-of-payment) — there is no payment gateway. [CONFIRMED — PRD brief §9]

Pickup, cash-at-library, and WhatsApp remain first-class, not legacy fallback, options. [CONFIRMED — Master Product Brief §20]

No business rule, price, policy, or numeric threshold is invented; missing information is marked Open Decision. [CONFIRMED — PRD brief §1, §39]

3. Scope

In Scope (MVP)

Guest and registered-customer browsing, search, filtering, cart, and checkout

Product catalog with variants, availability states, and pre-orders

Order lifecycle from submission through completion, including COD and manual InstaPay/e-wallet verification

Governorate-based shipping estimate with admin-adjustable final cost, plus free pickup

Student service requests with admin-driven quotation (no file upload — files exchanged via WhatsApp/Telegram)

Customer dashboard (profile, orders, addresses, payment history, service requests, notifications)

Admin dashboard covering orders, products, categories, customers, payments, services, pre-orders, inventory, shipping, returns, notifications, content, reports

Role-based access control (Owner, Admin, extensible to specialized admin roles)

In-app notifications; email for verification/password reset/transactional messages

Real-time updates (Socket.IO) for order/service/payment events, with the database as source of truth

Coupons and discounts (percentage, fixed, seasonal, product/category-level)

Returns (request/review) and manual refunds

SEO-supportive, indexable catalog and content structure

WhatsApp contact actions embedded throughout (customer-to-library and admin-to-customer)

[CONFIRMED — synthesized from PRD brief §3, §6–§34]



Out of Scope (current version)

Product reviews/ratings [CONFIRMED — PRD brief §29]

External/automated payment gateway [CONFIRMED — PRD brief §9]

In-site file upload for student-service attachments (handled via WhatsApp/Telegram) [CONFIRMED — PRD brief §23]

Google Maps/location-pin address entry [CONFIRMED — PRD brief §17]

Phone OTP verification [CONFIRMED — PRD brief §7]

Microservices, Kafka, Kubernetes, Elasticsearch, Redis, dedicated search engines [CONFIRMED — PRD brief §5, §34]

LMS/course functionality, social-network features, marketplace (multi-seller) functionality [CONFIRMED — Master Product Brief §3, §19; PRD brief §3]

MVP boundaries

The MVP must deliver: an accurate catalog (price, availability, images, baseline descriptions), all four payment methods, both fulfillment options, a functional service-request path for at least printing/photocopying/binding and student administrative services, and a clearly reachable WhatsApp contact throughout the site. [CONFIRMED — Master Product Brief §18, "At launch"]



Future opportunities (not committed, not scoped)

Educational/editorial content, Tajweed/Qira'at/Quran-memorization/nursery-curricula product expansion, paid social advertising, deeper personalization once usage data exists, additional RBAC roles (Products Admin, Orders Admin, Services Admin, Content Admin). [CONFIRMED — Master Product Brief §22; PRD brief §31]



4. Users & Actors

Actor	Description	Key capabilities

Guest Customer	Unauthenticated visitor	Browse, search, filter, add to cart, guest checkout, submit an order [CONFIRMED — PRD brief §6]

Registered Customer	Authenticated account holder	All guest capabilities plus profile, order history, addresses, payment history, service requests, notifications, account history [CONFIRMED — PRD brief §6]

Admin	Staff member managing day-to-day operations	Order review, payment verification, inventory, shipping adjustment, service quotation, returns/refunds, content, reports (scope may be narrowed by future specialized roles) [CONFIRMED — PRD brief §30–31]

Owner	Business owner; highest-privilege role	All Admin capabilities plus full administrative authority; sits above Admin in RBAC [CONFIRMED — PRD brief §31]

Future specialized roles	Products Admin, Orders Admin, Services Admin, Content Admin, others	Narrower slices of Admin capability; not required in the initial UI [CONFIRMED — PRD brief §31]

Deeper persona detail (motivations, decision triggers, objections) is [OPEN DECISION — Master Product Brief §5]; this PRD treats the segments in the Master Product Brief (Azhar-track student, general-education student, university student, parent/guardian, out-of-Qena customer) as the customer population without inventing additional behavioral detail.



5. Information Architecture

Primary areas and their relationships:



Storefront (Catalog Layer) — Home → Category/Search/Filter → Product Detail → (Add to Cart | Request Pre-order)

Transaction Layer — Cart → Checkout (Address → Shipping/Pickup → Payment Method → Payment Proof if applicable) → Order Confirmation → Order Tracking

Services Layer — Service Catalog → Service Request Form → Quotation → Accept/Reject → Payment → Fulfillment tracking (structurally separate from the product/cart/checkout flow, per Master Product Brief §13)

Account Layer — Registration/Login → Dashboard (Profile, Orders, Addresses, Payment History, Service Requests, Notifications)

Support Layer — WhatsApp contact action, present contextually across storefront, cart, checkout, order detail, and service-request screens

Admin Layer — Orders, Products, Categories, Customers, Payments, Services, Pre-orders, Inventory, Shipping, Returns, Notifications, Content, Reports — gated by RBAC

The Services Layer is intentionally not nested inside the Transaction Layer's cart/checkout because it follows a different lifecycle (quotation-based, not fixed-price). [CONFIRMED — Master Product Brief §13; PRD brief §8]



Seasonal content and promotions are a presentation layer on top of the permanent catalog structure (home page modules, banners, category highlighting) — never a restructuring of navigation or taxonomy. [CONFIRMED — Master Product Brief §7]



6. Functional Requirements

Each requirement is atomic and traceable. IDs are grouped by module.



6.1 Authentication & Accounts

ID	Requirement	Status

AUTH-001	The system SHALL allow guest checkout without requiring account creation.	[CONFIRMED]

AUTH-002	The system SHALL allow a visitor to register with name, phone, email, and password.	[CONFIRMED]

AUTH-003	The system SHALL require a valid, unique email per account.	[CONFIRMED]

AUTH-004	The system SHALL require a valid phone number per account.	[CONFIRMED]

AUTH-005	The system SHALL require email verification before [OPEN DECISION: full account privileges vs. registration-completion only — exact gated actions not specified].	[CONFIRMED requirement / OPEN DECISION on gating scope]

AUTH-006	The system SHALL NOT require phone OTP verification.	[CONFIRMED]

AUTH-007	The system SHALL allow login via email + password.	[CONFIRMED]

AUTH-008	The system SHALL allow login via phone + password.	[CONFIRMED]

AUTH-009	The system SHALL provide a "Forgot Password" flow via email.	[CONFIRMED]

AUTH-010	The system SHALL allow a registered customer to view and edit their profile information.	[PRODUCT RECOMMENDATION — standard account capability implied by "Profile" in customer dashboard, PRD brief §26]

AUTH-011	The system SHALL allow a registered customer to manage one or more saved addresses.	[CONFIRMED — PRD brief §26]

AUTH-012	The system SHALL issue session tokens (JWT + refresh token) to authenticate registered-customer and admin sessions.	[CONFIRMED — technology baseline, PRD brief §5]

6.2 Product Catalog

ID	Requirement	Status

CAT-001	The system SHALL represent each product with, at minimum: name, category, price, availability state, and image(s).	[CONFIRMED — Master Product Brief §6, §12]

CAT-002	The system SHALL support a written description field per product, editable by Admin.	[CONFIRMED]

CAT-003	The system SHALL NOT require a description to be present for a product to be published (descriptions are an unstarted content workload).	[PRODUCT RECOMMENDATION — reflects confirmed operational reality that most products currently lack descriptions]

CAT-004	The system SHALL organize products into categories reflecting the taxonomy: Books (core), School/Study Products (supporting), Other Products — games/gifts (secondary), Services (structurally separate).	[CONFIRMED — Master Product Brief §6]

CAT-005	The system SHALL structurally and visually prioritize Books over all other categories in default browsing/merchandising surfaces (home page, navigation order, featured placement).	[CONFIRMED — Master Product Brief §6, "Strategic Implication"]

CAT-006	The system SHALL allow Admin to mark a product's availability state as: In Stock, Out of Stock, or Pre-order-eligible.	[CONFIRMED — Master Product Brief §12]

CAT-007	The system SHALL allow Admin to update product price at any time without workflow friction.	[CONFIRMED]

CAT-008	The system SHALL support the taxonomy being extended with a future category (e.g., Tajweed, Qira'at, Quran-memorization curricula, nursery curricula) without requiring a redesign of existing categories.	[CONFIRMED — Master Product Brief §6.5, §17 Product Goals]

CAT-009	The system SHALL NOT display any future/expansion category as active or purchasable in the MVP.	[CONFIRMED]

6.3 Product Variants

ID	Requirement	Status

VAR-001	The system SHALL support a product having zero or more variants, differentiated by attributes such as publisher, edition, part, or language.	[CONFIRMED — PRD brief §15]

VAR-002	The system SHALL NOT assume every product has variants of every listed attribute type — variant attributes apply only where commercially meaningful for that product.	[CONFIRMED]

VAR-003	The system SHALL associate price and availability state independently per variant where variants exist.	[CONFIRMED — implied by inventory-per-variant requirement in §6.14 below]

VAR-004	The system SHALL require the customer to select a variant (where variants exist) before the product can be added to the cart.	[PRODUCT RECOMMENDATION — standard e-commerce behavior needed to avoid ambiguous orders]

6.4 Search & Filters

ID	Requirement	Status

SEARCH-001	The system SHALL support search by product name, author, grade, stage, subject, publisher, ISBN, and category.	[CONFIRMED — PRD brief §27]

SEARCH-002	The system SHALL NOT require all searchable fields to be populated for every product to remain searchable by the fields that are populated.	[CONFIRMED]

SEARCH-003	The system SHALL provide filters for: education type, stage, grade, subject, publisher, price range, and availability.	[CONFIRMED — PRD brief §27]

SEARCH-004	The system SHALL rely on MongoDB indexing/query capabilities for search in the initial version; no dedicated search engine (e.g., Elasticsearch) shall be introduced.	[CONFIRMED — PRD brief §34]

SEARCH-005	The system SHALL allow a customer to browse by category without needing to know exact product terminology.	[CONFIRMED — Master Product Brief §12]

6.5 Product Details

ID	Requirement	Status

PDP-001	The product detail page SHALL clearly display: what the product is, its price, and its current availability state.	[CONFIRMED — Master Product Brief §12]

PDP-002	If a product is out of stock and pre-order-eligible, the product detail page SHALL display a Pre-order action in place of Add to Cart.	[CONFIRMED — PRD brief §16]

PDP-003	If a product is out of stock and not pre-order-eligible, the product detail page SHALL clearly communicate unavailability without a purchase action.	[PRODUCT RECOMMENDATION — logical completion of the three-state availability model]

PDP-004	The product detail page SHALL display all applicable variants and let the customer select one before purchase.	[CONFIRMED — see VAR-004]

PDP-005	Product reviews/ratings SHALL NOT be displayed.	[CONFIRMED — PRD brief §29]

6.6 Cart

ID	Requirement	Status

CART-001	The system SHALL allow multiple distinct products/variants in a single cart.	[CONFIRMED — Master Product Brief §6, §12]

CART-002	The system SHALL NOT enforce a minimum order value.	[CONFIRMED — Master Product Brief §6]

CART-003	The system SHALL persist a guest's cart for the duration of the session at minimum.	[PRODUCT RECOMMENDATION — baseline usability expectation; exact persistence duration is [OPEN DECISION]]

CART-004	The system SHALL allow a registered customer's cart to persist across sessions/devices.	[PRODUCT RECOMMENDATION]

CART-005	The system SHALL re-validate product availability and price at the start of checkout, and reflect any changes to the customer before payment.	[PRODUCT RECOMMENDATION — required to prevent stale-price/stale-stock checkout, directly supports Edge Case in §12]

6.7 Checkout

ID	Requirement	Status

CHK-001	The system SHALL support checkout for both Guest and Registered customers.	[CONFIRMED]

CHK-002	Checkout SHALL collect a detailed address: governorate, city, area, street, building number, floor, apartment, landmark, recipient name, recipient phone, and additional notes.	[CONFIRMED — PRD brief §17]

CHK-003	Checkout SHALL NOT include a map/location-pin input.	[CONFIRMED — PRD brief §17]

CHK-004	Checkout SHALL let the customer choose between Delivery and Pickup.	[CONFIRMED]

CHK-005	Checkout SHALL display Pickup as free of charge.	[CONFIRMED — Master Product Brief §12]

CHK-006	When Delivery is selected, checkout SHALL display an estimated shipping cost, calculated by governorate/location, before the customer confirms the order.	[CONFIRMED — Master Product Brief §12, §18; PRD brief §18]

CHK-007	Checkout SHALL present all supported payment methods: InstaPay, Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, and Cash on Delivery.	[CONFIRMED — PRD brief §12]

CHK-008	If the customer selects InstaPay or an e-wallet, checkout SHALL display the library's payment details and require at least one uploaded payment screenshot before the order can be submitted.	[CONFIRMED — PRD brief §9, §12]

CHK-009	Checkout SHALL NOT request a transaction ID or transaction reference number from the customer.	[CONFIRMED — PRD brief §12]

CHK-010	If the customer selects Cash on Delivery, checkout SHALL NOT require any payment proof upload.	[CONFIRMED — PRD brief §10]

CHK-011	Checkout SHALL display an order summary (items, quantities, product total, shipping cost, discounts, final total) before submission.	[PRODUCT RECOMMENDATION — standard transparency requirement supporting Trust & Security, Master Product Brief §14]

CHK-012	The system SHALL apply a valid coupon code at checkout and recalculate totals accordingly.	[CONFIRMED — PRD brief §28]

6.8 Orders

ID	Requirement	Status

ORD-001	The system SHALL allow a customer to submit an order containing one or more eligible products.	[CONFIRMED — PRD brief §37 example]

ORD-002	The system SHALL place a newly submitted order into Pending Review.	[CONFIRMED — PRD brief §37 example]

ORD-003	Product orders and student-service requests SHALL be modeled as separate entities with separate lifecycles.	[CONFIRMED — PRD brief §8]

ORD-004	The system SHALL generate a unique, human-referenceable order identifier for every submitted order.	[PRODUCT RECOMMENDATION — required for support conversations and tracking]

ORD-005	The system SHALL allow the customer to view full order detail, including items, status, payment method, shipping/pickup choice, and cost breakdown.	[CONFIRMED — PRD brief §26]

ORD-006	The system SHALL allow the customer to edit products, quantities, and relevant order details only while the order is in Pending Review.	[CONFIRMED — PRD brief §19]

ORD-007	The system SHALL allow the customer to cancel an order only while it is in Pending Review; cancellation SHALL NOT be permitted after Admin acceptance.	[CONFIRMED — PRD brief §10, §19]

ORD-008	After payment, the system SHALL NOT permit any order change that alters the financial total.	[CONFIRMED — PRD brief §19]

ORD-009	Non-financial order information may be changed post-acceptance only where explicit business rules allow it and fulfillment has not progressed beyond the point where such a change is practical; any case not covered here is [OPEN DECISION].	[CONFIRMED framework / OPEN DECISION on specific cases]

6.9 Payments

ID	Requirement	Status

PAY-001	The system SHALL allow the customer to select InstaPay or an approved electronic wallet (Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay) as a payment method.	[CONFIRMED — PRD brief §37 example, §12]

PAY-002	The system SHALL allow the customer to upload one or more payment screenshots as proof of payment.	[CONFIRMED — PRD brief §37 example, §12]

PAY-003	The system SHALL NOT integrate any external/automated payment gateway.	[CONFIRMED — PRD brief §9]

PAY-004	The system SHALL allow Admin to Confirm Payment, Reject Payment, or Request New Proof for a submitted payment.	[CONFIRMED — PRD brief §12]

PAY-005	If Admin rejects payment proof, the order SHALL move to Awaiting New Proof, and the customer SHALL be able to submit new screenshot(s).	[CONFIRMED — PRD brief §12]

PAY-006	The system SHALL store uploaded payment screenshots via the approved media storage provider (Cloudinary).	[CONFIRMED — PRD brief §33]

PAY-007	The system SHALL maintain an audit trail of payment-related actions: actor, action, timestamp, and resulting state transition.	[CONFIRMED — PRD brief §13]

PAY-008	The system SHALL NOT expose internal audit-trail detail to the customer beyond what is necessary for their own order transparency.	[CONFIRMED — PRD brief §13]

6.10 Shipping

ID	Requirement	Status

SHIP-001	The system SHALL make shipping available across Egypt, subject to serviceability.	[CONFIRMED — PRD brief §17]

SHIP-002	The library (Admin), not the customer, SHALL determine which shipping provider (e.g., Bosta, Egyptian Post, local partner) is used for a given order.	[CONFIRMED — Master Product Brief §4; PRD brief §17]

SHIP-003	The system SHALL NOT hard-code a single mandatory shipping provider.	[CONFIRMED — PRD brief §17]

SHIP-004	The system SHALL generate a system-estimated shipping cost based on governorate/location at checkout.	[CONFIRMED — PRD brief §18]

SHIP-005	Admin SHALL be able to review and adjust the shipping cost after order submission.	[CONFIRMED — PRD brief §18]

SHIP-006	The adjusted (final) shipping cost becomes authoritative once confirmed by Admin; [OPEN DECISION: the exact order-state point at which this final cost becomes binding on the customer and whether re-confirmation is required if it changes materially from the estimate].	[CONFIRMED framework / OPEN DECISION on binding point]

SHIP-007	The system SHALL NOT use a fixed, invented governorate-to-price table; actual rate logic/source is [OPEN DECISION].	[CONFIRMED constraint / OPEN DECISION on rate source]

SHIP-008	Exact delivery time ranges by area are [OPEN DECISION] and SHALL NOT be displayed as committed promises until defined.	[OPEN DECISION — Master Product Brief §21]

SHIP-009	Exact governorates/areas excluded from shipping are [OPEN DECISION].	[OPEN DECISION — Master Product Brief §21]

6.11 Pickup

ID	Requirement	Status

PICK-001	The system SHALL allow the customer to select in-person pickup at the library as a fulfillment option.	[CONFIRMED]

PICK-002	Pickup SHALL always be displayed as free.	[CONFIRMED — Master Product Brief §12]

PICK-003	The system SHALL display the library's location/address information in the pickup flow.	[PRODUCT RECOMMENDATION — necessary for the customer to act on the pickup choice; uses only the confirmed address from Master Product Brief §2]

PICK-004	The order status model SHALL include a Ready for Pickup state distinct from Shipped/Out for Delivery states.	[CONFIRMED — PRD brief §11]

6.12 Inventory

ID	Requirement	Status

INV-001	Every product/variant SHALL carry stock information.	[CONFIRMED — PRD brief §14]

INV-002	Order creation (Pending Review) SHALL NOT finalize stock deduction.	[CONFIRMED — PRD brief §14]

INV-003	When Admin accepts an order, the system SHALL reserve the corresponding stock.	[CONFIRMED — PRD brief §14]

INV-004	When an order is rejected or cancelled, the system SHALL release any reserved stock back to available inventory.	[CONFIRMED — PRD brief §14]

INV-005	Stock SHALL only be finally deducted when the order reaches Delivered or Picked Up.	[CONFIRMED — PRD brief §14]

INV-006	The system SHALL prevent an order from being accepted if reserving the requested quantity would result in negative available stock, except where the product is pre-order-eligible.	[PRODUCT RECOMMENDATION — direct consequence of the reservation model]

INV-007	Exact behavior for concurrent orders competing for the last unit(s) of limited stock (e.g., first-accepted-wins vs. queue) is [OPEN DECISION].	[OPEN DECISION]

INV-008	Numeric low-stock or reorder thresholds are [OPEN DECISION] and SHALL NOT be invented.	[OPEN DECISION — PRD brief §39]

6.13 Pre-orders

ID	Requirement	Status

PRE-001	When a product/variant is Out of Stock and pre-order-eligible, the system SHALL display a Pre-order action instead of Add to Cart.	[CONFIRMED — PRD brief §16]

PRE-002	A pre-order request SHALL enter Admin Review before proceeding.	[CONFIRMED — PRD brief §16]

PRE-003	Once Admin accepts a pre-order request, the customer SHALL be able to pay immediately.	[CONFIRMED — PRD brief §16]

PRE-004	The system SHALL retain, per pre-order: customer, product/variant, quantity, price at the time of pre-order, payment status, expected availability, and fulfillment status.	[CONFIRMED — PRD brief §16]

PRE-005	When the product becomes available, a confirmed pre-order SHALL automatically enter the standard fulfillment/shipping flow.	[CONFIRMED — PRD brief §16]

PRE-006	The system SHALL NOT display or promise a specific availability date unless Admin has entered one.	[CONFIRMED — PRD brief §16]

PRE-007	Whether the price paid at pre-order time is honored if the catalog price changes before availability is [OPEN DECISION].	[OPEN DECISION]

6.14 Student Services

ID	Requirement	Status

SRV-001	Student services (printing, photocopying, binding, applications, transfers, research/formatting help, and other administrative services) SHALL be modeled as a distinct product type, not as fixed-price catalog products.	[CONFIRMED — Master Product Brief §13; PRD brief §8]

SRV-002	The system SHALL allow a customer to submit a service request describing what they need.	[CONFIRMED — Master Product Brief §13]

SRV-003	The system SHALL NOT provide in-site file upload for service-request attachments.	[CONFIRMED — PRD brief §23, §33]

SRV-004	The system SHALL direct the customer to exchange service files via WhatsApp or Telegram.	[CONFIRMED — PRD brief §23]

SRV-005	A submitted service request SHALL enter Admin Review.	[CONFIRMED — PRD brief §22]

SRV-006	Exact required information fields per service type (printing, photocopying, binding, applications, transfers, research/formatting) are [OPEN DECISION] and SHALL NOT be invented.	[OPEN DECISION — Master Product Brief §13]

SRV-007	Turnaround-time commitments per service type are [OPEN DECISION].	[OPEN DECISION — Master Product Brief §13]

SRV-008	For applications and transfers, the system SHALL reflect that the library performs the service on the customer's behalf (an administrative service), not a self-service form the customer completes end-to-end.	[CONFIRMED — Master Product Brief §13]

6.15 Quotations

ID	Requirement	Status

QUOTE-001	After reviewing a service request, Admin SHALL be able to create a quotation with a final price.	[CONFIRMED — PRD brief §22]

QUOTE-002	The customer SHALL be able to view the quotation and either Accept or Reject it.	[CONFIRMED — PRD brief §22]

QUOTE-003	If the customer accepts a quotation, the system SHALL proceed to payment for that service.	[CONFIRMED — PRD brief §22]

QUOTE-004	If the customer rejects a quotation, the service request SHALL close without payment, and Admin SHALL be notified.	[PRODUCT RECOMMENDATION — logical completion of the accept/reject flow]

QUOTE-005	Payment for an accepted service quotation SHALL follow the same payment-method and proof-of-payment model used for product orders (InstaPay/e-wallet screenshot review, or COD where applicable to a service).	[PRODUCT RECOMMENDATION — reuses the confirmed payment model rather than inventing a separate one; whether COD applies to every service type is [OPEN DECISION]]

6.16 Returns

ID	Requirement	Status

RET-001	The system SHALL allow a customer to submit a Return Request for an order, selecting the item(s), a reason, and evidence where appropriate.	[CONFIRMED — PRD brief §20]

RET-002	A submitted return request SHALL enter Admin Review, resulting in Approve or Reject.	[CONFIRMED — PRD brief §20]

RET-003	Return eligibility/policy may vary by product or service category, and some products may be marked non-returnable by Admin.	[CONFIRMED — PRD brief §20]

RET-004	Category-specific return periods and detailed policy rules are [OPEN DECISION] beyond the confirmed wrong-item/damaged-item case.	[OPEN DECISION — Master Product Brief §20, §21]

6.17 Refunds

ID	Requirement	Status

REF-001	Refunds SHALL be processed manually by Admin (InstaPay or e-wallet transfer), not through an automated gateway.	[CONFIRMED — PRD brief §21]

REF-002	An approved return SHALL create a distinct Refund Record, separate from the Original Payment and Payment Proof records.	[CONFIRMED — PRD brief §21]

REF-003	Admin SHALL record refund completion (amount, method, timestamp) against the originating order/return.	[CONFIRMED — PRD brief §21]

6.18 Notifications

ID	Requirement	Status

NOT-001	The system SHALL provide in-app notifications for the order, payment, service, and pre-order lifecycle events listed in Section 11 (Notification Matrix).	[CONFIRMED — PRD brief §24]

NOT-002	The system SHALL send email for account verification, password reset, and other relevant transactional communication.	[CONFIRMED — PRD brief §24]

NOT-003	The system SHALL NOT rely on WhatsApp as an automated notification channel; WhatsApp remains a manually-initiated communication channel.	[CONFIRMED — PRD brief §25]

NOT-004	Real-time-eligible events (new order, new service request, payment proof submitted, order status change) SHALL be pushed via Socket.IO to relevant Admin/Owner sessions and to the affected customer's session where applicable.	[CONFIRMED — PRD brief §32]

6.19 Coupons & Discounts

ID	Requirement	Status

COUP-001	The system SHALL support coupon codes.	[CONFIRMED — PRD brief §28]

COUP-002	The system SHALL support percentage-based and fixed-amount discounts.	[CONFIRMED — PRD brief §28]

COUP-003	The system SHALL support seasonal offers, product-level discounts, and category-level discounts.	[CONFIRMED — PRD brief §28]

COUP-004	Coupon stacking rules, maximum usage limits, expiry defaults, minimum order value for a coupon, and customer-specific restrictions are [OPEN DECISION] and SHALL NOT be invented.	[OPEN DECISION — PRD brief §28]

COUP-005	Admin SHALL be able to create, edit, activate/deactivate, and view usage of a coupon.	[PRODUCT RECOMMENDATION — baseline admin capability implied by supporting coupons at all]

6.20 Customer Dashboard

ID	Requirement	Status

DASH-001	The customer dashboard SHALL include: Profile, Orders, Order Details, Addresses, Payment History, Service Requests, and Notifications.	[CONFIRMED — PRD brief §26]

DASH-002	The dashboard SHALL allow cancellation of an order where the order's state permits it (Pending Review only, per ORD-007).	[CONFIRMED]

DASH-003	The dashboard SHALL surface a WhatsApp contact action in relevant order and service-request contexts.	[CONFIRMED — PRD brief §25, §26]

6.21 Admin Dashboard

ID	Requirement	Status

ADM-001	The admin dashboard SHALL cover: Orders, Products, Categories, Customers, Payments, Services, Pre-orders, Inventory, Shipping, Returns, Notifications, Content, and Reports.	[CONFIRMED — PRD brief §30]

ADM-002	Admin SHALL be able to perform the full relevant lifecycle actions for each module (see Section 10, Admin Workflows).	[CONFIRMED — PRD brief §30]

ADM-003	Admin capabilities SHALL respect the RBAC model; no permission SHALL be granted that contradicts it.	[CONFIRMED — PRD brief §30–31]

6.22 RBAC

ID	Requirement	Status

RBAC-001	The system SHALL support, at minimum, two roles: Owner and Admin.	[CONFIRMED — PRD brief §31]

RBAC-002	The permission architecture SHALL be extensible to future specialized roles (Products Admin, Orders Admin, Services Admin, Content Admin, others) without requiring a redesign.	[CONFIRMED — PRD brief §31]

RBAC-003	The system SHALL NOT require all future specialized roles to exist in the initial UI.	[CONFIRMED — PRD brief §31]

RBAC-004	Owner SHALL have equal or greater privilege than Admin over every module.	[PRODUCT RECOMMENDATION — standard hierarchy implied by "Owner" sitting above "Admin"]

6.23 Real-time Events

ID	Requirement	Status

RT-001	The system SHALL push real-time updates for: new order, new service request, payment proof submitted, order status change, and relevant Admin/customer updates.	[CONFIRMED — PRD brief §32]

RT-002	The database SHALL remain the authoritative source of truth; real-time delivery is a notification mechanism only, not a data store.	[CONFIRMED — PRD brief §32]

RT-003	If a real-time connection is unavailable, the underlying state change SHALL still be persisted and visible on next page load/refresh.	[PRODUCT RECOMMENDATION — standard reliability expectation following from RT-002]

6.24 WhatsApp Integration/Actions

ID	Requirement	Status

WA-001	The customer-facing site SHALL provide a persistent/contextual "Contact Al-Azhari Library on WhatsApp" action.	[CONFIRMED — PRD brief §25]

WA-002	The admin interface SHALL provide a "Contact Customer on WhatsApp" action within relevant order/customer contexts.	[CONFIRMED — PRD brief §25]

WA-003	WhatsApp SHALL NOT be used as, or replace, the authoritative order/service-request record.	[CONFIRMED — PRD brief §4, §25]

6.25 Content Management

ID	Requirement	Status

CMS-001	Admin SHALL be able to create and edit product descriptions.	[CONFIRMED — Master Product Brief §6, §15]

CMS-002	Admin SHALL be able to manage seasonal/homepage merchandising content (banners, featured categories/products) without altering the permanent catalog structure.	[CONFIRMED — Master Product Brief §7]

CMS-003	Educational/editorial content (guides, grade-specific summaries) is a Future Consideration, contingent on a content owner existing, and is out of MVP scope.	[CONFIRMED — Master Product Brief §15, §22]

CMS-004	Content-editing tools SHALL NOT encourage or default to repeated insertion of the phrase "مكتبة الأزهري" for SEO purposes.	[CONFIRMED — Master Product Brief §15]

6.26 Reports

ID	Requirement	Status

REP-001	The system SHALL allow Admin/Owner to view reports on: orders, revenue, orders originating outside Qena, payment-method distribution, service requests, conversion, product demand, pre-order demand, and coupon usage.	[CONFIRMED — PRD brief §16 (Analytics section)]

REP-002	The system SHALL NOT display invented numeric KPI targets; targets remain [OPEN DECISION] until defined with the owner.	[CONFIRMED — Master Product Brief §18, §21]

7. Business Rules

Order source of truth: The website's order/service-request records are authoritative; WhatsApp conversation is never the record of what was sold. [CONFIRMED]

Stock reservation: Stock is reserved only on Admin acceptance, released on rejection/cancellation, and finally deducted only on Delivered/Picked Up. [CONFIRMED]

Customer cancellation: Permitted only while an order is in Pending Review; not permitted after Admin acceptance. [CONFIRMED]

Payment verification: Every non-COD payment requires customer-submitted screenshot proof and Admin review (Confirm / Reject / Request New Proof); no automated confirmation exists. [CONFIRMED]

COD confirmation: A COD order requires explicit customer confirmation after Admin acceptance before proceeding to Confirmed; if the customer does not confirm, the order remains in Customer Confirmation Required indefinitely (no auto-cancellation timeframe is defined — [OPEN DECISION] on any timeout).

Financial immutability post-payment: No change that alters the order total is permitted once payment has been made. [CONFIRMED]

Shipping cost transparency: The shipping cost estimate must be visible before the customer confirms the order; the final, Admin-adjusted cost becomes authoritative per SHIP-006 (binding point is [OPEN DECISION]).

Pre-order pricing: Price is captured at the moment of pre-order; whether it is re-validated against the catalog price at fulfillment time is [OPEN DECISION].

Service pricing: No student service may be presented with a final fixed price prior to Admin quotation. [CONFIRMED]

Return/refund eligibility: Only the wrong-item/damaged-item case is confirmed as a policy today; all other category-specific rules are [OPEN DECISION].

Coupon governance: Stacking, usage limits, expiry defaults, and minimum order value are [OPEN DECISION] and must be configured, not hard-coded, once defined.

Taxonomy priority: Books must always outrank Services, Supplies, and Gifts/Games in default merchandising placement. [CONFIRMED]

Seasonal layering: Seasonal promotion/content must never replace or hide the permanent, full catalog structure. [CONFIRMED]

Service files: No service-related file may be uploaded to or stored by the platform; file exchange happens only via WhatsApp/Telegram. [CONFIRMED]

8. State Machines

8.1 Order State Machine

Pending Review

   ├─(Admin Accepts)→ Accepted

   └─(Admin Rejects)→ Rejected [terminal]



Accepted

   ├─ if payment method = InstaPay/E-Wallet →

   │     Awaiting Payment → Payment Verification →

   │         ├─(Admin Confirms)→ Payment Confirmed

   │         └─(Admin Rejects proof)→ Awaiting New Proof → (customer re-submits) → Payment Verification

   └─ if payment method = Cash on Delivery →

         Customer Confirmation Required →

            └─(Customer Confirms)→ Confirmed



Payment Confirmed / Confirmed

   → Preparing

   → (if Pickup) Ready for Pickup → Picked Up → Completed

   → (if Delivery) Shipped → Out for Delivery → Delivered → Completed



Any pre-fulfillment state → Cancelled [only from Pending Review, per ORD-007]

Post-fulfillment → Returned [via Return Request flow, see 8.3]

State	Meaning	Who triggers	Allowed next states	Customer visible	Admin visible	Notification

Pending Review	Order submitted, awaiting Admin decision	System (on submit)	Accepted, Rejected, Cancelled (by customer)	Yes	Yes	Order submitted (customer + Admin)

Accepted	Admin approved the order	Admin	Awaiting Payment / Customer Confirmation Required	Yes	Yes	Order accepted (customer)

Rejected	Admin declined the order	Admin	(terminal)	Yes	Yes	Order rejected (customer)

Awaiting Payment	Non-COD order awaiting proof upload	System	Payment Verification	Yes	Yes	—

Payment Verification	Proof submitted, pending Admin review	Customer (upload)	Payment Confirmed, Awaiting New Proof	Yes	Yes	Payment proof submitted (Admin)

Awaiting New Proof	Admin rejected the proof	Admin	Payment Verification (on re-upload)	Yes	Yes	New proof requested (customer)

Payment Confirmed	Admin verified payment	Admin	Preparing	Yes	Yes	Payment confirmed (customer)

Customer Confirmation Required	COD order awaiting customer confirmation	System (after Admin acceptance, COD)	Confirmed	Yes	Yes	Confirmation required (customer)

Confirmed	Customer confirmed COD order	Customer	Preparing	Yes	Yes	—

Preparing	Library preparing the order	Admin	Ready for Pickup / Shipped	Yes	Yes	Preparing (customer)

Ready for Pickup	Order ready at the library	Admin	Picked Up	Yes	Yes	Ready for pickup (customer)

Picked Up	Customer collected the order	Admin	Completed	Yes	Yes	—

Shipped	Order handed to shipping provider	Admin	Out for Delivery	Yes	Yes	Shipped (customer)

Out for Delivery	Provider is delivering	Admin/System	Delivered	Yes	Yes	Out for delivery (customer)

Delivered	Customer received the order	Admin/System	Completed	Yes	Yes	Delivered (customer)

Completed	Fulfillment closed	System	Returned (via Return Request)	Yes	Yes	Completed (customer)

Cancelled	Order cancelled from Pending Review	Customer	(terminal)	Yes	Yes	Cancelled (Admin)

Returned	Return approved post-fulfillment	Admin (via Return flow)	(terminal, linked to Refund)	Yes	Yes	Return approved (customer)

8.2 Payment State Machine (per payment attempt)

Not Submitted → Proof Uploaded → Under Review →

   ├─(Admin Confirms)→ Confirmed [terminal]

   └─(Admin Rejects)→ Rejected → (customer re-uploads) → Proof Uploaded

8.3 Return State Machine

(Completed Order) → Return Requested → Admin Review →

   ├─(Approve)→ Return Approved → Refund Initiated → Refund Completed [terminal]

   └─(Reject)→ Return Rejected [terminal]

8.4 Service Request State Machine

Submitted → Admin Review →

   ├─(Admin creates Quotation)→ Quotation Sent →

   │     ├─(Customer Accepts)→ Awaiting Payment → Payment Verification → Payment Confirmed → Processing → Completed [terminal]

   │     └─(Customer Rejects)→ Closed — Not Proceeding [terminal]

   └─(Admin determines request cannot be fulfilled)→ Closed — Declined [terminal]

8.5 Pre-order State Machine

Pre-order Requested → Admin Review →

   ├─(Admin Accepts)→ Pre-order Accepted → Payment (Confirmed/COD flow as applicable) →

   │     Pre-order Confirmed → (Product becomes available) → Enters standard fulfillment flow (§8.1, from Preparing)

   └─(Admin Rejects)→ Pre-order Rejected [terminal]

8.6 Inventory State Behavior

Trigger	Inventory effect

Order submitted (Pending Review)	No stock change

Order accepted	Requested quantity reserved (deducted from available, not from total)

Order rejected / cancelled	Reserved quantity released back to available

Order delivered / picked up	Reserved quantity finally deducted from total stock

Pre-order accepted	No stock movement (product not yet in stock); tracked as pre-order demand

Product becomes available with open pre-orders	[OPEN DECISION] — exact allocation order among multiple pending pre-orders is not defined

9. Detailed User Flows

9.1 Guest Checkout

Guest browses catalog, adds product(s)/variant(s) to cart.

Guest proceeds to checkout; enters recipient/address details.

Guest selects Delivery (sees estimated shipping cost) or Pickup (sees "Free").

Guest selects a payment method.

If InstaPay/e-wallet: guest sees payment instructions, transfers manually, uploads screenshot(s).

If COD: no proof step.

Guest reviews order summary and submits.

Order enters Pending Review; guest receives an order reference and (if email provided) a confirmation.

9.2 Registered Checkout

Same as 9.1, with saved address(es) and saved payment history available for reuse; order and payment history are attached to the account and visible in the dashboard afterward.



9.3 InstaPay Payment

Customer selects InstaPay at checkout.

System displays the library's InstaPay payment details.

Customer transfers manually outside the platform.

Customer uploads one or more screenshots as proof.

Order submitted → Pending Review → (on Admin acceptance) → Payment Verification.

Admin confirms, rejects, or requests new proof.

9.4 E-Wallet Payment (Vodafone Cash / Orange Cash / Etisalat Cash / WE Pay)

Identical flow to 9.3, with the relevant wallet's payment details displayed.



9.5 Cash on Delivery

Customer selects COD at checkout; submits order (no proof step).

Order enters Pending Review.

Admin reviews and accepts.

Order enters Customer Confirmation Required.

Customer confirms → order enters Confirmed → Preparing.

If customer never confirms, order remains in Customer Confirmation Required ([OPEN DECISION] on any timeout/expiry).

9.6 Payment Proof Rejection

Admin reviews submitted proof and rejects it (with a reason, where captured).

Order enters Awaiting New Proof; customer is notified.

Customer uploads new screenshot(s).

Order returns to Payment Verification for Admin review.

9.7 Order Rejection

Admin reviews a Pending Review order and rejects it (with a reason, where captured).

Order enters Rejected (terminal); any reserved stock (none yet reserved at this stage) is unaffected; customer is notified.

9.8 Order Cancellation

Customer opens an order in Pending Review from their dashboard.

Customer selects Cancel; confirms the action.

Order enters Cancelled (terminal); no stock was reserved, so no release action is needed.

9.9 Order Editing

Customer opens an order in Pending Review.

Customer edits products/quantities/relevant details.

System recalculates totals and re-validates availability/price.

Customer resubmits; order remains in Pending Review pending Admin action.

9.10 Pickup

Customer selects Pickup at checkout (no shipping cost).

Order proceeds through the standard order state machine to Preparing → Ready for Pickup.

Customer is notified when Ready for Pickup; collects the order; Admin marks Picked Up → Completed.

9.11 Delivery

Customer selects Delivery; enters address; sees estimated shipping cost.

Order proceeds through Preparing → Shipped → Out for Delivery → Delivered → Completed.

Admin selects the shipping provider and may adjust the final shipping cost (per SHIP-005/006).

9.12 Pre-order

Customer views an Out of Stock, pre-order-eligible product; selects Pre-order.

Customer submits pre-order request (quantity, variant if applicable).

Request enters Admin Review.

Admin accepts → customer can pay immediately (per the applicable payment flow).

Pre-order Confirmed; when the product becomes available, it automatically enters standard fulfillment (Preparing onward).

9.13 Student Service Request

Customer selects a service category (printing, photocopying, binding, applications, transfers, research/formatting, other).

Customer submits a request describing what they need (exact required fields are [OPEN DECISION] per SRV-006).

Request enters Admin Review; Admin may contact the customer (via WhatsApp) for clarification or files.

9.14 Service Quotation

Admin reviews the request and creates a quotation with a final price.

Customer views the quotation; Accepts or Rejects.

If accepted: customer proceeds to payment (per the standard payment flow), then Processing → Completed.

If rejected: request closes; no payment collected.

9.15 Return

Customer opens a Completed order; selects Request Return.

Customer selects the item(s), a reason, and provides evidence where appropriate.

Request submitted → Admin Review.

Admin Approves (→ Return Approved → Refund Initiated) or Rejects (→ terminal).

9.16 Refund

Following an approved return, Admin manually processes the refund via InstaPay or e-wallet transfer.

Admin records the refund (amount, method, timestamp) against the return/order.

Refund Completed; customer is notified.

9.17 Customer Account

Visitor registers (name, phone, email, password) or logs in (email or phone + password).

Registered customer accesses dashboard: Profile, Orders, Order Details, Addresses, Payment History, Service Requests, Notifications.

Customer may use Forgot Password at any time to reset credentials via email.

10. Admin Workflows

Workflow	Key steps

Reviewing orders	View Pending Review queue → open order detail → verify items/stock/customer info → Accept or Reject (with reason where applicable)

Accepting/rejecting orders	On Accept: system reserves stock and routes to payment/COD-confirmation step. On Reject: order becomes terminal; customer notified

Verifying payments	View Payment Verification queue → inspect uploaded screenshot(s) → Confirm / Reject / Request New Proof

Requesting new proof	Select Request New Proof with an optional note → order moves to Awaiting New Proof → customer notified

Managing inventory	View stock per product/variant → adjust available stock → view reserved vs. available breakdown

Managing products	Create/edit product (name, category, price, images, description, availability state) → publish/unpublish

Managing variants	Add/edit variant attributes and per-variant price/stock for a product

Managing pre-orders	View pending pre-order requests → Accept/Reject → mark product available to trigger fulfillment for confirmed pre-orders

Managing shipping	Select shipping provider per order → review/adjust system-estimated shipping cost → mark Shipped/Out for Delivery/Delivered

Managing returns	View Return Requests → review evidence/reason → Approve/Reject

Issuing refunds	For an approved return, record manual refund (amount, method, timestamp)

Managing services	View service catalog → create/edit service categories (fields captured per SRV-006 once defined)

Managing quotations	Open a reviewed service request → enter a price → send quotation → track Accept/Reject

Managing customers	View customer list/profile → view associated orders/service requests/payment history

Managing coupons	Create/edit coupon (code, discount type/value, applicable scope) → activate/deactivate → view usage

Managing content	Edit product descriptions → manage seasonal/homepage merchandising modules

Viewing reports	Access dashboards for orders, revenue, geography, payment methods, service requests, product/pre-order demand, coupon usage (see REP-001)

11. Notifications

Event	Trigger	Recipient	Channel	Message purpose

Order submitted	Customer submits order	Customer, Admin	In-app (+ email if available)	Confirm receipt / alert staff

Order accepted	Admin accepts	Customer	In-app	Inform next step (payment/confirmation)

Order rejected	Admin rejects	Customer	In-app	Inform and explain (where reason captured)

Payment proof submitted	Customer uploads screenshot	Admin	In-app (real-time)	Prompt review

Payment proof rejected	Admin rejects proof	Customer	In-app	Prompt re-upload

New proof requested	Admin requests new proof	Customer	In-app	Prompt re-upload

Payment confirmed	Admin confirms payment	Customer	In-app	Confirm order will proceed

Customer confirmation required	Admin accepts a COD order	Customer	In-app	Prompt confirmation action

Preparing	Admin updates status	Customer	In-app	Progress update

Ready for pickup	Admin updates status	Customer	In-app	Prompt collection

Shipped	Admin updates status	Customer	In-app	Progress update

Out for delivery	Admin/system updates status	Customer	In-app	Progress update

Delivered	Admin/system updates status	Customer	In-app	Confirm receipt expected

Completed	System closes order	Customer	In-app	Close the loop

Service quotation sent	Admin creates quotation	Customer	In-app	Prompt Accept/Reject decision

Service status changes	Admin updates service request	Customer	In-app	Progress update

Pre-order availability	Admin marks product available	Customer (with confirmed pre-order)	In-app	Inform fulfillment is starting

Email verification	Customer registers	Customer	Email	Verify account

Password reset	Customer requests reset	Customer	Email	Complete reset

Exact message copy is not defined here and is a content/localization task, not a functional requirement.



12. Edge Cases & Failure States

Case	Expected behavior

Product becomes unavailable during checkout	System re-validates availability at checkout start (CART-005); if unavailable, customer is informed and the item is removed or flagged before payment

Insufficient stock at Admin acceptance	Order cannot be accepted for the affected item; Admin must reject or adjust the order (exact partial-acceptance behavior is [OPEN DECISION])

Two customers ordering the same last unit(s)	Reservation occurs only at Admin acceptance, so the order accepted first reserves the stock; exact resolution when both are Pending simultaneously is [OPEN DECISION] (INV-007)

Payment proof rejected	Order enters Awaiting New Proof; customer notified and can re-upload (see §9.6)

Customer uploads multiple proofs	All uploaded screenshots are retained and visible to Admin for review

Admin rejects order	Order becomes terminal (Rejected); no stock was reserved; customer notified

Customer fails to confirm COD	Order remains in Customer Confirmation Required; no automatic cancellation is defined ([OPEN DECISION])

Shipping cost changes after estimate	Admin-adjusted final cost applies; the exact point at which this becomes binding on the customer is [OPEN DECISION] (SHIP-006)

Order cancellation	Permitted only from Pending Review (ORD-007); disallowed afterward

Refund failure/manual delay	No automated retry exists; Admin manually re-attempts and updates the Refund Record; any SLA is [OPEN DECISION]

Product becomes available after pre-order	Confirmed, paid pre-orders automatically enter standard fulfillment (PRE-005); allocation order among multiple pre-orders is [OPEN DECISION]

Pre-order price considerations	Price is captured at pre-order time; whether it is honored or re-validated at fulfillment is [OPEN DECISION] (PRE-007)

Service quotation rejected	Request closes without payment (QUOTE-004); Admin notified

Expired coupon	Coupon is rejected at checkout with a clear message; exact expiry-default behavior is [OPEN DECISION] (COUP-004)

Invalid coupon code	Coupon is rejected at checkout with a clear message; no discount applied

Non-returnable product	Return Request option is not offered, or is offered but automatically ineligible with a clear message, for products Admin has marked non-returnable (RET-003)

Delivery unavailable to an area	Checkout communicates the area is not currently serviceable; exact excluded-area list is [OPEN DECISION] (SHIP-009)

13. Acceptance Criteria

Guest checkout



Given a guest has items in the cart, When they proceed to checkout without an account, Then the system allows them to complete checkout without requiring registration.

Cart minimum



Given a cart with any single item below any typical "minimum order" threshold, When the customer proceeds to checkout, Then the system does not block checkout for order-value reasons.

Payment method visibility



Given a customer has products in the cart, When the customer reaches the payment step, Then the system displays all six supported payment methods (InstaPay, Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, COD).

InstaPay proof requirement



Given a customer selects InstaPay, When the customer attempts to submit the order without uploading a screenshot, Then the system prevents submission and prompts for proof.

COD requires no proof



Given a customer selects Cash on Delivery, When the customer submits the order, Then the system does not request any payment proof and places the order into Pending Review.

Shipping cost visibility



Given a customer selects Delivery and enters a governorate, When the customer reaches the order summary, Then the system displays the estimated shipping cost before order confirmation.

Pickup is free



Given a customer selects Pickup, When the customer views the order summary, Then the shipping line item shows no charge.

Order state after submission



Given a customer completes checkout, When the order is submitted, Then the order's status is Pending Review.

Stock reservation on acceptance



Given an order in Pending Review, When Admin accepts the order, Then the ordered quantity is reserved and no longer counted as available stock.

Stock release on rejection



Given an order in Pending Review with reserved... (N/A — reservation occurs only on acceptance) — Given an order in Accepted with reserved stock, When Admin or the customer causes it to become Rejected/Cancelled, Then the reserved quantity is released back to available stock.

Customer cancellation window



Given an order in Accepted, When the customer attempts to cancel, Then the system does not permit cancellation.

Payment proof rejection loop



Given a submitted payment proof, When Admin rejects it, Then the order enters Awaiting New Proof and the customer can upload a new screenshot.

COD confirmation gate



Given a COD order accepted by Admin, When the customer has not yet confirmed, Then the order remains in Customer Confirmation Required and does not progress to Preparing.

Pre-order eligibility display



Given a product is Out of Stock and marked pre-order-eligible by Admin, When a customer views the product page, Then a Pre-order action is shown instead of Add to Cart.

Service request has no file upload



Given a customer is submitting a student service request, When they view the request form, Then no file-upload control is presented, and WhatsApp/Telegram is indicated as the channel for file exchange.

Quotation-gated service payment



Given a submitted service request with no quotation yet, When the customer views the request, Then no payment action is available until Admin sends a quotation.

Return eligibility



Given a product marked non-returnable by Admin, When a customer attempts to request a return for that product, Then the system does not allow the return request to proceed.

Coupon application



Given a valid, active coupon code, When applied at checkout, Then the order total is recalculated to reflect the discount before payment.

RBAC boundary



Given a user with the Admin role (not Owner), When they attempt an action reserved for Owner (once such actions are defined), Then the system denies the action.

14. Non-Functional Product Requirements

Security: Customer accounts, personal information, and payment-proof handling must be treated as trust-critical; access to payment proofs and personal data is restricted to authorized Admin/Owner roles per RBAC. [CONFIRMED — Master Product Brief §14]

Privacy: Customer personal information (name, phone, email, address) is used only for order fulfillment, account management, and support communication. [PRODUCT RECOMMENDATION — baseline expectation from Trust & Security pillar]

Performance: No numeric SLA is specified; the system should feel responsive for typical catalog browsing and checkout interactions. [OPEN DECISION on numeric targets]

Availability: No numeric uptime target is specified. [OPEN DECISION]

Accessibility: The interface should be usable and legible for the stated audience (ages roughly 6–25 and their parents); specific accessibility conformance level (e.g., WCAG tier) is [OPEN DECISION].

Responsive behavior: The storefront and dashboard must function on mobile and desktop, reflecting that customers currently transact largely via mobile channels (WhatsApp/Facebook). [PRODUCT RECOMMENDATION]

Reliability: Order and payment state changes must persist reliably even if real-time delivery (Socket.IO) fails (RT-003). [CONFIRMED]

Auditability: Payment and order-critical actions must retain actor, action, and timestamp (PAY-007). [CONFIRMED]

15. SEO & Discoverability Requirements

Product and category pages must be indexable and structured to naturally communicate specialization, product type, and location. [CONFIRMED — Master Product Brief §15, §16 goal 5]

Content must not mechanically repeat "مكتبة الأزهري" for keyword density; readability takes priority over keyword stuffing. [CONFIRMED — Master Product Brief §15]

Product pages should expose useful metadata (title, description, category, availability) supporting search engine and social-share previews. [PRODUCT RECOMMENDATION]

Social sharing of product/category pages should be supported where it aids the confirmed goal of converting Facebook/TikTok followers into customers. [CONFIRMED — Master Product Brief §16, goal 3]

This section defines discoverability requirements, not a technical SEO implementation guide (sitemap generation, structured-data markup specifics, etc., are implementation detail).

16. Analytics & Business Measurement

The system should be capable of measuring, at minimum:



Orders (volume, by status, by time period)

Revenue (by period, by payment method)

Orders originating from outside Qena (governorate breakdown)

Payment-method distribution

Service-request volume and conversion (request → quotation → accepted)

Product/category demand

Pre-order demand

Coupon usage and redemption

[CONFIRMED — PRD brief §16 / Analytics section]



No numeric KPI targets (order volume, revenue share from online, traffic figures) are defined; these remain [OPEN DECISION — Master Product Brief §18] and must be set with the owner, not invented.



17. Traceability

PRD Section	Master Product Brief reference	Status source

Books-first merchandising (CAT-005)	§6, "Strategic Implication"	Confirmed

Service as distinct model (§6.14, §8.4)	§13	Confirmed

No fixed governorate price table (SHIP-007)	§21 Open Decisions	Open Decision

No return-period invention (RET-004)	§20, §21	Open Decision

Seasonal layer, not structure (CMS-002)	§7	Confirmed

WhatsApp remains prominent (§6.24)	§4, §10, §25	Confirmed

No product reviews (PDP-005)	Not in Master Brief — decided directly in PRD brief §29	Confirmed (PRD-brief-level decision)

Payment methods list (CHK-007, PAY-001)	§4 (current methods) + PRD brief §12 (expanded e-wallets)	Confirmed (PRD-brief-level expansion beyond the Brief's four current methods — see Open Decisions/Recommendations below)

No numeric KPI invention (REP-002, §16)	§18	Open Decision

RBAC roles (§6.22)	Not in Master Brief — decided directly in PRD brief §31	Confirmed (PRD-brief-level decision)

Every other functional requirement in Section 6 carries its own inline [CONFIRMED] / [PRODUCT RECOMMENDATION] / [OPEN DECISION] label and brief citation.



Note on payment-method scope: the Master Product Brief confirms four active payment methods (COD, cash at library, InstaPay, Vodafone Cash — §4, §12). The PRD brief (an explicit decision per the source-of-truth hierarchy) expands the e-wallet list to include Orange Cash, Etisalat Cash, and WE Pay, and does not mention "cash at library" as a checkout-selectable method. This PRD follows the PRD brief's explicit list per the stated priority order (explicit PRD-brief decisions outrank the Master Product Brief), but flags it below as a point the owner should confirm, since it extends beyond what the owner directly stated.



18. Open Decisions

ID	Decision	Why it matters	Owner	Status

OD-01	Final phone numbers for the website	Needed for WhatsApp/contact actions	Business owner	Open

OD-02	Email-verification gating scope (which actions require it)	Affects registration friction and security posture	Product/Business owner	Open

OD-03	Exact governorate shipping rate source/logic	Needed to compute SHIP-004 estimates	Business owner	Open

OD-04	Binding point for Admin-adjusted final shipping cost	Affects customer trust and dispute handling	Product/Business owner	Open

OD-05	Delivery time ranges by area	Needed for customer-facing delivery expectations	Business owner	Open

OD-06	Excluded governorates/areas for shipping	Needed for checkout validation	Business owner	Open

OD-07	COD non-confirmation timeout/expiry (if any)	Prevents indefinitely stuck orders	Business owner	Open

OD-08	Concurrent-order stock-contention resolution rule	Affects fairness and customer trust at scale	Product/Business owner	Open

OD-09	Low-stock/reorder numeric thresholds	Needed for inventory alerts	Business owner	Open

OD-10	Pre-order price honoring policy	Affects customer trust and pricing consistency	Business owner	Open

OD-11	Pre-order allocation order among multiple requests	Fairness when supply is limited	Business owner	Open

OD-12	Required fields/documents per service type	Needed to build service-request forms	Business owner	Open

OD-13	Turnaround times per service type	Sets customer expectations	Business owner	Open

OD-14	Whether COD applies to services or only InstaPay/e-wallet	Payment-flow completeness for services	Business owner	Open

OD-15	Category-specific return periods/policies	Needed for return-eligibility logic	Business owner	Open

OD-16	Refund processing SLA	Sets customer/support expectations	Business owner	Open

OD-17	Coupon stacking, usage limits, expiry defaults, minimum order value, customer restrictions	Needed to build coupon engine rules	Business owner	Open

OD-18	Numeric KPI targets (orders, revenue share, traffic)	Needed for meaningful reporting benchmarks	Business owner	Open

OD-19	Accessibility conformance level and performance/availability SLAs	Sets NFR acceptance bar	Product/Business owner	Open

OD-20	Confirm final payment-method list (Orange Cash/Etisalat Cash/WE Pay vs. Master Brief's confirmed four) and whether "cash at library" is checkout-selectable	Resolves a scope difference between the Master Product Brief and the PRD brief	Business owner	Open

OD-21	Partial-acceptance behavior when only part of a multi-item order has sufficient stock	Affects Admin workflow and customer communication	Product/Business owner	Open

19. Product Recommendations

Each requires explicit owner approval before being treated as a settled requirement.



Recommendation: Re-validate cart price/availability at the start of checkout (CART-005). Reason: Prevents customers from paying stale prices or ordering items that went out of stock between browsing and checkout. Tradeoff: Minor added complexity in cart/checkout logic. Impact: Reduces disputes and rejected orders. Owner approval required: Yes.



Recommendation: Require variant selection before add-to-cart when variants exist (VAR-004). Reason: Prevents ambiguous orders where the specific edition/publisher/language is unclear. Tradeoff: Slightly more friction on the product page. Impact: Reduces order-preparation errors and Admin back-and-forth. Owner approval required: Yes.



Recommendation: Display an order summary with full cost breakdown before submission (CHK-011). Reason: Supports the confirmed Trust & Security pillar; reduces disputes. Tradeoff: None significant. Impact: Higher perceived trustworthiness at checkout. Owner approval required: Yes (low-risk, but flagged per process).



Recommendation: Auto-close a service quotation when rejected, without payment (QUOTE-004). Reason: Logical completion of the Accept/Reject flow described in the Master Product Brief. Tradeoff: None significant. Impact: Keeps the service pipeline clean for Admin. Owner approval required: Yes.



Recommendation: Reuse the existing payment/proof-of-payment model for paying accepted service quotations rather than inventing a separate service-payment model (§6.15). Reason: Consistency for customers and Admin; avoids building two parallel payment UIs. Tradeoff: COD-for-services applicability is unresolved (see OD-14). Impact: Faster build, consistent UX. Owner approval required: Yes.



Recommendation: Prevent Admin from accepting an order that would push any line item's reserved quantity below zero available stock (INV-006), except for pre-order-eligible items. Reason: Direct, necessary consequence of the confirmed reservation model. Tradeoff: Requires Admin to reject/adjust orders that can't be fully fulfilled. Impact: Prevents overselling. Owner approval required: Yes.



20. Future Considerations

Aligned with the Master Product Brief's Future Opportunities (§22) and this PRD's confirmed MVP boundary — none of these are committed or scoped:



Educational/editorial content module (grade-specific guides, back-to-school content) once a content owner exists

Catalog expansion into Tajweed, Qira'at, Quran-memorization curricula, nursery curricula, and Qurans as a distinct future category

Paid social advertising integration/tracking once the store is live

Deeper personalization/segmentation once real usage data exists

Additional specialized RBAC roles (Products Admin, Orders Admin, Services Admin, Content Admin)

Product reviews (explicitly out of scope for the current version, per PDP-005)

A dedicated search engine (e.g., Elasticsearch) if catalog scale later requires it (PRD brief §34)

Final Consistency Check

A review was performed against the contradiction points listed in the PRD brief:



Payment before/after Admin review: Consistent — non-COD payment proof is only reviewed after order acceptance (Awaiting Payment occurs post-Accept); no path allows payment confirmation before Admin acceptance.

COD confirmation: Consistent — Customer Confirmation Required always follows Admin acceptance and precedes Preparing.

Customer cancellation: Consistent — cancellation is restricted to Pending Review throughout (ORD-007, §8.1, §9.8, §13).

Stock reservation: Consistent — reservation on acceptance, release on rejection/cancellation, final deduction only on Delivered/Picked Up, applied uniformly in §6.12 and §8.6.

Pre-orders: Consistent — pre-order flow (§6.13, §8.5, §9.12) does not reserve stock (none exists yet) and merges into standard fulfillment only once the product becomes available.

Returns: Consistent — returns only apply post-Completed order, feed into a separate Return/Refund state machine (§8.3), and respect Admin-set non-returnable flags (RET-003).

Refunds: Consistent — always manual, always a distinct Refund Record from the original payment (REF-002).

Guest checkout: Consistent — guest checkout is confirmed and unrestricted throughout Sections 4, 6.7, 9.1, and 13.

Student services: Consistent — never merged into the product/cart/checkout model; always Request → Review → Quotation → Accept/Reject → Payment → Fulfillment (§6.14–6.15, §8.4, §9.13–9.14).

File uploads: Consistent — no file upload exists for service requests anywhere in the document (SRV-003/004, §33); payment-proof screenshots are the only customer-uploaded files, and are explicitly distinct.

WhatsApp: Consistent — never treated as the transactional source of truth; always a contact/communication action (§6.24, business rule 1).

Admin permissions: Consistent — RBAC (§6.22) is referenced wherever Admin/Owner actions are defined; no action contradicts the two-role-minimum, extensible model.

Product reviews: Consistent — explicitly excluded in Scope (§3) and Product Details (PDP-005), and not reintroduced elsewhere.

One flagged inconsistency between source documents (not silently resolved): the Master Product Brief confirms four active payment methods (COD, cash at library, InstaPay, Vodafone Cash), while the PRD brief's explicit instruction (§12) lists six methods (adding Orange Cash, Etisalat Cash, WE Pay) and does not list "cash at library" as a checkout option. Per the stated source-of-truth hierarchy, this PRD follows the PRD brief's explicit list, but this is documented as OD-20 for the owner to confirm rather than silently reconciled.
