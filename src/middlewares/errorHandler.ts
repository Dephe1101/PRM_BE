import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { ENV } from '#configs/environment';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    const multerErr = err as any;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: 'File quá lớn (Tối đa 5MB)',
      });
    }
    if (multerErr.code === 'LIMIT_FILE_COUNT') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: 'Vượt quá số lượng file cho phép (tối đa 5)',
      });
    }
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      code: ERROR_CODES.VALIDATION_ERROR.code,
      message: err.message,
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const mongooseErr = err as any;
    const messages = Object.values(mongooseErr.errors).map((e: any) => e.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      code: ERROR_CODES.VALIDATION_ERROR.code,
      message: 'Dữ liệu không hợp lệ',
      errors: messages,
    });
  }

  // Mongoose Duplicate Key (11000)
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0];
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      code: 'DUPLICATE_KEY',
      message: `Giá trị '${field}' đã tồn tại`,
    });
  }

  // Mongoose Cast Error
  if (err.name === 'CastError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      code: 'INVALID_ID',
      message: `ID không hợp lệ: ${(err as any).value}`,
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      code: ERROR_CODES.UNAUTHORIZED.code,
      message: 'Token không hợp lệ',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      code: ERROR_CODES.TOKEN_EXPIRED.code,
      message: ERROR_CODES.TOKEN_EXPIRED.message,
    });
  }

  console.error('❌ Unhandled Error:', err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    code: ERROR_CODES.INTERNAL_ERROR.code,
    message: ERROR_CODES.INTERNAL_ERROR.message,
    ...(ENV.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};
