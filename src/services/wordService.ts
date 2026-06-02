import { WORD_REPOSITORY } from '#repositories/wordRepository';
import { TOPIC_REPOSITORY } from '#repositories/topicRepository';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { COMMON_CONSTANTS } from '#constants/common';

export const wordService = {
  createWord: async (data: any) => {
    // Validate Topic tồn tại
    const topic = await TOPIC_REPOSITORY.findById(data.topicId);
    if (!topic) throw new ApiError(ERROR_CODES.TOPIC_NOT_FOUND);
    
    // Check giới hạn từ/topic (max 13)
    const currentCount = await WORD_REPOSITORY.countByTopicId(data.topicId);
    if (currentCount >= COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MAX) {
      throw new ApiError(ERROR_CODES.TOPIC_WORD_COUNT_INVALID,
        'Chủ đề đã đạt giới hạn tối đa từ vựng');
    }

    return WORD_REPOSITORY.create(data);
  },

  getWordsByTopic: async (topicId: string) => {
    return WORD_REPOSITORY.findByTopicId(topicId);
  },

  getWordById: async (id: string) => {
    const word = await WORD_REPOSITORY.findById(id);
    if (!word) throw new ApiError(ERROR_CODES.WORD_NOT_FOUND);
    return word;
  },

  updateWord: async (id: string, data: any) => {
    const word = await WORD_REPOSITORY.update(id, data);
    if (!word) throw new ApiError(ERROR_CODES.WORD_NOT_FOUND);
    return word;
  },

  deleteWord: async (id: string) => {
    const word = await WORD_REPOSITORY.deleteById(id);
    if (!word) throw new ApiError(ERROR_CODES.WORD_NOT_FOUND);
    return word;
  },
};
