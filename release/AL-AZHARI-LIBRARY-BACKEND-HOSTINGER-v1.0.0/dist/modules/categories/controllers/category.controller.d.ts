import { Request, Response, NextFunction } from 'express';
export declare function listCategoriesController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listAdminCategoriesController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createCategoryController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateCategoryController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteCategoryController(req: Request, res: Response, next: NextFunction): Promise<void>;
