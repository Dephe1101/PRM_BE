import mongoose, { Schema, Document } from 'mongoose';

export interface IUserWordProgress extends Document {
  userId: mongoose.Types.ObjectId;
  wordId: mongoose.Types.ObjectId;
  srsStage: number;
  nextReviewAt: Date | null;
  correctCount: number;
  wrongCount: number;
  isBookmarked: boolean;
  lastPlayedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userWordProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wordId: {
      type: Schema.Types.ObjectId,
      ref: 'Word',
      required: true,
    },
    srsStage: {
      type: Number,
      default: 0,
    },
    nextReviewAt: {
      type: Date,
      default: Date.now,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    wrongCount: {
      type: Number,
      default: 0,
    },
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    lastPlayedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// 1 User chỉ có 1 progress per Word
userWordProgressSchema.index({ userId: 1, wordId: 1 }, { unique: true });

// Tối ưu query "từ nào cần ôn tập?"
userWordProgressSchema.index({ userId: 1, nextReviewAt: 1 });

const UserWordProgress = mongoose.model<IUserWordProgress>('UserWordProgress', userWordProgressSchema);

export default UserWordProgress;
