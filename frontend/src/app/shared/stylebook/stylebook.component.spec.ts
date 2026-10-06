import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StylebookComponent } from './stylebook.component';
import { ToastService } from '../overlay/toast/toast.service';

describe('StylebookComponent', () => {
  let component: StylebookComponent;
  let fixture: ComponentFixture<StylebookComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StylebookComponent],
      providers: [ToastService],
    }).compileComponents();

    toastService = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(StylebookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the stylebook component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle direction between rtl and ltr', () => {
    expect(component.currentDirection()).toBe('rtl');
    component.toggleDirection();
    expect(component.currentDirection()).toBe('ltr');
    component.toggleDirection();
    expect(component.currentDirection()).toBe('rtl');
  });

  it('should trigger toast messages via toastService', () => {
    expect(toastService.toasts().length).toBe(0);
    component.triggerToast('success');
    expect(toastService.toasts().length).toBe(1);
    expect(toastService.toasts()[0]?.tone).toBe('success');
  });

  it('should toggle modal visibility', () => {
    expect(component.isModalOpen).toBeFalse();
    component.isModalOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-modal')).toBeTruthy();
  });
});
