import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '#utils/catchAsync';
import { AUDIT_LOG_REPOSITORY } from '#repositories/auditLogRepository';

export const auditLogController = {
  getAll: catchAsync(async (req: Request, res: Response) => {
    const { page, limit, userId, action } = req.query;
    
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;

    const result = await AUDIT_LOG_REPOSITORY.findAll(
      filter,
      { 
        page: Number(page) || 1, 
        limit: Number(limit) || 20, 
        sort: { createdAt: -1 } 
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),
};
