import { TestBed } from '@angular/core/testing';
import { SafeStorage } from './safe-storage';
import { PlatformService } from './platform.service';

describe('SafeStorage', () => {
  let storage: SafeStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafeStorage, PlatformService],
    });
    storage = TestBed.inject(SafeStorage);
    storage.clear();
  });

  it('should store, retrieve and remove items safely', () => {
    storage.setItem('test_key', 'test_value');
    expect(storage.getItem('test_key')).toEqual('test_value');

    storage.removeItem('test_key');
    expect(storage.getItem('test_key')).toBeNull();
  });

  it('should clear stored items', () => {
    storage.setItem('key1', 'val1');
    storage.setItem('key2', 'val2');
    storage.clear();

    expect(storage.getItem('key1')).toBeNull();
    expect(storage.getItem('key2')).toBeNull();
  });
});
