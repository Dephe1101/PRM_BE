import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IWord extends Document {
  topicId: mongoose.Types.ObjectId;
  kanji: string;
  hiragana: string;
  romaji: string;
  meaning: string;
  example: string;
  audioUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const wordSchema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    kanji: {
      type: String,
      default: '',
    },
    hiragana: {
      type: String,
      required: true,
      trim: true,
    },
    romaji: {
      type: String,
      default: '',
      trim: true,
    },
    meaning: {
      type: String,
      required: true,
      trim: true,
    },
    example: {
      type: String,
      default: '',
    },
    audioUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

wordSchema.index({ topicId: 1 });
wordSchema.plugin(mongoosePaginate);

const Word = mongoose.model<IWord, mongoose.PaginateModel<IWord>>('Word', wordSchema);

export default Word;
