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
  extractFieldsFromJoi: (joiSchema: any): { allowedFields: string[]; requiredFields: string[] } => {
    if (!joiSchema || typeof joiSchema.describe !== 'function') {
      return { allowedFields: [], requiredFields: [] };
    }

    try {
      const description = joiSchema.describe();
      if (!description || !description.keys) {
        return { allowedFields: [], requiredFields: [] };
      }

      const allowedFields = Object.keys(description.keys);
      const requiredFields = allowedFields.filter(key => {
        const fieldDesc = description.keys[key];
        return fieldDesc.flags && fieldDesc.flags.presence === 'required';
      });

      return { allowedFields, requiredFields };
    } catch (error) {
      return { allowedFields: [], requiredFields: [] };
    }
  },
  shuffleArray,
};
