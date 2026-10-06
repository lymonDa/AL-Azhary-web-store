import { Request, Response, NextFunction } from 'express';
export declare function registerController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function loginController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function refreshController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function logoutController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function verifyEmailController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function forgotPasswordController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function resetPasswordController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getMeController(req: Request, res: Response, next: NextFunction): Promise<void>;
