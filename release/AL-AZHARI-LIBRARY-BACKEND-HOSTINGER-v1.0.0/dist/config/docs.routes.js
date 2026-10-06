"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docsRouter = void 0;
const express_1 = require("express");
const env_1 = require("./env");
const openapi_1 = require("./openapi");
const auth_middleware_1 = require("../modules/auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../modules/auth/middleware/rbac.middleware");
const roles_1 = require("../common/constants/roles");
exports.docsRouter = (0, express_1.Router)();
/**
 * Serves the OpenAPI specification in JSON format.
 * Path: GET /api/v1/openapi.json or GET /api/v1/docs.json
 */
exports.docsRouter.get(['/openapi.json', '/docs.json'], (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(openapi_1.openApiConfig);
});
/**
 * Access guard for interactive Swagger UI:
 * - Development/Test/Staging: Unrestricted public access for API development
 * - Production: Protected behind authentication and Admin/Owner role check
 */
const swaggerUIAccessGuard = (req, res, next) => {
    if (env_1.env.NODE_ENV === 'production') {
        // In production, require authentication and admin role
        return (0, auth_middleware_1.requireAuthentication)()(req, res, () => {
            return (0, rbac_middleware_1.requireRole)(roles_1.UserRoles.ADMIN, roles_1.UserRoles.OWNER)(req, res, next);
        });
    }
    return next();
};
/**
 * Generates the self-contained HTML for Swagger UI using the official CDN.
 */
function getSwaggerUIHtml(specUrl) {
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
exports.docsRouter.get(['/', '/docs', '/swagger'], swaggerUIAccessGuard, (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const specUrl = `${env_1.env.API_BASE_PATH}/openapi.json`;
    return res.status(200).send(getSwaggerUIHtml(specUrl));
});
//# sourceMappingURL=docs.routes.js.map