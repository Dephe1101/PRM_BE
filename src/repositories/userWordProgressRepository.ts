import UserWordProgress, { IUserWordProgress } from '#models/userWordProgressModel';
import mongoose, { QueryOptions } from 'mongoose';

export const USER_WORD_PROGRESS_REPOSITORY = {
  create: async (data: Partial<IUserWordProgress>): Promise<IUserWordProgress> => {
    return UserWordProgress.create(data);
  },

  upsert: async (userId: string, wordId: string, data: Partial<IUserWordProgress>): Promise<IUserWordProgress> => {
    return UserWordProgress.findOneAndUpdate(
      { userId, wordId },
      data,
      { returnDocument: 'after', upsert: true }
    );
  },

  findByUserAndWord: async (userId: string, wordId: string): Promise<IUserWordProgress | null> => {
    return UserWordProgress.findOne({ userId, wordId }).lean();
  },

  findByUserId: async (userId: string, options: QueryOptions = {}): Promise<IUserWordProgress[]> => {
    return UserWordProgress.find({ userId }, null, options).lean();
  },

  findByUserAndWords: async (userId: string, wordIds: string[]): Promise<IUserWordProgress[]> => {
    return UserWordProgress.find({ userId, wordId: { $in: wordIds } }).lean();
  },

  findDueForReview: async (userId: string): Promise<IUserWordProgress[]> => {
    return UserWordProgress.find({ userId, nextReviewAt: { $lte: new Date() } }).lean();
  },

  initProgressForWords: async (userId: string, wordIds: string[]) => {
    const bulkOps = wordIds.map((wordId) => ({
      updateOne: {
        filter: { userId, wordId },
        update: { $setOnInsert: { userId, wordId, srsStage: 0, nextReviewAt: new Date(), isBookmarked: false, correctCount: 0, wrongCount: 0 } },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      await UserWordProgress.bulkWrite(bulkOps as any);
    }
  },

  updateProgress: async (userId: string, wordId: string, setQuery: any, incQuery?: any): Promise<IUserWordProgress | null> => {
    const update: any = { $set: setQuery };
    if (incQuery) update.$inc = incQuery;
    return UserWordProgress.findOneAndUpdate({ userId, wordId }, update, { returnDocument: 'after', upsert: true }).lean();
  },

  findBookmarked: async (userId: string): Promise<IUserWordProgress[]> => {
    return UserWordProgress.find({ userId, isBookmarked: true }).lean();
  },

  findByUserAndTopicWords: async (userId: string, topicId: string): Promise<any[]> => {
    // Join với Word collection qua aggregation
    return UserWordProgress.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId) } },
      {
        $lookup: {
          from: 'words',
          localField: 'wordId',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
      { $match: { 'word.topicId': new (require('mongoose').Types.ObjectId)(topicId) } },
    ]);
  },

  updateSRS: async (userId: string, wordId: string, srsData: Partial<IUserWordProgress>): Promise<IUserWordProgress | null> => {
    return UserWordProgress.findOneAndUpdate(
      { userId, wordId },
      { $set: srsData },
      { returnDocument: 'after' }
    ).lean();
  },

  toggleBookmark: async (userId: string, wordId: string): Promise<IUserWordProgress | null> => {
    const progress = await UserWordProgress.findOne({ userId, wordId });
    if (!progress) {
      return UserWordProgress.create({ userId, wordId, isBookmarked: true });
    }
    progress.isBookmarked = !progress.isBookmarked;
    await progress.save();
    return progress.toObject();
  },

  bulkUpdateSRS: async (updates: Array<{ userId: string; wordId: string; srsData: Partial<IUserWordProgress> }>): Promise<void> => {
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { userId: update.userId, wordId: update.wordId },
        update: { $set: update.srsData },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      await UserWordProgress.bulkWrite(bulkOps);
    }
  },
};
