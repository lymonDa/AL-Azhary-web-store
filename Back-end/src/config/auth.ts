import { env } from './env';

export const authConfig = {
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshTtl: env.JWT_REFRESH_TTL,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },
  cookie: {
    name: env.REFRESH_COOKIE_NAME,
    secure: env.REFRESH_COOKIE_SECURE,
    sameSite: env.REFRESH_COOKIE_SAME_SITE,
    httpOnly: true,
    path: `${env.API_BASE_PATH}/auth`,
  },
  argon2: {
    memoryCost: env.ARGON2_MEMORY_COST,
    timeCost: env.ARGON2_TIME_COST,
    parallelism: env.ARGON2_PARALLELISM,
  },
};
