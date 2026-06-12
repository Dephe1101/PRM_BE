import Joi from 'joi';
import { REGEXP } from '#constants/regexp';

export const userValidation = {
  getAllSchema: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().allow('').optional(),
    }),
  },

  toggleStatusSchema: {
    params: Joi.object({
      id: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'ID User không hợp lệ'
      }),
    }),
    body: Joi.object({
      isActive: Joi.boolean().required().messages({
        'any.required': 'Trường isActive là bắt buộc',
        'boolean.base': 'Trường isActive phải là boolean',
      }),
    }),
  },
};
