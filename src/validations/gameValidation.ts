import Joi from 'joi';
import { REGEXP } from '#constants/regexp';
import { COMMON_CONSTANTS } from '#constants/common';

export const gameValidation = {
  startGame: {
    body: Joi.object({
      topicIds: Joi.array().items(
        Joi.string().regex(REGEXP.OBJECT_ID).messages({
          'string.pattern.base': 'Topic ID không hợp lệ',
        })
      ).min(1).max(5).required().messages({
        'array.min': 'Phải chọn ít nhất 1 chủ đề',
        'array.max': 'Tối đa 5 chủ đề mỗi ván game',
        'any.required': 'Danh sách chủ đề là bắt buộc',
      }),
      gameType: Joi.string().valid(
        ...Object.values(COMMON_CONSTANTS.GAME_TYPE)
      ).required().messages({
        'any.only': 'Loại game không hợp lệ',
        'any.required': 'Loại game là bắt buộc',
      }),
    }),
  },

  submitGame: {
    body: Joi.object({
      sessionId: Joi.string().regex(REGEXP.OBJECT_ID).required().messages({
        'any.required': 'Session ID là bắt buộc',
        'string.pattern.base': 'Session ID không hợp lệ',
      }),
      score: Joi.number().integer().min(0).required().messages({
        'any.required': 'Điểm số là bắt buộc',
        'number.min': 'Điểm số không được âm',
      }),
      maxCombo: Joi.number().integer().min(0).default(0),
      wordsHit: Joi.array().items(
        Joi.string().regex(REGEXP.OBJECT_ID)
      ).default([]),
      wordsMissed: Joi.array().items(
        Joi.string().regex(REGEXP.OBJECT_ID)
      ).default([]),
    }),
  },

  getHistory: {
    query: Joi.object({
      page: Joi.number().integer().min(1)
        .default(COMMON_CONSTANTS.PAGINATION.DEFAULT_PAGE),
      limit: Joi.number().integer().min(1).max(COMMON_CONSTANTS.PAGINATION.MAX_LIMIT)
        .default(COMMON_CONSTANTS.PAGINATION.DEFAULT_LIMIT),
      gameType: Joi.string().valid(
        ...Object.values(COMMON_CONSTANTS.GAME_TYPE)
      ).optional(),
    }),
  },

  getLeaderboard: {
    query: Joi.object({
      gameType: Joi.string().valid(
        ...Object.values(COMMON_CONSTANTS.GAME_TYPE)
      ).optional(),
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  },
};
