"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("./env");
exports.logger = (0, pino_1.default)({
    level: env_1.env.NODE_ENV === 'test' ? 'silent' : env_1.env.NODE_ENV === 'production' ? 'info' : 'debug',
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-guest-token"]',
            'password',
            'passwordHash',
            'token',
            'accessToken',
            'refreshToken',
            'resetToken',
            'tokenHash',
            'resetTokenHash',
            'guestAccessTokenHash',
            'secret',
            'apiKey',
            'apiSecret',
            'clientSecret',
            'smtpPassword',
            'cloudinaryApiSecret',
            'cloudinarySignature',
            'signature',
            'paymentProofUrl',
            'paymentProof',
            'paymentDetails',
            'cardNumber',
            'cvv',
            'address',
            'fullAddress',
            'customerNotes',
            'notes',
            'authorization',
            'cookie',
            'mongoUri',
            'mongodbUri',
            'MONGODB_URI',
            '*.password',
            '*.passwordHash',
            '*.token',
            '*.accessToken',
            '*.refreshToken',
            '*.resetToken',
            '*.secret',
            '*.apiKey',
            '*.apiSecret',
            '*.clientSecret',
            '*.smtpPassword',
            '*.cloudinaryApiSecret',
            '*.signature',
            '*.paymentProofUrl',
            '*.paymentDetails',
            '*.customerNotes',
            '*.cardNumber',
            '*.cvv',
            '*.authorization',
            '*.cookie',
        ],
        censor: '[REDACTED]',
    },
    transport: env_1.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
});
//# sourceMappingURL=logger.js.map