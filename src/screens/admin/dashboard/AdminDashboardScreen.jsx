// screens/admin/dashboard/AdminDashboardScreen.jsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
import { getAdminDashboardSummaryApi } from '../../../api/adminAPI';
import { logoutAction } from '../../../redux/auth/authAction';
import COLORS from '../../../assets/styles/color';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 đ';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
};

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getAdminDashboardSummaryApi();
      if (res?.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard admin:', err);
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

  const handleLogout = useCallback(() => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất quyền Quản trị?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(logoutAction()).unwrap();
          } catch (e) {
            console.log('Admin logout notice:', e);
          } finally {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }
        },
      },
    ]);
  }, [dispatch, navigation]);

  const overview = summary?.overview || {};
  const today = summary?.todayAttendance || {};
  const overtime = summary?.overtimeStats || {};
  const payroll = summary?.payrollStats || {};
  const departments = summary?.departmentDistribution || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Quản Trị Doanh Nghiệp"
        rightComponent={
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Icon name="logout" size={22} color="#EF4444" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY || '#2563EB']}
          />
        }
      >
        {/* 1. Hàng Lối Tắt Đơn Từ Cần Duyệt */}
        <View style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <Text style={styles.pendingTitle}>ĐƠN TỪ CẦN PHÊ DUYỆT</Text>
          </View>

          <View style={styles.pendingRow}>
            <TouchableOpacity
              style={styles.pendingBtn}
              onPress={() => navigation.navigate('LeaveApprovals')}
            >
              <View style={[styles.pendingIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="calendar-clock" size={22} color="#2563EB" />
              </View>
              <Text style={styles.pendingCount}>{overview.pendingLeaves || 0}</Text>
              <Text style={styles.pendingLbl}>Nghỉ phép</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pendingBtn}
              onPress={() => navigation.navigate('OTApprovals')}
            >
              <View style={[styles.pendingIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="clock-time-eight" size={22} color="#D97706" />
              </View>
              <Text style={styles.pendingCount}>{overview.pendingOTs || 0}</Text>
              <Text style={styles.pendingLbl}>Tăng ca OT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pendingBtn}
              onPress={() => navigation.navigate('RegularizationApprovals')}
            >
              <View style={[styles.pendingIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Icon name="clipboard-text-clock" size={22} color="#7C3AED" />
              </View>
              <Text style={styles.pendingCount}>Duyệt</Text>
              <Text style={styles.pendingLbl}>Giải trình</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pendingBtn}
              onPress={() => navigation.navigate('SalaryAdmin')}
            >
              <View style={[styles.pendingIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="cash-sync" size={22} color="#16A34A" />
              </View>
              <Text style={styles.pendingCount}>T{moment().format('M')}</Text>
              <Text style={styles.pendingLbl}>Bảng lương</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Tiện Ích Vận Hành Doanh Nghiệp (QR & Bảng tin) */}
        <View style={styles.quickOpsGrid}>
          <TouchableOpacity
            style={styles.opsCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AttendanceQR')}
          >
            <View style={[styles.opsIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="qrcode-scan" size={24} color="#2563EB" />
            </View>
            <View style={styles.opsTextBox}>
              <Text style={styles.opsTitle}>Mã QR Chấm Công</Text>
              <Text style={styles.opsSub}>Mã QR xoay vòng tại quầy</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opsCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Announcement')}
          >
            <View style={[styles.opsIconBox, { backgroundColor: '#FDF2F8' }]}>
              <Icon name="bullhorn-outline" size={24} color="#DB2777" />
            </View>
            <View style={styles.opsTextBox}>
              <Text style={styles.opsTitle}>Bảng Tin & Tương Tác</Text>
              <Text style={styles.opsSub}>Danh sách bài viết & Trả lời bình luận</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* 3. Tình Hình Chấm Công Hôm Nay */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="account-group" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>
              Chấm công hôm nay ({moment().format('DD/MM/YYYY')})
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={[styles.statNum, { color: '#16A34A' }]}>
                {today.present || 0}
              </Text>
              <Text style={styles.statLbl}>Đúng giờ</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Text style={[styles.statNum, { color: '#D97706' }]}>
                {today.late || 0}
              </Text>
              <Text style={styles.statLbl}>Đi muộn</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={[styles.statNum, { color: '#2563EB' }]}>
                {today.onLeave || 0}
              </Text>
              <Text style={styles.statLbl}>Nghỉ phép</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Text style={[styles.statNum, { color: '#DC2626' }]}>
                {today.notCheckedIn || 0}
              </Text>
              <Text style={styles.statLbl}>Chưa điểm danh</Text>
            </View>
          </View>

          <View style={styles.rateRow}>
            <Text style={styles.rateLbl}>Tỷ lệ có mặt tại văn phòng:</Text>
            <Text style={styles.rateVal}>{today.attendanceRate || '0.0'}%</Text>
          </View>
        </View>

        {/* 5. Phân Bổ Nhân Sự Theo Phòng Ban */}
        {departments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="chart-pie" size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Cơ cấu nhân sự ({overview.totalEmployees || 0} người)</Text>
            </View>

            <View style={styles.deptCard}>
              {departments.map((dept, index) => (
                <View
                  key={index}
                  style={[
                    styles.deptRow,
                    index === departments.length - 1 && styles.deptRowLast,
                  ]}
                >
                  <View style={styles.deptDot} />
                  <Text style={styles.deptName}>{dept.department || 'Chưa phân bổ'}</Text>
                  <Text style={styles.deptCount}>{dept.count} nhân sự</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
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
  logoutBtn: {
    padding: '6@ms',
    borderRadius: '8@ms',
    backgroundColor: '#FEF2F2',
  },
  welcomeCard: {
    backgroundColor: 'transparent',
    borderRadius: '16@ms',
    padding: '16@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14@vs',
  },
  welcomeSub: {
    fontSize: '11@ms',
    color: '#000000',
    marginBottom: '2@vs',
  },
  welcomeName: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#94A3B8',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: '8@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  adminBadgeText: {
    fontSize: '10@ms',
    fontWeight: '800',
    color: '#F59E0B',
    marginLeft: '4@ms',
  },
  pendingCard: {
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
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  pendingTitle: {
    fontSize: '11@ms',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  totalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: '8@ms',
    paddingVertical: '2@vs',
    borderRadius: '8@ms',
  },
  totalBadgeText: {
    fontSize: '11@ms',
    fontWeight: '800',
    color: '#DC2626',
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pendingBtn: {
    width: '23%',
    alignItems: 'center',
  },
  pendingIconBox: {
    width: '44@ms',
    height: '44@ms',
    borderRadius: '12@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6@vs',
  },
  pendingCount: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingLbl: {
    fontSize: '10@ms',
    color: '#64748B',
    marginTop: '2@vs',
    textAlign: 'center',
  },
  quickOpsGrid: {
    marginBottom: '12@vs',
  },
  opsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '14@ms',
    padding: '12@ms',
    marginBottom: '8@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  opsIconBox: {
    width: '40@ms',
    height: '40@ms',
    borderRadius: '10@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@ms',
  },
  opsTextBox: {
    flex: 1,
  },
  opsTitle: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  opsSub: {
    fontSize: '11@ms',
    color: '#64748B',
    marginTop: '2@vs',
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  sectionTitle: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: '6@ms',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '12@vs',
  },
  statBox: {
    width: '23%',
    borderRadius: '10@ms',
    paddingVertical: '8@vs',
    alignItems: 'center',
    borderWidth: 1,
  },
  statNum: {
    fontSize: '16@ms',
    fontWeight: '800',
    marginBottom: '2@vs',
  },
  statLbl: {
    fontSize: '10@ms',
    color: '#64748B',
    textAlign: 'center',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10@vs',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rateLbl: {
    fontSize: '12@ms',
    color: '#64748B',
  },
  rateVal: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#16A34A',
  },
  payrollCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10@ms',
    padding: '12@ms',
  },
  payrollRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '4@vs',
  },
  payrollKey: {
    fontSize: '12@ms',
    color: '#64748B',
  },
  payrollVal: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#16A34A',
  },
  payrollSubVal: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: '8@vs',
  },
  deptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10@ms',
    padding: '12@ms',
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '6@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  deptRowLast: {
    borderBottomWidth: 0,
  },
  deptDot: {
    width: '6@ms',
    height: '6@ms',
    borderRadius: '3@ms',
    backgroundColor: '#7C3AED',
    marginRight: '8@ms',
  },
  deptName: {
    flex: 1,
    fontSize: '12@ms',
    color: '#334155',
    fontWeight: '600',
  },
  deptCount: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomSpacer: {
    height: '20@vs',
  },
});

export default AdminDashboardScreen;
