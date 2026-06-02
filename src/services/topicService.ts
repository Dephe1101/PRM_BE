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
  for (let i = 0; i < count; i++) {
    if (suffix === 1 && i === 0) {
      titles.push(baseTitle);
    } else {
      titles.push(`${baseTitle} (${suffix + i})`);
    }
    if (suffix === 1) suffix = 2; // Sau khi dùng gốc, tiếp theo là (2)
  }

  return titles;
};

const importTopicWithWords = async (data: {
  levelId: string;
  title: string;
  words: any[];
}) => {
  const { levelId, title, words } = data;

  // 1. Validate Level tồn tại
  const level = await LEVEL_REPOSITORY.findById(levelId);
  if (!level) throw new ApiError(ERROR_CODES.LEVEL_NOT_FOUND);

  // 2. Validate minimum words
  if (words.length < COMMON_CONSTANTS.TOPIC_WORD_LIMIT.MIN) {
    throw new ApiError(ERROR_CODES.TOPIC_WORD_COUNT_INVALID);
  }

  // 3. Auto-Chunking
  const wordChunks = chunkWords(words);

  // 4. Auto-Suffixing
  const topicTitles = await generateUniqueTopicTitles(levelId, title, wordChunks.length);

  // 5. Lấy orderIndex hiện tại
  let currentMaxOrder = await TOPIC_REPOSITORY.getMaxOrderIndex(levelId);

  // 6. Tạo Topics + Words
  const createdTopics = [];

  for (let i = 0; i < wordChunks.length; i++) {
    currentMaxOrder++;

    // Tạo Topic
    const topic = await TOPIC_REPOSITORY.create({
      levelId,
      title: topicTitles[i],
      orderIndex: currentMaxOrder,
    });

    // Tạo Words gắn với Topic
    const wordsWithTopicId = wordChunks[i].map((w) => ({
      ...w,
      topicId: topic._id,
    }));
    
    // Insert Many
    const createdWords = await WORD_REPOSITORY.createMany(wordsWithTopicId);

    createdTopics.push({
      topic,
      words: createdWords,
      wordCount: createdWords.length,
    });
  }

  return {
    totalTopicsCreated: createdTopics.length,
    totalWordsCreated: words.length,
    topics: createdTopics,
  };
};

export const topicService = {
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
