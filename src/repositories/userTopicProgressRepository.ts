import UserTopicProgress, { IUserTopicProgress } from '#models/userTopicProgressModel';
import { COMMON_CONSTANTS } from '#constants/common';

export const USER_TOPIC_PROGRESS_REPOSITORY = {
  create: async (data: Partial<IUserTopicProgress>): Promise<IUserTopicProgress> => {
    return UserTopicProgress.create(data);
  },

  findByUserAndTopic: async (userId: string, topicId: string): Promise<IUserTopicProgress | null> => {
    return UserTopicProgress.findOne({ userId, topicId }).lean();
  },

  findByUserId: async (userId: string): Promise<IUserTopicProgress[]> => {
    return UserTopicProgress.find({ userId }).lean();
  },

  findMasteredByUserId: async (userId: string): Promise<IUserTopicProgress[]> => {
    return UserTopicProgress.find({ userId, status: COMMON_CONSTANTS.TOPIC_STATUS.MASTERED }).lean();
  },

  updateStatus: async (userId: string, topicId: string, status: string): Promise<IUserTopicProgress | null> => {
    return UserTopicProgress.findOneAndUpdate(
      { userId, topicId },
      { status },
      { returnDocument: 'after' }
    ).lean();
  },

  upsert: async (userId: string, topicId: string, data: Partial<IUserTopicProgress>): Promise<IUserTopicProgress> => {
    return UserTopicProgress.findOneAndUpdate(
      { userId, topicId },
      data,
      { returnDocument: 'after', upsert: true }
    );
  },

  checkAllMastered: async (userId: string, topicIds: string[]): Promise<boolean> => {
    const masteredCount = await UserTopicProgress.countDocuments({
      userId,
      topicId: { $in: topicIds },
      status: COMMON_CONSTANTS.TOPIC_STATUS.MASTERED,
    });
    return masteredCount === topicIds.length;
  },
};
