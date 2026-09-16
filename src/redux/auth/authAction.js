import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  loginApi,
  logoutApi,
  getProfileApi,
  updateFCMTokenApi,
  changePasswordApi,
  forgotPasswordApi,
  resetPasswordApi,
  updateProfileApi,
  uploadAvatarApi,
  removeAvatarApi,
} from '../../api/authAPI';
import { refreshTokenApi } from '../../services/tokenService';
import { saveTokens, removeTokens, getRefreshToken } from '../../services/storageService';

/**
 * Đăng nhập
 * Side effect: lưu tokens vào AsyncStorage khi thành công
 */
export const loginAction = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await loginApi(email, password);

      if (response.success) {
        // API response thực tế có dạng:
        //   { success, message, accessToken, refreshToken, user }
        // Hoặc: { success, data: { tokens, user } }
        const payload = response.data || response;

        // Lấy accessToken, refreshToken từ nhiều format
        const accessToken = payload?.accessToken || payload?.tokens?.accessToken;
        const refreshToken = payload?.refreshToken || payload?.tokens?.refreshToken;
        const user = payload?.user;

        if (!accessToken) {
          console.error('Login response thiếu accessToken:', JSON.stringify(response).slice(0, 200));
          return rejectWithValue('Phản hồi đăng nhập không hợp lệ: thiếu thông tin token');
        }

        const tokens = { accessToken, refreshToken };

        // Lưu tokens vào AsyncStorage ngay khi đăng nhập thành công
        await saveTokens(tokens.accessToken, tokens.refreshToken);

        return {
          message: response.message,
          tokens,
          user,
        };
      }

      return rejectWithValue(response.message || 'Đăng nhập thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Đã xảy ra lỗi khi đăng nhập',
      );
    }
  },
);

/**
 * Đăng xuất
 * Side effect: xóa tokens khỏi AsyncStorage khi thành công
 */
export const logoutAction = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutApi();

      // Xóa tokens khỏi AsyncStorage (bất kể API có thành công hay không)
      await removeTokens();

      if (response.success) {
        return { message: response.message };
      }

      return { message: response.message || 'Đã đăng xuất' };
    } catch (error) {
      // Vẫn xóa token local khi có lỗi mạng — người dùng muốn đăng xuất
      await removeTokens();
      return rejectWithValue(error.message || 'Đã xảy ra lỗi khi đăng xuất');
    }
  },
);

/**
 * Lấy thông tin người dùng
 */
export const getUserInfoAction = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const accessToken = state?.auth?.tokens?.accessToken;
      const response = await getProfileApi(accessToken);

      if (response.success) {
        // Hỗ trợ cả 2 format: { data: { user } } và { user }
        const user = response.data?.user || response.user;

        if (!user) {
          return rejectWithValue('Profile response thiếu thông tin user');
        }

        return { user };
      }

      return rejectWithValue(response.message || 'Không thể lấy thông tin người dùng');
    } catch (error) {
      return rejectWithValue(error.message || 'Đã xảy ra lỗi');
    }
  },
);

/**
 * Làm mới token
 * Side effect: lưu tokens mới vào AsyncStorage khi thành công
 */
export const refreshTokenAction = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      let refreshToken = state?.auth?.tokens?.refreshToken;

      if (!refreshToken) {
        refreshToken = await getRefreshToken();
      }

      if (!refreshToken) {
        return rejectWithValue('Không tìm thấy refresh token');
      }

      const response = await refreshTokenApi(refreshToken);

      if (response.success) {
        // API refresh token response có thể ở nhiều format:
        //   { accessToken }  — top-level
        //   { data: { tokens: { accessToken } } }
        //   { tokens: { accessToken } }
        const payload = response.data || response;
        const newAccessToken = payload?.accessToken || payload?.tokens?.accessToken;
        const newRefreshToken = payload?.refreshToken || payload?.tokens?.refreshToken;

        if (!newAccessToken) {
          return rejectWithValue('Refresh token response thiếu accessToken');
        }

        // Nếu backend không trả về refreshToken mới, giữ lại token cũ
        const tokens = {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || refreshToken,
        };

        // Lưu tokens mới vào AsyncStorage
        await saveTokens(tokens.accessToken, tokens.refreshToken);

        return { tokens };
      }

      // Nếu refresh thất bại, xóa token cũ
      await removeTokens();
      return rejectWithValue(response.message || 'Làm mới token thất bại');
    } catch (error) {
      await removeTokens();
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Làm mới token thất bại',
      );
    }
  },
);

/**
 * Cập nhật FCM token cho push notification
 */
export const updateFCMTokenAction = createAsyncThunk(
  'auth/updateFCMToken',
  async ({ fcmToken }, { rejectWithValue }) => {
    try {
      const response = await updateFCMTokenApi(fcmToken);

      if (response.success) {
        return { message: response.message };
      }

      return rejectWithValue(response.message || 'Cập nhật FCM token thất bại');
    } catch (error) {
      return rejectWithValue(error.message || 'Đã xảy ra lỗi');
    }
  },
);

/**
 * Đổi mật khẩu (khi đã đăng nhập)
 * POST /api/auth/change-password
 */
export const changePasswordAction = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await changePasswordApi(currentPassword, newPassword);

      if (response.success) {
        return { message: response.message };
      }

      return rejectWithValue(response.message || 'Đổi mật khẩu thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Đã xảy ra lỗi khi đổi mật khẩu',
      );
    }
  },
);

/**
 * Quên mật khẩu
 * POST /api/auth/forgot-password
 */
export const forgotPasswordAction = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await forgotPasswordApi(email);

      if (response.success) {
        const payload = response.data || response;
        return {
          message: response.message,
          resetToken: payload?.resetToken,
          resetTokenExpiry: payload?.resetTokenExpiry,
        };
      }

      return rejectWithValue(response.message || 'Gửi email thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Đã xảy ra lỗi',
      );
    }
  },
);

/**
 * Đặt lại mật khẩu
 * POST /api/auth/reset-password
 */
export const resetPasswordAction = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await resetPasswordApi(token, newPassword);

      if (response.success) {
        return { message: response.message };
      }

      return rejectWithValue(response.message || 'Đặt lại mật khẩu thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Đã xảy ra lỗi khi đặt lại mật khẩu',
      );
    }
  },
);

/**
 * Cập nhật hồ sơ người dùng
 * PUT /api/users/profile
 */
export const updateProfileAction = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateProfileApi(data);

      if (response.success) {
        const payload = response.data || response;
        const user = payload?.user || payload;
        return { user, message: response.message };
      }

      return rejectWithValue(response.message || 'Cập nhật hồ sơ thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Đã xảy ra lỗi khi cập nhật hồ sơ',
      );
    }
  },
);

/**
 * Upload avatar
 * POST /api/users/profile/avatar
 */
export const uploadAvatarAction = createAsyncThunk(
  'auth/uploadAvatar',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await uploadAvatarApi(formData);

      if (response.success) {
        const payload = response.data || response;
        return { avatar: payload?.avatar, message: response.message };
      }

      return rejectWithValue(response.message || 'Tải lên avatar thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Đã xảy ra lỗi khi tải lên avatar',
      );
    }
  },
);

/**
 * Xóa avatar
 * DELETE /api/users/profile/avatar
 */
export const removeAvatarAction = createAsyncThunk(
  'auth/removeAvatar',
  async (_, { rejectWithValue }) => {
    try {
      const response = await removeAvatarApi();

      if (response.success) {
        return { message: response.message };
      }

      return rejectWithValue(response.message || 'Xóa avatar thất bại');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Đã xảy ra lỗi khi xóa avatar',
      );
    }
  },
);
