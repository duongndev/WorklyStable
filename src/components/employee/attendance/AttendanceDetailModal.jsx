// src/components/employee/attendance/AttendanceDetailModal.jsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';
import { STATUS_CONFIG } from './attendanceConstants';

const AttendanceDetailModal = ({ visible, selectedDay, onClose }) => {
  if (!selectedDay) return null;

  const statusConfig = STATUS_CONFIG[selectedDay.status];
  const checkIn = selectedDay.checkIn || {};
  const checkOut = selectedDay.checkOut || {};

  return (
    <Modal
      visible={Boolean(visible && selectedDay)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalDateTitle}>
                {moment(selectedDay.date).format('dddd, DD/MM/YYYY')}
              </Text>
              <Text style={styles.modalSubtitle}>Chi tiết dữ liệu chấm công</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Status Badge */}
            <View style={styles.modalStatusRow}>
              <Text style={styles.modalFieldLbl}>Trạng thái:</Text>
              <View
                style={[
                  styles.modalStatusBadge,
                  { backgroundColor: statusConfig?.bg || '#F1F5F9' },
                ]}
              >
                <Text
                  style={[
                    styles.modalStatusText,
                    { color: statusConfig?.color || '#475569' },
                  ]}
                >
                  {statusConfig?.label || selectedDay.status || 'Chưa ghi nhận'}
                </Text>
              </View>
            </View>

            {/* Check In Detail */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSecTitle}>1. Giờ vào (Check-in)</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Thời gian:</Text>
                <Text style={styles.detailVal}>
                  {checkIn?.time
                    ? moment(checkIn.time).format('HH:mm:ss')
                    : '--:--:--'}
                </Text>
              </View>
              {checkIn?.isLate ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Đi muộn:</Text>
                  <Text style={[styles.detailVal, { color: '#DC2626' }]}>
                    {checkIn.minutesLate} phút
                  </Text>
                </View>
              ) : null}
              {checkIn?.location?.address ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Địa điểm:</Text>
                  <Text style={[styles.detailVal, { flex: 1, textAlign: 'right' }]}>
                    {checkIn.location.address}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Check Out Detail */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSecTitle}>2. Giờ ra (Check-out)</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Thời gian:</Text>
                <Text style={styles.detailVal}>
                  {checkOut?.time
                    ? moment(checkOut.time).format('HH:mm:ss')
                    : '--:--:--'}
                </Text>
              </View>
              {checkOut?.isEarlyLeave ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Về sớm:</Text>
                  <Text style={[styles.detailVal, { color: '#DC2626' }]}>
                    {checkOut.minutesEarly} phút
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Work Hours & Note */}
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Tổng giờ làm việc:</Text>
                <Text style={[styles.detailVal, { color: '#2563EB', fontWeight: '700' }]}>
                  {selectedDay.totalWorkHours || 0} giờ
                </Text>
              </View>
              {selectedDay.note ? (
                <View style={[styles.detailRow, { marginTop: 6 }]}>
                  <Text style={styles.detailKey}>Ghi chú:</Text>
                  <Text style={[styles.detailVal, { flex: 1, textAlign: 'right', fontStyle: 'italic' }]}>
                    {selectedDay.note}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@ms',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '20@ms',
    width: '100%',
    maxWidth: '340@ms',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalDateTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  modalSubtitle: {
    fontSize: '12@ms',
    color: '#64748B',
    marginTop: '2@vs',
  },
  modalBody: {
    paddingTop: '12@vs',
  },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  modalFieldLbl: {
    fontSize: '13@ms',
    color: '#64748B',
  },
  modalStatusBadge: {
    paddingHorizontal: '10@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
  },
  modalStatusText: {
    fontSize: '12@ms',
    fontWeight: '700',
  },
  detailSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10@ms',
    padding: '10@ms',
    marginBottom: '10@vs',
  },
  detailSecTitle: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6@vs',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '2@vs',
  },
  detailKey: {
    fontSize: '12@ms',
    color: '#64748B',
  },
  detailVal: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: '#0F172A',
  },
});

export default React.memo(AttendanceDetailModal);
