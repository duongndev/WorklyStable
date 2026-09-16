import { axiosClient } from './axiosConfig';

/**
 * =========================
 * NOTIFICATION API
 * =========================
 */

/**
 * Lấy danh sách thông báo của tôi
 * GET /api/notifications?page=1&limit=20
 * @param {object} query
 */
export const getMyNotificationsApi = async (query = {}) => {
  try {
    const response = await axiosClient.get('/notifications', { params: query });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thông báo:', error.response?.data || error.message);
    throw error;
  }
};
export const getNotificationsApi = getMyNotificationsApi;

/**
 * Đánh dấu 1 thông báo đã đọc
 * PUT /api/notifications/:id/read
 * @param {string} id
 */
export const markNotificationAsReadApi = async (id) => {
  try {
    const response = await axiosClient.put(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đánh dấu thông báo đã đọc:', error.response?.data || error.message);
    throw error;
  }
};
export const markAsReadApi = markNotificationAsReadApi;

/**
 * Đánh dấu đã đọc tất cả thông báo
 * PUT /api/notifications/read-all
 */
export const markAllNotificationsAsReadApi = async () => {
  try {
    const response = await axiosClient.put('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đánh dấu đã đọc tất cả:', error.response?.data || error.message);
    throw error;
  }
};
export const markAllAsReadApi = markAllNotificationsAsReadApi;

/**
 * Admin: Gửi thông báo tùy chỉnh tới nhân viên
 * POST /api/notifications/admin/send
 * @param {object} data - { recipientIds, title, body, type, data }
 */
export const sendAdminNotificationApi = async (data) => {
  try {
    const response = await axiosClient.post('/notifications/admin/send', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gửi thông báo admin:', error.response?.data || error.message);
    throw error;
  }
};