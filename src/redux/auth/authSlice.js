import { createSlice } from '@reduxjs/toolkit';
import {
  loginAction,
  logoutAction,
  getUserInfoAction,
  updateFCMTokenAction,
  refreshTokenAction,
  changePasswordAction,
  forgotPasswordAction,
  resetPasswordAction,
  updateProfileAction,
  uploadAvatarAction,
  removeAvatarAction,
} from './authAction.js';

const initialState = {
  tokens: null,
  user: null,
  message: null,
  error: null,
  // Loading states riêng cho từng action — tránh xung đột
  loginLoading: false,
  logoutLoading: false,
  profileLoading: false,
  changePasswordLoading: false,
  updateProfileLoading: false,
  uploadAvatarLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.tokens = null;
      state.message = null;
      state.loginLoading = false;
      state.logoutLoading = false;
      state.profileLoading = false;
      state.changePasswordLoading = false;
      state.updateProfileLoading = false;
      state.uploadAvatarLoading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
      state.message = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // ========== LOGIN ==========
    builder
      .addCase(loginAction.pending, (state) => {
        state.loginLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(loginAction.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(loginAction.rejected, (state, action) => {
        state.loginLoading = false;
        state.error = action.payload || 'Đăng nhập thất bại';
        state.message = state.error;
      });

    // ========== LOGOUT ==========
    builder
      .addCase(logoutAction.pending, (state) => {
        state.logoutLoading = true;
        state.error = null;
      })
      .addCase(logoutAction.fulfilled, (state, action) => {
        state.user = null;
        state.tokens = null;
        state.logoutLoading = false;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(logoutAction.rejected, (state, action) => {
        state.logoutLoading = false;
        // Không xóa user/tokens — nếu lỗi mạng thì người dùng vẫn đang đăng nhập
        state.error = action.payload || 'Có lỗi xảy ra khi đăng xuất';
        state.message = state.error;
      });

    // ========== GET USER INFO ==========
    builder
      .addCase(getUserInfoAction.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(getUserInfoAction.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(getUserInfoAction.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload || 'Không thể lấy thông tin người dùng';
      });

    // ========== UPDATE FCM TOKEN ==========
    builder
      .addCase(updateFCMTokenAction.pending, (state) => {
        state.error = null;
      })
      .addCase(updateFCMTokenAction.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(updateFCMTokenAction.rejected, (state, action) => {
        state.error = action.payload || 'Cập nhật FCM token thất bại';
      });

    // ========== REFRESH TOKEN ==========
    builder
      .addCase(refreshTokenAction.pending, (state) => {
        state.error = null;
      })
      .addCase(refreshTokenAction.fulfilled, (state, action) => {
        state.tokens = action.payload?.tokens || {
          accessToken: action.payload?.accessToken,
          refreshToken: action.payload?.refreshToken,
        };
        state.error = null;
      })
      .addCase(refreshTokenAction.rejected, (state, action) => {
        state.tokens = null;
        state.user = null;
        state.error = action.payload || 'Làm mới token thất bại';
      });

    // ========== CHANGE PASSWORD ==========
    builder
      .addCase(changePasswordAction.pending, (state) => {
        state.changePasswordLoading = true;
        state.error = null;
      })
      .addCase(changePasswordAction.fulfilled, (state, action) => {
        state.changePasswordLoading = false;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(changePasswordAction.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.error = action.payload || 'Đổi mật khẩu thất bại';
        state.message = state.error;
      });

    // ========== FORGOT PASSWORD ==========
    builder
      .addCase(forgotPasswordAction.pending, (state) => {
        state.error = null;
      })
      .addCase(forgotPasswordAction.fulfilled, (state, action) => {
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(forgotPasswordAction.rejected, (state, action) => {
        state.error = action.payload || 'Gửi email thất bại';
        state.message = state.error;
      });

    // ========== RESET PASSWORD ==========
    builder
      .addCase(resetPasswordAction.pending, (state) => {
        state.error = null;
      })
      .addCase(resetPasswordAction.fulfilled, (state, action) => {
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(resetPasswordAction.rejected, (state, action) => {
        state.error = action.payload || 'Đặt lại mật khẩu thất bại';
        state.message = state.error;
      });

    // ========== UPDATE PROFILE ==========
    builder
      .addCase(updateProfileAction.pending, (state) => {
        state.updateProfileLoading = true;
        state.error = null;
      })
      .addCase(updateProfileAction.fulfilled, (state, action) => {
        state.updateProfileLoading = false;
        if (action.payload.user) {
          state.user = { ...state.user, ...action.payload.user };
        }
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(updateProfileAction.rejected, (state, action) => {
        state.updateProfileLoading = false;
        state.error = action.payload || 'Cập nhật hồ sơ thất bại';
        state.message = state.error;
      });

    // ========== UPLOAD AVATAR ==========
    builder
      .addCase(uploadAvatarAction.pending, (state) => {
        state.uploadAvatarLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatarAction.fulfilled, (state, action) => {
        state.uploadAvatarLoading = false;
        if (action.payload.avatar) {
          state.user = { ...state.user, avatar: action.payload.avatar };
        }
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(uploadAvatarAction.rejected, (state, action) => {
        state.uploadAvatarLoading = false;
        state.error = action.payload || 'Tải lên avatar thất bại';
        state.message = state.error;
      });

    // ========== REMOVE AVATAR ==========
    builder
      .addCase(removeAvatarAction.pending, (state) => {
        state.error = null;
      })
      .addCase(removeAvatarAction.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, avatar: null };
        }
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(removeAvatarAction.rejected, (state, action) => {
        state.error = action.payload || 'Xóa avatar thất bại';
        state.message = state.error;
      });
  },
});

export const { logoutUser, clearError, clearMessage } = authSlice.actions;
export default authSlice.reducer;
