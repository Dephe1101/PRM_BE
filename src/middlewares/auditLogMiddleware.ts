import { Request, Response, NextFunction } from 'express';
import { AUDIT_LOG_REPOSITORY } from '#repositories/auditLogRepository';

const METHODS_TO_LOG = ['POST', 'PUT', 'PATCH', 'DELETE'];
const MAX_BODY_LENGTH = 500;
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'refreshToken'];

/**
 * Ẩn các field nhạy cảm trong body
 */
const sanitizeBody = (body: Record<string, unknown>): Record<string, unknown> => {
  const sanitized = { ...body };
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '***HIDDEN***';
    }
  }
  return sanitized;
};

/**
 * Truncate body nếu quá lớn
 */
const truncateBody = (body: Record<string, unknown>): Record<string, unknown> => {
  const jsonStr = JSON.stringify(body);
  if (jsonStr.length > MAX_BODY_LENGTH) {
    return { _truncated: true, preview: jsonStr.substring(0, MAX_BODY_LENGTH) + '...' };
  }
  return body;
};

export const auditLogMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Chỉ log các method thay đổi dữ liệu
  if (!METHODS_TO_LOG.includes(req.method)) {
    return next();
  }

  // Fire-and-forget: Ghi log sau khi response xong
  res.on('finish', () => {
    const logData = {
      userId: req.user?._id as any,
      action: req.method,
      endpoint: req.originalUrl,
      body: truncateBody(sanitizeBody(req.body || {})),
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      statusCode: res.statusCode,
    };

    // KHÔNG await — Fire and forget
    AUDIT_LOG_REPOSITORY.create(logData).catch((err) => {
      console.error('Audit log failed:', err.message);
    });
  });

  next();
};
