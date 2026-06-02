import { Router } from 'express';
import { gameController } from '#controllers/gameController';
import { gameValidation } from '#validations/gameValidation';
import { authMiddleware } from '#middlewares/authMiddleware';
import { validationMiddleware } from '#middlewares/validationMiddleware';
import { sanitizeRequest } from '#middlewares/sanitizeRequest';
import { GENERATE_UTILS } from '#utils/generateUtils';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Games
 *   description: Hệ thống Gamification. Quản lý việc sinh từ vựng, tính điểm (XP, Coins) và bảng xếp hạng.
 */

/**
 * @swagger
 * /games/leaderboard:
 *   get:
 *     summary: Bảng xếp hạng (Leaderboard) (Public)
 *     description: Lấy danh sách các tài khoản có số điểm cao nhất (tính theo XP tích lũy hoặc thành tích chơi Game).
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: gameType
 *         schema:
 *           type: string
 *           enum: [FALLING_WORDS, MULTIPLE_CHOICE]
 *         description: "Lọc bảng xếp hạng theo loại game (Tùy chọn)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Số lượng top user muốn lấy (Tối đa 100)"
 *     responses:
 *       200:
 *         description: Bảng xếp hạng
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
 *                       userId:
 *                         type: string
 *                       username:
 *                         type: string
 *                       totalScore:
 *                         type: number
 */
router.get('/leaderboard', gameController.getLeaderboard);

// === Các route dưới đây yêu cầu đăng nhập ===
router.use(authMiddleware);

/**
 * @swagger
 * /games/eligible-topics:
 *   get:
 *     summary: Danh sách Topic đủ điều kiện chơi Game (User)
 *     description: Lấy danh sách các Topic mà User đã đạt trạng thái MASTERED (học thuộc 100%). Người dùng CHỈ ĐƯỢC PHÉP chơi game trên các topic này.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách Topic Mastered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       totalWords:
 *                         type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/eligible-topics', gameController.getEligibleTopics);

/**
 * @swagger
 * /games/start:
 *   post:
 *     summary: Bắt đầu ván Game mới (User)
 *     description: Gửi danh sách các `topicIds` (tối đa 5 Topic) đã Mastered để hệ thống trộn từ vựng và tự động nhặt các "Đáp án nhiễu" (Distractors) từ trong cơ sở dữ liệu để phục vụ cho các Game trắc nghiệm.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicIds
 *               - gameType
 *             properties:
 *               topicIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "Array ObjectId của các Topic (Tối đa 5)"
 *               gameType:
 *                 type: string
 *                 enum: [FALLING_WORDS, MULTIPLE_CHOICE]
 *                 description: "Loại trò chơi"
 *     responses:
 *       200:
 *         description: Payload chứa data câu hỏi
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
 *                     questions:
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
 *                           distractors:
 *                             type: array
 *                             description: "Danh sách 3 đáp án sai"
 *                             items:
 *                               type: string
 *       400:
 *         description: Validation Error (topicIds rỗng, vượt quá 5 topics...)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Có Topic chưa đạt chuẩn MASTERED
 */
router.post(
  '/start',
  sanitizeRequest(
    GENERATE_UTILS.extractFieldsFromJoi(gameValidation.startGame.body),
    []
  ),
  validationMiddleware(gameValidation.startGame),
  gameController.startGame
);

/**
 * @swagger
 * /games/submit:
 *   post:
 *     summary: Nộp kết quả Game (Ghi nhận điểm số) (User)
 *     description: "Sau khi chơi xong, Frontend đẩy payload này lên để hệ thống quy đổi thành XP, Coins, và lưu GameHistory. ĐẶC BIỆT: Hệ thống sẽ tự động đồng bộ (Sync) ngược lại với thuật toán SRS. Những từ bị sai (`wordsMissed`) sẽ bị đánh rớt Stage và Topic có thể bị mất danh hiệu MASTERED."
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicIds
 *               - gameType
 *               - score
 *             properties:
 *               topicIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               gameType:
 *                 type: string
 *                 enum: [FALLING_WORDS, MULTIPLE_CHOICE]
 *               score:
 *                 type: number
 *                 description: "Điểm số đạt được trong ván"
 *               maxCombo:
 *                 type: number
 *                 description: "Combo liên tiếp cao nhất"
 *               wordsHit:
 *                 type: array
 *                 description: "Danh sách ObjectId của các từ vựng chọn đúng"
 *                 items:
 *                   type: string
 *               wordsMissed:
 *                 type: array
 *                 description: "Danh sách ObjectId của các từ vựng chọn sai (Sẽ bị tụt stage)"
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Lưu kết quả thành công
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
 *                     earnedXp:
 *                       type: number
 *                     earnedCoins:
 *                       type: number
 *                     levelUp:
 *                       type: boolean
 *                       description: "Báo hiệu user vừa thăng cấp độ"
 *       400:
 *         description: Payload lỗi
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/submit',
  sanitizeRequest(
    GENERATE_UTILS.extractFieldsFromJoi(gameValidation.submitGame.body),
    []
  ),
  validationMiddleware(gameValidation.submitGame),
  gameController.submitGame
);

/**
 * @swagger
 * /games/history:
 *   get:
 *     summary: Lịch sử chơi game (User)
 *     description: Xem lại lịch sử các ván game của mình (Có phân trang).
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: gameType
 *         schema:
 *           type: string
 *           enum: [FALLING_WORDS, MULTIPLE_CHOICE]
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/history',
  validationMiddleware(gameValidation.getHistory),
  gameController.getHistory
);

/**
 * @swagger
 * /games/history/{id}:
 *   get:
 *     summary: Chi tiết 1 lịch sử chơi game (User)
 *     tags: [Games]
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
 *         description: OK
 *       404:
 *         description: Không tìm thấy History
 */
router.get('/history/:id', gameController.getHistoryDetail);

/**
 * @swagger
 * /games/stats:
 *   get:
 *     summary: Thống kê thành tích Game của User
 *     description: Trả về số liệu tổng quan (Tổng số ván đã chơi, High Score, Tỉ lệ trả lời đúng).
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', gameController.getStats);

export default router;
