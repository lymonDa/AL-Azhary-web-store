import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { VerifyEmailComponent } from './verify-email.component';
import { AuthStore } from '../../../core/auth/auth.store';
import { VerifyEmailResponseDto } from '../../../core/api/dto/auth.dto';

describe('VerifyEmailComponent', () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let component: VerifyEmailComponent;
  let authStoreMock: {
    verifyEmail: jasmine.Spy;
  };

  const setupTest = async (tokenValue: string | null) => {
    authStoreMock = {
      verifyEmail: jasmine.createSpy('verifyEmail'),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? tokenValue : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
  };

  it('renders instructions when no token parameter is passed', async () => {
    await setupTest(null);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(authStoreMock.verifyEmail).not.toHaveBeenCalled();
    const text = fixture.nativeElement.querySelector('.az-verify-status__text');
    expect(text?.textContent).toContain('يرجى فتح الرابط المرسل إلى بريدك');
  });

  it('calls verifyEmail and renders success when token is valid', async () => {
    await setupTest('valid-token-123');
    authStoreMock.verifyEmail.and.returnValue(
      of({ verified: true } as VerifyEmailResponseDto),
    );

    fixture.detectChanges();

    expect(authStoreMock.verifyEmail).toHaveBeenCalledWith('valid-token-123');
    const successTitle = fixture.nativeElement.querySelector('.az-verify-status__title');
    expect(successTitle?.textContent).toContain('تم تأكيد البريد الإلكتروني بنجاح');
  });

  it('renders error notice when token verification fails', async () => {
    await setupTest('expired-token');
    authStoreMock.verifyEmail.and.returnValue(throwError(() => new Error('Invalid token')));

    fixture.detectChanges();

    expect(authStoreMock.verifyEmail).toHaveBeenCalledWith('expired-token');
    const errorTitle = fixture.nativeElement.querySelector('.az-verify-status__title');
    expect(errorTitle?.textContent).toContain('تعذر تأكيد البريد');
  });
});
