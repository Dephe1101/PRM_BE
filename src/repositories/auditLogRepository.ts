import AuditLog, { IAuditLog } from '#models/auditLogModel';
import mongoose, { PaginateOptions, PaginateResult } from 'mongoose';

export const AUDIT_LOG_REPOSITORY = {
  create: async (data: Partial<IAuditLog>): Promise<void> => {
    // Fire-and-forget
    AuditLog.create(data).catch((err) => {
      console.error('❌ Failed to save AuditLog:', err);
    });
  },

  findAll: async (filter: any = {}, options: PaginateOptions = {}): Promise<PaginateResult<IAuditLog>> => {
    return AuditLog.paginate(filter, options);
  },

  findByUserId: async (userId: string, options: PaginateOptions = {}): Promise<PaginateResult<IAuditLog>> => {
    return AuditLog.paginate({ userId }, options);
  },
};
