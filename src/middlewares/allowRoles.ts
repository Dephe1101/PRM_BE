import { Request, Response, NextFunction } from 'express';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { catchAsync } from '#utils/catchAsync';

export const allowRoles = (...roles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(ERROR_CODES.FORBIDDEN);
    }
    next();
  });
};
