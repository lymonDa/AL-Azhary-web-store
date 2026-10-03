import { Router, Request, Response, NextFunction } from 'express';
import { env } from './env';
import { openApiConfig } from './openapi';
import { requireAuthentication } from '../modules/auth/middleware/auth.middleware';
import { requireRole } from '../modules/auth/middleware/rbac.middleware';
import { UserRoles } from '../common/constants/roles';

export const docsRouter = Router();

/**
 * Serves the OpenAPI specification in JSON format.
 * Path: GET /api/v1/openapi.json or GET /api/v1/docs.json
 */
docsRouter.get(['/openapi.json', '/docs.json'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(openApiConfig);
});

/**
 * Access guard for interactive Swagger UI:
 * - Development/Test/Staging: Unrestricted public access for API development
 * - Production: Protected behind authentication and Admin/Owner role check
 */
const swaggerUIAccessGuard = (req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV === 'production') {
    // In production, require authentication and admin role
    return requireAuthentication()(req, res, () => {
      return requireRole(UserRoles.ADMIN, UserRoles.OWNER)(req, res, next);
    });
  }
  return next();
};

/**
 * Generates the self-contained HTML for Swagger UI using the official CDN.
 */
function getSwaggerUIHtml(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AL-AZHARI LIBRARY API — Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-family: sans-serif; color: #1e293b; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
        filter: true,
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Interactive Swagger UI documentation handler.
 * Path: GET /docs or GET /api/v1/docs
 */
docsRouter.get(['/', '/docs', '/swagger'], swaggerUIAccessGuard, (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  const specUrl = `${env.API_BASE_PATH}/openapi.json`;
  return res.status(200).send(getSwaggerUIHtml(specUrl));
});
