// components/employee/home/NewsFeed.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import SectionHeader from './SectionHeader';
import {
  getAnnouncementsApi,
  toggleLikeAnnouncementApi,
} from '../../../api/announcementAPI';

const MAX_ITEMS = 3;

const CATEGORY_MAP = {
  general: { label: 'Tin tức', color: '#2563EB', bg: '#EFF6FF' },
  policy: { label: 'Chính sách', color: '#7C3AED', bg: '#EDE9FE' },
  event: { label: 'Sự kiện', color: '#D97706', bg: '#FEF3C7' },
  holiday: { label: 'Nghỉ lễ', color: '#16A34A', bg: '#DCFCE7' },
  achievement: { label: 'Vinh danh', color: '#E11D48', bg: '#FFE4E6' },
  urgent: { label: 'Khẩn cấp', color: '#DC2626', bg: '#FEE2E2' },
};

const NewsFeed = ({ onSeeAll, refreshToken = 0, limit = 4 }) => {
  const navigation = useNavigation();
  const currentUserId = useSelector((state) => state.auth?.user?._id);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Skeleton loading pulse animation
  const skeletonAnim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonAnim, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [skeletonAnim]);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const res = await getAnnouncementsApi({ page: 1, limit });
      if (res?.data) {
        setItems(res.data.announcements || []);
      }
    } catch (err) {
      console.error('Lỗi tải bảng tin trên màn hình chính:', err);
      setError('Không thể tải bảng tin.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Nạp lại dữ liệu mỗi khi màn hình Home được focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Nạp lại khi kéo thả làm mới ở màn hình cha
  useEffect(() => {
    if (refreshToken > 0) {
      loadData();
    }
  }, [refreshToken, loadData]);

  const handleToggleLike = async (item) => {
    try {
      const res = await toggleLikeAnnouncementApi(item._id);
      if (res?.data) {
        const isNowLiked = res.data.isLiked;
        setItems((prev) =>
          prev.map((a) => {
            if (a._id !== item._id) return a;
            let likes = [...(a.likes || [])];
            if (isNowLiked) {
              likes.push(currentUserId);
            } else {
              likes = likes.filter((uid) => String(uid) !== String(currentUserId));
            }
            return { ...a, likes };
          }),
        );
      }
    } catch (err) {
      console.error('Lỗi tương tác like trên màn hình chính:', err);
    }
  };

  const openDetail = (item) => {
    navigation.navigate('AnnouncementDetail', { id: item._id, title: item.title });
  };

  const getAuthor = (item) => {
    const author = item.authorId && typeof item.authorId === 'object' ? item.authorId : {};
    return {
      name: author.fullName || 'Ban Quản Trị',
      sub: author.position || 'Công ty Workly',
    };
  };

  const renderMeta = (item, categoryInfo) => (
    <View style={styles.metaRow}>
      <View style={styles.badgeGroup}>
        {item.isPinned ? (
          <View style={styles.pinnedBadge}>
            <MaterialCommunityIcons name="pin" size={11} color="#DC2626" />
            <Text style={styles.pinnedText}>Ghim</Text>
          </View>
        ) : null}
        <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.bg }]}>
          <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
            {categoryInfo.label}
          </Text>
        </View>
      </View>
      <Text style={styles.timeText}>{moment(item.createdAt).fromNow()}</Text>
    </View>
  );

  const renderFooter = (item) => {
    const author = getAuthor(item);
    const likesCount = item.likes?.length || 0;
    const commentsCount = item.comments?.length || 0;
    const isLiked = item.likes?.some((uid) => String(uid) === String(currentUserId));

    return (
      <View style={styles.footerRow}>
        <View style={styles.authorBox}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>{author.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName} numberOfLines={1}>
              {author.name}
            </Text>
            <Text style={styles.authorSub} numberOfLines={1}>
              {author.sub}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => handleToggleLike(item)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialCommunityIcons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={17}
            color={isLiked ? '#EF4444' : '#94A3B8'}
          />
          <Text style={[styles.socialCount, isLiked && styles.likedCount]}>{likesCount}</Text>
        </TouchableOpacity>

        <View style={styles.socialBtn}>
          <MaterialCommunityIcons name="comment-text-outline" size={16} color="#94A3B8" />
          <Text style={styles.socialCount}>{commentsCount}</Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={18} color="#CBD5E1" />
      </View>
    );
  };

  const renderItem = (item, index) => {
    const categoryInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.general;
    const isFeatured = index === 0 && item.bannerUrl;

    if (isFeatured) {
      return (
        <TouchableOpacity
          key={item._id}
          style={styles.featuredBlock}
          onPress={() => openDetail(item)}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: item.bannerUrl }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
          {renderMeta(item, categoryInfo)}
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.featuredPreview} numberOfLines={2}>
            {item.content}
          </Text>
          {renderFooter(item)}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item._id}
        style={[styles.rowBlock, index > 0 && styles.rowDivider]}
        onPress={() => openDetail(item)}
        activeOpacity={0.85}
      >
        {renderMeta(item, categoryInfo)}
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowPreview} numberOfLines={2}>
          {item.content}
        </Text>
        {renderFooter(item)}
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <Animated.View style={[styles.skeletonCard, { opacity: skeletonAnim }]}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.skeletonBlock, i > 0 && styles.skeletonDivider]}>
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
        </View>
      ))}
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.stateCard}>
      <View style={styles.stateIconBox}>
        <MaterialCommunityIcons name="newspaper-variant-outline" size={30} color="#94A3B8" />
      </View>
      <Text style={styles.stateTitle}>Chưa có bài viết mới</Text>
      <Text style={styles.stateSub}>
        Thông báo, chính sách và sự kiện nội bộ sẽ xuất hiện tại đây
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.stateCard}>
      <View style={styles.stateIconBox}>
        <MaterialCommunityIcons name="cloud-alert-outline" size={30} color="#F59E0B" />
      </View>
      <Text style={styles.stateTitle}>{error || 'Không thể tải bảng tin'}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
        <MaterialCommunityIcons name="refresh" size={16} color="#2563EB" />
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  let content;
  if (loading && items.length === 0) {
    content = renderSkeleton();
  } else if (error && items.length === 0) {
    content = renderError();
  } else if (items.length === 0) {
    content = renderEmpty();
  } else {
    content = (
      <View style={styles.feedCard}>
        {items.slice(0, MAX_ITEMS).map((item, index) => renderItem(item, index))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader title="Bảng tin nội bộ" action="Xem tất cả" onAction={onSeeAll} />
      {content}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    marginBottom: '6@vs',
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: '16@ms',
    paddingVertical: '6@vs',
    marginBottom: '12@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Featured (bài nổi bật có ảnh banner) ──
  featuredBlock: {
    paddingVertical: '10@vs',
  },
  featuredImage: {
    width: '100%',
    height: '150@vs',
    borderRadius: '14@ms',
    marginBottom: '10@vs',
    backgroundColor: '#E2E8F0',
  },
  featuredTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: '21@vs',
    marginBottom: '4@vs',
  },
  featuredPreview: {
    fontSize: '13@ms',
    color: '#64748B',
    lineHeight: '18@vs',
  },

  // ── Compact row (các bài còn lại) ──
  rowBlock: {
    paddingVertical: '12@vs',
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowTitle: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: '19@vs',
    marginBottom: '3@vs',
  },
  rowPreview: {
    fontSize: '12.5@ms',
    color: '#64748B',
    lineHeight: '17@vs',
  },

  // ── Meta row (badge + thời gian) ──
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6@vs',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: '8@ms',
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
    fontSize: '10.5@ms',
    fontWeight: '700',
  },
  timeText: {
    fontSize: '10.5@ms',
    color: '#94A3B8',
  },

  // ── Footer (tác giả + like/comment) ──
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '8@vs',
  },
  authorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: '30@ms',
    height: '30@ms',
    borderRadius: '15@ms',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8@ms',
  },
  authorAvatarText: {
    fontSize: '12@ms',
    fontWeight: '800',
    color: '#2563EB',
  },
  authorInfo: {
    flex: 1,
    paddingRight: '6@ms',
  },
  authorName: {
    fontSize: '11@ms',
    fontWeight: '700',
    color: '#1E293B',
  },
  authorSub: {
    fontSize: '9.5@ms',
    color: '#94A3B8',
    marginTop: '1@vs',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: '10@ms',
    padding: '2@ms',
  },
  socialCount: {
    fontSize: '11@ms',
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: '3@ms',
  },
  likedCount: {
    color: '#EF4444',
    fontWeight: '700',
  },

  // ── Skeleton loading ──
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: '16@ms',
    paddingVertical: '6@vs',
    marginBottom: '12@vs',
  },
  skeletonBlock: {
    paddingVertical: '12@vs',
  },
  skeletonDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  skeletonBadge: {
    width: '70@ms',
    height: '16@vs',
    borderRadius: '6@ms',
    backgroundColor: '#F1F5F9',
    marginBottom: '8@vs',
  },
  skeletonLineWide: {
    width: '90%',
    height: '14@vs',
    borderRadius: '4@ms',
    backgroundColor: '#F1F5F9',
    marginBottom: '6@vs',
  },
  skeletonLine: {
    width: '75%',
    height: '12@vs',
    borderRadius: '4@ms',
    backgroundColor: '#F1F5F9',
    marginBottom: '8@vs',
  },
  skeletonLineShort: {
    width: '45%',
    height: '10@vs',
    borderRadius: '4@ms',
    backgroundColor: '#F1F5F9',
  },

  // ── Empty / Error state ──
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: '22@vs',
    paddingHorizontal: '16@ms',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  stateIconBox: {
    width: '52@ms',
    height: '52@ms',
    borderRadius: '26@ms',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8@vs',
  },
  stateTitle: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#334155',
  },
  stateSub: {
    fontSize: '11@ms',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: '3@vs',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: '14@ms',
    paddingVertical: '6@vs',
    borderRadius: '8@ms',
    marginTop: '10@vs',
  },
  retryText: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: '4@ms',
  },
});

export default NewsFeed;