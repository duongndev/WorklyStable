import { createSlice } from '@reduxjs/toolkit';
import {
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
  getUnreadCountAction,
} from './notificationAction';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    message: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      limit: 20,
    },
  },
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    clearNotificationMessage: (state) => {
      state.message = null;
    },
    markReadLocal: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.map((item) =>
        item._id === id ? { ...item, isRead: true } : item
      );
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    markAllReadLocal: (state) => {
      state.notifications = state.notifications.map((item) => ({ ...item, isRead: true }));
      state.unreadCount = 0;
    },
    addIncomingNotification: (state, action) => {
      state.notifications = [action.payload, ...state.notifications];
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Get Notifications ──
      .addCase(getNotificationsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotificationsAction.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload.data || {};
        const list = Array.isArray(payload)
          ? payload
          : (payload.notifications || payload.data || []);
        
        state.notifications = list;
        state.unreadCount =
          typeof payload.unreadCount === 'number'
            ? payload.unreadCount
            : list.filter((item) => !item.isRead).length;

        const pag = payload.pagination || action.payload.pagination;
        if (pag) {
          state.pagination = {
            currentPage: pag.page || pag.currentPage || 1,
            totalPages: pag.totalPages || 1,
            totalItems: pag.total || pag.totalItems || list.length,
            limit: pag.limit || 20,
          };
        }
      })
      .addCase(getNotificationsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Get Unread Count ──
      .addCase(getUnreadCountAction.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count;
      })

      // ── Mark As Read ──
      .addCase(markAsReadAction.fulfilled, (state, action) => {
        state.notifications = state.notifications.map((item) =>
          item._id === action.payload.id ? { ...item, isRead: true } : item
        );
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })

      // ── Mark All As Read ──
      .addCase(markAllAsReadAction.fulfilled, (state) => {
        state.notifications = state.notifications.map((item) => ({ ...item, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export const {
  clearNotificationError,
  clearNotificationMessage,
  markReadLocal,
  markAllReadLocal,
  addIncomingNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;