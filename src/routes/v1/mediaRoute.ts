import { Router } from 'express';
import { mediaController } from '#controllers/mediaController';
import { mediaValidation } from '#validations/mediaValidation';
import { authMiddleware } from '#middlewares/authMiddleware';
import { allowRoles } from '#middlewares/allowRoles';
import { validationMiddleware } from '#middlewares/validationMiddleware';
import { auditLogMiddleware } from '#middlewares/auditLogMiddleware';
import { uploadSingle, uploadMultiple } from '#configs/multer';
import { COMMON_CONSTANTS } from '#constants/common';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit upload (chống spam)
const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 20, // 20 requests mỗi IP
  message: {
    success: false,
    message: 'Bạn đã upload quá nhiều lần, vui lòng thử lại sau.',
  },
});

// Tất cả media routes đều cần Admin
router.use(authMiddleware);
router.use(allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN));
router.use(auditLogMiddleware);

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Upload và Quản lý File (Cloudinary). Tích hợp Multer. Giới hạn upload 5MB/file. Áp dụng Rate Limit (20 req/phút). Yêu cầu quyền Admin.
 */

/**
 * @swagger
 * /media/upload:
 *   post:
 *     summary: Upload 1 File duy nhất (Admin)
 *     description: Tải lên một file ảnh/audio/video. Hệ thống sử dụng Multer memory storage để stream thẳng lên Cloudinary, không lưu trữ tạm trên ổ cứng server.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "File cần upload (Tối đa 5MB, format hỗ trợ: jpg, png, mp3, mp4)"
 *               folder:
 *                 type: string
 *                 enum: [words, profile, general]
 *                 description: "Thư mục đích trên Cloudinary. Nếu không truyền sẽ vào thư mục mặc định (general)"
 *     responses:
 *       201:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     url:
 *                       type: string
 *                       description: "URL dùng để truy cập file (Secure HTTPS URL)"
 *                     publicId:
 *                       type: string
 *                     format:
 *                       type: string
 *       400:
 *         description: Không có file đính kèm, định dạng không hỗ trợ, hoặc file vượt quá 5MB.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Chỉ Admin)
 *       429:
 *         description: Quá giới hạn Upload trong 1 phút (Rate Limit)
 */
router.post(
  '/upload',
  uploadLimiter,
  uploadSingle,
  validationMiddleware(mediaValidation.upload),
  mediaController.upload
);

/**
 * @swagger
 * /media/upload-multiple:
 *   post:
 *     summary: Upload nhiều File cùng lúc (Batch Upload) (Admin)
 *     description: Tải lên tối đa 5 files trong một request.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: "Danh sách files cần upload (Tối đa 5 file)"
 *               folder:
 *                 type: string
 *                 enum: [words, profile, general]
 *     responses:
 *       201:
 *         description: Upload toàn bộ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       url:
 *                         type: string
 *       400:
 *         description: Quá giới hạn 5 file (Multer LIMIT_FILE_COUNT)
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/upload-multiple',
  uploadLimiter,
  uploadMultiple,
  validationMiddleware(mediaValidation.upload),
  mediaController.uploadMultiple
);

/**
 * @swagger
 * /media:
 *   get:
 *     summary: Lấy danh sách Media (Admin)
 *     description: Xem toàn bộ lịch sử các file đã tải lên kèm phân trang.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           enum: [words, profile, general]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trả về danh sách (Có phân trang)
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  validationMiddleware(mediaValidation.getAll),
  mediaController.getAll
);

/**
 * @swagger
 * /media/{id}:
 *   get:
 *     summary: Xem chi tiết 1 Media (Admin)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', mediaController.getById);

/**
 * @swagger
 * /media/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn file (Admin)
 *     description: Xóa file khỏi Database (MongoDB) đồng thời gọi API Cloudinary để xóa hoàn toàn file gốc trên mây.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Không tìm thấy Media
 */
router.delete('/:id', mediaController.delete);

export default router;
