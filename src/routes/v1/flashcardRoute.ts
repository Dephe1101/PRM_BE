import { Router } from 'express';
import { flashcardController } from '#controllers/flashcardController';
import { flashcardValidation } from '#validations/flashcardValidation';
import { authMiddleware } from '#middlewares/authMiddleware';
import { validationMiddleware } from '#middlewares/validationMiddleware';
import { sanitizeRequest } from '#middlewares/sanitizeRequest';

const router = Router();

// Tất cả route flashcard yêu cầu đăng nhập
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Flashcards
 *   description: Quản lý học tập và ôn tập (Hệ thống Spaced Repetition - SRS). Tất cả các route yêu cầu Bearer Token (User).
 */

/**
 * @swagger
 * /flashcards/topics/{topicId}:
 *   get:
 *     summary: Lấy danh sách flashcard của bài học (Kèm tiến độ)
 *     description: Trả về danh sách từ vựng thuộc về 1 Topic, kết hợp với tiến độ học tập (Progress) của User hiện tại đối với từng từ vựng đó. Nếu user chưa học bao giờ, progress sẽ trả về stage = 0.
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: "ObjectId của Topic"
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                     topicId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "LEARNING"
 *                     words:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           wordId:
 *                             type: string
 *                           kanji:
 *                             type: string
 *                           hiragana:
 *                             type: string
 *                           meaning:
 *                             type: string
 *                           progress:
 *                             type: object
 *                             properties:
 *                               srsStage:
 *                                 type: number
 *                                 example: 1
 *                               nextReviewDate:
 *                                 type: string
 *                                 format: date-time
 *       400:
 *         description: topicId không hợp lệ
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/topics/:topicId',
  validationMiddleware(flashcardValidation.getByTopic),
  flashcardController.getFlashcardsByTopic
);

/**
 * @swagger
 * /flashcards/levels/{levelId}/topics:
 *   get:
 *     summary: Lấy danh sách Topic kèm tiến độ theo Level
 *     description: Trả về danh sách Topic kèm theo số từ vựng (totalWords), số từ đang học (learnedWords), số từ đã thuộc (masteredWords) và trạng thái (status).
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: levelId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/levels/:levelId/topics',
  flashcardController.getTopicsProgressByLevel
);

/**
 * @swagger
 * /flashcards/submit:
 *   post:
 *     summary: Submit kết quả 1 thẻ Flashcard
 *     description: Ghi nhận kết quả người dùng trả lời (Hit/Miss) cho 1 từ vựng. Hệ thống tự động tính toán lại thuật toán SRS (Spaced Repetition System) để xác định thời điểm ôn tập tiếp theo (nextReviewDate).
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wordId
 *               - isCorrect
 *             properties:
 *               wordId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: "ObjectId của từ vựng vừa lật"
 *               isCorrect:
 *                 type: boolean
 *                 description: "User trả lời Đúng (true) hay Sai (false)"
 *               timeSpent:
 *                 type: number
 *                 description: "Thời gian người dùng suy nghĩ tính bằng milliseconds (không bắt buộc)"
 *     responses:
 *       200:
 *         description: Cập nhật tiến độ thành công
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
 *                     wordId:
 *                       type: string
 *                     srsStage:
 *                       type: number
 *                       description: "Level hiện tại của thẻ (Từ 0 đến 5)"
 *                     nextReviewDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dữ liệu gửi lên không đúng chuẩn
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Không tìm thấy Từ vựng
 */
router.post(
  '/submit',
  sanitizeRequest(flashcardValidation.submit.body),
  validationMiddleware(flashcardValidation.submit),
  flashcardController.submit
);

/**
 * @swagger
 * /flashcards/submit-batch:
 *   post:
 *     summary: Submit kết quả hàng loạt (Batch)
 *     description: Tương tự như Submit nhưng áp dụng cho nhiều thẻ cùng 1 lúc (dành cho chế độ học trắc nghiệm/game).
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - results
 *             properties:
 *               results:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - wordId
 *                     - isCorrect
 *                   properties:
 *                     wordId:
 *                       type: string
 *                       pattern: '^[0-9a-fA-F]{24}$'
 *                     isCorrect:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Ghi nhận thành công
 *       400:
 *         description: Lỗi Validation
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/submit-batch',
  sanitizeRequest(flashcardValidation.submitBatch.body),
  validationMiddleware(flashcardValidation.submitBatch),
  flashcardController.submitBatch
);


/**
 * @swagger
 * /flashcards/progress:
 *   get:
 *     summary: Xem tổng quan trạng thái (Stats/Progress)
 *     description: "Lấy số liệu thống kê: số thẻ học mới, số thẻ đang học (learning), số thẻ đã thuộc (mastered)."
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu biểu đồ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalLearning:
 *                       type: number
 *                       example: 50
 *                     totalMastered:
 *                       type: number
 *                       example: 10
 *       401:
 *         description: Unauthorized
 */
router.get('/progress', flashcardController.getProgress);

/**
 * @swagger
 * /flashcards/bookmarks/study:
 *   get:
 *     summary: Lấy danh sách flashcard cho các từ vựng đã Bookmark
 *     description: Trả về danh sách flashcard (word + progress) giống như khi học theo topic, nhưng chỉ lấy các từ đã được bookmark.
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Unauthorized
 */
router.get('/bookmarks/study', flashcardController.getBookmarkedFlashcards);

/**
 * @swagger
 * /flashcards/topics/{topicId}/bookmarks:
 *   get:
 *     summary: Lấy danh sách flashcard đã bookmark của 1 Topic
 *     description: Trả về danh sách flashcard (word + progress) cho những từ đã bookmark thuộc về 1 topic cụ thể.
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/topics/:topicId/bookmarks',
  validationMiddleware(flashcardValidation.getByTopic),
  flashcardController.getBookmarkedFlashcardsByTopic
);

/**
 * @swagger
 * /flashcards/bookmarks:
 *   get:
 *     summary: Lấy danh sách từ vựng đã Bookmark (Lưu lại)
 *     description: Phục vụ tính năng thư viện từ của tôi (My Words).
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Unauthorized
 */
router.get('/bookmarks', flashcardController.getBookmarks);

/**
 * @swagger
 * /flashcards/bookmark/{wordId}:
 *   patch:
 *     summary: Bật/tắt Bookmark (Toggle)
 *     description: Đánh dấu sao một từ vựng để lưu vào danh sách yêu thích, hoặc gỡ dấu sao nếu đã lưu.
 *     tags: [Flashcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/bookmark/:wordId',
  validationMiddleware(flashcardValidation.bookmark),
  flashcardController.toggleBookmark
);

export default router;
