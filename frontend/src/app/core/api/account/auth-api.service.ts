import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import type {
  AuthUserDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshResponseDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from '../dto/auth.dto';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly client = inject(ApiClient);

  register(payload: RegisterRequestDto): Observable<AuthUserDto> {
    return this.client.postData<AuthUserDto>('/auth/register', payload);
  }

  login(payload: LoginRequestDto): Observable<LoginResponseDto> {
    return this.client.postData<LoginResponseDto>('/auth/login', payload, {
      withCredentials: true,
    });
  }

  refresh(): Observable<RefreshResponseDto> {
    return this.client.postData<RefreshResponseDto>(
      '/auth/refresh',
      {},
      { withCredentials: true },
    );
  }

  getMe(): Observable<AuthUserDto> {
    return this.client.getData<AuthUserDto>('/me');
  }

  logout(all = false): Observable<void> {
    return this.client.postData<void>(
      '/auth/logout',
      { all },
      { withCredentials: true },
    );
  }

  verifyEmail(token: string): Observable<VerifyEmailResponseDto> {
    const payload: VerifyEmailRequestDto = { token };
    return this.client.postData<VerifyEmailResponseDto>('/auth/verify-email', payload);
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponseDto> {
    const payload: ForgotPasswordRequestDto = { email };
    return this.client.postData<ForgotPasswordResponseDto>('/auth/forgot-password', payload);
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    const payload: ResetPasswordRequestDto = { token, newPassword };
    return this.client.postData<void>('/auth/reset-password', payload, {
      withCredentials: true,
    });
  }
}
