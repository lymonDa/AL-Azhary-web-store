/**
 * Product-scoped Pre-order Router (mounted at /products)
 * POST /api/v1/products/:slug/pre-orders
 */
export declare const productPreorderRouter: import("express-serve-static-core").Router;
/**
 * Customer Pre-order Router (mounted at /pre-orders)
 * Requires authenticated customer
 */
export declare const customerPreorderRouter: import("express-serve-static-core").Router;
/**
 * Admin Pre-order Router (mounted at /admin/pre-orders)
 * Requires authenticated user with 'preorders.write' permission
 */
export declare const adminPreorderRouter: import("express-serve-static-core").Router;
