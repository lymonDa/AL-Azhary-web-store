import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AppConfigStore } from './app-config.store';
import { ConfigApi } from '../api/public/config-api.service';
import { AppConfigService } from './app-config.service';
import type { AppConfigDto } from '../api/dto/config.dto';

describe('AppConfigStore', () => {
  let store: AppConfigStore;
  let mockConfigApi: jasmine.SpyObj<ConfigApi>;

  beforeEach(() => {
    mockConfigApi = jasmine.createSpyObj<ConfigApi>('ConfigApi', ['getPublicConfig']);

    TestBed.configureTestingModule({
      providers: [
        AppConfigStore,
        AppConfigService,
        { provide: ConfigApi, useValue: mockConfigApi },
      ],
    });

    store = TestBed.inject(AppConfigStore);
  });

  it('initializes with safe defaults and idle status', () => {
    expect(store.status()).toBe('idle');
    expect(store.isLoaded()).toBe(false);
    expect(store.contact().whatsappNumber).toBeTruthy();
    expect(store.paymentMethods().length).toBeGreaterThan(0);
  });

  it('successfully loads and merges configuration from API', (done) => {
    const apiDto: AppConfigDto = {
      contact: {
        whatsappNumber: '+201012345678',
        phone: '+201012345678',
        email: 'support@al-azhari.com',
      },
      paymentMethods: ['COD', 'INSTAPAY'],
      businessHours: {
        ar: 'مفتوح دائماً',
      },
    };

    mockConfigApi.getPublicConfig.and.returnValue(of(apiDto));

    store.loadConfig().subscribe({
      next: (config) => {
        expect(store.status()).toBe('success');
        expect(store.isLoaded()).toBe(true);
        expect(store.whatsappNumber()).toBe('+201012345678');
        expect(store.paymentMethods()).toEqual(['COD', 'INSTAPAY']);
        expect(config.contact.email).toBe('support@al-azhari.com');
        done();
      },
      error: (err) => done.fail(err),
    });
  });

  it('handles API loading failure gracefully without throwing', (done) => {
    mockConfigApi.getPublicConfig.and.returnValue(
      throwError(() => new Error('Network error')),
    );

    store.loadConfig().subscribe({
      next: (config) => {
        expect(store.status()).toBe('error');
        expect(store.error()).toContain('Network error');
        // Remains with safe baseline
        expect(config.contact.whatsappNumber).toBeTruthy();
        done();
      },
      error: (err) => done.fail(err),
    });
  });

  it('updates partial config via updateConfig()', () => {
    store.updateConfig({
      paymentMethods: ['COD'],
    });

    expect(store.paymentMethods()).toEqual(['COD']);
  });
});
