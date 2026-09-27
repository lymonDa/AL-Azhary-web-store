import { Request, Response, NextFunction } from 'express';
import { UserRole, UserRoles } from '../../../common/constants/roles';
import { ForbiddenError, UnauthorizedError } from '../../../common/errors';
import { rolesService } from '../../users/services/roles.service';

/**
 * Middleware requiring the authenticated user to have one of the specified roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Access forbidden: insufficient role permissions'));
    }

    next();
  };
}

/**
 * Middleware requiring the authenticated user's role to possess the required permission.
 * Owner role possesses universal bypass/all permissions.
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // Owner role always has unrestricted authority
      if (req.user.role === UserRoles.OWNER) {
        return next();
      }

      for (const permission of requiredPermissions) {
        const hasPerm = await rolesService.hasPermission(req.user.role, permission);
        if (!hasPerm) {
          return next(new ForbiddenError(`Access forbidden: missing required permission "${permission}"`));
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
