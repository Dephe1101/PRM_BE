import { TOPIC_REPOSITORY } from '#repositories/topicRepository';
import { LEVEL_REPOSITORY } from '#repositories/levelRepository';
import { WORD_REPOSITORY } from '#repositories/wordRepository';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { COMMON_CONSTANTS } from '#constants/common';

// Helper: Chunk array of words
const chunkWords = (words: any[]): any[][] => {
  const max = COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MAX;
  const total = words.length;

  if (total <= max) return [words];

  // Logic chia đều. VD: 25 -> 2 chunks. 30 -> 3 chunks
  const chunksCount = Math.ceil(total / max);
  const baseSize = Math.floor(total / chunksCount);
  let remainder = total % chunksCount;

  let chunks = [];
  let startIndex = 0;
  for (let i = 0; i < chunksCount; i++) {
    const currentChunkSize = baseSize + (remainder > 0 ? 1 : 0);
    chunks.push(words.slice(startIndex, startIndex + currentChunkSize));
    startIndex += currentChunkSize;
    if (remainder > 0) remainder--;
  }

  return chunks;
};

/**
 * Tạo title không trùng lặp cho batch topics
 */
const generateUniqueTopicTitles = async (
  levelId: string,
  baseTitle: string,
  count: number
): Promise<string[]> => {
  const titles: string[] = [];

  if (count === 1) {
    // Nếu chỉ 1 chunk → thử dùng title gốc trước
    const existing = await TOPIC_REPOSITORY.findByLevelAndTitle(levelId, baseTitle);
    if (!existing) {
      return [baseTitle];
    }
  }

  // Bắt đầu tìm suffix
  let suffix = 1;

  // Check title gốc
  const originalExists = await TOPIC_REPOSITORY.findByLevelAndTitle(levelId, baseTitle);
  if (originalExists) {
    suffix = 2; // Bắt đầu từ (2) vì gốc đã tồn tại
  }

  // Tìm suffix cao nhất đã tồn tại
  while (true) {
    const titleToCheck = suffix === 1 ? baseTitle : `${baseTitle} (${suffix})`;
    const exists = await TOPIC_REPOSITORY.findByLevelAndTitle(levelId, titleToCheck);
    if (!exists) break;
    suffix++;
  }

  // Sinh ra đủ titles
  let currentSuffix = suffix;
  for (let i = 0; i < count; i++) {
    if (currentSuffix === 1) {
      titles.push(baseTitle);
      currentSuffix = 2;
    } else {
      titles.push(`${baseTitle} (${currentSuffix})`);
      currentSuffix++;
    }
  }

  return titles;
};

