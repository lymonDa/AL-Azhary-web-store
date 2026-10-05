import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let service: PlatformService;

  describe('in browser environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [PlatformService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(PlatformService);
    });

    it('should identify browser platform', () => {
      expect(service.isBrowser).toBeTrue();
      expect(service.isServer).toBeFalse();
    });

    it('should return window and document in browser', () => {
      expect(service.window).toBeTruthy();
      expect(service.document).toBeTruthy();
    });
  });

  describe('in server environment', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [PlatformService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(PlatformService);
    });

    it('should identify server platform and return null for window/storage', () => {
      expect(service.isBrowser).toBeFalse();
      expect(service.isServer).toBeTrue();
      expect(service.window).toBeNull();
      expect(service.localStorage).toBeNull();
      expect(service.sessionStorage).toBeNull();
    });
  });
});
