// screens/employee/leave/LeaveRequestScreen.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import {
  getMyLeavesRequestAction,
  getLeaveBalanceAction,
  cancelLeaveRequestAction,
} from '../../../redux/leave/leaveAction';
import COLORS from '../../../assets/styles/color';

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', color: '#D97706', bg: '#FEF3C7', icon: 'clock-outline' },
  approved: { label: 'Đã duyệt', color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle-outline' },
  rejected: { label: 'Từ chối', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
  cancelled: { label: 'Đã hủy', color: '#64748B', bg: '#F1F5F9', icon: 'cancel' },
};

const LEAVE_TYPE_MAP = {
  annual_leave: { label: 'Nghỉ phép năm', color: '#2563EB', icon: 'calendar-star' },
  sick_leave: { label: 'Nghỉ ốm', color: '#DC2626', icon: 'medical-bag' },
  unpaid_leave: { label: 'Không lương', color: '#64748B', icon: 'cash-off' },
  maternity_leave: { label: 'Thai sản', color: '#DB2777', icon: 'baby-carriage' },
  paternity_leave: { label: 'Nghỉ sinh (Nam)', color: '#0284C7', icon: 'human-male-child' },
  marriage_leave: { label: 'Kết hôn', color: '#E11D48', icon: 'ring' },
  compassionate_leave: { label: 'Hiếu hỉ', color: '#D97706', icon: 'heart' },
  personal_leave: { label: 'Việc riêng', color: '#7C3AED', icon: 'account' },
  holiday_leave: { label: 'Nghỉ lễ', color: '#16A34A', icon: 'calendar-heart' },
  study_leave: { label: 'Đi học', color: '#4F46E5', icon: 'book-education' },
  other: { label: 'Khác', color: '#475569', icon: 'dots-horizontal' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

const LeaveRequestScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { leaves = [], balance, loading = false } = useSelector(
    (state) => state.leave || {},
  );

  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const loadData = useCallback(() => {
    dispatch(getMyLeavesRequestAction({}));
    dispatch(getLeaveBalanceAction({}));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(getMyLeavesRequestAction({})).unwrap().catch(() => {}),
      dispatch(getLeaveBalanceAction({})).unwrap().catch(() => {}),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  const filteredLeaves = useMemo(() => {
    if (!Array.isArray(leaves)) return [];
    if (filterStatus === 'all') return leaves;
    return leaves.filter((item) => item.status === filterStatus);
  }, [leaves, filterStatus]);

  const handleCancelLeave = (leaveItem) => {
    if (leaveItem.status !== 'pending') {
      Alert.alert('Thông báo', 'Chỉ có thể hủy đơn đang ở trạng thái chờ duyệt.');
      return;
    }

    Alert.alert('Xác nhận hủy đơn', 'Bạn có chắc chắn muốn hủy đơn xin nghỉ phép này?', [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancellingId(leaveItem._id);
            await dispatch(cancelLeaveRequestAction(leaveItem._id)).unwrap();
            Alert.alert('Thành công', 'Đã hủy đơn xin nghỉ phép.');
          } catch (err) {
            Alert.alert('Lỗi', err || 'Không thể hủy đơn nghỉ phép.');
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const renderLeaveCard = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const leaveType = LEAVE_TYPE_MAP[item.leaveType] || LEAVE_TYPE_MAP.other;

    const startDateStr = moment(item.startDate).format('DD/MM/YYYY');
    const endDateStr = moment(item.endDate).format('DD/MM/YYYY');
    const isSingleDay = startDateStr === endDateStr;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('LeaveDetail', { id: item._id, leave: item })}
      >
        <View style={styles.cardTop}>
          <View style={styles.typeBadge}>
            <Icon name={leaveType.icon} size={16} color={leaveType.color} />
            <Text style={[styles.typeText, { color: leaveType.color }]}>
              {leaveType.label}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Icon name="calendar-range" size={18} color="#475569" />
          <Text style={styles.dateText}>
            {isSingleDay ? startDateStr : `${startDateStr} - ${endDateStr}`}
          </Text>
          <View style={styles.durationTag}>
            <Text style={styles.durationText}>
              {item.duration || 1} ngày
              {item.leaveDurationType === 'half_day'
                ? ` (${item.session === 'morning' ? 'Sáng' : 'Chiều'})`
                : ''}
            </Text>
          </View>
        </View>

        <Text style={styles.reasonText} numberOfLines={2}>
          <Text style={{ fontWeight: '600', color: '#334155' }}>Lý do: </Text>
          {item.reason}
        </Text>

        <View style={styles.cardBottom}>
          <Text style={styles.createTime}>
            Gửi lúc: {moment(item.createdAt).format('HH:mm DD/MM/YYYY')}
          </Text>
          {item.status === 'pending' ? (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelLeave(item)}
              disabled={cancellingId === item._id}
            >
              {cancellingId === item._id ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Icon name="trash-can-outline" size={14} color="#DC2626" />
                  <Text style={styles.cancelBtnText}>Hủy đơn</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Quản lý nghỉ phép"
        canGoBack
        rightComponent={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('LeaveCreate')}
          >
            <Icon name="plus" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Leave Balance Overview */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceTitle}>Quỹ phép năm {moment().year()}</Text>
          <Icon name="information-outline" size={18} color="#94A3B8" />
        </View>
        <View style={styles.balanceGrid}>
          <View style={[styles.balanceCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={[styles.balanceNum, { color: '#2563EB' }]}>
              {balance?.annualLeave?.remaining ?? 12}
            </Text>
            <Text style={styles.balanceLabel}>Phép còn lại</Text>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Text style={[styles.balanceNum, { color: '#D97706' }]}>
              {balance?.annualLeave?.used ?? 0}
            </Text>
            <Text style={styles.balanceLabel}>Đã sử dụng</Text>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
            <Text style={[styles.balanceNum, { color: '#DC2626' }]}>
              {balance?.sickLeave?.used ?? 0}
            </Text>
            <Text style={styles.balanceLabel}>Nghỉ ốm</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, filterStatus === tab.key && styles.tabBtnActive]}
            onPress={() => setFilterStatus(tab.key)}
          >
            <Text
              style={[styles.tabText, filterStatus === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leave List */}
      <FlatList
        data={filteredLeaves}
        keyExtractor={(item) => item._id || String(Math.random())}
        renderItem={renderLeaveCard}
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
              <Icon name="calendar-blank-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>Chưa có đơn xin nghỉ phép nào</Text>
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
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: '16@ms',
    marginTop: '10@vs',
    borderRadius: '16@ms',
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  balanceTitle: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    marginHorizontal: '4@ms',
    borderWidth: 1,
  },
  balanceNum: {
    fontSize: '20@ms',
    fontWeight: '800',
    marginBottom: '2@vs',
  },
  balanceLabel: {
    fontSize: '11@ms',
    color: '#475569',
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: '16@ms',
    marginTop: '12@vs',
    marginBottom: '6@vs',
  },
  tabBtn: {
    paddingHorizontal: '14@ms',
    paddingVertical: '6@vs',
    borderRadius: '20@ms',
    backgroundColor: '#F1F5F9',
    marginRight: '8@ms',
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  tabText: {
    fontSize: '13@ms',
    color: '#64748B',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: '16@ms',
    paddingTop: '8@vs',
    paddingBottom: '80@vs',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14@ms',
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: '14@ms',
    fontWeight: '700',
    marginLeft: '6@ms',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8@ms',
    paddingVertical: '3@vs',
    borderRadius: '8@ms',
  },
  statusText: {
    fontSize: '11@ms',
    fontWeight: '600',
    marginLeft: '4@ms',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  dateText: {
    fontSize: '14@ms',
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: '6@ms',
  },
  durationTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: '8@ms',
    paddingVertical: '2@vs',
    borderRadius: '6@ms',
    marginLeft: '8@ms',
  },
  durationText: {
    fontSize: '11@ms',
    color: '#475569',
    fontWeight: '600',
  },
  reasonText: {
    fontSize: '13@ms',
    color: '#475569',
    lineHeight: '18@vs',
    marginBottom: '10@vs',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8@vs',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  createTime: {
    fontSize: '11@ms',
    color: '#94A3B8',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8@ms',
    paddingVertical: '4@vs',
    borderRadius: '6@ms',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: '12@ms',
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: '4@ms',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '60@vs',
  },
  emptyText: {
    fontSize: '14@ms',
    color: '#94A3B8',
    marginTop: '12@vs',
  },
  fab: {
    position: 'absolute',
    bottom: '24@vs',
    right: '16@ms',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: '20@ms',
    paddingVertical: '12@vs',
    borderRadius: '28@ms',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: '14@ms',
    fontWeight: '700',
    marginLeft: '6@ms',
  },
});

export default LeaveRequestScreen;
