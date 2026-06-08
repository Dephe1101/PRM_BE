import { Request, Response, NextFunction } from 'express';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { GENERATE_UTILS } from '#utils/generateUtils';

export const sanitizeRequest = (joiSchema: any) => {
  const { allowedFields, requiredFields } = GENERATE_UTILS.extractFieldsFromJoi(joiSchema);

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      // 1. Kiểm tra các field bắt buộc
      const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
      if (missingFields.length > 0) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`);
      }

      const sanitizedBody: any = {};
      
      // 2. Chỉ giữ lại các fields được phép
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          sanitizedBody[field] = req.body[field];
        }
      });
      
      req.body = sanitizedBody;
    }
    next();
  };
};
