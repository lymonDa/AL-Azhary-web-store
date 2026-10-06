"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProductsController = listProductsController;
exports.searchProductsController = searchProductsController;
exports.getProductBySlugController = getProductBySlugController;
exports.listAdminProductsController = listAdminProductsController;
exports.getAdminProductByIdController = getAdminProductByIdController;
exports.createProductController = createProductController;
exports.updateProductController = updateProductController;
const product_service_1 = require("../services/product.service");
const response_util_1 = require("../../../common/utils/response.util");
async function listProductsController(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const category = req.query.category;
        const availability = req.query.availability;
        const result = await product_service_1.productService.listPublicProducts({
            page,
            limit,
            category,
            availability,
        });
        (0, response_util_1.sendSuccess)(req, res, result.items, 200, {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        });
    }
    catch (error) {
        next(error);
    }
}
async function searchProductsController(req, res, next) {
    try {
        const q = String(req.query.q ?? '');
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const category = req.query.category;
        const availability = req.query.availability;
        const result = await product_service_1.productService.searchPublicProducts(q, {
            page,
            limit,
            category,
            availability,
        });
        (0, response_util_1.sendSuccess)(req, res, result.items, 200, {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        });
    }
    catch (error) {
        next(error);
    }
}
async function getProductBySlugController(req, res, next) {
    try {
        const product = await product_service_1.productService.getPublicProductBySlug(req.params.slug);
        (0, response_util_1.sendSuccess)(req, res, product);
    }
    catch (error) {
        next(error);
    }
}
async function listAdminProductsController(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const result = await product_service_1.productService.listAdminProducts(page, limit);
        (0, response_util_1.sendSuccess)(req, res, result.items, 200, {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdminProductByIdController(req, res, next) {
    try {
        const product = await product_service_1.productService.getAdminProductById(req.params.id);
        (0, response_util_1.sendSuccess)(req, res, product);
    }
    catch (error) {
        next(error);
    }
}
async function createProductController(req, res, next) {
    try {
        const product = await product_service_1.productService.createProduct(req.body, req.user?.userId, req.user?.role, req.id ? String(req.id) : undefined);
        (0, response_util_1.sendCreated)(req, res, product);
    }
    catch (error) {
        next(error);
    }
}
async function updateProductController(req, res, next) {
    try {
        const product = await product_service_1.productService.updateProduct(req.params.id, req.body, req.user?.userId, req.user?.role, req.id ? String(req.id) : undefined);
        (0, response_util_1.sendSuccess)(req, res, product);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=product.controller.js.map