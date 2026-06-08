import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';

export const validationMiddleware = (schema: { body?: Joi.Schema, params?: Joi.Schema, query?: Joi.Schema }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, error.details.map(x => x.message).join(', '));
      }
    }
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, error.details.map(x => x.message).join(', '));
      }
    }
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, error.details.map(x => x.message).join(', '));
      }
    }
    next();
  };
};
