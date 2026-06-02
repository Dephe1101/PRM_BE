import { Router } from 'express';
import { auditLogController } from '#controllers/auditLogController';
import { authMiddleware } from '#middlewares/authMiddleware';
import { allowRoles } from '#middlewares/allowRoles';
import { COMMON_CONSTANTS } from '#constants/common';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Tác vụ quản trị hệ thống cấp cao. Yêu cầu quyền Admin. (Bao gồm hệ thống Audit Log - Theo dõi dấu vết)
 */

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Xem lịch sử thao tác hệ thống (Audit Logs) (Admin)
 *     description: Lấy danh sách các thao tác đã thực hiện trên hệ thống (POST, PUT, DELETE). Mọi thay đổi dữ liệu của Admin đều được ghi nhận ngầm tại đây. Password và Token sẽ tự động bị ẩn.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Trang hiện tại"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: "Số bản ghi mỗi trang"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: "Lọc log theo ID của Admin thực hiện thao tác"
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [POST, PUT, PATCH, DELETE]
 *         description: "Lọc theo hành động (Ví dụ: DELETE)"
 *     responses:
 *       200:
 *         description: Danh sách Audit Logs
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
 *                     docs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           action:
 *                             type: string
 *                           endpoint:
 *                             type: string
 *                             example: "/api/v1/levels"
 *                           body:
 *                             type: object
 *                             description: "Dữ liệu JSON đã gửi"
 *                           ipAddress:
 *                             type: string
 *                           userAgent:
 *                             type: string
 *                           statusCode:
 *                             type: number
 *                     totalDocs:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Chỉ Admin)
 */
router.get(
  '/audit-logs',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogController.getAll
);

export default router;
