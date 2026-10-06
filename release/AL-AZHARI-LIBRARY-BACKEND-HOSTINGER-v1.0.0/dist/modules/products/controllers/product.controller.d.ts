import { Request, Response, NextFunction } from 'express';
export declare function listProductsController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function searchProductsController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getProductBySlugController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listAdminProductsController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getAdminProductByIdController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createProductController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateProductController(req: Request, res: Response, next: NextFunction): Promise<void>;
