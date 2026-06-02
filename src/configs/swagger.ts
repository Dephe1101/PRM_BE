import swaggerJsdoc from 'swagger-jsdoc';
import { ENV } from '#configs/environment';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Japanese EdTech & Gamification API',
      version: '1.0.0',
      description: 'API Documentation cho ứng dụng học tiếng Nhật kết hợp Gamification',
      contact: {
        name: 'Dev Team',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            totalDocs: { type: 'integer' },
            totalPages: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            hasPrevPage: { type: 'boolean' },
            hasNextPage: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'API Quản lý xác thực người dùng, đăng ký, đăng nhập và quản lý phiên (Sessions). Yêu cầu Role Public hoặc User.' },
      { name: 'Levels', description: 'API Quản lý cấp độ JLPT (Ví dụ N5, N4, v.v.). Bao gồm các endpoint cho Public (Đọc) và Admin (Ghi/Sửa/Xóa).' },
      { name: 'Topics', description: 'Quản lý Chủ đề / Bài học. Bao gồm tính năng Auto-Chunking khi import dữ liệu lớn.' },
      { name: 'Words', description: 'Quản lý từ vựng. Cung cấp API đọc (Public) và thao tác CRUD (Admin).' },
      { name: 'Flashcards', description: 'Quản lý học tập và ôn tập (Hệ thống Spaced Repetition - SRS). Tất cả các route yêu cầu Bearer Token (User).' },
      { name: 'Games', description: 'Hệ thống Gamification. Quản lý việc sinh từ vựng, tính điểm (XP, Coins) và bảng xếp hạng.' },
      { name: 'Media', description: 'Upload và Quản lý File (Cloudinary). Tích hợp Multer. Giới hạn upload 5MB/file. Áp dụng Rate Limit (20 req/phút). Yêu cầu quyền Admin.' },
      { name: 'Admin', description: 'Tác vụ quản trị hệ thống cấp cao. Yêu cầu quyền Admin. (Bao gồm hệ thống Audit Log - Theo dõi dấu vết)' },
    ],
  },
  apis: ['./src/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
