/**
 * Xáo trộn ngẫu nhiên một mảng (Fisher-Yates)
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const GENERATE_UTILS = {
  extractFieldsFromJoi: (joiSchema: any): string[] => {
    // Skeleton: Trích xuất mảng các field từ schema Joi để phục vụ sanitizeRequest
    if (!joiSchema || !joiSchema._ids || !joiSchema._ids._byKey) return [];
    return Array.from(joiSchema._ids._byKey.keys()) as string[];
  },
  shuffleArray,
};
