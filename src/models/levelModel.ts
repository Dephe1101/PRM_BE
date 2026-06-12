import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface ILevel {
  _id: string;
  name: string;
  description: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const levelSchema = new Schema(
  {
    // Mongo tự sinh _id (ObjectId)
    name: {
      type: String, // 'JLPT N5'
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    orderIndex: {
      type: Number,
      required: true,
      unique: true, // Dùng để sort trên UI
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


levelSchema.index({ isActive: 1 });
levelSchema.plugin(mongoosePaginate);

const Level = mongoose.model<ILevel, mongoose.PaginateModel<ILevel>>('Level', levelSchema);

export default Level;
