import { Request, Response, NextFunction } from 'express';
import { usersService } from '../services/users.service';
import { sendSuccess } from '../../../common/utils/response.util';
import { UnauthorizedError } from '../../../common/errors';

export async function getProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const principal = req.user;
    if (!principal) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await usersService.getUserById(principal.userId);
    sendSuccess(req, res, user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const principal = req.user;
    if (!principal) {
      throw new UnauthorizedError('Authentication required');
    }

    const updatedUser = await usersService.updateProfile(principal.userId, req.body);
    sendSuccess(req, res, updatedUser);
  } catch (error) {
    next(error);
  }
}
