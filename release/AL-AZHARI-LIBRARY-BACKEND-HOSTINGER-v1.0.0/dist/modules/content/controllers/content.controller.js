"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeContentController = getHomeContentController;
exports.listAdminContentController = listAdminContentController;
exports.getContentByIdController = getContentByIdController;
exports.createContentController = createContentController;
exports.updateContentController = updateContentController;
exports.deleteContentController = deleteContentController;
const content_service_1 = require("../services/content.service");
const response_util_1 = require("../../../common/utils/response.util");
async function getHomeContentController(req, res, next) {
    try {
        const modules = await content_service_1.contentService.getHomeContent();
        (0, response_util_1.sendSuccess)(req, res, modules);
    }
    catch (error) {
        next(error);
    }
}
async function listAdminContentController(req, res, next) {
    try {
        const modules = await content_service_1.contentService.listAdminContent();
        (0, response_util_1.sendSuccess)(req, res, modules);
    }
    catch (error) {
        next(error);
    }
}
async function getContentByIdController(req, res, next) {
    try {
        const module = await content_service_1.contentService.getContentById(req.params.id);
        (0, response_util_1.sendSuccess)(req, res, module);
    }
    catch (error) {
        next(error);
    }
}
async function createContentController(req, res, next) {
    try {
        const module = await content_service_1.contentService.createContent(req.body, req.user?.userId, req.user?.role, req.id ? String(req.id) : undefined);
        (0, response_util_1.sendCreated)(req, res, module);
    }
    catch (error) {
        next(error);
    }
}
async function updateContentController(req, res, next) {
    try {
        const module = await content_service_1.contentService.updateContent(req.params.id, req.body, req.user?.userId, req.user?.role, req.id ? String(req.id) : undefined);
        (0, response_util_1.sendSuccess)(req, res, module);
    }
    catch (error) {
        next(error);
    }
}
async function deleteContentController(req, res, next) {
    try {
        await content_service_1.contentService.deleteContent(req.params.id, req.user?.userId, req.user?.role, req.id ? String(req.id) : undefined);
        (0, response_util_1.sendSuccess)(req, res, { message: 'Content module deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=content.controller.js.map