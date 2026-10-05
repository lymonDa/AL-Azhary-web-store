export interface AppEnvironment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly socketUrl: string;
  readonly cloudinaryCloudName: string;
  readonly defaultLocale: 'ar' | 'en';
  readonly supportedLocales: readonly ('ar' | 'en')[];
  readonly features: {
    readonly enableSsr: boolean;
    readonly enableAnalytics: boolean;
    readonly enableMockupDevTools: boolean;
  };
}
