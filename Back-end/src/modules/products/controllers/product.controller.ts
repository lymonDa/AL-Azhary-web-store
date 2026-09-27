import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess, sendCreated } from '../../../common/utils/response.util';
import { ProductAvailability } from '../types/product.types';

export async function listProductsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const category = req.query.category as string | undefined;
    const availability = req.query.availability as ProductAvailability | undefined;

    const result = await productService.listPublicProducts({
      page,
      limit,
      category,
      availability,
    });

    sendSuccess(req, res, result.items, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
}

export async function searchProductsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = String(req.query.q ?? '');
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const category = req.query.category as string | undefined;
    const availability = req.query.availability as ProductAvailability | undefined;

    const result = await productService.searchPublicProducts(q, {
      page,
      limit,
      category,
      availability,
    });

    sendSuccess(req, res, result.items, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlugController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.getPublicProductBySlug(req.params.slug);
    sendSuccess(req, res, product);
  } catch (error) {
    next(error);
  }
}

export async function listAdminProductsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await productService.listAdminProducts(page, limit);

    sendSuccess(req, res, result.items, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminProductByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.getAdminProductById(req.params.id);
    sendSuccess(req, res, product);
  } catch (error) {
    next(error);
  }
}

export async function createProductController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.createProduct(
      req.body,
      req.user?.userId,
      req.user?.role,
      req.id ? String(req.id) : undefined,
    );
    sendCreated(req, res, product);
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.updateProduct(
      req.params.id,
      req.body,
      req.user?.userId,
      req.user?.role,
      req.id ? String(req.id) : undefined,
    );
    sendSuccess(req, res, product);
  } catch (error) {
    next(error);
  }
}
