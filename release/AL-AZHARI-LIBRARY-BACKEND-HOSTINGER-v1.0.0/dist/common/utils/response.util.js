"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendCreated = sendCreated;
exports.sendNoContent = sendNoContent;
exports.sendError = sendError;
function sendSuccess(req, res, data, statusCode = 200, pagination) {
    const requestId = String(req.id || 'req_unknown');
    const response = {
        success: true,
        data,
        requestId,
        meta: {
            requestId,
            pagination: pagination ?? null,
            timestamp: new Date().toISOString(),
        },
    };
    return res.status(statusCode).json(response);
}
function sendCreated(req, res, data, pagination) {
    return sendSuccess(req, res, data, 201, pagination);
}
function sendNoContent(res) {
    return res.status(204).send();
}
function sendError(req, res, errorPayload, statusCode = 500) {
    const requestId = String(req.id || 'req_unknown');
    const response = {
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
    return res.status(statusCode).json(response);
}
//# sourceMappingURL=response.util.js.map