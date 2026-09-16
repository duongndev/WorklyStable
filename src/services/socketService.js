import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import { getAccessToken } from './storageService';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

let socket = null;

/**
 * =========================================================================
 * WORKLY REAL-TIME SOCKET SERVICE (BÌNH LUẬN & THÍCH BẢNG TIN THỜI GIAN THỰC)
 * =========================================================================
 *
 * SERVER EVENT NAMES (PHẢI KHỚP CHÍNH XÁC):
 *   - join:    "join_announcement"         (client → server)
 *   - leave:   "leave_announcement"        (client → server)
 *   - comment: "announcement_new_comment"  (server → client)
 *   - like:    "announcement_like_updated" (server → client)
 */

export const getSocket = async () => {
  if (!socket || !socket.connected) {
    const token = await getAccessToken();
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: token ? `Bearer ${token}` : '',
      },
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.log('⚡ Socket error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ Socket disconnected:', reason);
    });
  }
  return socket;
};

/**
 * Tham gia phòng trao đổi của một bài viết
 * Server lắng nghe event: "join_announcement" với payload là announcementId (string)
 * @param {string} announcementId
 */
export const joinAnnouncementRoom = async (announcementId) => {
  if (!announcementId) return;
  const s = await getSocket();
  // Server: socket.on("join_announcement", (announcementId) => { ... })
  s.emit('join_announcement', announcementId);
};

/**
 * Rời phòng trao đổi của một bài viết
 * Server lắng nghe event: "leave_announcement" với payload là announcementId (string)
 * @param {string} announcementId
 */
export const leaveAnnouncementRoom = async (announcementId) => {
  if (!announcementId) return;
  if (socket && socket.connected) {
    // Server: socket.on("leave_announcement", (announcementId) => { ... })
    socket.emit('leave_announcement', announcementId);
  }
};

/**
 * Lắng nghe sự kiện có bình luận/phản hồi mới theo thời gian thực
 * Server phát event: "announcement_new_comment" → { announcementId, comment, totalComments }
 * @param {Function} callback
 */
export const onNewAnnouncementComment = (callback) => {
  if (!socket) return () => {};
  const handler = (data) => {
    if (typeof callback === 'function') callback(data);
  };
  socket.on('announcement_new_comment', handler);
  return () => {
    socket.off('announcement_new_comment', handler);
  };
};

/**
 * Lắng nghe sự kiện có người thả tim / like bài viết theo thời gian thực
 * Server phát event: "announcement_like_updated" → { announcementId, userId, userName, isLiked, totalLikes, likes }
 * @param {Function} callback
 */
export const onAnnouncementLikeUpdated = (callback) => {
  if (!socket) return () => {};
  const handler = (data) => {
    if (typeof callback === 'function') callback(data);
  };
  socket.on('announcement_like_updated', handler);
  return () => {
    socket.off('announcement_like_updated', handler);
  };
};

/**
 * Đóng kết nối socket khi đăng xuất
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
