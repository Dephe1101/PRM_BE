import { USER_REPOSITORY } from '#repositories/userRepository';
import { SESSION_REPOSITORY } from '#repositories/sessionRepository';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { generateAccessToken, generateRefreshToken, hashToken } from '#utils/tokenUtils';
import { ENV } from '#configs/environment';

export const authService = {
  register: async (data: any) => {
    const { username, email, password } = data;

    // 1. Kiểm tra email đã tồn tại
    const existingUser = await USER_REPOSITORY.findByEmail(email);
    if (existingUser) {
      throw new ApiError(ERROR_CODES.EMAIL_EXISTS);
    }

    // 2. Tạo user mới
    const newUser = await USER_REPOSITORY.create({
      username,
      email,
      passwordHash: password, // Sẽ được hash bởi hook pre-save
    });

    // 3. Tạo token
    const accessToken = generateAccessToken({ _id: newUser._id.toString(), role: newUser.role });
    const refreshToken = generateRefreshToken();

    // 4. Lưu refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
    await SESSION_REPOSITORY.create({
      userId: newUser._id,
      token: hashToken(refreshToken),
      expiresAt,
    });

    const { passwordHash, ...userObj } = newUser.toObject();

    return { user: userObj, accessToken, refreshToken };
  },

  login: async (email: string, password: string, ipAddress: string, userAgent: string) => {
    // 1. Tìm user
    const user = await USER_REPOSITORY.findByEmail(email);
    if (!user) {
      throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS);
    }
    if (!user.isActive) {
      throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED);
    }

    // 2. Kiểm tra mật khẩu
    // Trong mongoose 6/7/8 khi lean thì mất method, phải gọi bcrypt trực tiếp
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(ERROR_CODES.INVALID_CREDENTIALS);
    }

    // 3. Tạo token mới
    const accessToken = generateAccessToken({ _id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken();

    // 4. Lưu session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await SESSION_REPOSITORY.create({
      userId: user._id,
      token: hashToken(refreshToken),
      ipAddress,
      userAgent,
      expiresAt,
    });

    // 5. Tránh lộ passwordHash ra ngoài
    const { passwordHash: _, ...userObj } = user;

    return { user: userObj, accessToken, refreshToken };
  },

  refresh: async (refreshToken: string, ipAddress: string, userAgent: string) => {
    // 1. Tìm session
    const hashedToken = hashToken(refreshToken);
    const session = await SESSION_REPOSITORY.findByToken(hashedToken);

    if (!session) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED);
    }

    // 2. Không xóa ngay lập tức để tránh Race Condition (Grace Period 60 giây)
    await SESSION_REPOSITORY.update(session._id.toString(), {
      expiresAt: new Date(Date.now() + 60 * 1000), // Sống thêm 60 giây
    });

    // 3. Lấy thông tin user
    const user = await USER_REPOSITORY.findById(session.userId.toString());
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED);
    }
    if (!user.isActive) {
      throw new ApiError(ERROR_CODES.ACCOUNT_DISABLED);
    }

    // 4. Tạo token MỚI
    const newAccessToken = generateAccessToken({ _id: user._id.toString(), role: user.role });
    const newRefreshToken = generateRefreshToken();

    // 5. Lưu session MỚI
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await SESSION_REPOSITORY.create({
      userId: user._id,
      token: hashToken(newRefreshToken),
      ipAddress,
      userAgent,
      expiresAt,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  logout: async (refreshToken: string) => {
    const hashedToken = hashToken(refreshToken);
    await SESSION_REPOSITORY.deleteByToken(hashedToken);
  },

  logoutAll: async (userId: string) => {
    await SESSION_REPOSITORY.deleteByUserId(userId);
  },

  getMe: async (userId: string) => {
    const user = await USER_REPOSITORY.findById(userId);
    if (!user) {
      throw new ApiError(ERROR_CODES.NOT_FOUND, 'User not found');
    }
    return user;
  },

  getSessions: async (userId: string) => {
    const sessions = await SESSION_REPOSITORY.findByUserId(userId);
    return sessions.map((s) => ({
      _id: s._id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  },

  deleteSession: async (sessionId: string, userId: string) => {
    // Ensure the session belongs to the user
    const sessions = await SESSION_REPOSITORY.findByUserId(userId);
    const targetSession = sessions.find((s) => s._id.toString() === sessionId);
    
    if (!targetSession) {
      throw new ApiError(ERROR_CODES.NOT_FOUND, 'Session not found');
    }

    await SESSION_REPOSITORY.deleteById(sessionId);
  },
};
