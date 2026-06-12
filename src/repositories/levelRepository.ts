import Level, { ILevel } from '#models/levelModel';
import mongoose, { UpdateQuery } from 'mongoose';

export const LEVEL_REPOSITORY = {
  create: async (data: Partial<ILevel>): Promise<ILevel> => {
    return Level.create(data);
  },

  findById: async (id: string): Promise<ILevel | null> => {
    return Level.findById(id).lean();
  },

  findByName: async (name: string): Promise<ILevel | null> => {
    return Level.findOne({ name }).lean();
  },

  findAll: async (filter: any = {}): Promise<ILevel[]> => {
    return Level.find(filter).sort({ orderIndex: 1 }).lean();
  },

  findActiveAll: async (): Promise<ILevel[]> => {
    return Level.find({ isActive: true }).sort({ orderIndex: 1 }).lean();
  },

  update: async (id: string, data: UpdateQuery<ILevel>): Promise<ILevel | null> => {
    return Level.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
  },

  deleteById: async (id: string): Promise<ILevel | null> => {
    return Level.findByIdAndDelete(id).lean();
  },
};
