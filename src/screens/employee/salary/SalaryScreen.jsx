// screens/employee/salary/SalaryScreen.jsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import PinModal from '../../../components/employee/salary/PinModal';
import {
  getMyPayslipsAction,
  verifyPayslipPinAction,
  setupPayslipPinAction,
} from '../../../redux/salary/salaryAction';
import COLORS from '../../../assets/styles/color';

const STATUS_CONFIG = {
  draft: { label: 'Nháp', color: '#94A3B8', bg: '#F1F5F9', icon: 'file-document-outline' },
  published: { label: 'Đã phát hành', color: '#0284C7', bg: '#E0F2FE', icon: 'clock-check-outline' },
  paid: { label: 'Đã thanh toán', color: '#16A34A', bg: '#DCFCE7', icon: 'check-decagram' },
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 đ';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
};

const SalaryScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { payslips = [], loading = false, payslipToken, tokenExpiresAt } = useSelector(
    (state) => state.salary || {},
  );

  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [showYearModal, setShowYearModal] = useState(false);

  // PIN Modal State
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [isPinSetup, setIsPinSetup] = useState(false);
  const [targetPayslipId, setTargetPayslipId] = useState(null);

  const availableYears = useMemo(() => {
    const years = new Set();
    payslips.forEach((p) => {
      if (p.year) years.add(Number(p.year));
    });
    years.add(moment().year());
    return Array.from(years).sort((a, b) => b - a);
  }, [payslips]);

  const loadData = useCallback(() => {
    dispatch(getMyPayslipsAction({ year: selectedYear }));
  }, [dispatch, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getMyPayslipsAction({ year: selectedYear })).unwrap().catch(() => {});
    setRefreshing(false);
  }, [dispatch, selectedYear]);

  // Lọc theo năm được chọn
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => Number(p.year) === Number(selectedYear));
  }, [payslips, selectedYear]);

  // Tổng thực lĩnh trong năm
  const totalNetSalaryYear = useMemo(() => {
    return filteredPayslips.reduce((sum, p) => sum + (Number(p.netSalary) || 0), 0);
  }, [filteredPayslips]);

  const isTokenValid = useMemo(() => {
    return Boolean(payslipToken && tokenExpiresAt && Date.now() < tokenExpiresAt);
  }, [payslipToken, tokenExpiresAt]);

  const handleOpenPayslip = (payslip) => {
    if (isTokenValid) {
      navigation.navigate('SalaryDetail', {
        salaryId: payslip._id,
        payslipId: payslip._id,
        payslip,
        token: payslipToken,
      });
    } else {
      setTargetPayslipId(payslip._id);
      setIsPinSetup(false);
      setPinModalVisible(true);
    }
  };

  const handleVerifyPin = async (pin) => {
    const res = await dispatch(verifyPayslipPinAction(pin)).unwrap();
    return res;
  };

  const handleSetupPin = async (pin) => {
    const res = await dispatch(setupPayslipPinAction({ pin })).unwrap();
    return res;
  };

  const handlePinSuccess = (token) => {
    const activeToken = token || payslipToken;
    if (targetPayslipId) {
      navigation.navigate('SalaryDetail', {
        salaryId: targetPayslipId,
        payslipId: targetPayslipId,
        token: activeToken,
      });
      setTargetPayslipId(null);
    }
  };

  const renderPayslipCard = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.published;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleOpenPayslip(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.monthBadge}>
            <Icon name="calendar-text" size={18} color="#2563EB" />
            <Text style={styles.monthText}>
              Tháng {item.month}/{item.year}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <Text style={styles.salaryLabel}>Thực lĩnh</Text>
          <Text style={styles.salaryAmount}>{formatCurrency(item.netSalary)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Icon name="credit-card-outline" size={15} color="#64748B" />
            <Text style={styles.footerText}>
              {item.paymentMethod || 'Chuyển khoản'}
            </Text>
          </View>
          <View style={styles.viewDetailBtn}>
            <Text style={styles.viewDetailText}>Chi tiết</Text>
            <Icon name="chevron-right" size={16} color="#2563EB" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Phiếu lương"
        canGoBack
        rightComponent={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              setIsPinSetup(true);
              setPinModalVisible(true);
            }}
          >
            <Icon name="shield-key-outline" size={22} color={COLORS.PRIMARY || '#2563EB'} />
          </TouchableOpacity>
        }
      />

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>Tổng thực lĩnh năm {selectedYear}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalNetSalaryYear)}</Text>
          </View>
          <TouchableOpacity
            style={styles.yearPickerBtn}
            onPress={() => setShowYearModal(true)}
          >
            <Text style={styles.yearPickerText}>{selectedYear}</Text>
            <Icon name="chevron-down" size={18} color="#2563EB" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryStatsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{filteredPayslips.length}</Text>
            <Text style={styles.statLbl}>Kỳ lương</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>
              {formatCurrency(
                filteredPayslips.length > 0
                  ? Math.round(totalNetSalaryYear / filteredPayslips.length)
                  : 0,
              )}
            </Text>
            <Text style={styles.statLbl}>Trung bình/tháng</Text>
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredPayslips}
        keyExtractor={(item) => item._id || String(Math.random())}
        renderItem={renderPayslipCard}
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
              <Icon name="cash-remove" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                Chưa có phiếu lương nào trong năm {selectedYear}
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          )
        }
      />

      {/* Year Picker Modal */}
      <Modal visible={showYearModal} transparent animationType="fade" onRequestClose={() => setShowYearModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearModal(false)}
        >
          <View style={styles.yearModalContent}>
            <Text style={styles.yearModalTitle}>Chọn năm</Text>
            {availableYears.map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[styles.yearItem, yr === selectedYear && styles.yearItemActive]}
                onPress={() => {
                  setSelectedYear(yr);
                  setShowYearModal(false);
                }}
              >
                <Text style={[styles.yearText, yr === selectedYear && styles.yearTextActive]}>
                  Năm {yr}
                </Text>
                {yr === selectedYear && <Icon name="check" size={20} color="#2563EB" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PIN Verification / Setup Modal */}
      <PinModal
        visible={pinModalVisible}
        isSetup={isPinSetup}
        onClose={() => {
          setPinModalVisible(false);
          setTargetPayslipId(null);
        }}
        onVerifyPin={handleVerifyPin}
        onSetupPin={handleSetupPin}
        onSuccess={handlePinSuccess}
      />
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBtn: {
    padding: '6@ms',
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: '16@ms',
    marginTop: '12@vs',
    marginBottom: '8@vs',
    borderRadius: '16@ms',
    padding: '16@ms',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryTitle: {
    fontSize: '12@ms',
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: '4@vs',
  },
  summaryAmount: {
    fontSize: '22@ms',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  yearPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: '12@ms',
    paddingVertical: '6@vs',
    borderRadius: '20@ms',
  },
  yearPickerText: {
    color: '#FFFFFF',
    fontSize: '13@ms',
    fontWeight: '600',
    marginRight: '4@ms',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: '12@ms',
    paddingVertical: '10@vs',
    paddingHorizontal: '16@ms',
    marginTop: '14@vs',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    color: '#38BDF8',
    fontSize: '15@ms',
    fontWeight: '700',
  },
  statLbl: {
    color: '#64748B',
    fontSize: '11@ms',
    marginTop: '2@vs',
  },
  statDivider: {
    width: 1,
    height: '24@vs',
    backgroundColor: '#334155',
  },
  listContent: {
    paddingHorizontal: '16@ms',
    paddingTop: '8@vs',
    paddingBottom: '24@vs',
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
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
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
    marginVertical: '12@vs',
  },
  cardBody: {
    marginBottom: '10@vs',
  },
  salaryLabel: {
    fontSize: '12@ms',
    color: '#64748B',
    marginBottom: '2@vs',
  },
  salaryAmount: {
    fontSize: '20@ms',
    fontWeight: '700',
    color: '#16A34A',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8@vs',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: '12@ms',
    color: '#64748B',
    marginLeft: '6@ms',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailText: {
    fontSize: '13@ms',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '24@ms',
  },
  yearModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '20@ms',
    width: '100%',
    maxWidth: '320@ms',
  },
  yearModalTitle: {
    fontSize: '16@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '12@vs',
    textAlign: 'center',
  },
  yearItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  yearItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: '8@ms',
    paddingHorizontal: '8@ms',
  },
  yearText: {
    fontSize: '14@ms',
    color: '#334155',
    fontWeight: '500',
  },
  yearTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default SalaryScreen;