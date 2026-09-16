// screens/admin/regularization/AdminRegularizationApprovalsScreen.jsx
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import {
  getPendingRegularizationsApi,
  reviewRegularizationApi,
} from '../../../api/adminAPI';
import COLORS from '../../../assets/styles/color';

const TYPE_MAP = {
  checkin: { label: 'Bổ sung giờ vào', color: '#2563EB', bg: '#EFF6FF' },
  checkout: { label: 'Bổ sung giờ ra', color: '#D97706', bg: '#FEF3C7' },
  both: { label: 'Bổ sung cả vào & ra', color: '#7C3AED', bg: '#EDE9FE' },
};

const AdminRegularizationApprovalsScreen = () => {
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
      const res = await getPendingRegularizationsApi();
      if (res?.data) {
        const list = res.data.requests || (Array.isArray(res.data) ? res.data : []);
        setRequests(list);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách duyệt giải trình:', err);
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
    Alert.alert(
      'Xác nhận duyệt',
      `Phê duyệt giải trình bổ sung công cho ${item.userId?.fullName || 'nhân viên'}? Hệ thống sẽ tự động cập nhật lại bảng chấm công.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Phê duyệt',
          style: 'default',
          onPress: async () => {
            setProcessingId(item._id);
            try {
              await reviewRegularizationApi(item._id, 'approve');
              Alert.alert('Thành công', 'Đã phê duyệt đơn giải trình công!');
              setRequests((prev) => prev.filter((r) => r._id !== item._id));
            } catch (err) {
              Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể duyệt đơn.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleOpenReject = (item) => {
    setRejectTarget(item);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do từ chối đơn giải trình.');
      return;
    }

    setProcessingId(rejectTarget._id);
    setRejectModalVisible(false);
    try {
      await reviewRegularizationApi(rejectTarget._id, 'reject', rejectReason.trim());
      Alert.alert('Thành công', 'Đã từ chối đơn giải trình.');
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
    const typeInfo = TYPE_MAP[item.type] || TYPE_MAP.checkin;
    const isProcessing = processingId === item._id;

    return (
      <View style={styles.card}>
        {/* User Top Row */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.fullName?.charAt(0)?.toUpperCase() || 'E'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.fullName || 'Nhân viên'}</Text>
            <Text style={styles.userMeta}>
              {user.position || 'Nhân viên'} • {user.department || 'Văn phòng'}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
            <Text style={[styles.typeText, { color: typeInfo.color }]}>
              {typeInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Regularization Detail Info */}
        <View style={styles.detailGrid}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#64748B" />
            <Text style={styles.detailKey}>Ngày cần bổ sung:</Text>
            <Text style={styles.detailVal}>
              {moment(item.date).format('dddd, DD/MM/YYYY')}
            </Text>
          </View>

          {item.proposedCheckIn ? (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-in" size={16} color="#2563EB" />
              <Text style={styles.detailKey}>Giờ vào đề xuất:</Text>
              <Text style={[styles.detailVal, { color: '#2563EB' }]}>
                {moment(item.proposedCheckIn).format('HH:mm:ss')}
              </Text>
            </View>
          ) : null}

          {item.proposedCheckOut ? (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-out" size={16} color="#D97706" />
              <Text style={styles.detailKey}>Giờ ra đề xuất:</Text>
              <Text style={[styles.detailVal, { color: '#D97706' }]}>
                {moment(item.proposedCheckOut).format('HH:mm:ss')}
              </Text>
            </View>
          ) : null}

          <View style={styles.reasonBox}>
            <Text style={styles.reasonTitle}>Lý do giải trình:</Text>
            <Text style={styles.reasonText}>{item.reason || 'Không có lý do chi tiết'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn, isProcessing && styles.btnDisabled]}
            onPress={() => handleOpenReject(item)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close" size={18} color="#DC2626" />
            <Text style={styles.rejectBtnText}>Từ Chối</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.approveBtn, isProcessing && styles.btnDisabled]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                <Text style={styles.approveBtnText}>Phê Duyệt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Duyệt Giải Trình Công"
        canGoBack
        onBack={() => navigation.goBack()}
      />

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
              <MaterialCommunityIcons name="clipboard-check-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không có đơn giải trình nào</Text>
              <Text style={styles.emptySub}>Tất cả đơn giải trình bổ sung công đã được xử lý</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          )
        }
      />

      {/* Modal Nhập Lý Do Từ Chối */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRejectModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Từ Chối Đơn Giải Trình</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Nhập lý do từ chối gửi tới {rejectTarget?.userId?.fullName || 'nhân viên'}:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do chi tiết..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmReject}
              >
                <Text style={styles.modalConfirmText}>Xác Nhận Từ Chối</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: '40@ms',
    height: '40@ms',
    borderRadius: '20@ms',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10@ms',
  },
  avatarText: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#2563EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  userMeta: {
    fontSize: '11@ms',
    color: '#64748B',
    marginTop: '2@vs',
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
    marginVertical: '12@vs',
  },
  detailGrid: {
    marginBottom: '14@vs',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: '3@vs',
  },
  detailKey: {
    fontSize: '12@ms',
    color: '#64748B',
    marginLeft: '6@ms',
    flex: 1,
  },
  detailVal: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8@ms',
    padding: '10@ms',
    marginTop: '8@vs',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reasonTitle: {
    fontSize: '11@ms',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '2@vs',
  },
  reasonText: {
    fontSize: '12@ms',
    color: '#334155',
    lineHeight: '16@vs',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '10@vs',
    borderRadius: '10@ms',
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginRight: '8@ms',
  },
  rejectBtnText: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: '4@ms',
  },
  approveBtn: {
    backgroundColor: '#16A34A',
    marginLeft: '8@ms',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  approveBtnText: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: '4@ms',
  },
  btnDisabled: {
    opacity: 0.6,
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
  emptySub: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  modalTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: '12@ms',
    color: '#64748B',
    marginBottom: '12@vs',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: '10@ms',
    padding: '10@ms',
    fontSize: '13@ms',
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: '80@vs',
    marginBottom: '16@vs',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingVertical: '8@vs',
    paddingHorizontal: '14@ms',
    marginRight: '8@ms',
  },
  modalCancelText: {
    fontSize: '13@ms',
    color: '#64748B',
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: '8@vs',
    paddingHorizontal: '16@ms',
    borderRadius: '8@ms',
  },
  modalConfirmText: {
    fontSize: '13@ms',
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default AdminRegularizationApprovalsScreen;
