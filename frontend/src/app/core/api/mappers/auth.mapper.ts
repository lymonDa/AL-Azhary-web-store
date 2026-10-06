import type { AuthUser } from '../../../domain/models/auth.model';
import type { AuthUserDto } from '../dto/auth.dto';

export function mapAuthUserDtoToDomain(dto: AuthUserDto): AuthUser {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    role: dto.role,
    status: dto.status,
    isEmailVerified: Boolean(dto.emailVerifiedAt),
    emailVerifiedAt: dto.emailVerifiedAt ?? null,
  };
}
