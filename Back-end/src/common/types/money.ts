import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../constants/error-codes';

export interface MoneySnapshot {
  amountMinor: number; // Integer in EGP piastres
  currency: 'EGP';
}

export function assertMoney(value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      'Money must be a non-negative integer in minor units (piastres)',
      400,
    );
  }
}
