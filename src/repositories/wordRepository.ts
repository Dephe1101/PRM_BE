import Word, { IWord } from '#models/wordModel';
import { UpdateQuery } from 'mongoose';

export const WORD_REPOSITORY = {
  create: async (data: Partial<IWord>): Promise<IWord> => {
    return Word.create(data);
  },

  createMany: async (data: Partial<IWord>[]): Promise<IWord[]> => {
    return Word.insertMany(data) as any;
  },

  findById: async (id: string): Promise<IWord | null> => {
    return Word.findById(id).lean();
  },

  findByTopicId: async (topicId: string): Promise<IWord[]> => {
    return Word.find({ topicId }).lean();
  },

  findByTopicIds: async (topicIds: string[]): Promise<IWord[]> => {
    return Word.find({ topicId: { $in: topicIds } }).lean();
  },

  update: async (id: string, data: UpdateQuery<IWord>): Promise<IWord | null> => {
    return Word.findByIdAndUpdate(id, data, { new: true }).lean();
  },

  deleteById: async (id: string): Promise<IWord | null> => {
    return Word.findByIdAndDelete(id).lean();
  },

  deleteByTopicId: async (topicId: string): Promise<any> => {
    return Word.deleteMany({ topicId });
  },

  countByTopicId: async (topicId: string): Promise<number> => {
    return Word.countDocuments({ topicId });
  },
};
