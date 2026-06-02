import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from '#services/authService';
import { catchAsync } from '#utils/catchAsync';
import { COMMON_CONSTANTS } from '#constants/common';
import { ENV } from '#configs/environment';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(COMMON_CONSTANTS.COOKIE_REFRESH_TOKEN, token, {
    httpOnly: true, // Không cho JS truy cập
    secure: ENV.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Chặn CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
    path: '/',
  });
};

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const ipAddress = req.ip || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    const result = await authService.login(email, password, ipAddress, userAgent);

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies[COMMON_CONSTANTS.COOKIE_REFRESH_TOKEN];
    if (!refreshToken) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED);
    }

    const ipAddress = req.ip || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    const result = await authService.refresh(refreshToken, ipAddress, userAgent);

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Làm mới token thành công',
      data: {
        accessToken: result.accessToken,
      },
    });
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies[COMMON_CONSTANTS.COOKIE_REFRESH_TOKEN];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie(COMMON_CONSTANTS.COOKIE_REFRESH_TOKEN);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  }),

  logoutAll: catchAsync(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!._id);

    res.clearCookie(COMMON_CONSTANTS.COOKIE_REFRESH_TOKEN);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã đăng xuất tất cả thiết bị',
    });
  }),

  getMe: catchAsync(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!._id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  }),

  getSessions: catchAsync(async (req: Request, res: Response) => {
    const sessions = await authService.getSessions(req.user!._id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: sessions,
    });
  }),

  deleteSession: catchAsync(async (req: Request, res: Response) => {
    await authService.deleteSession(req.params.id as string, req.user!._id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Đã xóa phiên đăng nhập',
    });
  }),
};
