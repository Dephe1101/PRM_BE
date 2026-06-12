import Joi from 'joi';
import { REGEXP } from '#constants/regexp';

export const levelValidation = {
  createLevel: {
    body: Joi.object({

      name: Joi.string().required().min(2).max(50).trim().messages({
        'any.required': 'Tên cấp độ là bắt buộc',
        'string.min': 'Tên phải có ít nhất {#limit} ký tự',
      }),
      description: Joi.string().max(500).allow('').optional(),
      orderIndex: Joi.number().required().integer().min(0).messages({
        'any.required': 'Thứ tự sắp xếp là bắt buộc',
        'number.integer': 'Thứ tự sắp xếp phải là số nguyên',
      }),
      isActive: Joi.boolean().optional().default(true),
    }),
  },

  updateLevel: {
    params: Joi.object({
      id: Joi.string().required().messages({
        'any.required': 'ID cấp độ là bắt buộc',
      }),
    }),
    body: Joi.object({
      name: Joi.string().min(2).max(50).trim().optional(),
      description: Joi.string().max(500).allow('').optional(),
      orderIndex: Joi.number().integer().min(0).optional(),
      isActive: Joi.boolean().optional(),
    }),
  },
};
