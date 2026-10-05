import type { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: '/api/v1',
  socketUrl: '',
  cloudinaryCloudName: 'al-azhari-dev',
  defaultLocale: 'ar',
  supportedLocales: ['ar', 'en'],
  features: {
    enableSsr: false,
    enableAnalytics: false,
    enableMockupDevTools: true,
  },
};
