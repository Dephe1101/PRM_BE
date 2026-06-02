import GameSession, { IGameSession } from '#models/gameSessionModel';
import { PaginateOptions, PaginateResult } from 'mongoose';

export const GAME_SESSION_REPOSITORY = {
  create: async (data: Partial<IGameSession>): Promise<IGameSession> => {
    return GameSession.create(data);
  },

  findById: async (id: string): Promise<IGameSession | null> => {
    return GameSession.findById(id).populate('includedTopics').lean();
  },

  findByUserId: async (userId: string, options: PaginateOptions = {}): Promise<PaginateResult<IGameSession>> => {
    return GameSession.paginate({ userId }, options);
  },

  findTopScores: async (gameType: string, limit: number = 10): Promise<IGameSession[]> => {
    return GameSession.find({ gameType })
      .sort({ score: -1 })
      .limit(limit)
      .populate('userId', 'username')
      .lean();
  },

  getStats: async (userId: string): Promise<{ totalGames: number; avgScore: number; bestScore: number }> => {
    const stats = await GameSession.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId) } },
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
