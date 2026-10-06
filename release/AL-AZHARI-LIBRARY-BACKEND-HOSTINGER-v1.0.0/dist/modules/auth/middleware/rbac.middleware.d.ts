import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../common/constants/roles';
/**
 * Middleware requiring the authenticated user to have one of the specified roles.
 */
export declare function requireRole(...allowedRoles: UserRole[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware requiring the authenticated user's role to possess the required permission.
 * Owner role possesses universal bypass/all permissions.
 */
export declare function requirePermission(...requiredPermissions: string[]): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
