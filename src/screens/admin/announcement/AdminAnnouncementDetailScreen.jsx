// screens/admin/announcement/AdminAnnouncementDetailScreen.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import {
  getAnnouncementDetailApi,
  toggleLikeAnnouncementApi,
  addCommentAnnouncementApi,
} from '../../../api/announcementAPI';
import {
  joinAnnouncementRoom,
  leaveAnnouncementRoom,
  onNewAnnouncementComment,
  onAnnouncementLikeUpdated,
} from '../../../services/socketService';
import COLORS from '../../../assets/styles/color';

const QUICK_REPLY_TEMPLATES = [
  { icon: 'checkbox-marked-circle-outline', text: 'Đã giải quyết vấn đề', full: '✅ Vấn đề này đã được phòng Nhân sự giải quyết.' },
  { icon: 'pin-outline', text: 'Đã ghi nhận ý kiến', full: '📌 Ban Quản Trị đã ghi nhận ý kiến của bạn.' },
  { icon: 'phone-in-talk-outline', text: 'HR sẽ liên hệ', full: '📞 Phòng HR sẽ liên hệ trực tiếp với bạn để hỗ trợ.' },
  { icon: 'book-open-page-variant-outline', text: 'Xem sổ tay nhân viên', full: 'ℹ️ Vui lòng xem thêm quy định chi tiết trong sổ tay nhân viên.' },
];

const CATEGORY_MAP = {
  general: { label: 'Tin tức', color: '#2563EB', bg: '#EFF6FF' },
  policy: { label: 'Chính sách', color: '#7C3AED', bg: '#EDE9FE' },
  event: { label: 'Sự kiện', color: '#D97706', bg: '#FEF3C7' },
  holiday: { label: 'Nghỉ lễ', color: '#16A34A', bg: '#DCFCE7' },
  achievement: { label: 'Vinh danh', color: '#E11D48', bg: '#FFE4E6' },
  urgent: { label: 'Khẩn cấp', color: '#DC2626', bg: '#FEE2E2' },
};

const AdminAnnouncementDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentAdmin = useSelector((state) => state.auth?.user || {});
  const currentAdminId = currentAdmin._id;

  const announcementId = route.params?.id;
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { userName, commentId, snippet }

  const loadDetail = useCallback(async () => {
    if (!announcementId) return;
    try {
      setLoading(true);
      const res = await getAnnouncementDetailApi(announcementId);
      if (res?.data) {
        setAnnouncement(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết bài viết phía admin:', err);
      Alert.alert('Lỗi', 'Không thể tải chi tiết bài viết.');
    } finally {
      setLoading(false);
    }
  }, [announcementId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // ── Lắng nghe sự kiện Socket.IO thời gian thực ──
  useEffect(() => {
    if (!announcementId) return;

    let unsubscribeComment = null;
    let unsubscribeLike = null;

    // await để đảm bảo socket đã kết nối và join room xong
    // trước khi gắn listener, tránh race condition
    const setupSocket = async () => {
      await joinAnnouncementRoom(announcementId);

      unsubscribeComment = onNewAnnouncementComment((data) => {
        if (data?.announcementId === announcementId && data?.comment) {
          setAnnouncement((prev) => {
            if (!prev) return prev;
            const exists = prev.comments?.some((c) => c._id === data.comment._id);
            if (exists) return prev;
            return {
              ...prev,
              comments: [...(prev.comments || []), data.comment],
            };
          });
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }
      });

      unsubscribeLike = onAnnouncementLikeUpdated((data) => {
        if (data?.announcementId === announcementId) {
          setAnnouncement((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              likes: data.likes || prev.likes,
            };
          });
        }
      });
    };

    setupSocket();

    return () => {
      leaveAnnouncementRoom(announcementId);
      if (typeof unsubscribeComment === 'function') unsubscribeComment();
      if (typeof unsubscribeLike === 'function') unsubscribeLike();
    };
  }, [announcementId]);

  const handleToggleLike = async () => {
    if (!announcement) return;
    try {
      const res = await toggleLikeAnnouncementApi(announcement._id);
      if (res?.data) {
        const isNowLiked = res.data.isLiked;
        let newLikes = [...(announcement.likes || [])];
        if (isNowLiked) {
          newLikes.push(currentAdminId);
        } else {
          newLikes = newLikes.filter((uid) => String(uid) !== String(currentAdminId));
        }
        setAnnouncement((prev) => ({ ...prev, likes: newLikes }));
      }
    } catch (err) {
      console.error('Lỗi like:', err);
    }
  };

  const handleStartReply = (user, comment) => {
    const targetName = user.fullName || 'Nhân viên';
    setReplyingTo({
      userName: targetName,
      userId: user._id || null,   // lưu lại để gửi thông báo
      commentId: comment._id,
      snippet: comment.content || '',
    });
    setCommentText(`@${targetName}: `);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleSelectTemplate = (tpl) => {
    if (replyingTo?.userName) {
      setCommentText(`@${replyingTo.userName}: ${tpl.full}`);
    } else {
      setCommentText(tpl.full);
    }
    inputRef.current?.focus();
  };

  const handleSendAdminComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSendingComment(true);
      const res = await addCommentAnnouncementApi(
        announcement._id,
        commentText.trim(),
        replyingTo?.commentId || null,      // parentCommentId
        replyingTo?.userId || null,          // mentionedUserId → server gửi thông báo cho nhân viên
      );
      if (res?.data?.comments) {
        setAnnouncement((prev) => ({
          ...prev,
          comments: res.data.comments,
        }));
        setCommentText('');
        setReplyingTo(null);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể gửi phản hồi.');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Quản Lý Bài Viết" canGoBack onBack={() => navigation.goBack()} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!announcement) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Quản Lý Bài Viết" canGoBack onBack={() => navigation.goBack()} />
        <View style={styles.centerLoading}>
          <Text style={styles.notFoundText}>Không tìm thấy bài viết hoặc bài viết đã bị xóa.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = CATEGORY_MAP[announcement.category] || CATEGORY_MAP.general;
  const author = announcement.authorId || {};
  const likesCount = announcement.likes?.length || 0;
  const comments = announcement.comments || [];
  const isLiked = announcement.likes?.some((uid) => String(uid) === String(currentAdminId));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Quản Lý & Phản Hồi Bảng Tin"
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Category Tag */}
          <View style={styles.topRow}>
            <View style={styles.tagGroup}>
              {announcement.isPinned ? (
                <View style={styles.pinnedBadge}>
                  <MaterialCommunityIcons name="pin" size={12} color="#DC2626" />
                  <Text style={styles.pinnedText}>Đã Ghim</Text>
                </View>
              ) : null}
              <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.bg }]}>
                <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                  {categoryInfo.label}
                </Text>
              </View>
            </View>
            <Text style={styles.timeText}>
              {moment(announcement.createdAt).format('HH:mm · DD/MM/YYYY')}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{announcement.title}</Text>

          {/* Author Details */}
          <View style={styles.authorBar}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>
                {author.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{author.fullName || 'Ban Quản Trị'}</Text>
                <View style={styles.adminPill}>
                  <Text style={styles.adminPillText}>TÁC GIẢ</Text>
                </View>
              </View>
              <Text style={styles.authorPosition}>
                {author.position || 'Quản lý'} • {author.department || 'Ban Điều Hành'}
              </Text>
            </View>
          </View>

          {/* Optional Banner Image */}
          {announcement.bannerUrl ? (
            <Image
              source={{ uri: announcement.bannerUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : null}

          {/* Article Content */}
          <View style={styles.contentCard}>
            <Text style={styles.mainContentText}>{announcement.content}</Text>
          </View>

          {/* Stats Bar */}
          <View style={styles.interactionRow}>
            <TouchableOpacity
              style={[styles.likeButton, isLiked && styles.likeButtonActive]}
              onPress={handleToggleLike}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? '#EF4444' : '#64748B'}
              />
              <Text style={[styles.likeButtonText, isLiked && styles.likeButtonTextActive]}>
                {likesCount} lượt thích
              </Text>
            </TouchableOpacity>

            <View style={styles.commentCountBadge}>
              <MaterialCommunityIcons name="comment-text-multiple" size={18} color="#2563EB" />
              <Text style={styles.commentCountText}>{comments.length} câu hỏi & bình luận</Text>
            </View>
          </View>

          {/* Comments Stream */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeaderRow}>
              <Text style={styles.commentsSectionTitle}>
                Thảo luận từ nhân viên ({comments.length})
              </Text>
            </View>

            {comments.length === 0 ? (
              <View style={styles.emptyCommentsBox}>
                <MaterialCommunityIcons name="comment-text-outline" size={48} color="#CBD5E1" />
                <Text style={styles.noCommentsText}>
                  Chưa có bình luận nào từ nhân viên cho bài viết này.
                </Text>
              </View>
            ) : (
              comments.map((c, idx) => {
                const cUser = c.userId || {};
                const isCommentAdmin = cUser.role === 'admin';

                return (
                  <View key={c._id || idx} style={styles.commentItem}>
                    <View style={[styles.commentAvatar, isCommentAdmin && styles.commentAvatarAdmin]}>
                      <Text style={[styles.commentAvatarText, isCommentAdmin && styles.commentAvatarTextAdmin]}>
                        {cUser.fullName?.charAt(0)?.toUpperCase() || 'E'}
                      </Text>
                    </View>

                    <View style={[styles.commentBubble, isCommentAdmin && styles.commentBubbleAdmin]}>
                      <View style={styles.commentTopRow}>
                        <View style={styles.commentUserRow}>
                          <Text style={styles.commentUserName}>{cUser.fullName || 'Nhân viên'}</Text>
                          {isCommentAdmin ? (
                            <View style={styles.commentAdminBadge}>
                              <MaterialCommunityIcons name="shield-check" size={10} color="#D97706" />
                              <Text style={styles.commentAdminBadgeText}>ADMIN TRẢ LỜI</Text>
                            </View>
                          ) : (
                            <Text style={styles.commentDeptText}>({cUser.department || 'Nhân viên'})</Text>
                          )}
                        </View>
                        <Text style={styles.commentTime}>{moment(c.createdAt).fromNow()}</Text>
                      </View>

                      <Text style={styles.commentBodyText}>{c.content}</Text>

                      {/* Reply button */}
                      <View style={styles.commentFooterRow}>
                        <TouchableOpacity
                          style={styles.replyActionBtn}
                          onPress={() => handleStartReply(cUser, c)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="reply" size={14} color="#2563EB" />
                          <Text style={styles.replyActionText}>Trả lời chính thức</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* ── GIAO DIỆN TRẢ LỜI MỚI (REDESIGNED REPLY DOCK + SOCKET REAL-TIME) ── */}
        <View style={styles.replyDockContainer}>
          {/* Quick Template Chips Bar (Floating Horizontally) */}
          <View style={styles.templateScrollContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateList}>
              <View style={styles.templateLeadBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color="#D97706" />
                <Text style={styles.templateLeadText}>Mẫu trả lời:</Text>
              </View>
              {QUICK_REPLY_TEMPLATES.map((tpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.templateChip}
                  onPress={() => handleSelectTemplate(tpl)}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons name={tpl.icon} size={14} color="#2563EB" />
                  <Text style={styles.templateChipText}>{tpl.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Contextual Reply Pill Banner */}
          {replyingTo && (
            <View style={styles.replyCard}>
              <View style={styles.replyLeftBar} />
              <View style={styles.replyContentBox}>
                <View style={styles.replyHeaderRow}>
                  <MaterialCommunityIcons name="reply-all" size={14} color="#D97706" />
                  <Text style={styles.replyingLabel}>
                    Đang phản hồi cho <Text style={styles.replyingName}>@{replyingTo.userName}</Text>
                  </Text>
                </View>
                <Text style={styles.replySnippet} numberOfLines={1}>
                  "{replyingTo.snippet || 'Câu hỏi từ nhân viên...'}"
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancelReply} style={styles.closeReplyBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input & Send Action Bar */}
          <View style={styles.inputBarContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.commentInput}
                placeholder={
                  replyingTo
                    ? `Phản hồi cho @${replyingTo.userName}...`
                    : 'Phản hồi với tư cách Ban Quản Trị...'
                }
                placeholderTextColor="#94A3B8"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, (!commentText.trim() || sendingComment) && styles.sendBtnDisabled]}
              onPress={handleSendAdminComment}
              disabled={!commentText.trim() || sendingComment}
              activeOpacity={0.85}
            >
              {sendingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20@ms',
  },
  notFoundText: {
    fontSize: '14@ms',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: '16@ms',
    paddingTop: '12@vs',
    paddingBottom: '24@vs',
  },
  adminBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: '8@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  adminBadgeText: {
    fontSize: '10@ms',
    fontWeight: '800',
    color: '#D97706',
    marginLeft: '4@ms',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: '6@ms',
    paddingVertical: '2@vs',
    borderRadius: '6@ms',
    marginRight: '6@ms',
  },
  pinnedText: {
    fontSize: '10@ms',
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: '2@ms',
  },
  categoryBadge: {
    paddingHorizontal: '8@ms',
    paddingVertical: '2@vs',
    borderRadius: '6@ms',
  },
  categoryText: {
    fontSize: '11@ms',
    fontWeight: '700',
  },
  timeText: {
    fontSize: '11@ms',
    color: '#94A3B8',
  },
  titleText: {
    fontSize: '18@ms',
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: '24@vs',
    marginBottom: '12@vs',
  },
  authorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12@ms',
    padding: '10@ms',
    marginBottom: '14@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  authorAvatar: {
    width: '38@ms',
    height: '38@ms',
    borderRadius: '19@ms',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10@ms',
  },
  authorAvatarText: {
    fontSize: '15@ms',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  adminPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: '4@ms',
    paddingVertical: '1@vs',
    borderRadius: '4@ms',
    marginLeft: '6@ms',
  },
  adminPillText: {
    fontSize: '8.5@ms',
    fontWeight: '800',
    color: '#2563EB',
  },
  authorPosition: {
    fontSize: '11@ms',
    color: '#64748B',
    marginTop: '1@vs',
  },
  bannerImage: {
    width: '100%',
    height: '180@vs',
    borderRadius: '14@ms',
    marginBottom: '14@vs',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: '14@vs',
  },
  mainContentText: {
    fontSize: '14@ms',
    color: '#334155',
    lineHeight: '22@vs',
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12@ms',
    padding: '10@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: '16@vs',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: '12@ms',
    paddingVertical: '6@vs',
    borderRadius: '8@ms',
  },
  likeButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  likeButtonText: {
    fontSize: '12@ms',
    color: '#64748B',
    fontWeight: '600',
    marginLeft: '6@ms',
  },
  likeButtonTextActive: {
    color: '#EF4444',
    fontWeight: '700',
  },
  commentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: '6@ms',
  },
  commentCountText: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: '6@ms',
  },
  commentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: '10@vs',
  },
  commentsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  commentsSectionTitle: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyCommentsBox: {
    alignItems: 'center',
    paddingVertical: '24@vs',
  },
  noCommentsText: {
    fontSize: '12@ms',
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '8@vs',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: '12@vs',
  },
  commentAvatar: {
    width: '34@ms',
    height: '34@ms',
    borderRadius: '17@ms',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8@ms',
  },
  commentAvatarAdmin: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  commentAvatarText: {
    fontSize: '13@ms',
    fontWeight: '800',
    color: '#2563EB',
  },
  commentAvatarTextAdmin: {
    color: '#D97706',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: '12@ms',
    padding: '10@ms',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  commentBubbleAdmin: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
  },
  commentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUserName: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#1E293B',
  },
  commentDeptText: {
    fontSize: '11@ms',
    color: '#64748B',
    marginLeft: '4@ms',
  },
  commentAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: '4@ms',
    paddingVertical: '1@vs',
    borderRadius: '4@ms',
    marginLeft: '6@ms',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  commentAdminBadgeText: {
    fontSize: '8@ms',
    fontWeight: '800',
    color: '#D97706',
    marginLeft: '2@ms',
  },
  commentTime: {
    fontSize: '10@ms',
    color: '#94A3B8',
  },
  commentBodyText: {
    fontSize: '13@ms',
    color: '#334155',
    lineHeight: '18@vs',
  },
  commentFooterRow: {
    flexDirection: 'row',
    marginTop: '6@vs',
  },
  replyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '2@vs',
    paddingHorizontal: '4@ms',
  },
  replyActionText: {
    fontSize: '11@ms',
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: '3@ms',
  },

  /* ── REDESIGNED REPLY DOCK ── */
  replyDockContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  templateScrollContainer: {
    backgroundColor: '#F8FAFC',
    paddingVertical: '6@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  templateList: {
    paddingHorizontal: '12@ms',
    alignItems: 'center',
  },
  templateLeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: '6@ms',
  },
  templateLeadText: {
    fontSize: '11@ms',
    fontWeight: '700',
    color: '#92400E',
    marginLeft: '2@ms',
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: '16@ms',
    paddingHorizontal: '10@ms',
    paddingVertical: '4@vs',
    marginRight: '6@ms',
  },
  templateChipText: {
    fontSize: '11@ms',
    fontWeight: '600',
    color: '#1D4ED8',
    marginLeft: '4@ms',
  },
  replyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: '12@ms',
    paddingVertical: '6@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  replyLeftBar: {
    width: '3@ms',
    height: '28@vs',
    borderRadius: '2@ms',
    backgroundColor: '#D97706',
    marginRight: '8@ms',
  },
  replyContentBox: {
    flex: 1,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyingLabel: {
    fontSize: '11@ms',
    color: '#92400E',
    marginLeft: '4@ms',
  },
  replyingName: {
    fontWeight: '800',
    color: '#B45309',
  },
  replySnippet: {
    fontSize: '11@ms',
    color: '#78350F',
    marginTop: '1@vs',
    fontStyle: 'italic',
  },
  closeReplyBtn: {
    padding: '4@ms',
    borderRadius: '12@ms',
    backgroundColor: '#FEF3C7',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '12@ms',
    paddingVertical: '8@vs',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: '22@ms',
    paddingHorizontal: '14@ms',
    paddingVertical: Platform.OS === 'ios' ? '8@vs' : '4@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: '8@ms',
  },
  commentInput: {
    fontSize: '13@ms',
    color: '#0F172A',
    maxHeight: '80@vs',
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: '40@ms',
    height: '40@ms',
    borderRadius: '20@ms',
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default AdminAnnouncementDetailScreen;
