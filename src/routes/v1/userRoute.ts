import { Router } from 'express';
import { userController } from '#controllers/userController';
import { userValidation } from '#validations/userValidation';
import { validationMiddleware } from '#middlewares/validationMiddleware';
import { authMiddleware } from '#middlewares/authMiddleware';
import { allowRoles } from '#middlewares/allowRoles';
import { COMMON_CONSTANTS } from '#constants/common';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Quản lý người dùng (Dành cho Admin)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     description: Lấy danh sách người dùng có phân trang và tìm kiếm (Chỉ Admin).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng trên 1 trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo username hoặc email
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  validationMiddleware(userValidation.getAllSchema),
  userController.getAll
);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Thay đổi trạng thái tài khoản
 *     description: Khóa (ban) hoặc mở khóa tài khoản người dùng (Chỉ Admin).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Trạng thái tài khoản (true = hoạt động, false = khóa)
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.patch(
  '/:id/status',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  validationMiddleware(userValidation.toggleStatusSchema),
  userController.toggleStatus
);

export default router;
