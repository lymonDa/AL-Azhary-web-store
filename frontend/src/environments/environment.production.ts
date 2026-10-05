import type { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: '/api/v1',
  socketUrl: '',
  cloudinaryCloudName: 'al-azhari',
  defaultLocale: 'ar',
  supportedLocales: ['ar', 'en'],
  features: {
    enableSsr: false,
    enableAnalytics: false,
    enableMockupDevTools: false,
  },
};
