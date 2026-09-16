// screens/employee/notification/NotificationScreen.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/vi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
  getUnreadCountAction,
} from '../../../redux/notification/notificationAction';
import {
  markReadLocal,
  markAllReadLocal,
} from '../../../redux/notification/notificationSlice';
import COLORS from '../../../assets/styles/color';

// ─── Type mapping ─────────────────────────────────────────────────────────────
const NOTIFICATION_TYPES = {
  leave: { label: 'Nghỉ phép', color: '#3B82F6', icon: 'beach-outline' },
  LEAVE_REQUEST_APPROVED: { label: 'Nghỉ phép', color: '#3B82F6', icon: 'beach-outline' },
  LEAVE_REQUEST_REJECTED: { label: 'Nghỉ phép', color: '#EF4444', icon: 'beach-outline' },
  overtime: { label: 'Tăng ca', color: '#F59E0B', icon: 'time-outline' },
  OVERTIME_APPROVED: { label: 'Tăng ca', color: '#F59E0B', icon: 'time-outline' },
  OVERTIME_REJECTED: { label: 'Tăng ca', color: '#EF4444', icon: 'time-outline' },
  regularization: { label: 'Bù công', color: '#14B8A6', icon: 'clipboard-check-outline' },
  attendance: { label: 'Chấm công', color: '#10B981', icon: 'finger-print-outline' },
  ATTENDANCE_REMINDER: { label: 'Chấm công', color: '#10B981', icon: 'finger-print-outline' },
  ATTENDANCE_CHECKIN: { label: 'Chấm công', color: '#10B981', icon: 'finger-print-outline' },
  ATTENDANCE_CHECKOUT: { label: 'Chấm công', color: '#10B981', icon: 'finger-print-outline' },
  payslip: { label: 'Bảng lương', color: '#8B5CF6', icon: 'cash-outline' },
  SALARY_PAID: { label: 'Bảng lương', color: '#8B5CF6', icon: 'cash-outline' },
  announcement: { label: 'Bảng tin', color: '#6366F1', icon: 'megaphone-outline' },
  ANNOUNCEMENT: { label: 'Bảng tin', color: '#6366F1', icon: 'megaphone-outline' },
  system: { label: 'Hệ thống', color: '#64748B', icon: 'information-circle-outline' },
  general: { label: 'Thông báo', color: '#0EA5E9', icon: 'notifications-outline' },
  reminder: { label: 'Nhắc nhở', color: '#EF4444', icon: 'alert-circle-outline' },
};

const getTypeInfo = (type) => {
  if (!type) return NOTIFICATION_TYPES.general;
  const key = String(type).toLowerCase();
  return NOTIFICATION_TYPES[key] || NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.general;
};

// ─── Separator Component ──────────────────────────────────────────────────────
const Separator = () => <View style={styles.separator} />;

