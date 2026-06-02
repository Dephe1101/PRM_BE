import Topic, { ITopic } from '#models/topicModel';
import mongoose, { UpdateQuery, PaginateOptions, PaginateResult } from 'mongoose';

export const TOPIC_REPOSITORY = {
  create: async (data: Partial<ITopic>): Promise<ITopic> => {
    return Topic.create(data);
  },

  createMany: async (data: Partial<ITopic>[]): Promise<ITopic[]> => {
    return Topic.insertMany(data) as any;
  },

  findById: async (id: string): Promise<ITopic | null> => {
    return Topic.findById(id).lean();
  },

  findByIds: async (ids: string[]): Promise<ITopic[]> => {
    return Topic.find({ _id: { $in: ids } }).lean();
  },

  findByLevelId: async (levelId: string, options: PaginateOptions = {}): Promise<PaginateResult<ITopic>> => {
    return Topic.paginate({ levelId }, options);
  },

  findAll: async (filter: any = {}, options: PaginateOptions = {}): Promise<PaginateResult<ITopic>> => {
    return Topic.paginate(filter, options);
  },

  update: async (id: string, data: UpdateQuery<ITopic>): Promise<ITopic | null> => {
    return Topic.findByIdAndUpdate(id, data, { new: true }).lean();
  },

  deleteById: async (id: string): Promise<ITopic | null> => {
    return Topic.findByIdAndDelete(id).lean();
  },

  findByLevelAndTitle: async (levelId: string, title: string): Promise<ITopic | null> => {
    return Topic.findOne({ levelId, title }).lean();
  },

  getMaxOrderIndex: async (levelId: string): Promise<number> => {
    const topic = await Topic.findOne({ levelId }).sort({ orderIndex: -1 }).select('orderIndex').lean();
    return topic ? topic.orderIndex : 0;
  },

  countByLevelId: async (levelId: string): Promise<number> => {
    return Topic.countDocuments({ levelId });
  },
};
