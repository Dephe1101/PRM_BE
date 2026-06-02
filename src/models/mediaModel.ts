import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { COMMON_CONSTANTS } from '#constants/common';

export interface IMedia extends Document {
  url: string;
  publicId: string;
  folder: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
}

const mediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    folder: {
      type: String,
      enum: Object.values(COMMON_CONSTANTS.MEDIA_FOLDER),
      required: true,
    },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

mediaSchema.index({ folder: 1, createdAt: -1 });
mediaSchema.plugin(mongoosePaginate);

const Media = mongoose.model<IMedia, mongoose.PaginateModel<IMedia>>('Media', mediaSchema);

export default Media;
