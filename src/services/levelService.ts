import { LEVEL_REPOSITORY } from '#repositories/levelRepository';
import { TOPIC_REPOSITORY } from '#repositories/topicRepository';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';

export const levelService = {
  createLevel: async (data: any) => {
    // Check _id đã tồn tại
    const existing = await LEVEL_REPOSITORY.findById(data._id);
    if (existing) throw new ApiError(ERROR_CODES.LEVEL_ID_EXISTS);
    return LEVEL_REPOSITORY.create(data);
  },

  getAllLevels: async () => {
    return LEVEL_REPOSITORY.findAll();  // sort by orderIndex in Model/Repo
  },

  getLevelById: async (id: string) => {
    const level = await LEVEL_REPOSITORY.findById(id);
    if (!level) throw new ApiError(ERROR_CODES.LEVEL_NOT_FOUND);
    return level;
  },

  updateLevel: async (id: string, data: any) => {
    const level = await LEVEL_REPOSITORY.update(id, data);
    if (!level) throw new ApiError(ERROR_CODES.LEVEL_NOT_FOUND);
    return level;
  },

  deleteLevel: async (id: string) => {
    // Check xem Level có Topics không
    const topicCount = await TOPIC_REPOSITORY.countByLevelId(id);
    if (topicCount > 0) {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 
        'Không thể xóa cấp độ đang có chủ đề');
    }
    const level = await LEVEL_REPOSITORY.deleteById(id);
    if (!level) throw new ApiError(ERROR_CODES.LEVEL_NOT_FOUND);
    return level;
  },
};
