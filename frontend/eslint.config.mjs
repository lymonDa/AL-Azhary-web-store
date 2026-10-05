// @ts-check
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  {
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        {
          type: "core",
          pattern: "src/app/core/**",
          mode: "full",
        },
        {
          type: "domain",
          pattern: "src/app/domain/**",
          mode: "full",
        },
        {
          type: "shared",
          pattern: "src/app/shared/**",
          mode: "full",
        },
        {
          type: "layout",
          pattern: "src/app/layout/**",
          mode: "full",
        },
        {
          type: "features-admin",
          pattern: "src/app/features/admin/**",
          mode: "full",
        },
        {
          type: "features-storefront",
          pattern: "src/app/features/storefront/**",
          mode: "full",
        },
        {
          type: "features-checkout",
          pattern: "src/app/features/checkout/**",
          mode: "full",
        },
        {
          type: "features-customer",
          pattern: "src/app/features/customer/**",
          mode: "full",
        },
        {
          type: "features-services",
          pattern: "src/app/features/services/**",
          mode: "full",
        },
        {
          type: "features-auth",
          pattern: "src/app/features/auth/**",
          mode: "full",
        },
        {
          type: "features-orders",
          pattern: "src/app/features/orders/**",
          mode: "full",
        },
        {
          type: "features-preorders",
          pattern: "src/app/features/preorders/**",
          mode: "full",
        },
        {
          type: "routing",
          pattern: "src/app/routing/**",
          mode: "full",
        },
        {
          type: "env",
          pattern: "src/environments/**",
          mode: "full",
        },
      ],
    },
  },
  {
    files: ["**/*.ts"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "core",
              allow: ["core", "domain", "env"],
            },
            {
              from: "domain",
              allow: ["domain"],
            },
            {
              from: "shared",
              allow: ["shared", "core", "domain", "env"],
            },
            {
              from: "layout",
              allow: ["layout", "core", "domain", "shared", "env"],
            },
            {
              from: "features-admin",
              allow: ["core", "domain", "shared", "env", "features-admin"],
            },
            {
              from: "features-storefront",
              allow: ["core", "domain", "shared", "env", "features-storefront"],
            },
            {
              from: "features-checkout",
              allow: ["core", "domain", "shared", "env", "features-checkout"],
            },
            {
              from: "features-customer",
              allow: ["core", "domain", "shared", "env", "features-customer"],
            },
            {
              from: "features-services",
              allow: ["core", "domain", "shared", "env", "features-services"],
            },
            {
              from: "features-auth",
              allow: ["core", "domain", "shared", "env", "features-auth"],
            },
            {
              from: "features-orders",
              allow: ["core", "domain", "shared", "env", "features-orders"],
            },
            {
              from: "features-preorders",
              allow: ["core", "domain", "shared", "env", "features-preorders"],
            },
            {
              from: "routing",
              allow: [
                "core",
                "domain",
                "shared",
                "layout",
                "env",
                "features-admin",
                "features-storefront",
                "features-checkout",
                "features-customer",
                "features-services",
                "features-auth",
                "features-orders",
                "features-preorders",
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
