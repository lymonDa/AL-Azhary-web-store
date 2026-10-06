"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
const env_1 = require("./env");
exports.authConfig = {
    jwt: {
        accessSecret: env_1.env.JWT_ACCESS_SECRET,
        accessTtl: env_1.env.JWT_ACCESS_TTL,
        refreshSecret: env_1.env.JWT_REFRESH_SECRET,
        refreshTtl: env_1.env.JWT_REFRESH_TTL,
        issuer: env_1.env.JWT_ISSUER,
        audience: env_1.env.JWT_AUDIENCE,
    },
    cookie: {
        name: env_1.env.REFRESH_COOKIE_NAME,
        secure: env_1.env.REFRESH_COOKIE_SECURE,
        sameSite: env_1.env.REFRESH_COOKIE_SAME_SITE,
        httpOnly: true,
        path: `${env_1.env.API_BASE_PATH}/auth`,
    },
    argon2: {
        memoryCost: env_1.env.ARGON2_MEMORY_COST,
        timeCost: env_1.env.ARGON2_TIME_COST,
        parallelism: env_1.env.ARGON2_PARALLELISM,
    },
};
//# sourceMappingURL=auth.js.map