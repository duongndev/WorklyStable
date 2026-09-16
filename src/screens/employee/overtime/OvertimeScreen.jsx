// screens/employee/overtime/OvertimeScreen.jsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { getMyOvertimeRequestsAction } from '../../../redux/overtime/overtimeAction';
import COLORS from '../../../assets/styles/color';

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', color: '#D97706', bg: '#FEF3C7', icon: 'clock-outline' },
  approved: { label: 'Đã duyệt', color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle-outline' },
  rejected: { label: 'Từ chối', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
  cancelled: { label: 'Đã hủy', color: '#64748B', bg: '#F1F5F9', icon: 'cancel' },
};

const OT_TYPE_CONFIG = {
  weekday: { label: 'Ngày thường', multiplier: '1.5x', color: '#2563EB', bg: '#EFF6FF' },
  weekend: { label: 'Cuối tuần', multiplier: '2.0x', color: '#D97706', bg: '#FEF3C7' },
  holiday: { label: 'Ngày lễ', multiplier: '3.0x', color: '#DC2626', bg: '#FEE2E2' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

const OvertimeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { overtimes = [], totalApprovedHours = 0, loading = false } = useSelector(
    (state) => state.overtime || {},
  );

  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    dispatch(getMyOvertimeRequestsAction({}));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getMyOvertimeRequestsAction({})).unwrap().catch(() => {});
    setRefreshing(false);
  }, [dispatch]);

  const filteredOvertimes = useMemo(() => {
    if (!Array.isArray(overtimes)) return [];
    if (filterStatus === 'all') return overtimes;
    return overtimes.filter((item) => item.status === filterStatus);
  }, [overtimes, filterStatus]);

  const renderOvertimeCard = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const otType = OT_TYPE_CONFIG[item.otType] || OT_TYPE_CONFIG.weekday;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('OvertimeDetail', { id: item._id, overtime: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateBox}>
            <Icon name="calendar-clock" size={18} color="#2563EB" />
            <Text style={styles.dateText}>
              {moment(item.date).format('DD/MM/YYYY')}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Thời gian làm</Text>
            <Text style={styles.timeVal}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Tổng số giờ</Text>
            <Text style={styles.hoursVal}>{item.durationHours || 0} giờ</Text>
          </View>
          <View style={[styles.multiplierBadge, { backgroundColor: otType.bg }]}>
            <Text style={[styles.multiplierText, { color: otType.color }]}>
              Hệ số {otType.multiplier}
            </Text>
          </View>
        </View>

        {item.projectName ? (
          <View style={styles.projectRow}>
            <Icon name="briefcase-outline" size={15} color="#64748B" />
            <Text style={styles.projectText} numberOfLines={1}>
              Dự án: {item.projectName}
            </Text>
          </View>
        ) : null}

        <Text style={styles.reasonText} numberOfLines={2}>
          <Text style={{ fontWeight: '600', color: '#334155' }}>Lý do: </Text>
          {item.reason}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.createTime}>
            Nộp lúc: {moment(item.createdAt).format('HH:mm DD/MM/YYYY')}
          </Text>
          <View style={styles.viewDetailRow}>
            <Text style={styles.viewDetailText}>Chi tiết</Text>
            <Icon name="chevron-right" size={16} color="#2563EB" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Làm thêm giờ (OT)" canGoBack />

      {/* Summary Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryTitle}>Tổng giờ OT đã duyệt</Text>
          <Text style={styles.summaryHours}>{totalApprovedHours} <Text style={{ fontSize: 16 }}>giờ</Text></Text>
        </View>
        <View style={styles.summaryIconCircle}>
          <Icon name="clock-check-outline" size={32} color="#38BDF8" />
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

      {/* Overtime List */}
      <FlatList
        data={filteredOvertimes}
        keyExtractor={(item) => item._id || String(Math.random())}
        renderItem={renderOvertimeCard}
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
              <Icon name="clock-remove-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>Chưa có đơn làm thêm giờ nào</Text>
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
  summaryCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: '16@ms',
    marginTop: '10@vs',
    borderRadius: '16@ms',
    padding: '18@ms',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryLeft: {},
  summaryTitle: {
    fontSize: '12@ms',
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: '4@vs',
  },
  summaryHours: {
    fontSize: '28@ms',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryIconCircle: {
    width: '54@ms',
    height: '54@ms',
    borderRadius: '27@ms',
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: '15@ms',
    fontWeight: '700',
    color: '#0F172A',
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: '10@vs',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  timeItem: {},
  timeLabel: {
    fontSize: '11@ms',
    color: '#64748B',
    marginBottom: '2@vs',
  },
  timeVal: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#1E293B',
  },
  hoursVal: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#2563EB',
  },
  multiplierBadge: {
    paddingHorizontal: '8@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
  },
  multiplierText: {
    fontSize: '11@ms',
    fontWeight: '700',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '6@vs',
  },
  projectText: {
    fontSize: '12@ms',
    color: '#64748B',
    marginLeft: '6@ms',
  },
  reasonText: {
    fontSize: '13@ms',
    color: '#475569',
    lineHeight: '18@vs',
    marginBottom: '10@vs',
  },
  cardFooter: {
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
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailText: {
    fontSize: '12@ms',
    color: '#2563EB',
    fontWeight: '600',
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

export default OvertimeScreen;