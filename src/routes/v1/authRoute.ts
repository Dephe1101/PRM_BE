import { Router } from 'express';
import { authController } from '#controllers/authController';
import { authMiddleware } from '#middlewares/authMiddleware';
import { validationMiddleware } from '#middlewares/validationMiddleware';
import { sanitizeRequest } from '#middlewares/sanitizeRequest';
import { apiLimiter as loginLimiter } from '#middlewares/rateLimiter';
import { authValidation } from '#validations/authValidation';
import { GENERATE_UTILS } from '#utils/generateUtils';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API Quản lý xác thực người dùng, đăng ký, đăng nhập và quản lý phiên (Sessions). Yêu cầu Role Public hoặc User.
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới (Public)
 *     description: Endpoint cho phép người dùng đăng ký tài khoản mới. Trả về thông tin user và access token. Sẽ tự động set một HTTP-only Cookie chứa Refresh Token để dùng cho việc làm mới token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Tên người dùng hiển thị
 *                 example: "nguyenvana"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Địa chỉ email hợp lệ
 *                 example: "nguyenvana@example.com"
 *               password:
 *                 type: string
 *                 description: Mật khẩu (tối thiểu 6 ký tự)
 *                 example: "MatKhauBaoMat123"
 *     responses:
 *       201:
 *         description: Đăng ký thành công.
 *         headers:
 *           Set-Cookie:
 *             schema: 
 *               type: string
 *             description: Cookie chứa Refresh Token (HTTP-only)
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
 *                   example: "Đăng ký thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *       400:
 *         description: Lỗi dữ liệu đầu vào (Validation Error). Ví dụ mật khẩu quá ngắn hoặc thiếu email.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email đã tồn tại trong hệ thống (DUPLICATE_KEY).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi Server nội bộ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/register',
  loginLimiter,
  sanitizeRequest(
    GENERATE_UTILS.extractFieldsFromJoi(authValidation.register.body),
    []
  ),
  validationMiddleware(authValidation.register),
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống (Public)
 *     description: Xác thực người dùng bằng email và mật khẩu. Trả về access token và set HTTP-only cookie chứa Refresh Token. Hỗ trợ đăng nhập đa thiết bị (mỗi lần đăng nhập tạo một Session mới).
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký
 *                 example: "nguyenvana@example.com"
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: "MatKhauBaoMat123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         headers:
 *           Set-Cookie:
 *             schema: 
 *               type: string
 *             description: Cookie chứa Refresh Token
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *       400:
 *         description: Lỗi Validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Sai email hoặc mật khẩu (INVALID_CREDENTIALS)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi Server
 */
router.post(
  '/login',
  loginLimiter,
  sanitizeRequest(
    GENERATE_UTILS.extractFieldsFromJoi(authValidation.login.body),
    []
  ),
  validationMiddleware(authValidation.login),
  authController.login
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Cấp lại Access Token (Public/Cookie)
 *     description: Dùng Refresh Token được lưu trong HTTP-Only cookie để lấy Access Token mới. Áp dụng cơ chế Refresh Token Rotation (Xoay vòng token) - cấp luôn cả Refresh Token mới.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Cấp token mới thành công
 *         headers:
 *           Set-Cookie:
 *             schema: 
 *               type: string
 *             description: Refresh Token MỚI
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
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Không tìm thấy cookie, token đã hết hạn, token bị đánh cắp hoặc phiên bị vô hiệu hóa (UNAUTHORIZED).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất khỏi thiết bị hiện tại (User/Admin)
 *     description: Xóa phiên đăng nhập hiện tại khỏi Database (tương ứng với Refresh Token trong cookie) và ra lệnh cho trình duyệt xóa cookie.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         headers:
 *           Set-Cookie:
 *             schema: 
 *               type: string
 *             description: Clear cookie
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
 *                   example: "Đăng xuất thành công"
 *       401:
 *         description: Chưa đăng nhập hoặc Access Token không hợp lệ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Đăng xuất mọi thiết bị (User/Admin)
 *     description: Xóa tất cả các phiên đăng nhập (Sessions) của người dùng hiện tại khỏi DB. Kể cả các thiết bị khác đang đăng nhập cũng sẽ bị văng.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất tất cả thiết bị thành công
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
 *                   example: "Đăng xuất thành công mọi thiết bị"
 *       401:
 *         description: Chưa đăng nhập.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout-all', authMiddleware, authController.logoutAll);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy Profile của tôi (User/Admin)
 *     description: Trả về thông tin cá nhân của người dùng hiện tại, bao gồm cả Level, Coin, XP.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin cá nhân
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
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     level:
 *                       type: number
 *                     xp:
 *                       type: number
 *                     coins:
 *                       type: number
 *       401:
 *         description: Access Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User không tồn tại (đã bị xóa khỏi DB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Xem lịch sử đăng nhập (User/Admin)
 *     description: Lấy danh sách các Session (thiết bị/trình duyệt/IP) đang duy trì trạng thái đăng nhập của người dùng.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thiết bị (sessions)
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
 *                       ipAddress:
 *                         type: string
 *                         description: "IP Address của thiết bị (Ví dụ: 192.168.1.1)"
 *                       userAgent:
 *                         type: string
 *                         description: "Trình duyệt đang dùng (Ví dụ: Mozilla/5.0...)"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Chưa đăng nhập.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sessions', authMiddleware, authController.getSessions);

/**
 * @swagger
 * /auth/sessions/{id}:
 *   delete:
 *     summary: Xóa một phiên đăng nhập từ xa (User/Admin)
 *     description: Hủy (xóa) một phiên đăng nhập của thiết bị khác dựa vào Session ID. Giống tính năng "Đăng xuất khỏi thiết bị khác".
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã định danh của Session (ObjectId)
 *     responses:
 *       200:
 *         description: Đã xóa thành công
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
 *                   example: "Đã xóa phiên đăng nhập"
 *       401:
 *         description: Cần đăng nhập.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session không tồn tại hoặc không thuộc quyền sở hữu của user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/sessions/:id', authMiddleware, authController.deleteSession);

export default router;
