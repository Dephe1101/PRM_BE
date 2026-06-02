import { Request, Response, NextFunction } from 'express';

export const sanitizeRequest = (allowedFields: string[], requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody: any = {};
      
      // Chỉ giữ lại các fields được phép
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
