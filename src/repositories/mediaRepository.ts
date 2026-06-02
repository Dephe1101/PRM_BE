import Media, { IMedia } from '#models/mediaModel';
import { PaginateOptions, PaginateResult } from 'mongoose';

export const MEDIA_REPOSITORY = {
  create: async (data: Partial<IMedia>): Promise<IMedia> => {
    return Media.create(data);
  },

  findById: async (id: string): Promise<IMedia | null> => {
    return Media.findById(id).lean();
  },

  findAll: async (filter: any, options: PaginateOptions = {}): Promise<PaginateResult<IMedia>> => {
    return Media.paginate(filter, options);
  },

  deleteById: async (id: string): Promise<void> => {
    await Media.findByIdAndDelete(id);
  },
};
