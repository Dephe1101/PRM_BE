import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '#utils/catchAsync';
import { topicService } from '#services/topicService';

export const topicController = {
  importTopic: catchAsync(async (req: Request, res: Response) => {
    const result = await topicService.importTopicWithWords(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Import chủ đề thành công',
      data: result,
    });
  }),

  getTopicsByLevel: catchAsync(async (req: Request, res: Response) => {
    // Lấy query pagination options nếu có
    const { page, limit } = req.query;
    const options = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50,
      sort: { orderIndex: 1 },
    };

    const result = await topicService.getTopicsByLevel(req.params.levelId as string, options);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getTopicDetail: catchAsync(async (req: Request, res: Response) => {
    const result = await topicService.getTopicDetail(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  updateTopic: catchAsync(async (req: Request, res: Response) => {
    const result = await topicService.updateTopic(req.params.id as string, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật thành công',
      data: result,
    });
  }),

  deleteTopic: catchAsync(async (req: Request, res: Response) => {
    await topicService.deleteTopic(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa thành công',
    });
  }),
};
