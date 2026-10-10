export interface UserProfileDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: 'customer' | 'admin' | 'owner';
  readonly status: 'active' | 'suspended';
  readonly emailVerifiedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpdateProfileRequestDto {
  readonly name?: string | undefined;
  readonly phone?: string | undefined;
}

export interface CreateAddressRequestDto {
  readonly label?: string | null | undefined;
  readonly recipientName: string;
  readonly recipientPhone: string;
  readonly governorate: string;
  readonly city: string;
  readonly area: string;
  readonly street: string;
  readonly buildingNumber: string;
  readonly floor?: string | null | undefined;
  readonly apartment?: string | null | undefined;
  readonly landmark?: string | null | undefined;
  readonly notes?: string | null | undefined;
  readonly isDefault?: boolean | undefined;
}

export interface UpdateAddressRequestDto {
  readonly label?: string | null | undefined;
  readonly recipientName?: string | undefined;
  readonly recipientPhone?: string | undefined;
  readonly governorate?: string | undefined;
  readonly city?: string | undefined;
  readonly area?: string | undefined;
  readonly street?: string | undefined;
  readonly buildingNumber?: string | undefined;
  readonly floor?: string | null | undefined;
  readonly apartment?: string | null | undefined;
  readonly landmark?: string | null | undefined;
  readonly notes?: string | null | undefined;
  readonly isDefault?: boolean | undefined;
}
