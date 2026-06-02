import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '#configs/environment';

/**
 * Tạo Access Token (ngắn hạn: 15 phút)
 */
export const generateAccessToken = (payload: { _id: string; role: string }): string => {
  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
  });
};

/**
 * Tạo Refresh Token (dài hạn: 7 ngày) — Random bytes, không phải JWT
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash Refresh Token trước khi lưu DB
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): { _id: string; role: string } => {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as { _id: string; role: string };
};
