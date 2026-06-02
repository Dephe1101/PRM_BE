import Joi from 'joi';
import { COMMON_CONSTANTS } from '#constants/common';

export const mediaValidation = {
  upload: {
    body: Joi.object({
      folder: Joi.string().valid(
        ...Object.values(COMMON_CONSTANTS.MEDIA_FOLDER)
      ).default(COMMON_CONSTANTS.MEDIA_FOLDER.GENERAL).messages({
        'any.only': 'Folder không hợp lệ. Chọn: words, profile, general',
      }),
    }),
  },

  getAll: {
    query: Joi.object({
      folder: Joi.string().valid(
        ...Object.values(COMMON_CONSTANTS.MEDIA_FOLDER)
      ).optional(),
      page: Joi.number().integer().min(1)
        .default(COMMON_CONSTANTS.PAGINATION.DEFAULT_PAGE),
      limit: Joi.number().integer().min(1).max(COMMON_CONSTANTS.PAGINATION.MAX_LIMIT)
        .default(COMMON_CONSTANTS.PAGINATION.DEFAULT_LIMIT),
    }),
  },
};
