import Joi from 'joi';
import { REGEXP } from '#constants/regexp';

export const flashcardValidation = {
  getByTopic: {
    params: Joi.object({
      topicId: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'Topic ID không hợp lệ',
        'any.required': 'Topic ID là bắt buộc',
      }),
    }),
  },

  submit: {
    body: Joi.object({
      wordId: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'Word ID không hợp lệ',
        'any.required': 'Word ID là bắt buộc',
      }),
      isCorrect: Joi.boolean().required().messages({
        'any.required': 'Kết quả trả lời là bắt buộc',
      }),
    }),
  },

  submitBatch: {
    body: Joi.object({
      results: Joi.array().items(
        Joi.object({
          wordId: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
            'string.pattern.base': 'Word ID không hợp lệ',
          }),
          isCorrect: Joi.boolean().required().messages({
            'any.required': 'Kết quả trả lời là bắt buộc',
          }),
        })
      ).min(1).required().messages({
        'array.min': 'Phải có ít nhất 1 kết quả',
        'any.required': 'Danh sách kết quả là bắt buộc',
      }),
    }),
  },

  bookmark: {
    params: Joi.object({
      wordId: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'Word ID không hợp lệ',
      }),
    }),
  },
};