const importTopicWithWords = async (data: {
  topicId?: string;
  levelId: string;
  title: string;
  words: any[];
}) => {
  const { topicId, levelId, title, words } = data;

  // 1. Validate Level tồn tại
  const level = await LEVEL_REPOSITORY.findById(levelId);
  if (!level) {
    throw new ApiError(ERROR_CODES.LEVEL_NOT_FOUND);
  }

  // 2. Validate minimum words only for completely new import
  if (!topicId && words.length < COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MIN) {
    throw new ApiError(ERROR_CODES.TOPIC_WORD_COUNT_INVALID);
  }

  let wordsToProcess = [...words];
  const createdTopics = [];
  let currentMaxOrder = await TOPIC_REPOSITORY.getMaxOrderIndex(levelId);

  // 3. Nếu có topicId, thử lấp đầy Topic hiện tại trước
  if (topicId) {
    const existingTopic = await TOPIC_REPOSITORY.findById(topicId);
    if (!existingTopic) {
      throw new ApiError(ERROR_CODES.TOPIC_NOT_FOUND);
    }

    const existingWords = await WORD_REPOSITORY.findByTopicId(topicId);
    const spaceLeft = COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MAX - existingWords.length;

    if (spaceLeft > 0) {
      let k = Math.min(spaceLeft, wordsToProcess.length);
      let r = wordsToProcess.length - k;

      // Nếu r > 0, tức là số từ import vượt quá chỗ trống, ta đang phải CHIA CẮT danh sách từ.
      if (r > 0) {
        if (
          wordsToProcess.length <= COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MAX &&
          existingWords.length >= COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MIN
        ) {
          // Danh sách import hoàn toàn nằm gọn được trong 1 topic.
          // Topic cũ lại đang HỢP LỆ (>= MIN).
          // => Không tội gì phải cắt vụn danh sách import ra cả, nhường toàn bộ cho topic mới.
          k = 0;
        } else if (r < COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MIN) {
          k = wordsToProcess.length - COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MIN;
          if (k < 0) k = 0; // Đảm bảo không âm
        }
      }

      if (k > 0) {
        const wordsToInsert = wordsToProcess.splice(0, k);
        const wordsWithTopicId = wordsToInsert.map((w) => ({
          ...w,
          topicId: existingTopic._id,
        }));
        const createdWords = await WORD_REPOSITORY.createMany(wordsWithTopicId);

        createdTopics.push({
          topic: existingTopic,
          words: createdWords,
          wordCount: createdWords.length,
          isNewTopic: false,
        });
      }
    }
  }

  // 4. Nếu vẫn còn từ, tạo Topic mới (tự chunk và auto-suffix)
  if (wordsToProcess.length > 0) {
    const wordChunks = chunkWords(wordsToProcess);
    const topicTitles = await generateUniqueTopicTitles(levelId, title, wordChunks.length);

    for (let i = 0; i < wordChunks.length; i++) {
      currentMaxOrder++;
      const topic = await TOPIC_REPOSITORY.create({
        levelId,
        title: topicTitles[i],
        orderIndex: currentMaxOrder,
      });

      const wordsWithTopicId = wordChunks[i].map((w) => ({
        ...w,
        topicId: topic._id,
      }));
      const createdWords = await WORD_REPOSITORY.createMany(wordsWithTopicId);

      createdTopics.push({
        topic,
        words: createdWords,
        wordCount: createdWords.length,
        isNewTopic: true,
      });
    }
  }

  return {
    totalTopicsCreated: createdTopics.filter(t => t.isNewTopic).length,
    totalWordsImported: words.length,
    topics: createdTopics,
  };
};

export const topicService = {
  getAllTopics: async (options?: any) => {
    // Populate levelId to get Level name
    const populateOption = { path: 'levelId', select: 'name' };
    const mergedOptions = { ...options, populate: populateOption };
    return TOPIC_REPOSITORY.findAll({}, mergedOptions);
  },

  createTopic: async (data: { levelId: string; title: string; orderIndex?: number }) => {
    const level = await LEVEL_REPOSITORY.findById(data.levelId);
    if (!level) throw new ApiError(ERROR_CODES.LEVEL_NOT_FOUND);

    let { levelId, title, orderIndex } = data;

    // Check duplicate title in same level
    const existing = await TOPIC_REPOSITORY.findByLevelAndTitle(levelId, title);
    if (existing) throw new ApiError(ERROR_CODES.TOPIC_TITLE_EXISTS);

    // Auto orderIndex if not provided
    if (orderIndex === undefined) {
      const maxOrder = await TOPIC_REPOSITORY.getMaxOrderIndex(levelId);
      orderIndex = maxOrder + 1;
    }

    return TOPIC_REPOSITORY.create({
      levelId,
      title,
      orderIndex,
    });
  },

  importTopicWithWords,

  getTopicsByLevel: async (levelId: string, options?: any) => {
    const level = await LEVEL_REPOSITORY.findById(levelId);
    if (!level) throw new ApiError(ERROR_CODES.LEVEL_NOT_FOUND);
    return TOPIC_REPOSITORY.findByLevelId(levelId, options);
  },

  getTopicDetail: async (id: string) => {
    const topic = await TOPIC_REPOSITORY.findById(id);
    if (!topic) throw new ApiError(ERROR_CODES.TOPIC_NOT_FOUND);

    const words = await WORD_REPOSITORY.findByTopicId(id);
    return { ...topic, words };
  },

  updateTopic: async (id: string, data: any) => {
    const topic = await TOPIC_REPOSITORY.update(id, data);
    if (!topic) throw new ApiError(ERROR_CODES.TOPIC_NOT_FOUND);
    return topic;
  },

  deleteTopic: async (id: string) => {
    const topic = await TOPIC_REPOSITORY.deleteById(id);
    if (!topic) throw new ApiError(ERROR_CODES.TOPIC_NOT_FOUND);
    // Cascade delete words
    await WORD_REPOSITORY.deleteByTopicId(id);
    return topic;
  },
};
