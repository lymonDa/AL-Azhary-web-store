import { Request, Response, NextFunction } from 'express';
export declare function getHomeContentController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listAdminContentController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getContentByIdController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createContentController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateContentController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteContentController(req: Request, res: Response, next: NextFunction): Promise<void>;
