// screens/employee/salary/SalaryDetailScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';
import Header from '../../../components/common/Header';
import PinModal from '../../../components/employee/salary/PinModal';
import {
  getPayslipDetailAction,
  verifyPayslipPinAction,
  setupPayslipPinAction,
} from '../../../redux/salary/salaryAction';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 đ';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
};

const DetailRow = ({ label, value, valueColor, isTotal, isHighlight, icon, subValue }) => (
  <View style={[styles.detailRow, isTotal && styles.totalRow, isHighlight && styles.highlightRow]}>
    <View style={styles.labelContainer}>
      {icon && <Icon name={icon} size={16} color="#64748B" style={styles.rowIcon} />}
      <View>
        <Text style={[styles.detailLabel, isTotal && styles.totalLabel]}>{label}</Text>
        {subValue ? <Text style={styles.subLabel}>{subValue}</Text> : null}
      </View>
    </View>
    <Text
      style={[
        styles.detailValue,
        isTotal && styles.totalValue,
        valueColor ? { color: valueColor } : null,
      ]}
    >
      {value}
    </Text>
  </View>
);

const Section = ({ title, icon, iconColor = '#2563EB', children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={18} color={iconColor} style={styles.sectionIcon} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const SalaryDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { salaryId, payslipId, token: routeToken } = route.params || {};
  const currentId = salaryId || payslipId;

  const { currentDetail, salaryDetail, loadingDetail, payslipToken } = useSelector(
    (state) => state.salary || {},
  );
  const activeToken = routeToken || payslipToken;

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const payslip = currentDetail || salaryDetail || route.params?.payslip;

  const fetchDetail = useCallback(
    async (tokenToUse) => {
      const tok = tokenToUse || activeToken;
      if (!tok) {
        setPinModalVisible(true);
        return;
      }
      if (currentId) {
        try {
          await dispatch(getPayslipDetailAction({ id: currentId, token: tok })).unwrap();
        } catch (err) {
          setErrorMsg(err || 'Không thể tải chi tiết phiếu lương.');
          // If token expired, open PIN modal
          setPinModalVisible(true);
        }
      }
    },
    [currentId, activeToken, dispatch],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleVerifyPin = async (pin) => {
    const res = await dispatch(verifyPayslipPinAction(pin)).unwrap();
    return res;
  };

  const handleSetupPin = async (pin) => {
    const res = await dispatch(setupPayslipPinAction({ pin })).unwrap();
    return res;
  };

  const handlePinSuccess = (token) => {
    fetchDetail(token);
  };

  if (loadingDetail && !payslip) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Chi tiết phiếu lương" canGoBack />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải chi tiết bảng lương...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!payslip) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Chi tiết phiếu lương" canGoBack />
        <View style={styles.centerLoading}>
          <Icon name="lock-alert-outline" size={60} color="#F59E0B" />
          <Text style={styles.errorTitle}>Cần xác thực bảo mật</Text>
          <Text style={styles.errorSubtitle}>
            Vui lòng nhập mã PIN để xem thông tin thu nhập chi tiết.
          </Text>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => setPinModalVisible(true)}
          >
            <Icon name="key-outline" size={18} color="#FFFFFF" />
            <Text style={styles.unlockBtnText}>Nhập mã PIN</Text>
          </TouchableOpacity>
        </View>

        <PinModal
          visible={pinModalVisible}
          onClose={() => setPinModalVisible(false)}
          onVerifyPin={handleVerifyPin}
          onSetupPin={handleSetupPin}
          onSuccess={handlePinSuccess}
        />
      </SafeAreaView>
    );
  }

  const earnings = payslip.earnings || {};
  const deductions = payslip.deductions || {};
  const user = payslip.userId || {};
  const allowances = earnings.allowances || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title={`Phiếu lương T${payslip.month}/${payslip.year}`} canGoBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Net Salary Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>THỰC LĨNH</Text>
          <Text style={styles.heroAmount}>{formatCurrency(payslip.netSalary)}</Text>

          <View style={styles.heroInfoRow}>
            <View style={styles.heroBadge}>
              <Icon
                name={payslip.status === 'paid' ? 'check-decagram' : 'clock-check-outline'}
                size={14}
                color={payslip.status === 'paid' ? '#16A34A' : '#0284C7'}
              />
              <Text
                style={[
                  styles.heroBadgeText,
                  { color: payslip.status === 'paid' ? '#16A34A' : '#0284C7' },
                ]}
              >
                {payslip.status === 'paid' ? 'Đã chi trả' : 'Đã phát hành'}
              </Text>
            </View>
            <Text style={styles.heroDate}>
              {payslip.paidAt
                ? `Thanh toán: ${moment(payslip.paidAt).format('DD/MM/YYYY')}`
                : `Phát hành: ${moment(payslip.createdAt).format('DD/MM/YYYY')}`}
            </Text>
          </View>
        </View>

        {/* Section 1: Thông tin nhân viên & Ngày công */}
        <Section title="Thông tin nhân viên & Ngày công" icon="account-badge-outline">
          <DetailRow label="Họ và tên" value={user.fullName || 'Nhân viên'} />
          <DetailRow label="Bộ phận / Chức vụ" value={`${user.department || '--'} - ${user.position || '--'}`} />
          <DetailRow
            label="Ngày công chuẩn"
            value={`${earnings.standardWorkingDays || 22} ngày`}
            icon="calendar-month"
          />
          <DetailRow
            label="Ngày công thực tế"
            value={`${earnings.actualWorkingDays || 0} ngày`}
            valueColor="#16A34A"
            icon="calendar-check"
          />
          {earnings.paidLeaveDays > 0 ? (
            <DetailRow
              label="Nghỉ phép hưởng lương"
              value={`${earnings.paidLeaveDays} ngày`}
              valueColor="#0284C7"
              icon="beach"
            />
          ) : null}
          {earnings.overtimeHours > 0 ? (
            <DetailRow
              label="Giờ làm thêm (OT)"
              value={`${earnings.overtimeHours} giờ`}
              valueColor="#F59E0B"
              icon="clock-plus-outline"
            />
          ) : null}
        </Section>

        {/* Section 2: Các khoản Thu nhập (Earnings) */}
        <Section title="Các khoản thu nhập" icon="cash-plus" iconColor="#16A34A">
          <DetailRow
            label="Lương cơ bản hợp đồng"
            value={formatCurrency(earnings.baseSalary)}
          />
          <DetailRow
            label="Lương theo ngày công thực tế"
            value={formatCurrency(earnings.proratedSalary)}
            subValue={`(${earnings.actualWorkingDays || 0} ngày công / ${earnings.standardWorkingDays || 22} công chuẩn)`}
          />
          {earnings.overtimePay > 0 ? (
            <DetailRow
              label="Tiền làm thêm giờ (OT)"
              value={formatCurrency(earnings.overtimePay)}
              valueColor="#F59E0B"
            />
          ) : null}

          {/* Phụ cấp */}
          {allowances.map((al, idx) => (
            <DetailRow
              key={idx}
              label={al.name || `Phụ cấp ${idx + 1}`}
              value={formatCurrency(al.amount)}
            />
          ))}

          {earnings.bonus > 0 ? (
            <DetailRow label="Thưởng hiệu quả" value={formatCurrency(earnings.bonus)} valueColor="#16A34A" />
          ) : null}

          <DetailRow
            label="TỔNG THU NHẬP (GROSS)"
            value={formatCurrency(earnings.grossSalary)}
            isTotal
            valueColor="#0F172A"
          />
        </Section>

        {/* Section 3: Các khoản Khấu trừ (Deductions) */}
        <Section title="Các khoản khấu trừ" icon="cash-minus" iconColor="#EF4444">
          <DetailRow
            label="Bảo hiểm xã hội (BHXH 8%)"
            value={formatCurrency(deductions.socialInsurance)}
          />
          <DetailRow
            label="Bảo hiểm y tế (BHYT 1.5%)"
            value={formatCurrency(deductions.healthInsurance)}
          />
          <DetailRow
            label="Bảo hiểm thất nghiệp (BHTN 1%)"
            value={formatCurrency(deductions.unemploymentInsurance)}
          />
          <DetailRow
            label="Thuế thu nhập cá nhân (TNCN)"
            value={formatCurrency(deductions.personalIncomeTax)}
            valueColor={deductions.personalIncomeTax > 0 ? '#EF4444' : '#64748B'}
          />

          <DetailRow
            label="TỔNG KHẤU TRỪ"
            value={formatCurrency(deductions.totalDeductions)}
            isTotal
            valueColor="#EF4444"
          />
        </Section>

        {/* Section 4: Tổng kết thực lĩnh */}
        <View style={styles.netSummaryCard}>
          <View style={styles.netRow}>
            <Text style={styles.netSummaryLabel}>Tổng thu nhập Gross:</Text>
            <Text style={styles.netSummaryVal}>{formatCurrency(earnings.grossSalary)}</Text>
          </View>
          <View style={styles.netRow}>
            <Text style={styles.netSummaryLabel}>Tổng khấu trừ:</Text>
            <Text style={[styles.netSummaryVal, { color: '#EF4444' }]}>
              -{formatCurrency(deductions.totalDeductions)}
            </Text>
          </View>
          <View style={styles.netDivider} />
          <View style={styles.netRow}>
            <Text style={styles.netFinalLabel}>THỰC LĨNH NHẬN ĐƯỢC:</Text>
            <Text style={styles.netFinalVal}>{formatCurrency(payslip.netSalary)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* PIN Verification Modal */}
      <PinModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
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
  scrollContent: {
    paddingHorizontal: '16@ms',
    paddingTop: '12@vs',
    paddingBottom: '32@vs',
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: '16@ms',
    padding: '20@ms',
    alignItems: 'center',
    marginBottom: '16@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroLabel: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: '6@vs',
  },
  heroAmount: {
    fontSize: '28@ms',
    fontWeight: '800',
    color: '#22C55E',
    marginBottom: '12@vs',
  },
  heroInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: '12@vs',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: '10@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
  },
  heroBadgeText: {
    fontSize: '11@ms',
    fontWeight: '600',
    marginLeft: '4@ms',
  },
  heroDate: {
    fontSize: '11@ms',
    color: '#94A3B8',
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
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: '6@vs',
    paddingTop: '10@vs',
  },
  highlightRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8@ms',
    paddingHorizontal: '8@ms',
  },
  labelContainer: {
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
  subLabel: {
    fontSize: '11@ms',
    color: '#94A3B8',
    marginTop: '1@vs',
  },
  totalLabel: {
    fontWeight: '700',
    color: '#0F172A',
  },
  detailValue: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: '8@ms',
  },
  totalValue: {
    fontSize: '15@ms',
    fontWeight: '700',
  },
  netSummaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: '14@ms',
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: '4@vs',
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '4@vs',
  },
  netSummaryLabel: {
    fontSize: '13@ms',
    color: '#475569',
  },
  netSummaryVal: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#1E293B',
  },
  netDivider: {
    height: 1,
    backgroundColor: '#BFDBFE',
    marginVertical: '8@vs',
  },
  netFinalLabel: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#1E3A8A',
  },
  netFinalVal: {
    fontSize: '18@ms',
    fontWeight: '800',
    color: '#16A34A',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '24@ms',
  },
  loadingText: {
    marginTop: '12@vs',
    fontSize: '14@ms',
    color: '#64748B',
  },
  errorTitle: {
    fontSize: '17@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginTop: '16@vs',
  },
  errorSubtitle: {
    fontSize: '13@ms',
    color: '#64748B',
    textAlign: 'center',
    marginVertical: '8@vs',
    lineHeight: '18@vs',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: '20@ms',
    paddingVertical: '10@vs',
    borderRadius: '10@ms',
    marginTop: '12@vs',
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: '14@ms',
    fontWeight: '600',
    marginLeft: '6@ms',
  },
});

export default SalaryDetailScreen;
