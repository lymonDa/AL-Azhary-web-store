import { TestBed } from '@angular/core/testing';
import { LocaleService } from './locale.service';
import { DirectionService } from './direction.service';
import { SafeStorage } from '../storage/safe-storage';
import { PlatformService } from '../storage/platform.service';

describe('LocaleService', () => {
  let service: LocaleService;
  let directionService: DirectionService;
  let storage: SafeStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocaleService, DirectionService, SafeStorage, PlatformService],
    });
    storage = TestBed.inject(SafeStorage);
    storage.clear();
    service = TestBed.inject(LocaleService);
    directionService = TestBed.inject(DirectionService);
  });

  afterEach(() => {
    storage.clear();
  });

  it('should default to Arabic locale with RTL direction', () => {
    service.setLocale('ar');
    expect(service.currentLocale()).toEqual('ar');
    expect(service.isArabic()).toBeTrue();
    expect(directionService.direction()).toEqual('rtl');
    expect(directionService.isRtl()).toBeTrue();
  });

  it('should switch to English with LTR direction', () => {
    service.setLocale('en');
    expect(service.currentLocale()).toEqual('en');
    expect(service.isEnglish()).toBeTrue();
    expect(directionService.direction()).toEqual('ltr');
    expect(directionService.isLtr()).toBeTrue();
  });
});
