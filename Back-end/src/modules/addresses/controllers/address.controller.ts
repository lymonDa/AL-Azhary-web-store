import { Request, Response, NextFunction } from 'express';
import { addressService } from '../services/address.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../../common/utils/response.util';
import { UnauthorizedError } from '../../../common/errors';
import { logger } from '../../../config/logger';

export async function listAddressesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const principal = req.user;
    if (!principal) {
      throw new UnauthorizedError('Authentication required');
    }

    const addresses = await addressService.listAddresses(principal.userId);
    sendSuccess(req, res, addresses);
  } catch (error) {
    next(error);
  }
}

export async function createAddressController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const principal = req.user;
    if (!principal) {
      throw new UnauthorizedError('Authentication required');
    }

    const address = await addressService.createAddress(principal.userId, req.body);

    logger.info(
      {
        requestId: req.id,
        userId: principal.userId,
        addressId: address.id,
        operation: 'address_create',
      },
      'Customer address created successfully',
    );

    sendCreated(req, res, address);
  } catch (error) {
    next(error);
  }
}

export async function getAddressController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const principal = req.user;
    if (!principal) {
      throw new UnauthorizedError('Authentication required');
    }

    const address = await addressService.getAddressById(principal.userId, req.params.id);
    sendSuccess(req, res, address);
  } catch (error) {
    next(error);
  }
}

export async function updateAddressController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const principal = req.user;
    if (!principal) {
      throw new UnauthorizedError('Authentication required');
    }

    const address = await addressService.updateAddress(
      principal.userId,
      req.params.id,
      req.body,
    );

    logger.info(
      {
        requestId: req.id,
        userId: principal.userId,
        addressId: address.id,
        operation: 'address_update',
      },
      'Customer address updated successfully',
    );

    sendSuccess(req, res, address);
  } catch (error) {
    next(error);
  }
}

export async function deleteAddressController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const principal = req.user;
    if (!principal) {
      throw new UnauthorizedError('Authentication required');
    }

    await addressService.deleteAddress(principal.userId, req.params.id);

    logger.info(
      {
        requestId: req.id,
        userId: principal.userId,
        addressId: req.params.id,
        operation: 'address_delete',
      },
      'Customer address deleted successfully',
    );

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}
