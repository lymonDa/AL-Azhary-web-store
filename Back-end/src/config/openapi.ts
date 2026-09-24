import { env } from './env';

export const openApiConfig = {
  openapi: '3.0.3',
  info: {
    title: 'AL-AZHARI LIBRARY API',
    version: '1.0.0',
    description:
      'Production REST API for AL-AZHARI LIBRARY — Online Store & Student Services Platform',
    contact: {
      name: 'AL-AZHARI LIBRARY Engineering',
    },
  },
  servers: [
    {
      url: env.API_BASE_PATH,
      description: 'Current Environment API Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      RefreshTokenCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: env.REFRESH_COOKIE_NAME,
      },
      GuestTokenAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Guest-Token',
      },
    },
  },
};
