import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { sendSuccess, sendCreated } from '../../../common/utils/response.util';

export async function listCategoriesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await categoryService.listPublicCategories();
    sendSuccess(req, res, categories);
  } catch (error) {
    next(error);
  }
}

export async function listAdminCategoriesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await categoryService.listAdminCategories();
    sendSuccess(req, res, categories);
  } catch (error) {
    next(error);
  }
}

export async function createCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoryService.createCategory(
      req.body,
      req.user?.userId,
      req.user?.role,
      req.id ? String(req.id) : undefined,
    );
    sendCreated(req, res, category);
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
      req.user?.userId,
      req.user?.role,
      req.id ? String(req.id) : undefined,
    );
    sendSuccess(req, res, category);
  } catch (error) {
    next(error);
  }
}

export async function deleteCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await categoryService.deleteCategory(
      req.params.id,
      req.user?.userId,
      req.user?.role,
      req.id ? String(req.id) : undefined,
    );
    sendSuccess(req, res, category);
  } catch (error) {
    next(error);
  }
}
