import Session, { ISession } from '#models/sessionModel';

export const SESSION_REPOSITORY = {
  create: async (data: Partial<ISession>): Promise<ISession> => {
    return Session.create(data);
  },

  findByToken: async (hashedToken: string): Promise<ISession | null> => {
    return Session.findOne({ token: hashedToken }).lean();
  },

  findByUserId: async (userId: string): Promise<ISession[]> => {
    return Session.find({ userId }).lean();
  },

  deleteByToken: async (hashedToken: string): Promise<void> => {
    await Session.deleteOne({ token: hashedToken });
  },

  deleteByUserId: async (userId: string): Promise<void> => {
    await Session.deleteMany({ userId });
  },

  deleteById: async (sessionId: string): Promise<void> => {
    await Session.findByIdAndDelete(sessionId);
  },

  update: async (id: string, data: any): Promise<void> => {
    await Session.findByIdAndUpdate(id, data);
  },
};
