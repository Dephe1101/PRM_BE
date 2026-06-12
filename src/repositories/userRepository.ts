import User, { IUser } from '#models/userModel';
import { UpdateQuery } from 'mongoose';

export const USER_REPOSITORY = {
  create: async (data: Partial<IUser>): Promise<IUser> => {
    return User.create(data);
  },

  findById: async (id: string): Promise<IUser | null> => {
    return User.findById(id).lean();
  },

  findByEmail: async (email: string): Promise<IUser | null> => {
    return User.findOne({ email }).select('+passwordHash').lean();
  },

  findByIdWithPassword: async (id: string): Promise<IUser | null> => {
    return User.findById(id).select('+passwordHash').lean();
  },

  update: async (id: string, data: UpdateQuery<IUser>): Promise<IUser | null> => {
    return User.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
  },

  paginate: async (query: any, options: any) => {
    return User.paginate(query, options);
  },

  updateStatus: async (id: string, isActive: boolean): Promise<IUser | null> => {
    return User.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { returnDocument: 'after' }
    ).select('-passwordHash').lean();
  },

  addCoins: async (id: string, amount: number): Promise<IUser | null> => {
    return User.findByIdAndUpdate(id, { $inc: { coins: amount } }, { returnDocument: 'after' }).lean();
  },

  addXp: async (id: string, amount: number): Promise<IUser | null> => {
    return User.findByIdAndUpdate(id, { $inc: { xp: amount } }, { returnDocument: 'after' }).lean();
  },
};
