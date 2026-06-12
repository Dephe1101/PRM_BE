import Joi from 'joi';
import { REGEXP } from '#constants/regexp';

export const commonValidation = {
  checkId: {
    params: Joi.object({
      id: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'ID không hợp lệ',
        'any.required': 'ID là bắt buộc',
      }),
    }),
  },
  checkLevelId: {
    params: Joi.object({
      id: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'Level ID không hợp lệ',
        'any.required': 'Level ID là bắt buộc',
      }),
    }),
  },
  checkTopicId: {
    params: Joi.object({
      id: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'Topic ID không hợp lệ',
        'any.required': 'Topic ID là bắt buộc',
      }),
    }),
  },
  checkWordId: {
    params: Joi.object({
      id: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'string.pattern.base': 'Word ID không hợp lệ',
        'any.required': 'Word ID là bắt buộc',
      }),
    }),
  },
};
