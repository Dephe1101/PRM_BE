import { Router } from 'express';
import { levelController } from '#controllers/levelController';
import { levelValidation } from '#validations/levelValidation';
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
 *   name: Levels
 *   description: API Quản lý cấp độ JLPT (Ví dụ N5, N4, v.v.). Bao gồm các endpoint cho Public (Đọc) và Admin (Ghi/Sửa/Xóa).
 */

/**
 * @swagger
 * /levels:
 *   get:
 *     summary: Lấy danh sách toàn bộ Level (Public)
 *     description: Trả về danh sách cấp độ JLPT (sắp xếp theo `orderIndex` tăng dần). Có thể dùng để hiển thị trên màn hình Home.
 *     tags: [Levels]
 *     responses:
 *       200:
 *         description: Trả về danh sách Level thành công
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
 *                         description: "ID dạng chuỗi ngắn (VD: N5)"
 *                       name:
 *                         type: string
 *                         description: "Tên cấp độ (VD: N5 - Căn bản)"
 *                       description:
 *                         type: string
 *                       orderIndex:
 *                         type: number
 *                         description: "Thứ tự sắp xếp hiển thị (VD: 1)"
 *                       isActive:
 *                         type: boolean
 *       500:
 *         description: Lỗi Server nội bộ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', levelController.getAllLevels);

/**
 * @swagger
 * /levels/{id}:
 *   get:
 *     summary: Lấy chi tiết 1 Level (Public)
 *     description: Truy xuất thông tin của 1 Level cụ thể dựa vào `_id` (Ví dụ N5, N4).
 *     tags: [Levels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]+$'
 *         description: "ID của Level (Ví dụ: N5)"
 *     responses:
 *       200:
 *         description: Truy xuất thành công
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
 *                     name:
 *                       type: string
 *       404:
 *         description: Level không tồn tại trong hệ thống (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validationMiddleware(commonValidation.checkLevelId), levelController.getLevelById);

/**
 * @swagger
 * /levels:
 *   post:
 *     summary: Tạo Level mới (Admin)
 *     description: API dành riêng cho Quản trị viên để tạo mới 1 cấp độ. (Ví dụ tạo cấp N6).
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *               - name
 *               - orderIndex
 *             properties:
 *               _id:
 *                 type: string
 *                 pattern: '^[A-Z0-9]+$'
 *                 description: "ID cấp độ, không được chứa ký tự đặc biệt, không dấu (Ví dụ: N3)"
 *                 example: "N3"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: "Tên hiển thị của cấp độ"
 *                 example: "N3 - Trung cấp"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: "Mô tả chi tiết"
 *                 example: "Khóa học N3 tiêu chuẩn"
 *               orderIndex:
 *                 type: integer
 *                 minimum: 0
 *                 description: "Thứ tự sắp xếp (ví dụ 3)"
 *                 example: 3
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: "Trạng thái kích hoạt (Mặc định true)"
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo Level thành công
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
 *                   example: "Tạo level thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: Lỗi dữ liệu đầu vào (Ví dụ ID chứa ký tự đặc biệt)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Bạn không có quyền truy cập (Chỉ Admin)
 *       409:
 *         description: ID đã tồn tại trong hệ thống (DUPLICATE_KEY)
 */
router.post(
  '/',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  sanitizeRequest(levelValidation.createLevel.body),
  validationMiddleware(levelValidation.createLevel),
  levelController.createLevel
);

/**
 * @swagger
 * /levels/{id}:
 *   put:
 *     summary: Cập nhật thông tin Level (Admin)
 *     description: Sửa thông tin Level đang có. Không thể sửa `_id`.
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]+$'
 *         description: "ID của Level cần sửa (VD: N5)"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "N5 - Cập nhật"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Mô tả cập nhật"
 *               orderIndex:
 *                 type: integer
 *                 minimum: 0
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                   example: "Cập nhật thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Level không tồn tại
 */
router.put(
  '/:id',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  sanitizeRequest(levelValidation.updateLevel.body),
  validationMiddleware(levelValidation.updateLevel),
  levelController.updateLevel
);

/**
 * @swagger
 * /levels/{id}:
 *   delete:
 *     summary: Xóa Level (Admin)
 *     description: Xóa Level khỏi Database. Bất cứ Topic nào tham chiếu đến Level này vẫn sẽ bị mồ côi hoặc lỗi nếu Frontend không bắt (Cần cẩn trọng khi dùng).
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]+$'
 *         description: "ID Level cần xóa (VD: N5)"
 *     responses:
 *       200:
 *         description: Xóa thành công
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
 *                   example: "Xóa thành công"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Chỉ Admin)
 *       404:
 *         description: Không tìm thấy Level
 */
router.delete(
  '/:id',
  authMiddleware,
  allowRoles(COMMON_CONSTANTS.USER_ROLE.ADMIN),
  auditLogMiddleware,
  validationMiddleware(commonValidation.checkLevelId),
  levelController.deleteLevel
);

export default router;
