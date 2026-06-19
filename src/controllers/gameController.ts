import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '#utils/catchAsync';
import { gameService } from '#services/gameService';

export const gameController = {
  startGame: catchAsync(async (req: Request, res: Response) => {
    const { topicIds, gameType } = req.body;
    const result = await gameService.startGame(req.user!._id, topicIds, gameType);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Game đã sẵn sàng!',
      data: result,
    });
  }),

  submitGame: catchAsync(async (req: Request, res: Response) => {
    const result = await gameService.submitGame(req.user!._id, req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Ván game kết thúc! Bạn nhận được ${result.rewards.coinsEarned} coins`,
      data: result,
    });
  }),

  getHistory: catchAsync(async (req: Request, res: Response) => {
    const result = await gameService.getHistory(req.user!._id, req.query);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getHistoryDetail: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await gameService.getHistoryDetail(id, req.user!._id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getLeaderboard: catchAsync(async (req: Request, res: Response) => {
    let topicIds: string[] = [];
    if (req.query.topicIds) {
      topicIds = (req.query.topicIds as string).split(',').filter(Boolean);
    }
    const result = await gameService.getLeaderboard(
      req.query.gameType as string,
      topicIds,
      Number(req.query.limit) || 10
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getStats: catchAsync(async (req: Request, res: Response) => {
    let topicIds: string[] = [];
    if (req.query.topicIds) {
      topicIds = (req.query.topicIds as string).split(',').filter(Boolean);
    }
    const result = await gameService.getStats(req.user!._id, topicIds);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getEligibleTopics: catchAsync(async (req: Request, res: Response) => {
    const levelId = req.query.levelId as string;
    const result = await gameService.getEligibleTopics(req.user!._id, levelId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),
};