// ─── Notification Card ────────────────────────────────────────────────────────
const NotificationCard = ({ item, onPress, onMarkRead }) => {
  const typeInfo = getTypeInfo(item.type);
  const timeAgo = moment(item.createdAt).locale('vi').fromNow();

  return (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: typeInfo.color + '15' }]}>
          <Ionicons name={typeInfo.icon} size={22} color={typeInfo.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.cardBody} numberOfLines={2}>
            {item.content || item.body}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardTime}>{timeAgo}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '15' }]}>
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                {typeInfo.label}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {!item.isRead && (
        <TouchableOpacity
          style={styles.unreadDot}
          onPress={() => onMarkRead?.(item._id)}
          activeOpacity={0.7}
        >
          <View style={styles.dot} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ─── Filter Button ────────────────────────────────────────────────────────────
const FilterButton = ({ type, label, filterType, unreadCount, onPress }) => (
  <TouchableOpacity
    style={[styles.filterBtn, filterType === type && styles.filterBtnActive]}
    onPress={() => onPress(type)}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
      {label}
    </Text>
    {type === 'unread' && unreadCount > 0 && (
      <View style={styles.filterBadge}>
        <Text style={styles.filterBadgeText}>{unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const NotificationScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const {
    notifications = [],
    unreadCount = 0,
    loading = false,
    pagination,
  } = useSelector((state) => state.notification || {});

  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredData = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    if (filterType === 'all') return notifications;
    if (filterType === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => n.isRead);
  }, [notifications, filterType]);

  useEffect(() => {
    dispatch(getNotificationsAction({ page: 1 }));
    dispatch(getUnreadCountAction());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getNotificationsAction({ page: 1 })).unwrap().catch(() => {});
    await dispatch(getUnreadCountAction()).unwrap().catch(() => {});
    setRefreshing(false);
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    if (pagination?.totalPages > pagination?.currentPage && !loading) {
      dispatch(getNotificationsAction({ page: (pagination?.currentPage || 1) + 1 }));
    }
  }, [dispatch, pagination, loading]);

  const handleMarkRead = useCallback(
    (id) => {
      dispatch(markReadLocal(id));
      dispatch(markAsReadAction(id));
    },
    [dispatch],
  );

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount === 0) {
      Alert.alert('Thông báo', 'Bạn không có thông báo chưa đọc.');
      return;
    }
    Alert.alert(
      'Đánh dấu tất cả đã đọc',
      `Bạn có ${unreadCount} thông báo chưa đọc. Đánh dấu tất cả đã đọc?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đánh dấu',
          onPress: () => {
            dispatch(markAllReadLocal());
            dispatch(markAllAsReadAction());
          },
        },
      ],
      { cancelable: true },
    );
  }, [unreadCount, dispatch]);

  // Helper điều hướng theo type và data payload
  const navigateByType = useCallback(
    (item) => {
      const type = String(item.type || '').toLowerCase();
      const data = item.data || {};
      const refId = item.referenceId || data.referenceId || data.leaveId || data.id;

      // ── Thông báo bảng tin: có announcementId trong data ──
      const announcementId = data.announcementId;
      if (announcementId) {
        navigation.navigate('AnnouncementDetail', { id: announcementId });
        return;
      }

      // ── Nhớ phép ──
      if (type.includes('leave')) {
        if (refId) {
          navigation.navigate('LeaveDetail', { id: refId });
        } else {
          navigation.navigate('Leave');
        }
      // ── Tăng ca ──
      } else if (type.includes('overtime') || type.includes('ot')) {
        if (refId) {
          navigation.navigate('OvertimeDetail', { id: refId });
        } else {
          navigation.navigate('Overtime');
        }
      // ── Chấm công / Bu công ──
      } else if (type.includes('attendance') || type.includes('regularization')) {
        navigation.navigate('Attendance');
      // ── Bảng lương ──
      } else if (type.includes('payslip') || type.includes('salary')) {
        navigation.navigate('Salary');
      // ── Announcement không có announcementId ──
      } else if (type.includes('announcement')) {
        navigation.navigate('Announcement');
      }
    },
    [navigation],
  );

  const handlePressNotification = useCallback(
    (item) => {
      if (!item.isRead) {
        handleMarkRead(item._id);
      }
      navigateByType(item);
    },
    [handleMarkRead, navigateByType],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
        <Text style={styles.emptyText}>
          {filterType === 'unread'
            ? 'Không có thông báo chưa đọc nào'
            : 'Bạn chưa có thông báo nào'}
        </Text>
      </View>
    ),
    [filterType],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Thông báo"
        canGoBack
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Ionicons name="checkmark-done" size={20} color={COLORS.PRIMARY || '#2563EB'} />
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.filterRow}>
        <FilterButton
          type="all"
          label="Tất cả"
          filterType={filterType}
          unreadCount={unreadCount}
          onPress={setFilterType}
        />
        <FilterButton
          type="unread"
          label="Chưa đọc"
          filterType={filterType}
          unreadCount={unreadCount}
          onPress={setFilterType}
        />
        <FilterButton
          type="read"
          label="Đã đọc"
          filterType={filterType}
          unreadCount={unreadCount}
          onPress={setFilterType}
        />
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item._id || String(Math.random())}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            onPress={handlePressNotification}
            onMarkRead={handleMarkRead}
          />
        )}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY || '#2563EB']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!loading ? renderEmpty : null}
      />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: '16@ms',
    paddingVertical: '10@vs',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '12@ms',
    paddingVertical: '6@vs',
    borderRadius: '20@ms',
    backgroundColor: '#F1F5F9',
    marginRight: '8@ms',
  },
  filterBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: '13@ms',
    color: '#64748B',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    borderRadius: '10@ms',
    paddingHorizontal: '6@ms',
    paddingVertical: '1@vs',
    marginLeft: '4@ms',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: '10@ms',
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: '8@vs',
  },
  separator: {
    height: '6@vs',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: '16@ms',
    paddingVertical: '12@vs',
    marginHorizontal: '12@ms',
    borderRadius: '12@ms',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardUnread: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: '42@ms',
    height: '42@ms',
    borderRadius: '21@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@ms',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '14@ms',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '2@vs',
  },
  cardTitleUnread: {
    color: '#0F172A',
    fontWeight: '700',
  },
  cardBody: {
    fontSize: '12@ms',
    color: '#64748B',
    lineHeight: '18@vs',
    marginBottom: '6@vs',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTime: {
    fontSize: '11@ms',
    color: '#94A3B8',
  },
  typeBadge: {
    paddingHorizontal: '8@ms',
    paddingVertical: '2@vs',
    borderRadius: '6@ms',
  },
  typeBadgeText: {
    fontSize: '10@ms',
    fontWeight: '600',
  },
  unreadDot: {
    padding: '6@ms',
    marginLeft: '6@ms',
  },
  dot: {
    width: '8@ms',
    height: '8@ms',
    borderRadius: '4@ms',
    backgroundColor: '#2563EB',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '60@vs',
  },
  emptyText: {
    marginTop: '12@vs',
    fontSize: '14@ms',
    color: '#94A3B8',
  },
  markAllBtn: {
    padding: '8@ms',
  },
});

export default NotificationScreen;
