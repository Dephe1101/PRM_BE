import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '#utils/catchAsync';
import { wordService } from '#services/wordService';

export const wordController = {
  createWord: catchAsync(async (req: Request, res: Response) => {
    const result = await wordService.createWord(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo từ vựng thành công',
      data: result,
    });
  }),

  getWordsByTopic: catchAsync(async (req: Request, res: Response) => {
    const result = await wordService.getWordsByTopic(req.params.topicId as string);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getWordById: catchAsync(async (req: Request, res: Response) => {
    const result = await wordService.getWordById(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  updateWord: catchAsync(async (req: Request, res: Response) => {
    const result = await wordService.updateWord(req.params.id as string, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật thành công',
      data: result,
    });
  }),

  deleteWord: catchAsync(async (req: Request, res: Response) => {
    await wordService.deleteWord(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa thành công',
    });
  }),
};
