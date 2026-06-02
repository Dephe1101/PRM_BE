import mongoose, { Schema, Document } from 'mongoose';
import { COMMON_CONSTANTS } from '#constants/common';

export interface IUserTopicProgress extends Document {
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const userTopicProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(COMMON_CONSTANTS.TOPIC_STATUS),
      default: COMMON_CONSTANTS.TOPIC_STATUS.LOCKED,
    },
  },
  { timestamps: true }
);

// 1 User chỉ có 1 progress per Topic
userTopicProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
userTopicProgressSchema.index({ userId: 1, status: 1 });

const UserTopicProgress = mongoose.model<IUserTopicProgress>('UserTopicProgress', userTopicProgressSchema);

export default UserTopicProgress;
