import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { catchAsync } from '#utils/catchAsync';
import { verifyAccessToken } from '#utils/tokenUtils';
import { USER_REPOSITORY } from '#repositories/userRepository';

export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    try {
      const decoded = verifyAccessToken(token) as { _id: string; role: string };

      // 3. Kiểm tra user vẫn tồn tại
      const user = await USER_REPOSITORY.findById(decoded._id);
      if (!user) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED);
      }

      // 4. Gắn user vào request
      req.user = {
        _id: decoded._id,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(ERROR_CODES.TOKEN_EXPIRED);
      }
      throw new ApiError(ERROR_CODES.UNAUTHORIZED);
    }
  }
);
