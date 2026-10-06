"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressRouter = void 0;
const express_1 = require("express");
const address_controller_1 = require("../controllers/address.controller");
const address_schema_1 = require("../schemas/address.schema");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const common_validators_1 = require("../../../common/validators/common.validators");
exports.addressRouter = (0, express_1.Router)();
// All address operations require authenticated customer principal
exports.addressRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.addressRouter.get('/', address_controller_1.listAddressesController);
exports.addressRouter.post('/', (0, common_validators_1.validateRequest)({ body: address_schema_1.createAddressSchema }), address_controller_1.createAddressController);
exports.addressRouter.get('/:id', (0, common_validators_1.validateRequest)({ params: address_schema_1.addressIdParamSchema }), address_controller_1.getAddressController);
exports.addressRouter.patch('/:id', (0, common_validators_1.validateRequest)({ params: address_schema_1.addressIdParamSchema, body: address_schema_1.updateAddressSchema }), address_controller_1.updateAddressController);
exports.addressRouter.delete('/:id', (0, common_validators_1.validateRequest)({ params: address_schema_1.addressIdParamSchema }), address_controller_1.deleteAddressController);
//# sourceMappingURL=address.routes.js.map