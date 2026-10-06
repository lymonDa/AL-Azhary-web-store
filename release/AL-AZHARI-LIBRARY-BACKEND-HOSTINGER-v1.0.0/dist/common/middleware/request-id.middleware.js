"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidRequestId = isValidRequestId;
exports.generateRequestId = generateRequestId;
exports.requestIdMiddleware = requestIdMiddleware;
const crypto_1 = __importDefault(require("crypto"));
const VALID_REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
function isValidRequestId(id) {
    return typeof id === 'string' && VALID_REQUEST_ID_REGEX.test(id.trim());
}
function generateRequestId() {
    return `req_${crypto_1.default.randomUUID()}`;
}
function requestIdMiddleware(req, res, next) {
    const incomingId = req.headers['x-request-id'];
    const requestId = isValidRequestId(incomingId) ? incomingId.trim() : generateRequestId();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
}
//# sourceMappingURL=request-id.middleware.js.map