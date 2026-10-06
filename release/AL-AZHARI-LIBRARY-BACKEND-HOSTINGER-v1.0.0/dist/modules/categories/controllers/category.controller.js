"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategoriesController = listCategoriesController;
exports.listAdminCategoriesController = listAdminCategoriesController;
exports.createCategoryController = createCategoryController;
exports.updateCategoryController = updateCategoryController;
exports.deleteCategoryController = deleteCategoryController;
const category_service_1 = require("../services/category.service");
const response_util_1 = require("../../../common/utils/response.util");
async function listCategoriesController(req, res, next) {
    try {
        const categories = await category_service_1.categoryService.listPublicCategories();
        (0, response_util_1.sendSuccess)(req, res, categories);
    }
    catch (error) {
        next(error);
    }
}
async function listAdminCategoriesController(req, res, next) {
    try {
        const categories = await category_service_1.categoryService.listAdminCategories();
        (0, response_util_1.sendSuccess)(req, res, categories);
    }
    catch (error) {
        next(error);
    }
}
async function createCategoryController(req, res, next) {
    try {
        const category = await category_service_1.categoryService.createCategory(req.body, req.user?.userId, req.user?.role, req.id ? String(req.id) : undefined);
        (0, response_util_1.sendCreated)(req, res, category);
    }
    catch (error) {
        next(error);
    }
}
async function updateCategoryController(req, res, next) {
    try {
        const category = await category_service_1.categoryService.updateCategory(req.params.id, req.body, req.user?.userId, req.user?.role, req.id ? String(req.id) : undefined);
        (0, response_util_1.sendSuccess)(req, res, category);
    }
    catch (error) {
        next(error);
    }
}
async function deleteCategoryController(req, res, next) {
    try {
        const category = await category_service_1.categoryService.deleteCategory(req.params.id, req.user?.userId, req.user?.role, req.id ? String(req.id) : undefined);
        (0, response_util_1.sendSuccess)(req, res, category);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=category.controller.js.map