import Joi from 'joi';
import { REGEXP } from '#constants/regexp';

export const wordValidation = {
  getAllWords: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional().default(1),
      limit: Joi.number().integer().min(1).max(100).optional().default(10),
      topicId: Joi.string().regex(REGEXP.OBJECT_ID).optional(),
      levelId: Joi.string().regex(REGEXP.OBJECT_ID).optional(),
      search: Joi.string().allow('').optional(),
    }),
  },

  createWord: {
    body: Joi.object({
      topicId: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'any.required': 'Topic ID là bắt buộc',
        'string.pattern.base': 'Topic ID không hợp lệ',
      }),
      kanji: Joi.string().allow('').optional().default(''),
      hiragana: Joi.string().required().trim().messages({
        'any.required': 'Hiragana là bắt buộc',
        'string.empty': 'Hiragana không được để trống',
      }),
      romaji: Joi.string().allow('').optional().default(''),
      meaning: Joi.string().required().trim().messages({
        'any.required': 'Nghĩa từ vựng là bắt buộc',
      }),
      example: Joi.string().allow('').optional().default(''),
      audioUrl: Joi.string().uri().allow('').optional().default(''),
    }),
  },

  updateWord: {
    params: Joi.object({
      id: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'Word ID không hợp lệ',
      }),
    }),
    body: Joi.object({
      kanji: Joi.string().allow('').optional(),
      hiragana: Joi.string().trim().optional(),
      romaji: Joi.string().allow('').optional(),
      meaning: Joi.string().trim().optional(),
      example: Joi.string().allow('').optional(),
      audioUrl: Joi.string().uri().allow('').optional(),
    }),
  },
};
