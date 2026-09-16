import { axiosClient } from './axiosConfig';

/**
 * =========================
 * UPLOAD API
 * =========================
 */

/**
 * Upload 1 file ảnh lên Cloudinary qua Server
 * POST /api/upload/image
 * @param {FormData} formData
 */
export const uploadImageApi = async (formData) => {
  try {
    const response = await axiosClient.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi upload ảnh:', error.response?.data || error.message);
    throw error;
  }
};
