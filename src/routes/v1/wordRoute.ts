import { Router } from 'express';
import { wordController } from '#controllers/wordController';
import { wordValidation } from '#validations/wordValidation';
import { authMiddleware } from '#middlewares/authMiddleware';
import { allowRoles } from '#middlewares/allowRoles';
import { auditLogMiddleware } from '#middlewares/auditLogMiddleware';
import { validationMiddleware } from '#middlewares/validationMiddleware';
import { sanitizeRequest } from '#middlewares/sanitizeRequest';
import { COMMON_CONSTANTS } from '#constants/common';
import { GENERATE_UTILS } from '#utils/generateUtils';
import Joi from 'joi';
import { REGEXP } from '#constants/regexp';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Words
 *   description: Quản lý từ vựng. Cung cấp API đọc (Public) và thao tác CRUD (Admin).
 */

/**
 * @swagger
 * /words/topic/{topicId}:
 *   get:
 *     summary: Lấy danh sách từ vựng theo Topic (Public)
 *     description: Lấy ra toàn bộ danh sách từ vựng thuộc về một Topic cụ thể.
 *     tags: [Words]
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: "ObjectId của Topic"
 *     responses:
 *       200:
 *         description: Danh sách từ vựng
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
 *                       topicId:
 *                         type: string
 *                       kanji:
 *                         type: string
 *                       hiragana:
 *                         type: string
 *                       romaji:
 *                         type: string
 *                       meaning:
 *                         type: string
 *                       example:
 *                         type: string
 *                       audioUrl:
 *                         type: string
 *       400:
 *         description: topicId không đúng định dạng ObjectId (ValidationError)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/topic/:topicId',
  validationMiddleware({
    params: Joi.object({
      topicId: Joi.string().regex(REGEXP.OBJECT_ID).required(),
    }),
  }),
  wordController.getWordsByTopic
);

/**
 * @swagger
 * /words/{id}:
 *   get:
 *     summary: Lấy chi tiết 1 từ vựng (Public)
 *     description: Truy xuất toàn bộ thông tin của 1 từ vựng (kanji, hiragana, ví dụ, file âm thanh).
 *     tags: [Words]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ObjectId của Từ vựng"
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *       404:
 *         description: Từ vựng không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', wordController.getWordById);

/**
 * @swagger
 * /words:
 *   post:
 *     summary: Tạo từ vựng mới (Admin)
 *     description: Dành cho Admin thêm 1 từ vựng thủ công vào Topic. Lưu ý khi thêm từ mới, hệ thống sẽ tự động cập nhật lại tổng số từ (totalWords) của Topic đó.
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicId
 *               - hiragana
 *               - meaning
 *             properties:
 *               topicId:
 *                 type: string
 *                 description: "ID bài học chứa từ này"
 *               kanji:
 *                 type: string
 *               hiragana:
 *                 type: string
 *               romaji:
 *                 type: string
 *               meaning:
 *                 type: string
 *               example:
 *                 type: string
 *               audioUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Validation Error (thiếu trường, sai ID...)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Chỉ Admin)
 *       404:
 *         description: Topic không tồn tại để gán từ vựng vào
 */
router.post(
  '/',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  sanitizeRequest(
    GENERATE_UTILS.extractFieldsFromJoi(wordValidation.createWord.body),
    []
  ),
  validationMiddleware(wordValidation.createWord),
  wordController.createWord
);

/**
 * @swagger
 * /words/{id}:
 *   put:
 *     summary: Cập nhật từ vựng (Admin)
 *     description: Chỉnh sửa thông tin từ vựng.
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ObjectId của từ vựng"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kanji:
 *                 type: string
 *               hiragana:
 *                 type: string
 *               romaji:
 *                 type: string
 *               meaning:
 *                 type: string
 *               example:
 *                 type: string
 *               audioUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Từ vựng không tồn tại
 */
router.put(
  '/:id',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  sanitizeRequest(
    GENERATE_UTILS.extractFieldsFromJoi(wordValidation.updateWord.body),
    []
  ),
  validationMiddleware(wordValidation.updateWord),
  wordController.updateWord
);

/**
 * @swagger
 * /words/{id}:
 *   delete:
 *     summary: Xóa từ vựng (Admin)
 *     description: Xóa từ vựng. Hệ thống sẽ tự động cập nhật giảm số lượng `totalWords` trong Topic tương ứng, đồng thời xóa mọi `UserWordProgress` (thẻ Flashcard) gắn liền với từ này của tất cả user.
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ObjectId của từ vựng"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Chỉ Admin)
 *       404:
 *         description: Không tìm thấy từ vựng
 */
router.delete(
  '/:id',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  wordController.deleteWord
);

export default router;
