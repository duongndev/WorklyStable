import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getMyNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
} from '../../api/notificationAPI';

/**
 * Lấy danh sách thông báo
 */
export const getNotificationsAction = createAsyncThunk(
  'notification/getNotifications',
  async (query = {}, { rejectWithValue }) => {
    try {
      const response = await getMyNotificationsApi(query);
      if (response && response.success !== false) {
        return {
          data: response.data || {},
          pagination: response.data?.pagination || response.pagination,
          message: response.message,
        };
      }
      return rejectWithValue(response.message || 'Không thể tải thông báo');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi',
      );
    }
  },
);

/**
 * Đánh dấu đã đọc 1 thông báo
 */
export const markAsReadAction = createAsyncThunk(
  'notification/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await markNotificationAsReadApi(id);
      if (response && response.success !== false) {
        return { id, message: response.message };
      }
      return rejectWithValue(response.message || 'Đánh dấu thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi',
      );
    }
  },
);

/**
 * Đánh dấu tất cả đã đọc
 */
export const markAllAsReadAction = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await markAllNotificationsAsReadApi();
      if (response && response.success !== false) {
        return { message: response.message };
      }
      return rejectWithValue(response.message || 'Đánh dấu tất cả thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi',
      );
    }
  },
);

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCountAction = createAsyncThunk(
  'notification/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyNotificationsApi({ limit: 1 });
      const unreadCount = response.data?.unreadCount ?? 0;
      return { count: unreadCount };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);