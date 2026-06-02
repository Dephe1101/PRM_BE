import cloudinary from '#configs/cloudinary';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import { MEDIA_REPOSITORY } from '#repositories/mediaRepository';

const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  options?: { transformation?: object[] }
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `japanese-edtech/${folder}`,
        transformation: options?.transformation || [
          { width: 1200, height: 630, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Lỗi upload ảnh lên Cloudinary'));
          return;
        }
        resolve({
          url: result!.secure_url,
          publicId: result!.public_id,
        });
      }
    );
    stream.end(buffer);
  });
};

const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const mediaService = {
  upload: async (file: Express.Multer.File, folder: string, userId: string) => {
    const { url, publicId } = await uploadToCloudinary(file.buffer, folder);

    const media = await MEDIA_REPOSITORY.create({
      url,
      publicId,
      folder,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: userId as any, // Cast for ObjectId
    });

    return media;
  },

  uploadMultiple: async (files: Express.Multer.File[], folder: string, userId: string) => {
    const results = await Promise.all(
      files.map((file) => mediaService.upload(file, folder, userId))
    );
    return results;
  },

  getAll: async (filter: { folder?: string }, options: any) => {
    const query: any = {};
    if (filter.folder) query.folder = filter.folder;
    return MEDIA_REPOSITORY.findAll(query, options);
  },

  getById: async (id: string) => {
    const media = await MEDIA_REPOSITORY.findById(id);
    if (!media) throw new ApiError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy media');
    return media;
  },

  delete: async (id: string) => {
    const media = await MEDIA_REPOSITORY.findById(id);
    if (!media) throw new ApiError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy media');

    // Xóa trên Cloudinary
    await deleteFromCloudinary(media.publicId);

    // Xóa trong DB
    await MEDIA_REPOSITORY.deleteById(id);

    return media;
  },
};
