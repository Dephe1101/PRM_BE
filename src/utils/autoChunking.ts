import { COMMON_CONSTANTS } from '#constants/common';

const { TOPIC_WORD_LIMIT } = COMMON_CONSTANTS;

/**
 * Chia mảng words thành các chunk phù hợp (7-13 words/chunk)
 * VD: 30 words → [10, 10, 10]
 */
export const chunkWords = <T>(words: T[]): T[][] => {
  const total = words.length;

  if (total <= TOPIC_WORD_LIMIT.MAX) {
    return [words]; // Đủ 1 topic
  }

  // Tính số chunk cần thiết
  const numChunks = Math.ceil(total / TOPIC_WORD_LIMIT.MAX);

  // Chia đều
  const baseSize = Math.floor(total / numChunks);
  const remainder = total % numChunks;

  const chunks: T[][] = [];
  let startIndex = 0;

  for (let i = 0; i < numChunks; i++) {
    // Chia thêm 1 cho các chunk đầu nếu có dư
    const chunkSize = baseSize + (i < remainder ? 1 : 0);
    chunks.push(words.slice(startIndex, startIndex + chunkSize));
    startIndex += chunkSize;
  }

  return chunks;
};
