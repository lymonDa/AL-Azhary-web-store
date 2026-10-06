"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSuccessResponse = formatSuccessResponse;
exports.formatErrorResponse = formatErrorResponse;
exports.sendSuccessResponse = sendSuccessResponse;
exports.sendCreatedResponse = sendCreatedResponse;
exports.sendNoContentResponse = sendNoContentResponse;
exports.sendErrorResponse = sendErrorResponse;
const status_codes_1 = require("./status-codes");
function formatSuccessResponse(requestId, data, pagination) {
    return {
        success: true,
        data,
        requestId,
        meta: {
            requestId,
            pagination: pagination ?? null,
            timestamp: new Date().toISOString(),
        },
    };
}
function formatErrorResponse(requestId, errorPayload) {
    return {
        success: false,
        error: {
            code: errorPayload.code,
            message: errorPayload.message,
            details: errorPayload.details ?? null,
            ...(errorPayload.fields && errorPayload.fields.length > 0 ? { fields: errorPayload.fields } : {}),
        },
        requestId,
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
        },
    };
}
function sendSuccessResponse(req, res, data, statusCode = status_codes_1.HttpStatus.OK, pagination) {
    const requestId = String(req.id || 'req_unknown');
    return res.status(statusCode).json(formatSuccessResponse(requestId, data, pagination));
}
function sendCreatedResponse(req, res, data, pagination) {
    return sendSuccessResponse(req, res, data, status_codes_1.HttpStatus.CREATED, pagination);
}
function sendNoContentResponse(res) {
    return res.status(status_codes_1.HttpStatus.NO_CONTENT).send();
}
function sendErrorResponse(req, res, errorPayload, statusCode = status_codes_1.HttpStatus.INTERNAL_SERVER_ERROR) {
    const requestId = String(req.id || 'req_unknown');
    return res.status(statusCode).json(formatErrorResponse(requestId, errorPayload));
}
//# sourceMappingURL=envelope.js.map