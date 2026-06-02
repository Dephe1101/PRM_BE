import multer from 'multer';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Định dạng file không được hỗ trợ (Chỉ nhận jpeg, png, gif, webp)'));
    }
  },
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 5); // Max 5 files
