import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { COMMON_CONSTANTS } from '#constants/common';

export interface IGameSession extends Document {
  userId: mongoose.Types.ObjectId;
  includedTopics: mongoose.Types.ObjectId[];
  gameType: string;
  score: number;
  maxCombo: number;
  coinsEarned: number;
  status: string; // 'playing' | 'completed' | 'abandoned'
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gameSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    includedTopics: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    gameType: {
      type: String,
      required: true,
      enum: Object.values(COMMON_CONSTANTS.GAME_TYPE),
    },
    score: {
      type: Number,
      default: 0,
    },
    maxCombo: {
      type: Number,
      default: 0,
    },
    coinsEarned: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['playing', 'completed', 'abandoned'],
      default: 'playing',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

gameSessionSchema.index({ userId: 1, createdAt: -1 });
gameSessionSchema.index({ userId: 1, gameType: 1 });

gameSessionSchema.plugin(mongoosePaginate);

const GameSession = mongoose.model<IGameSession, mongoose.PaginateModel<IGameSession>>('GameSession', gameSessionSchema);

export default GameSession;
