import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '#utils/catchAsync';
import { levelService } from '#services/levelService';

export const levelController = {
  createLevel: catchAsync(async (req: Request, res: Response) => {
    const result = await levelService.createLevel(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo cấp độ thành công',
      data: result,
    });
  }),

  getAllLevels: catchAsync(async (req: Request, res: Response) => {
    const result = await levelService.getAllLevels();
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getLevelById: catchAsync(async (req: Request, res: Response) => {
    const result = await levelService.getLevelById(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  updateLevel: catchAsync(async (req: Request, res: Response) => {
    const result = await levelService.updateLevel(req.params.id as string, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật thành công',
      data: result,
    });
  }),

  deleteLevel: catchAsync(async (req: Request, res: Response) => {
    await levelService.deleteLevel(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa thành công',
    });
  }),
};
