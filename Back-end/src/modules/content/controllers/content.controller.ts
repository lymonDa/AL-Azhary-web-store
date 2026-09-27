import { Request, Response, NextFunction } from 'express';
import { contentService } from '../services/content.service';
import { sendSuccess, sendCreated } from '../../../common/utils/response.util';

export async function getHomeContentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const modules = await contentService.getHomeContent();
    sendSuccess(req, res, modules);
  } catch (error) {
    next(error);
  }
}

export async function listAdminContentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const modules = await contentService.listAdminContent();
    sendSuccess(req, res, modules);
  } catch (error) {
    next(error);
  }
}

export async function getContentByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const module = await contentService.getContentById(req.params.id);
    sendSuccess(req, res, module);
  } catch (error) {
    next(error);
  }
}

export async function createContentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const module = await contentService.createContent(
      req.body,
      req.user?.userId,
      req.user?.role,
      req.id ? String(req.id) : undefined,
    );
    sendCreated(req, res, module);
  } catch (error) {
    next(error);
  }
}

export async function updateContentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const module = await contentService.updateContent(
      req.params.id,
      req.body,
      req.user?.userId,
      req.user?.role,
      req.id ? String(req.id) : undefined,
    );
    sendSuccess(req, res, module);
  } catch (error) {
    next(error);
  }
}

export async function deleteContentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await contentService.deleteContent(
      req.params.id,
      req.user?.userId,
      req.user?.role,
      req.id ? String(req.id) : undefined,
    );
    sendSuccess(req, res, { message: 'Content module deleted successfully' });
  } catch (error) {
    next(error);
  }
}
