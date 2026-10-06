import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created and start with empty toasts list', () => {
    expect(service).toBeTruthy();
    expect(service.toasts().length).toBe(0);
  });

  it('should add toast with success tone', () => {
    const id = service.success('تمت العملية بنجاح');
    expect(id).toBeTruthy();
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]?.tone).toBe('success');
    expect(service.toasts()[0]?.message).toBe('تمت العملية بنجاح');
  });

  it('should add toast with error tone', () => {
    service.error('حدث خطأ');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]?.tone).toBe('error');
  });

  it('should dismiss toast by id', () => {
    const id1 = service.info('رسالة 1');
    service.info('رسالة 2');
    expect(service.toasts().length).toBe(2);

    service.dismiss(id1);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]?.message).toBe('رسالة 2');
  });

  it('should clear all toasts', () => {
    service.info('رسالة 1');
    service.info('رسالة 2');
    expect(service.toasts().length).toBe(2);

    service.clear();
    expect(service.toasts().length).toBe(0);
  });
});
