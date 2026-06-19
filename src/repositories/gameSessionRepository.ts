import GameSession, { IGameSession } from '#models/gameSessionModel';
import { PaginateOptions, PaginateResult } from 'mongoose';

export const GAME_SESSION_REPOSITORY = {
  create: async (data: Partial<IGameSession>): Promise<IGameSession> => {
    return GameSession.create(data);
  },

  findById: async (id: string): Promise<IGameSession | null> => {
    return GameSession.findById(id).populate('includedTopics').lean();
  },

  update: async (id: string, data: Partial<IGameSession>): Promise<IGameSession | null> => {
    return GameSession.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
  },

  findByUserId: async (userId: string, options: any = {}): Promise<PaginateResult<IGameSession>> => {
    const query: any = { userId };
    
    if (options.topicIds) {
      const topicIdsArray = options.topicIds.split(',').filter(Boolean);
      if (topicIdsArray.length > 0) {
        const mongoose = require('mongoose');
        const topicObjectIds = topicIdsArray.map((id: string) => new mongoose.Types.ObjectId(id));
        query.$expr = { $setEquals: ['$includedTopics', topicObjectIds] };
      }
    }

    const paginateOptions: PaginateOptions = {
      page: Number(options.page) || 1,
      limit: Number(options.limit) || 10,
      sort: { startTime: -1 }, // Sort by startTime descending
    };

    return GameSession.paginate(query, paginateOptions);
  },

  findTopScores: async (gameType: string, topicIds: string[] = [], limit: number = 10): Promise<any[]> => {
    const mongoose = require('mongoose');
    const topicObjectIds = topicIds.map((id) => new mongoose.Types.ObjectId(id));

    const pipeline: any[] = [
      {
        $match: {
          gameType,
        },
      },
    ];

    if (topicIds.length > 0) {
      pipeline.push({
        $match: {
          $expr: { $setEquals: ['$includedTopics', topicObjectIds] },
        },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: '$userId',
          score: { $max: '$score' },
          sessionId: { $first: '$_id' }, // Just to keep a reference
        },
      },
      { $sort: { score: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$sessionId',
          score: 1,
          userId: {
            _id: '$user._id',
            username: '$user.username',
          },
        },
      }
    );

    return GameSession.aggregate(pipeline);
  },

  getStats: async (userId: string, topicIds: string[] = []): Promise<{ totalGames: number; avgScore: number; bestScore: number }> => {
    const mongoose = require('mongoose');
    const matchStage: any = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (topicIds.length > 0) {
      const topicObjectIds = topicIds.map((id) => new mongoose.Types.ObjectId(id));
      matchStage.$expr = { $setEquals: ['$includedTopics', topicObjectIds] };
    }

    const stats = await GameSession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          avgScore: { $avg: '$score' },
          bestScore: { $max: '$score' },
        },
      },
    ]);

    if (stats.length === 0) {
      return { totalGames: 0, avgScore: 0, bestScore: 0 };
    }
    return {
      totalGames: stats[0].totalGames,
      avgScore: Math.round(stats[0].avgScore || 0),
      bestScore: stats[0].bestScore || 0,
    };
  },
};
