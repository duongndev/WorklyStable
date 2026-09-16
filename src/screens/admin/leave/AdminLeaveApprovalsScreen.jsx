import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import 'moment/locale/vi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import {
  getPendingLeaveApprovalsApi,
  reviewLeaveRequestApi,
} from '../../../api/adminAPI';
import COLORS from '../../../assets/styles/color';

const LEAVE_TYPE_MAP = {
  annual_leave: { label: 'Nghỉ phép năm', color: '#2563EB' },
  sick_leave: { label: 'Nghỉ ốm', color: '#DC2626' },
  unpaid_leave: { label: 'Không lương', color: '#64748B' },
  maternity_leave: { label: 'Thai sản', color: '#DB2777' },
  marriage_leave: { label: 'Kết hôn', color: '#E11D48' },
  personal_leave: { label: 'Việc riêng', color: '#7C3AED' },
  compassionate_leave: { label: 'Hiếu hỉ', color: '#D97706' },
  other: { label: 'Khác', color: '#475569' },
};

const AdminLeaveApprovalsScreen = () => {
  const navigation = useNavigation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPendingLeaveApprovalsApi();
      if (res?.data) {
        const list = res.data.requests || (Array.isArray(res.data) ? res.data : []);
        setRequests(list);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách duyệt nghỉ phép:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleApprove = (item) => {
    Alert.alert('Xác nhận duyệt', `Phê duyệt đơn nghỉ phép cho ${item.userId?.fullName || 'nhân viên'}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Phê duyệt',
        style: 'default',
        onPress: async () => {
          setProcessingId(item._id);
          try {
            await reviewLeaveRequestApi(item._id, 'approve');
            Alert.alert('Thành công', 'Đã phê duyệt đơn xin nghỉ phép!');
            setRequests((prev) => prev.filter((r) => r._id !== item._id));
          } catch (err) {
            Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể duyệt đơn.');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleOpenReject = (item) => {
    setRejectTarget(item);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do từ chối đơn.');
      return;
    }

    setProcessingId(rejectTarget._id);
    setRejectModalVisible(false);
    try {
      await reviewLeaveRequestApi(rejectTarget._id, 'reject', rejectReason.trim());
      Alert.alert('Thành công', 'Đã từ chối đơn xin nghỉ phép.');
      setRequests((prev) => prev.filter((r) => r._id !== rejectTarget._id));
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể từ chối đơn.');
    } finally {
      setProcessingId(null);
      setRejectTarget(null);
    }
  };

  const renderItem = ({ item }) => {
    const user = item.userId || {};
    const leaveType = LEAVE_TYPE_MAP[item.leaveType] || LEAVE_TYPE_MAP.other;
    const isProcessing = processingId === item._id;

    return (
      <View style={styles.card}>
        {/* Header nhân viên */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.fullName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{user.fullName || 'Nhân viên'}</Text>
            <Text style={styles.userDept}>
              {user.department || 'Phòng ban'} • {user.position || 'Chức vụ'}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: leaveType.color + '15' }]}>
            <Text style={[styles.typeText, { color: leaveType.color }]}>
              {leaveType.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Thông tin nghỉ */}
        <View style={styles.infoRow}>
          <Icon name="calendar-range" size={16} color="#64748B" />
          <Text style={styles.infoDate}>
            {moment(item.startDate).format('DD/MM/YYYY')} - {moment(item.endDate).format('DD/MM/YYYY')}
          </Text>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration || 1} ngày</Text>
          </View>
        </View>

        <Text style={styles.reasonText}>
          <Text style={{ fontWeight: '600', color: '#334155' }}>Lý do: </Text>
          {item.reason}
        </Text>

        {item.handoverInfo?.handoverNotes ? (
          <Text style={styles.handoverText}>
            <Text style={{ fontWeight: '600' }}>Bàn giao: </Text>
            {item.handoverInfo.handoverNotes}
          </Text>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, isProcessing && styles.btnDisabled]}
            onPress={() => handleOpenReject(item)}
            disabled={isProcessing}
          >
            <Icon name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.rejectBtnText}>Từ chối</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approveBtn, isProcessing && styles.btnDisabled]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="check-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.approveBtnText}>Phê duyệt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Duyệt Đơn Nghỉ Phép" canGoBack onBack={() => navigation.goBack()} />

      <FlatList
        data={requests}
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
              <Icon name="check-decagram-outline" size={60} color="#16A34A" />
              <Text style={styles.emptyTitle}>Tất cả đơn đã được xử lý</Text>
              <Text style={styles.emptySubtitle}>Hiện tại không có đơn nghỉ phép nào chờ duyệt</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          )
        }
      />

      {/* Modal nhập lý do từ chối */}
      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Từ chối đơn xin nghỉ</Text>
            <Text style={styles.modalSubtitle}>
              Nhập lý do từ chối đơn của {rejectTarget?.userId?.fullName}:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do cụ thể..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmReject}
              >
                <Text style={styles.modalConfirmText}>Xác nhận từ chối</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: '40@ms',
    height: '40@ms',
    borderRadius: '20@ms',
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10@ms',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: '16@ms',
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  userDept: {
    fontSize: '11@ms',
    color: '#64748B',
    marginTop: '1@vs',
  },
  typeBadge: {
    paddingHorizontal: '8@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
  },
  typeText: {
    fontSize: '11@ms',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: '10@vs',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  infoDate: {
    fontSize: '13@ms',
    color: '#1E293B',
    fontWeight: '600',
    marginLeft: '6@ms',
  },
  durationBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: '8@ms',
    paddingVertical: '2@vs',
    borderRadius: '6@ms',
    marginLeft: '8@ms',
  },
  durationText: {
    fontSize: '11@ms',
    fontWeight: '700',
    color: '#2563EB',
  },
  reasonText: {
    fontSize: '13@ms',
    color: '#475569',
    lineHeight: '18@vs',
    marginBottom: '6@vs',
  },
  handoverText: {
    fontSize: '12@ms',
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: '10@vs',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '6@vs',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: '10@vs',
    paddingHorizontal: '16@ms',
    borderRadius: '10@ms',
    borderWidth: 1,
    borderColor: '#FECACA',
    width: '46%',
  },
  rejectBtnText: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: '4@ms',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: '10@vs',
    paddingHorizontal: '16@ms',
    borderRadius: '10@ms',
    width: '46%',
  },
  approveBtnText: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: '4@ms',
  },
  btnDisabled: {
    opacity: 0.5,
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
  modalTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '4@vs',
  },
  modalSubtitle: {
    fontSize: '12@ms',
    color: '#64748B',
    marginBottom: '12@vs',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: '10@ms',
    padding: '10@ms',
    fontSize: '13@ms',
    color: '#0F172A',
    minHeight: '70@vs',
    textAlignVertical: 'top',
    marginBottom: '16@vs',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    paddingVertical: '10@vs',
    paddingHorizontal: '16@ms',
    borderRadius: '10@ms',
    backgroundColor: '#F1F5F9',
    width: '46%',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: '13@ms',
    color: '#475569',
    fontWeight: '600',
  },
  modalConfirmBtn: {
    paddingVertical: '10@vs',
    paddingHorizontal: '16@ms',
    borderRadius: '10@ms',
    backgroundColor: '#DC2626',
    width: '46%',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: '13@ms',
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default AdminLeaveApprovalsScreen;
