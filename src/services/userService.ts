import { USER_REPOSITORY } from '#repositories/userRepository';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';

export const userService = {
  getAllUsers: async (page: number, limit: number, search?: string) => {
    const query: any = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { username: searchRegex },
        { email: searchRegex },
      ];
    }

    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      select: '-passwordHash', // Ẩn passwordHash
      lean: true,
    };

    const result = await USER_REPOSITORY.paginate(query, options);
    return result;
  },

  toggleUserStatus: async (id: string, isActive: boolean) => {
    const user = await USER_REPOSITORY.updateStatus(id, isActive);
    if (!user) {
      throw new ApiError(ERROR_CODES.USER_NOT_FOUND);
    }
    return user;
  },
};
