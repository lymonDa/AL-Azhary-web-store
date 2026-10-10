import { TestBed } from '@angular/core/testing';
import { GuestSessionService, GUEST_SESSION_STORAGE_KEY } from './guest-session.service';
import { SafeStorage } from '../storage/safe-storage';

describe('GuestSessionService', () => {
  let service: GuestSessionService;
  let mockStorage: jasmine.SpyObj<SafeStorage>;

  beforeEach(() => {
    mockStorage = jasmine.createSpyObj<SafeStorage>('SafeStorage', [
      'getItem',
      'setItem',
      'removeItem',
    ]);

    TestBed.configureTestingModule({
      providers: [
        GuestSessionService,
        { provide: SafeStorage, useValue: mockStorage },
      ],
    });

    service = TestBed.inject(GuestSessionService);
  });

  it('should return null when no guest session exists', () => {
    mockStorage.getItem.and.returnValue(null);
    expect(service.getSessionId()).toBeNull();
    expect(service.hasActiveSession()).toBeFalse();
  });

  it('should return existing session id if present in storage and valid uuid', () => {
    const validUuid = '12345678-1234-4234-8234-123456789abc';
    mockStorage.getItem.and.returnValue(validUuid);
    expect(service.getSessionId()).toBe(validUuid);
    expect(service.hasActiveSession()).toBeTrue();
  });

  it('should generate, persist, and return new uuid session if none existed on getOrCreateSessionId', () => {
    mockStorage.getItem.and.returnValue(null);
    const sid = service.getOrCreateSessionId();
    expect(sid).toBeTruthy();
    expect(sid.length).toBeGreaterThan(10);
    expect(mockStorage.setItem).toHaveBeenCalledWith(GUEST_SESSION_STORAGE_KEY, sid);
  });

  it('should reuse existing session on getOrCreateSessionId if already stored', () => {
    const validUuid = '12345678-1234-4234-8234-123456789abc';
    mockStorage.getItem.and.returnValue(validUuid);
    const sid = service.getOrCreateSessionId();
    expect(sid).toBe(validUuid);
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('should remove session id on clearSessionId', () => {
    service.clearSessionId();
    expect(mockStorage.removeItem).toHaveBeenCalledWith(GUEST_SESSION_STORAGE_KEY);
  });
});
