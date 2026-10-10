export interface CustomerProfile {
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

export interface CustomerAddress {
  readonly id: string;
  readonly label?: string | null;
  readonly recipientName: string;
  readonly recipientPhone: string;
  readonly governorate: string;
  readonly city: string;
  readonly area: string;
  readonly street: string;
  readonly buildingNumber: string;
  readonly floor?: string | null;
  readonly apartment?: string | null;
  readonly landmark?: string | null;
  readonly notes?: string | null;
  readonly isDefault: boolean;
}
