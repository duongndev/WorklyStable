// screens/employee/leave/LeaveDetailScreen.jsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { cancelLeaveRequestAction } from '../../../redux/leave/leaveAction';

const STATUS_CONFIG = {
  pending: { label: 'Chờ phê duyệt', color: '#D97706', bg: '#FEF3C7', icon: 'clock-outline' },
  approved: { label: 'Đã phê duyệt', color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle-outline' },
  rejected: { label: 'Bị từ chối', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
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

const LeaveDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { id, leave: routeLeave } = route.params || {};

  const { leaves = [] } = useSelector((state) => state.leave || {});
  const leave = routeLeave || leaves.find((l) => l._id === id);

  const [cancelling, setCancelling] = useState(false);

  const handleCancel = useCallback(() => {
    if (!leave || leave.status !== 'pending') return;

    Alert.alert('Xác nhận hủy', 'Bạn có chắc chắn muốn hủy đơn xin nghỉ phép này?', [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await dispatch(cancelLeaveRequestAction(leave._id)).unwrap();
            Alert.alert('Thành công', 'Đã hủy đơn xin nghỉ phép thành công.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch (err) {
            Alert.alert('Lỗi', err || 'Không thể hủy đơn.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }, [leave, dispatch, navigation]);

  if (!leave) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Chi tiết đơn nghỉ" canGoBack />
        <View style={styles.centerLoading}>
          <Icon name="file-question-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyText}>Không tìm thấy thông tin đơn nghỉ phép</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
  const leaveType = LEAVE_TYPE_MAP[leave.leaveType] || LEAVE_TYPE_MAP.other;
  const workflow = leave.approvalWorkflow || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Chi tiết đơn nghỉ phép" canGoBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Hero Card */}
        <View style={[styles.statusHero, { borderColor: status.color + '40' }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={28} color={status.color} />
          </View>
          <Text style={[styles.statusTitle, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.statusDate}>
            Gửi lúc: {moment(leave.createdAt).format('HH:mm DD/MM/YYYY')}
          </Text>

          {leave.status === 'rejected' && leave.rejectionReason ? (
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionTitle}>Lý do từ chối:</Text>
              <Text style={styles.rejectionText}>{leave.rejectionReason}</Text>
            </View>
          ) : null}
        </View>

        {/* Section 1: Thời gian & Loại phép */}
        <Section title="Thông tin kỳ nghỉ" icon="calendar-clock">
          <DetailRow
            label="Loại nghỉ phép"
            value={leaveType.label}
            icon={leaveType.icon}
            valueColor={leaveType.color}
            isHighlight
          />
          <DetailRow
            label="Hình thức"
            value={
              leave.leaveDurationType === 'half_day'
                ? `Nửa ngày (${leave.session === 'morning' ? 'Ca sáng' : 'Ca chiều'})`
                : leave.leaveDurationType === 'time_based'
                ? `Theo giờ (${leave.startTime || ''} - ${leave.endTime || ''})`
                : 'Cả ngày'
            }
          />
          <DetailRow
            label="Từ ngày"
            value={moment(leave.startDate).format('DD/MM/YYYY')}
            icon="calendar-start"
          />
          <DetailRow
            label="Đến ngày"
            value={moment(leave.endDate).format('DD/MM/YYYY')}
            icon="calendar-end"
          />
          <DetailRow
            label="Tổng thời lượng"
            value={`${leave.duration || 1} ngày`}
            valueColor="#2563EB"
            isHighlight
          />
          <DetailRow
            label="Chế độ lương"
            value={leave.isPaidLeave ? 'Hưởng nguyên lương' : 'Không hưởng lương'}
            valueColor={leave.isPaidLeave ? '#16A34A' : '#64748B'}
          />
        </Section>

        {/* Section 2: Lý do & Bàn giao */}
        <Section title="Lý do & Bàn giao công việc" icon="text-box-outline">
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Lý do xin nghỉ:</Text>
            <Text style={styles.reasonContent}>{leave.reason}</Text>
          </View>

          {leave.emergencyContact?.phone ? (
            <DetailRow
              label="Liên hệ khẩn cấp"
              value={leave.emergencyContact.phone}
              icon="phone-outline"
            />
          ) : null}

          {leave.handoverInfo?.handoverNotes ? (
            <DetailRow
              label="Ghi chú bàn giao"
              value={leave.handoverInfo.handoverNotes}
              icon="clipboard-text-outline"
            />
          ) : null}
        </Section>

        {/* Section 3: Tiến trình duyệt */}
        {workflow.length > 0 ? (
          <Section title="Tiến trình phê duyệt" icon="timeline-check-outline">
            {workflow.map((step, idx) => {
              const stepStatus = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
              return (
                <View key={idx} style={styles.stepItem}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepDot,
                        { backgroundColor: stepStatus.color },
                      ]}
                    />
                    {idx < workflow.length - 1 ? <View style={styles.stepLine} /> : null}
                  </View>
                  <View style={styles.stepRight}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepRole}>
                        Bước {step.stepNumber || idx + 1}: {step.role === 'manager' ? 'Quản lý trực tiếp' : 'HR / Admin'}
                      </Text>
                      <View style={[styles.stepBadge, { backgroundColor: stepStatus.bg }]}>
                        <Text style={[styles.stepBadgeText, { color: stepStatus.color }]}>
                          {stepStatus.label}
                        </Text>
                      </View>
                    </View>
                    {step.actedAt ? (
                      <Text style={styles.stepTime}>
                        Xử lý lúc: {moment(step.actedAt).format('HH:mm DD/MM/YYYY')}
                      </Text>
                    ) : null}
                    {step.comment ? (
                      <Text style={styles.stepComment}>Nhận xét: {step.comment}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Section>
        ) : null}

        {/* Cancel Action Button */}
        {leave.status === 'pending' ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Icon name="trash-can-outline" size={18} color="#DC2626" />
                <Text style={styles.cancelBtnText}>Hủy đơn xin nghỉ này</Text>
              </>
            )}
          </TouchableOpacity>
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
  stepItem: {
    flexDirection: 'row',
    marginBottom: '12@vs',
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: '12@ms',
    width: '16@ms',
  },
  stepDot: {
    width: '12@ms',
    height: '12@ms',
    borderRadius: '6@ms',
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginTop: '4@vs',
  },
  stepRight: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepRole: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  stepBadge: {
    paddingHorizontal: '6@ms',
    paddingVertical: '2@vs',
    borderRadius: '6@ms',
  },
  stepBadgeText: {
    fontSize: '10@ms',
    fontWeight: '600',
  },
  stepTime: {
    fontSize: '11@ms',
    color: '#94A3B8',
    marginTop: '2@vs',
  },
  stepComment: {
    fontSize: '12@ms',
    color: '#475569',
    marginTop: '4@vs',
    fontStyle: 'italic',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: '8@vs',
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: '14@ms',
    fontWeight: '700',
    marginLeft: '6@ms',
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

export default LeaveDetailScreen;
