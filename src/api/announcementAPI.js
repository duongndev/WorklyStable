import { axiosClient } from './axiosConfig';

/**
 * ============================================
 * ANNOUNCEMENT API - BẢNG TIN DOANH NGHIỆP
 * ============================================
 */

/**
 * Lấy danh sách bảng tin nội bộ
 * GET /api/announcements
 */
export const getAnnouncementsApi = async (params = {}) => {
  try {
    const response = await axiosClient.get('/announcements', { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bảng tin:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Xem chi tiết bài viết bảng tin
 * GET /api/announcements/:id
 */
export const getAnnouncementDetailApi = async (id) => {
  try {
    const response = await axiosClient.get(`/announcements/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thông báo:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Thả tim / Bỏ tim bài viết
 * POST /api/announcements/:id/like
 */
export const toggleLikeAnnouncementApi = async (id) => {
  try {
    const response = await axiosClient.post(`/announcements/${id}/like`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi thả tim bài viết:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Gửi bình luận vào bài viết
 * POST /api/announcements/:id/comments
 * @param {string} id - ID bài viết
 * @param {string} content - Nội dung bình luận
 * @param {string|null} parentCommentId - ID bình luận gốc nếu là reply
 * @param {string|null} mentionedUserId - ID user được reply tới để gửi thông báo
 */
export const addCommentAnnouncementApi = async (id, content, parentCommentId = null, mentionedUserId = null) => {
  try {
    const response = await axiosClient.post(`/announcements/${id}/comments`, {
      content,
      parentCommentId,
      mentionedUserId,
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gửi bình luận:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Admin đăng thông báo / tin tức mới
 * POST /api/announcements
 */
export const createAnnouncementAdminApi = async (data) => {
  try {
    const response = await axiosClient.post('/announcements', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đăng thông báo mới:', error.response?.data || error.message);
    throw error;
  }
};
