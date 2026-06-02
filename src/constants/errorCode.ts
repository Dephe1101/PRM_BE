import { StatusCodes } from 'http-status-codes';

export const ERROR_CODES = {
  // ===== Auth =====
  UNAUTHORIZED: {
    statusCode: StatusCodes.UNAUTHORIZED,
    code: 'UNAUTHORIZED',
    message: 'Bạn chưa đăng nhập',
  },
  INVALID_CREDENTIALS: {
    statusCode: StatusCodes.UNAUTHORIZED,
    code: 'INVALID_CREDENTIALS',
    message: 'Email hoặc mật khẩu không chính xác',
  },
  TOKEN_EXPIRED: {
    statusCode: StatusCodes.UNAUTHORIZED,
    code: 'TOKEN_EXPIRED',
    message: 'Token đã hết hạn',
  },
  FORBIDDEN: {
    statusCode: StatusCodes.FORBIDDEN,
    code: 'FORBIDDEN',
    message: 'Bạn không có quyền thực hiện hành động này',
  },
  EMAIL_EXISTS: {
    statusCode: StatusCodes.CONFLICT,
    code: 'EMAIL_EXISTS',
    message: 'Email đã được sử dụng',
  },

  // ===== User =====
  USER_NOT_FOUND: {
    statusCode: StatusCodes.NOT_FOUND,
    code: 'USER_NOT_FOUND',
    message: 'Không tìm thấy người dùng',
  },

  // ===== Level =====
  LEVEL_NOT_FOUND: {
    statusCode: StatusCodes.NOT_FOUND,
    code: 'LEVEL_NOT_FOUND',
    message: 'Không tìm thấy cấp độ',
  },
  LEVEL_ID_EXISTS: {
    statusCode: StatusCodes.CONFLICT,
    code: 'LEVEL_ID_EXISTS',
    message: 'Mã cấp độ đã tồn tại',
  },

  // ===== Topic =====
  TOPIC_NOT_FOUND: {
    statusCode: StatusCodes.NOT_FOUND,
    code: 'TOPIC_NOT_FOUND',
    message: 'Không tìm thấy chủ đề',
  },
  TOPIC_WORD_COUNT_INVALID: {
    statusCode: StatusCodes.BAD_REQUEST,
    code: 'TOPIC_WORD_COUNT_INVALID',
    message: 'Mỗi chủ đề phải có từ 7 đến 13 từ vựng',
  },

  // ===== Word =====
  WORD_NOT_FOUND: {
    statusCode: StatusCodes.NOT_FOUND,
    code: 'WORD_NOT_FOUND',
    message: 'Không tìm thấy từ vựng',
  },

  // ===== Game =====
  TOPIC_NOT_MASTERED: {
    statusCode: StatusCodes.FORBIDDEN,
    code: 'TOPIC_NOT_MASTERED',
    message: 'Phải thuộc hết từ vựng của chủ đề mới được chơi game',
  },
  INVALID_GAME_TYPE: {
    statusCode: StatusCodes.BAD_REQUEST,
    code: 'INVALID_GAME_TYPE',
    message: 'Loại game không hợp lệ',
  },

  // ===== Media =====
  MEDIA_NOT_FOUND: {
    statusCode: StatusCodes.NOT_FOUND,
    code: 'MEDIA_NOT_FOUND',
    message: 'Không tìm thấy file media',
  },
  UPLOAD_FAILED: {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    code: 'UPLOAD_FAILED',
    message: 'Upload file thất bại',
  },
  FILE_TOO_LARGE: {
    statusCode: StatusCodes.BAD_REQUEST,
    code: 'FILE_TOO_LARGE',
    message: 'File vượt quá kích thước cho phép',
  },
  INVALID_FILE_TYPE: {
    statusCode: StatusCodes.BAD_REQUEST,
    code: 'INVALID_FILE_TYPE',
    message: 'Định dạng file không được hỗ trợ',
  },

  // ===== General =====
  VALIDATION_ERROR: {
    statusCode: StatusCodes.BAD_REQUEST,
    code: 'VALIDATION_ERROR',
    message: 'Dữ liệu không hợp lệ',
  },
  INTERNAL_ERROR: {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_ERROR',
    message: 'Lỗi hệ thống, vui lòng thử lại sau',
  },
  NOT_FOUND: {
    statusCode: StatusCodes.NOT_FOUND,
    code: 'NOT_FOUND',
    message: 'Không tìm thấy tài nguyên',
  },
} as const;
