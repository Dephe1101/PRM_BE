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
    return UserWordProgress.find({ userId, srsStage: { $lt: 2 }, nextReviewAt: { $lte: new Date() } }).lean();
  },

  findDueForReviewWithWords: async (userId: string): Promise<any[]> => {
    return UserWordProgress.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), srsStage: { $lt: 2 }, nextReviewAt: { $lte: new Date() } } },
      {
        $lookup: {
          from: 'words',
          localField: 'wordId',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
    ]);
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

  findBookmarkedWithWords: async (userId: string): Promise<any[]> => {
    return UserWordProgress.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), isBookmarked: true } },
      {
        $lookup: {
          from: 'words',
          localField: 'wordId',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
      {
        $lookup: {
          from: 'topics',
          localField: 'word.topicId',
          foreignField: '_id',
          as: 'topic',
        },
      },
      {
        $unwind: {
          path: '$topic',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'levels',
          let: { levelIdStr: '$topic.levelId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$levelIdStr' }] } } }
          ],
          as: 'level',
        },
      },
      {
        $unwind: {
          path: '$level',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          'word.topicId': {
            _id: '$topic._id',
            title: '$topic.title',
            levelId: {
              _id: '$level._id',
              name: '$level.name',
            },
          },
        },
      },
      {
        $project: {
          topic: 0,
          level: 0,
        },
      },
    ]);
  },

  findBookmarkedWithWordsByTopic: async (userId: string, topicId: string): Promise<any[]> => {
    return UserWordProgress.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), isBookmarked: true } },
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
      {
        $lookup: {
          from: 'topics',
          localField: 'word.topicId',
          foreignField: '_id',
          as: 'topic',
        },
      },
      {
        $unwind: {
          path: '$topic',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'levels',
          let: { levelIdStr: '$topic.levelId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$levelIdStr' }] } } }
          ],
          as: 'level',
        },
      },
      {
        $unwind: {
          path: '$level',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          'word.topicId': {
            _id: '$topic._id',
            title: '$topic.title',
            levelId: {
              _id: '$level._id',
              name: '$level.name',
            },
          },
        },
      },
      {
        $project: {
          topic: 0,
          level: 0,
        },
      },
    ]);
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

  getOverallStats: async (userId: string): Promise<{ totalLearning: number; totalMastered: number, learningWords: any[], masteredWords: any[] }> => {
    const progresses = await UserWordProgress.find({
      userId: new (require('mongoose').Types.ObjectId)(userId)
    }).populate('wordId').lean();

    const learningWords: any[] = [];
    const masteredWords: any[] = [];
    for (const p of progresses) {
      if (p.wordId) {
        const word = p.wordId;
        const progress = { ...p, wordId: word._id };
        const resultItem = { word, progress };

        if (p.srsStage === 0) learningWords.push(resultItem);
        else if (p.srsStage === 1) masteredWords.push(resultItem);
      }
    }
    return {
      totalLearning: learningWords.length,
      totalMastered: masteredWords.length,
      learningWords,
      masteredWords
    };
  },

  getStatsByWordIds: async (userId: string, wordIds: string[]): Promise<{ totalLearning: number; totalMastered: number, learningWords: any[], masteredWords: any[] }> => {
    const objectIds = wordIds.map(id => new (require('mongoose').Types.ObjectId)(id));
    const progresses = await UserWordProgress.find({
      userId: new (require('mongoose').Types.ObjectId)(userId),
      wordId: { $in: objectIds }
    }).populate('wordId').lean();

    const learningWords: any[] = [];
    const masteredWords: any[] = [];
    for (const p of progresses) {
      if (p.wordId) {
        const word = p.wordId;
        const progress = { ...p, wordId: word._id };
        const resultItem = { word, progress };

        if (p.srsStage === 0) learningWords.push(resultItem);
        else if (p.srsStage === 1) masteredWords.push(resultItem);
      }
    }
    return {
      totalLearning: learningWords.length,
      totalMastered: masteredWords.length,
      learningWords,
      masteredWords
    };
  },

  getTopicWordStats: async (userId: string, topicIds: string[]): Promise<any[]> => {
    const objectIds = topicIds.map(id => new (require('mongoose').Types.ObjectId)(id));
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
      { $match: { 'word.topicId': { $in: objectIds } } },
      {
        $group: {
          _id: '$word.topicId',
          masteredWords: { $sum: { $cond: [{ $eq: ['$srsStage', 1] }, 1, 0] } },
          learnedWords: { $sum: 0 },
        },
      },
    ]);
  },
};
