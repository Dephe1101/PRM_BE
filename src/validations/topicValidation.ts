import Joi from 'joi';
import { REGEXP } from '#constants/regexp';

export const topicValidation = {
  importTopic: {
    body: Joi.object({
      levelId: Joi.string().required().regex(REGEXP.LEVEL_ID).messages({
        'any.required': 'Mã cấp độ là bắt buộc',
        'string.pattern.base': 'Mã cấp độ không hợp lệ',
      }),
      title: Joi.string().required().min(2).max(100).trim().messages({
        'any.required': 'Tên chủ đề là bắt buộc',
        'string.min': 'Tên chủ đề phải có ít nhất {#limit} ký tự',
      }),
      words: Joi.array().items(
        Joi.object({
          kanji: Joi.string().allow('').optional().default(''),
          hiragana: Joi.string().required().trim().messages({
            'any.required': 'Hiragana là bắt buộc',
            'string.empty': 'Hiragana không được để trống',
          }),
          romaji: Joi.string().allow('').optional().default(''),
          meaning: Joi.string().required().trim().messages({
            'any.required': 'Nghĩa từ vựng là bắt buộc',
            'string.empty': 'Nghĩa từ vựng không được để trống',
          }),
          example: Joi.string().allow('').optional().default(''),
          audioUrl: Joi.string().uri().allow('').optional().default(''),
        })
      ).min(7).required().messages({
        'array.min': 'Phải có ít nhất {#limit} từ vựng',
        'any.required': 'Danh sách từ vựng là bắt buộc',
      }),
    }),
  },

  updateTopic: {
    params: Joi.object({
      id: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'Topic ID không hợp lệ',
      }),
    }),
    body: Joi.object({
      title: Joi.string().min(2).max(100).trim().optional(),
      orderIndex: Joi.number().integer().min(0).optional(),
    }),
  },

  getByLevel: {
    params: Joi.object({
      levelId: Joi.string().required().regex(REGEXP.LEVEL_ID).messages({
        'string.pattern.base': 'Mã cấp độ không hợp lệ',
      }),
    }),
  },
};
