// screens/employee/overtime/OvertimeDetailScreen.jsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';

const STATUS_CONFIG = {
  pending: { label: 'Chờ phê duyệt', color: '#D97706', bg: '#FEF3C7', icon: 'clock-outline' },
  approved: { label: 'Đã phê duyệt', color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle-outline' },
  rejected: { label: 'Bị từ chối', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
  cancelled: { label: 'Đã hủy', color: '#64748B', bg: '#F1F5F9', icon: 'cancel' },
};

const OT_TYPE_CONFIG = {
  weekday: { label: 'Ngày thường', multiplier: '1.5x', color: '#2563EB', bg: '#EFF6FF' },
  weekend: { label: 'Cuối tuần', multiplier: '2.0x', color: '#D97706', bg: '#FEF3C7' },
  holiday: { label: 'Ngày lễ / Tết', multiplier: '3.0x', color: '#DC2626', bg: '#FEE2E2' },
};

const DetailRow = ({ label, value, icon, valueColor, isHighlight }) => (
  <View style={[styles.detailRow, isHighlight && styles.detailRowHighlight]}>
    <View style={styles.detailLabelBox}>
      {icon && <Icon name={icon} size={16} color="#64748B" style={styles.rowIcon} />}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>
      {value}
    </Text>
  </View>
);

const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={18} color="#2563EB" style={styles.sectionIcon} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const OvertimeDetailScreen = () => {
  const route = useRoute();
  const { id, overtime: routeOvertime } = route.params || {};

  const { overtimes = [] } = useSelector((state) => state.overtime || {});
  const overtime = routeOvertime || overtimes.find((o) => o._id === id);

  if (!overtime) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Chi tiết làm thêm giờ" canGoBack />
        <View style={styles.centerLoading}>
          <Icon name="clock-alert-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyText}>Không tìm thấy thông tin đơn làm thêm giờ</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_CONFIG[overtime.status] || STATUS_CONFIG.pending;
  const otType = OT_TYPE_CONFIG[overtime.otType] || OT_TYPE_CONFIG.weekday;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Chi tiết làm thêm giờ (OT)" canGoBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Hero Banner */}
        <View style={[styles.statusHero, { borderColor: status.color + '40' }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={28} color={status.color} />
          </View>
          <Text style={[styles.statusTitle, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.statusDate}>
            Nộp lúc: {moment(overtime.createdAt).format('HH:mm DD/MM/YYYY')}
          </Text>

          {overtime.status === 'rejected' && overtime.rejectionReason ? (
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionTitle}>Lý do từ chối:</Text>
              <Text style={styles.rejectionText}>{overtime.rejectionReason}</Text>
            </View>
          ) : null}
        </View>

        {/* Section 1: Thời gian & Hệ số */}
        <Section title="Thông tin ca làm việc" icon="clock-time-four-outline">
          <DetailRow
            label="Ngày làm thêm"
            value={moment(overtime.date).format('dddd, DD/MM/YYYY')}
            icon="calendar"
          />
          <DetailRow
            label="Khung giờ"
            value={`${overtime.startTime} - ${overtime.endTime}`}
            icon="clock-outline"
          />
          <DetailRow
            label="Tổng thời lượng"
            value={`${overtime.durationHours || 0} giờ`}
            valueColor="#2563EB"
            isHighlight
          />
          <DetailRow
            label="Loại ngày"
            value={otType.label}
            valueColor={otType.color}
          />
          <DetailRow
            label="Hệ số nhân lương"
            value={`x${overtime.rateMultiplier || otType.multiplier}`}
            valueColor="#16A34A"
            isHighlight
          />
        </Section>

        {/* Section 2: Dự án & Lý do */}
        <Section title="Công việc & Lý do" icon="text-box-outline">
          {overtime.projectName ? (
            <DetailRow
              label="Dự án / Khách hàng"
              value={overtime.projectName}
              icon="briefcase-outline"
            />
          ) : null}

          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Lý do làm thêm:</Text>
            <Text style={styles.reasonContent}>{overtime.reason}</Text>
          </View>
        </Section>

        {/* Section 3: Phê duyệt */}
        {overtime.status === 'approved' && overtime.approvedAt ? (
          <Section title="Thông tin phê duyệt" icon="check-decagram-outline">
            <DetailRow
              label="Thời gian duyệt"
              value={moment(overtime.approvedAt).format('HH:mm DD/MM/YYYY')}
              icon="calendar-check"
              valueColor="#16A34A"
            />
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: '16@ms',
    paddingTop: '12@vs',
    paddingBottom: '36@vs',
  },
  statusHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '20@ms',
    alignItems: 'center',
    marginBottom: '14@vs',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusIconWrap: {
    width: '56@ms',
    height: '56@ms',
    borderRadius: '28@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10@vs',
  },
  statusTitle: {
    fontSize: '18@ms',
    fontWeight: '700',
    marginBottom: '4@vs',
  },
  statusDate: {
    fontSize: '12@ms',
    color: '#94A3B8',
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: '10@ms',
    padding: '12@ms',
    width: '100%',
    marginTop: '12@vs',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectionTitle: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: '2@vs',
  },
  rejectionText: {
    fontSize: '13@ms',
    color: '#B91C1C',
    lineHeight: '18@vs',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14@ms',
    padding: '16@ms',
    marginBottom: '14@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
    paddingBottom: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionIcon: {
    marginRight: '8@ms',
  },
  sectionTitle: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionBody: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '8@vs',
  },
  detailRowHighlight: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8@ms',
    paddingHorizontal: '8@ms',
  },
  detailLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: '6@ms',
  },
  detailLabel: {
    fontSize: '13@ms',
    color: '#475569',
  },
  detailValue: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: '8@ms',
  },
  reasonBox: {
    paddingVertical: '6@vs',
  },
  reasonLabel: {
    fontSize: '12@ms',
    color: '#64748B',
    marginBottom: '4@vs',
  },
  reasonContent: {
    fontSize: '14@ms',
    color: '#1E293B',
    lineHeight: '20@vs',
    fontWeight: '500',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: '12@vs',
    fontSize: '14@ms',
    color: '#94A3B8',
  },
});

export default OvertimeDetailScreen;