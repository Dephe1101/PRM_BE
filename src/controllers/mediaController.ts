import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '#utils/catchAsync';
import { mediaService } from '#services/mediaService';
import { COMMON_CONSTANTS } from '#constants/common';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';

export const mediaController = {
  upload: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Chưa chọn file upload');
    }

    const folder = req.body.folder || COMMON_CONSTANTS.MEDIA_FOLDER.GENERAL;
    const result = await mediaService.upload(req.file, folder, req.user!._id);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Upload thành công',
      data: result,
    });
  }),

  uploadMultiple: catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Chưa chọn file upload');
    }

    const folder = req.body.folder || COMMON_CONSTANTS.MEDIA_FOLDER.GENERAL;
    const result = await mediaService.uploadMultiple(files, folder, req.user!._id);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Upload ${result.length} file thành công`,
      data: result,
    });
  }),

  getAll: catchAsync(async (req: Request, res: Response) => {
    const { folder, page, limit } = req.query;
    const result = await mediaService.getAll(
      { folder: folder as string },
      { page: Number(page) || 1, limit: Number(limit) || 10 }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await mediaService.getById(id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await mediaService.delete(id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa file thành công',
    });
  }),
};
