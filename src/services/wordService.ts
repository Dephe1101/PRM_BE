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

  getAllWords: async (page: number = 1, limit: number = 10, topicId?: string, levelId?: string, search?: string) => {
    const filter: any = {};
    if (topicId) {
      filter.topicId = topicId;
    } else if (levelId) {
      const topics = await TOPIC_REPOSITORY.findAll({ levelId }, { pagination: false } as any);
      let docs: any[] = [];
      if (Array.isArray(topics)) {
        docs = topics;
      } else if (topics.docs) {
        docs = topics.docs;
      }
      const topicIds = docs.map((t: any) => t._id);
      filter.topicId = { $in: topicIds };
    }

    if (search) {
      filter.$or = [
        { romaji: { $regex: search, $options: 'i' } },
        { hiragana: { $regex: search, $options: 'i' } },
        { kanji: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } }
      ];
    }

    return WORD_REPOSITORY.findAll(filter, {
      page,
      limit,
      populate: {
        path: 'topicId',
        select: 'title levelId',
        populate: {
          path: 'levelId',
          select: 'name'
        }
      },
      sort: { createdAt: -1 }
    });
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
