import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface ITopic extends Document {
  levelId: string;
  title: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema(
  {
    levelId: {
      type: String,
      ref: 'Level',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    orderIndex: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Unique compound index — Chống trùng title trong cùng 1 Level
topicSchema.index({ levelId: 1, title: 1 }, { unique: true });
topicSchema.index({ levelId: 1, orderIndex: 1 });

topicSchema.plugin(mongoosePaginate);

const Topic = mongoose.model<ITopic, mongoose.PaginateModel<ITopic>>('Topic', topicSchema);

export default Topic;
