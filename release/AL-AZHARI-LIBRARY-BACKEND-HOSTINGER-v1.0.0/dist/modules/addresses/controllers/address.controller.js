"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAddressesController = listAddressesController;
exports.createAddressController = createAddressController;
exports.getAddressController = getAddressController;
exports.updateAddressController = updateAddressController;
exports.deleteAddressController = deleteAddressController;
const address_service_1 = require("../services/address.service");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
const logger_1 = require("../../../config/logger");
async function listAddressesController(req, res, next) {
    try {
        const principal = req.user;
        if (!principal) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        const addresses = await address_service_1.addressService.listAddresses(principal.userId);
        (0, response_util_1.sendSuccess)(req, res, addresses);
    }
    catch (error) {
        next(error);
    }
}
async function createAddressController(req, res, next) {
    try {
        const principal = req.user;
        if (!principal) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        const address = await address_service_1.addressService.createAddress(principal.userId, req.body);
        logger_1.logger.info({
            requestId: req.id,
            userId: principal.userId,
            addressId: address.id,
            operation: 'address_create',
        }, 'Customer address created successfully');
        (0, response_util_1.sendCreated)(req, res, address);
    }
    catch (error) {
        next(error);
    }
}
async function getAddressController(req, res, next) {
    try {
        const principal = req.user;
        if (!principal) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        const address = await address_service_1.addressService.getAddressById(principal.userId, req.params.id);
        (0, response_util_1.sendSuccess)(req, res, address);
    }
    catch (error) {
        next(error);
    }
}
async function updateAddressController(req, res, next) {
    try {
        const principal = req.user;
        if (!principal) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        const address = await address_service_1.addressService.updateAddress(principal.userId, req.params.id, req.body);
        logger_1.logger.info({
            requestId: req.id,
            userId: principal.userId,
            addressId: address.id,
            operation: 'address_update',
        }, 'Customer address updated successfully');
        (0, response_util_1.sendSuccess)(req, res, address);
    }
    catch (error) {
        next(error);
    }
}
async function deleteAddressController(req, res, next) {
    try {
        const principal = req.user;
        if (!principal) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        await address_service_1.addressService.deleteAddress(principal.userId, req.params.id);
        logger_1.logger.info({
            requestId: req.id,
            userId: principal.userId,
            addressId: req.params.id,
            operation: 'address_delete',
        }, 'Customer address deleted successfully');
        (0, response_util_1.sendNoContent)(res);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=address.controller.js.map