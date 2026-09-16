// screens/employee/announcement/AnnouncementListScreen.jsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import {
  getAnnouncementsApi,
  toggleLikeAnnouncementApi,
} from '../../../api/announcementAPI';
import COLORS from '../../../assets/styles/color';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'general', label: 'Tin tức' },
  { id: 'policy', label: 'Chính sách' },
  { id: 'event', label: 'Sự kiện' },
  { id: 'holiday', label: 'Nghỉ lễ' },
  { id: 'achievement', label: 'Vinh danh' },
  { id: 'urgent', label: 'Khẩn cấp' },
];

const CATEGORY_MAP = {
  general: { label: 'Tin tức', color: '#2563EB', bg: '#EFF6FF' },
  policy: { label: 'Chính sách', color: '#7C3AED', bg: '#EDE9FE' },
  event: { label: 'Sự kiện', color: '#D97706', bg: '#FEF3C7' },
  holiday: { label: 'Nghỉ lễ', color: '#16A34A', bg: '#DCFCE7' },
  achievement: { label: 'Vinh danh', color: '#E11D48', bg: '#FFE4E6' },
  urgent: { label: 'Khẩn cấp', color: '#DC2626', bg: '#FEE2E2' },
};

const AnnouncementListScreen = () => {
  const navigation = useNavigation();
  const currentUserId = useSelector((state) => state.auth?.user?._id);

  const [announcements, setAnnouncements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const res = await getAnnouncementsApi(params);
      if (res?.data) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách bảng tin:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleToggleLike = async (item) => {
    try {
      const res = await toggleLikeAnnouncementApi(item._id);
      if (res?.data) {
        setAnnouncements((prev) =>
          prev.map((a) => {
            if (a._id === item._id) {
              const isNowLiked = res.data.isLiked;
              let newLikes = [...(a.likes || [])];
              if (isNowLiked) {
                newLikes.push(currentUserId);
              } else {
                newLikes = newLikes.filter((uid) => String(uid) !== String(currentUserId));
              }
              return { ...a, likes: newLikes };
            }
            return a;
          }),
        );
      }
    } catch (err) {
      console.error('Lỗi tương tác like:', err);
    }
  };

  const renderItem = ({ item }) => {
    const categoryInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.general;
    const author = item.authorId || {};
    const likesCount = item.likes?.length || 0;
    const commentsCount = item.comments?.length || 0;
    const isLiked = item.likes?.some((uid) => String(uid) === String(currentUserId));

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AnnouncementDetail', { id: item._id, title: item.title })}
      >
        {/* Pinned Tag & Category Row */}
        <View style={styles.cardTopRow}>
          <View style={styles.tagGroup}>
            {item.isPinned ? (
              <View style={styles.pinnedBadge}>
                <MaterialCommunityIcons name="pin" size={12} color="#DC2626" />
                <Text style={styles.pinnedText}>Ghim</Text>
              </View>
            ) : null}
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.bg }]}>
              <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                {categoryInfo.label}
              </Text>
            </View>
          </View>
          <Text style={styles.timeText}>
            {moment(item.createdAt).fromNow()}
          </Text>
        </View>

        {/* Title & Preview Content */}
        <Text style={styles.titleText} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.contentText} numberOfLines={3}>
          {item.content}
        </Text>

        {/* Banner image if available */}
        {item.bannerUrl ? (
          <Image
            source={{ uri: item.bannerUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Author Footer & Social Actions */}
        <View style={styles.cardFooter}>
          <View style={styles.authorBox}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>
                {author.fullName?.charAt(0)?.toUpperCase() || 'W'}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{author.fullName || 'Ban Quản Trị'}</Text>
              <Text style={styles.authorDept}>{author.position || 'Công ty Workly'}</Text>
            </View>
          </View>

          <View style={styles.socialActionRow}>
            {/* Like Button */}
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => {
                if (!isLiked) {
                  handleToggleLike(item);
                }
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? '#EF4444' : '#64748B'}
              />
              <Text style={[styles.socialCount, isLiked && { color: '#EF4444', fontWeight: '700' }]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            {/* Comment Count */}
            <View style={styles.socialBtn}>
              <MaterialCommunityIcons name="comment-text-outline" size={18} color="#64748B" />
              <Text style={styles.socialCount}>{commentsCount}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Bảng Tin Doanh Nghiệp"
        canGoBack
        onBack={() => navigation.goBack()}
      />

      {/* Category Filter Pills */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedCategory(item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main List */}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY || '#2563EB']}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptySubtitle}>Các bài viết và chính sách mới sẽ xuất hiện tại đây</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterList: {
    paddingHorizontal: '16@ms',
  },
  filterPill: {
    paddingHorizontal: '14@ms',
    paddingVertical: '6@vs',
    borderRadius: '16@ms',
    backgroundColor: '#F1F5F9',
    marginRight: '8@ms',
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
  },
  filterPillText: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: '16@ms',
    paddingTop: '12@vs',
    paddingBottom: '36@vs',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '16@ms',
    marginBottom: '12@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
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
    fontSize: '15@ms',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: '20@vs',
    marginBottom: '6@vs',
  },
  contentText: {
    fontSize: '13@ms',
    color: '#475569',
    lineHeight: '18@vs',
    marginBottom: '10@vs',
  },
  bannerImage: {
    width: '100%',
    height: '140@vs',
    borderRadius: '10@ms',
    marginBottom: '12@vs',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10@vs',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  authorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: '32@ms',
    height: '32@ms',
    borderRadius: '16@ms',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8@ms',
  },
  authorAvatarText: {
    fontSize: '13@ms',
    fontWeight: '800',
    color: '#2563EB',
  },
  authorName: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#1E293B',
  },
  authorDept: {
    fontSize: '10@ms',
    color: '#64748B',
  },
  socialActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: '12@ms',
    padding: '4@ms',
  },
  socialCount: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: '#64748B',
    marginLeft: '4@ms',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '80@vs',
  },
  emptyTitle: {
    fontSize: '16@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginTop: '12@vs',
  },
  emptySubtitle: {
    fontSize: '13@ms',
    color: '#94A3B8',
    marginTop: '4@vs',
  },
});

export default AnnouncementListScreen;
