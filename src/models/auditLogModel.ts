import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  endpoint: string;
  body: any;
  ipAddress: string;
  userAgent: string;
  statusCode: number;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String, // 'POST', 'PUT', 'PATCH', 'DELETE'
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    body: {
      type: Schema.Types.Mixed, // Truncated request body
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    statusCode: {
      type: Number,
    },
  },
  { timestamps: true }
);

// TTL Index — Tự động xóa log sau 30 ngày
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

auditLogSchema.plugin(mongoosePaginate);

const AuditLog = mongoose.model<IAuditLog, mongoose.PaginateModel<IAuditLog>>('AuditLog', auditLogSchema);

export default AuditLog;
