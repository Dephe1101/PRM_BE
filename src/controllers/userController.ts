import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { userService } from '#services/userService';
import { catchAsync } from '#utils/catchAsync';

export const userController = {
  /**
   * Lấy danh sách người dùng (Phân trang & Tìm kiếm)
   */
  getAll: catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string | undefined;

    const result = await userService.getAllUsers(page, limit, search);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  }),

  /**
   * Khóa / Mở khóa người dùng
   */
  toggleStatus: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { isActive } = req.body;

    const updatedUser = await userService.toggleUserStatus(id, isActive);

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedUser,
    });
  }),
};
