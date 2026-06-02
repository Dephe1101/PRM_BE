import Joi from 'joi';
import { REGEXP } from '#constants/regexp';

export const levelValidation = {
  createLevel: {
    body: Joi.object({
      _id: Joi.string().required().regex(REGEXP.LEVEL_ID).uppercase().messages({
        'any.required': 'Mã cấp độ là bắt buộc',
        'string.pattern.base': 'Mã cấp độ chỉ chứa chữ in hoa và số',
      }),
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
      id: Joi.string().required().regex(REGEXP.LEVEL_ID).messages({
        'string.pattern.base': 'Mã cấp độ không hợp lệ',
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
