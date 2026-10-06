export interface AuthUserDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: 'customer' | 'admin' | 'owner' | string;
  readonly status: 'active' | 'suspended' | string;
  readonly emailVerifiedAt?: string | null | undefined;
  readonly createdAt?: string | undefined;
  readonly updatedAt?: string | undefined;
}

export interface RegisterRequestDto {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
}

export interface LoginRequestDto {
  readonly email?: string | undefined;
  readonly phone?: string | undefined;
  readonly identifier?: string | undefined;
  readonly password: string;
}

export interface LoginResponseDto {
  readonly accessToken: string;
  readonly user: AuthUserDto;
  readonly session?: {
    readonly id: string;
  } | undefined;
}

export interface RefreshResponseDto {
  readonly accessToken: string;
}

export interface VerifyEmailRequestDto {
  readonly token: string;
}

export interface VerifyEmailResponseDto {
  readonly user: AuthUserDto;
  readonly verified: boolean;
}

export interface ForgotPasswordRequestDto {
  readonly email: string;
}

export interface ForgotPasswordResponseDto {
  readonly message: string;
}

export interface ResetPasswordRequestDto {
  readonly token: string;
  readonly newPassword: string;
}

export interface LogoutRequestDto {
  readonly all?: boolean | undefined;
}
