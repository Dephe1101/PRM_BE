import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '#utils/catchAsync';
import { flashcardService } from '#services/flashcardService';

export const flashcardController = {
  getFlashcardsByTopic: catchAsync(async (req: Request, res: Response) => {
    const topicId = req.params.topicId as string;
    const result = await flashcardService.getFlashcardsByTopic(req.user!._id, topicId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getTopicsProgressByLevel: catchAsync(async (req: Request, res: Response) => {
    const levelId = req.params.levelId as string;
    const result = await flashcardService.getTopicsProgressByLevel(req.user!._id, levelId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  submit: catchAsync(async (req: Request, res: Response) => {
    const { wordId, isCorrect } = req.body;
    const result = await flashcardService.submitAnswer(req.user!._id, wordId, isCorrect);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: isCorrect ? 'Tuyệt vời! Đã ghi nhận' : 'Đã ghi nhận, hãy cố gắng nhé!',
      data: result,
    });
  }),

  submitBatch: catchAsync(async (req: Request, res: Response) => {
    const result = await flashcardService.submitBatch(req.user!._id, req.body.results);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã cập nhật tiến trình học',
      data: result,
    });
  }),


  getProgress: catchAsync(async (req: Request, res: Response) => {
    const { levelId, topicId } = req.query;
    const result = await flashcardService.getProgress(
      req.user!._id, 
      levelId as string | undefined, 
      topicId as string | undefined
    );
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  toggleBookmark: catchAsync(async (req: Request, res: Response) => {
    const wordId = req.params.wordId as string;
    const result = await flashcardService.toggleBookmark(req.user!._id, wordId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.isBookmarked ? 'Đã thêm vào danh sách yêu thích' : 'Đã bỏ khỏi danh sách yêu thích',
      data: result,
    });
  }),

  getBookmarks: catchAsync(async (req: Request, res: Response) => {
    const result = await flashcardService.getBookmarks(req.user!._id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getBookmarkedFlashcards: catchAsync(async (req: Request, res: Response) => {
    const result = await flashcardService.getBookmarkedFlashcards(req.user!._id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  getBookmarkedFlashcardsByTopic: catchAsync(async (req: Request, res: Response) => {
    const topicId = req.params.topicId as string;
    const result = await flashcardService.getBookmarkedFlashcardsByTopic(req.user!._id, topicId);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),
};
