import rateLimit from 'express-rate-limit';
import { ENV } from '#configs/environment';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 100, // Limit each IP to 100 requests per `window`
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau',
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Limit each IP to 5 login requests per `window`
  message: 'Quá nhiều yêu cầu đăng nhập từ IP này, vui lòng thử lại sau',
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 20, // Limit each IP to 20 requests per `window`
  message: 'Quá nhiều yêu cầu upload, vui lòng thử lại sau',
});
