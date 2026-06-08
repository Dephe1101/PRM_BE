import { Router } from 'express';
import { topicController } from '#controllers/topicController';
import { topicValidation } from '#validations/topicValidation';
import { authMiddleware } from '#middlewares/authMiddleware';
import { allowRoles } from '#middlewares/allowRoles';
import { auditLogMiddleware } from '#middlewares/auditLogMiddleware';
import { validationMiddleware } from '#middlewares/validationMiddleware';
import { sanitizeRequest } from '#middlewares/sanitizeRequest';
import { COMMON_CONSTANTS } from '#constants/common';
import { commonValidation } from '#validations/commonValidation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Topics
 *   description: Quản lý Chủ đề / Bài học. Bao gồm tính năng Auto-Chunking khi import dữ liệu lớn.
 */

/**
 * @swagger
 * /topics/level/{levelId}:
 *   get:
 *     summary: Lấy danh sách Topic theo Level (Public)
 *     description: Lấy danh sách các chủ đề (bài học) thuộc về một Level nhất định. Ví dụ lấy toàn bộ bài học của N5.
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]+$'
 *         description: "ID của Level (Ví dụ: N5)"
 *     responses:
 *       200:
 *         description: Trả về danh sách Topic
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
 *                       title:
 *                         type: string
 *                         example: "Bài 1: Chào hỏi"
 *                       levelId:
 *                         type: string
 *                         example: "N5"
 *                       orderIndex:
 *                         type: number
 *                         example: 1
 *                       totalWords:
 *                         type: number
 *                         example: 20
 *       400:
 *         description: LevelId không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/level/:levelId', validationMiddleware(topicValidation.getByLevel), topicController.getTopicsByLevel);

/**
 * @swagger
 * /topics/{id}:
 *   get:
 *     summary: Lấy chi tiết 1 Topic (Public)
 *     description: Truy xuất thông tin của 1 Topic (chỉ bao gồm metadata của Topic, không kèm danh sách từ vựng).
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: "MongoDB ObjectId của Topic"
 *     responses:
 *       200:
 *         description: Chi tiết Topic
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
 *                     title:
 *                       type: string
 *                     totalWords:
 *                       type: number
 *       400:
 *         description: ID không đúng định dạng ObjectId (CastError)
 *       404:
 *         description: Topic không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validationMiddleware(commonValidation.checkId), topicController.getTopicDetail);

/**
 * @swagger
 * /topics/import:
 *   post:
 *     summary: Import Topic và Từ vựng (Auto-Chunking) (Admin)
 *     description: Tính năng dành cho Admin. Thay vì tạo từng từ vựng, Admin có thể gửi lên 1 cục JSON bao gồm Topic Info và Mảng `words`. Hệ thống sẽ tự động tạo Topic và Insert Many các từ vựng, tính toán `totalWords` cho Topic một cách tự động.
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - levelId
 *               - title
 *               - words
 *             properties:
 *               levelId:
 *                 type: string
 *                 pattern: '^[A-Z0-9]+$'
 *                 description: "ID Level (Ví dụ: N5)"
 *                 example: "N5"
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: "Tên Topic"
 *                 example: "Từ vựng bài 1 Minna"
 *               orderIndex:
 *                 type: number
 *                 description: "Thứ tự sắp xếp"
 *                 example: 1
 *               words:
 *                 type: array
 *                 minItems: 7
 *                 description: "Mảng danh sách các từ vựng thuộc bài này"
 *                 items:
 *                   type: object
 *                   required:
 *                     - hiragana
 *                     - meaning
 *                   properties:
 *                     kanji:
 *                       type: string
 *                       example: "私"
 *                     hiragana:
 *                       type: string
 *                       example: "わたし"
 *                     romaji:
 *                       type: string
 *                       example: "watashi"
 *                     meaning:
 *                       type: string
 *                       example: "tôi"
 *                     example:
 *                       type: string
 *                       example: "私は学生です。"
 *                     audioUrl:
 *                       type: string
 *                       format: uri
 *     responses:
 *       201:
 *         description: Import thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đã tạo Topic và import 10 từ vựng."
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: object
 *       400:
 *         description: Thiếu trường bắt buộc trong mảng Words hoặc LevelId không tồn tại.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Chỉ Admin)
 */
router.post(
  '/import',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  sanitizeRequest(topicValidation.importTopic.body),
  validationMiddleware(topicValidation.importTopic),
  topicController.importTopic
);

/**
 * @swagger
 * /topics/{id}:
 *   put:
 *     summary: Cập nhật thông tin Topic (Admin)
 *     description: Đổi tên hoặc thứ tự sắp xếp của Topic. (Không cập nhật array Words ở đây, Words có API riêng).
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: "ObjectId của Topic"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Bài 1 - Cập nhật"
 *               orderIndex:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Validation Error
 *       404:
 *         description: Topic không tồn tại
 */
router.put(
  '/:id',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  sanitizeRequest(topicValidation.updateTopic.body),
  validationMiddleware(topicValidation.updateTopic),
  topicController.updateTopic
);

/**
 * @swagger
 * /topics/{id}:
 *   delete:
 *     summary: Xóa Topic (Cascade Delete) (Admin)
 *     description: "Xóa một Topic. RẤT QUAN TRỌNG: Hệ thống sẽ tự động thực hiện Cascade Delete - Xóa toàn bộ Words, Flashcards, Game Progress liên quan đến Topic này."
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: "ObjectId của Topic"
 *     responses:
 *       200:
 *         description: Đã xóa thành công toàn bộ dữ liệu liên quan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topic không tồn tại
 */
router.delete(
  '/:id',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  validationMiddleware(commonValidation.checkId),
  topicController.deleteTopic
);

export default router;
