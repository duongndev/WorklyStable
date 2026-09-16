import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import 'moment/locale/vi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { generateMonthlyPayslipsApi } from '../../../api/adminAPI';

const AdminSalaryScreen = () => {
  const navigation = useNavigation();

  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleGeneratePayroll = () => {
    Alert.alert(
      'Xác nhận tính lương',
      `Bạn có chắc chắn muốn hệ thống tự động tính toán bảng lương cho tất cả nhân viên trong Tháng ${selectedMonth}/${selectedYear}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tính toán ngay',
          style: 'default',
          onPress: async () => {
            setGenerating(true);
            try {
              const res = await generateMonthlyPayslipsApi(selectedMonth, selectedYear);
              setGenerationResult(res?.data || res);
              Alert.alert('Thành công', `Đã tính toán xong bảng lương Tháng ${selectedMonth}/${selectedYear}!`);
            } catch (err) {
              Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể tính bảng lương.');
            } finally {
              setGenerating(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Quản Lý Bảng Lương" canGoBack onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Month Selector */}
        <View style={styles.monthCard}>
          <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth}>
            <Icon name="chevron-left" size={24} color="#2563EB" />
          </TouchableOpacity>

          <View style={styles.monthCenter}>
            <Text style={styles.monthTitle}>Kỳ Lương Tháng {selectedMonth}/{selectedYear}</Text>
            <Text style={styles.monthSub}>Chọn kỳ lương để thực hiện tính toán</Text>
          </View>

          <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth}>
            <Icon name="chevron-right" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Generate Card */}
        <View style={styles.generateCard}>
          <View style={styles.genIconCircle}>
            <Icon name="calculator-variant-outline" size={32} color="#2563EB" />
          </View>
          <Text style={styles.genTitle}>Tính Lương Tự Động Toàn Công Ty</Text>
          <Text style={styles.genDesc}>
            Hệ thống sẽ tổng hợp toàn bộ ngày công thực tế, giờ làm thêm OT, các khoản phụ cấp và tự động tính toán thuế TNCN, BHXH/BHYT cho tất cả nhân sự.
          </Text>

          <TouchableOpacity
            style={[styles.genButton, generating && styles.btnDisabled]}
            onPress={handleGeneratePayroll}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="lightning-bolt" size={20} color="#FFFFFF" />
                <Text style={styles.genBtnText}>
                  Tính bảng lương T{selectedMonth}/{selectedYear}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Card */}
        {generationResult ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Icon name="check-decagram" size={22} color="#16A34A" />
              <Text style={styles.resultHeaderTitle}>Kết quả tính lương thành công</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Tổng số phiếu lương đã sinh:</Text>
              <Text style={styles.resultVal}>
                {generationResult.payslips?.length || generationResult.generatedCount || 'Hoàn tất'} phiếu
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Kỳ tính lương:</Text>
              <Text style={styles.resultVal}>Tháng {selectedMonth}/{selectedYear}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Trạng thái phát hành:</Text>
              <Text style={[styles.resultVal, { color: '#0284C7' }]}>Đã phát hành (Published)</Text>
            </View>
          </View>
        ) : null}

        {/* Policy Notice Card */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Quy chuẩn tính lương tự động:</Text>
          <Text style={styles.policyItem}>• Công chuẩn tháng: 22 ngày</Text>
          <Text style={styles.policyItem}>• Khấu trừ bảo hiểm: BHXH 8%, BHYT 1.5%, BHTN 1%</Text>
          <Text style={styles.policyItem}>• Thuế TNCN: Tính lũy tiến theo quy định hiện hành</Text>
          <Text style={styles.policyItem}>• Tăng ca OT: Ngày thường x1.5, Cuối tuần x2.0, Ngày lễ x3.0</Text>
        </View>
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
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '16@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthNavBtn: {
    padding: '8@ms',
    borderRadius: '10@ms',
    backgroundColor: '#EFF6FF',
  },
  monthCenter: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  monthSub: {
    fontSize: '11@ms',
    color: '#64748B',
    marginTop: '2@vs',
  },
  generateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '20@ms',
    alignItems: 'center',
    marginBottom: '14@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  genIconCircle: {
    width: '60@ms',
    height: '60@ms',
    borderRadius: '30@ms',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12@vs',
  },
  genTitle: {
    fontSize: '16@ms',
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: '6@vs',
  },
  genDesc: {
    fontSize: '12@ms',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: '18@vs',
    marginBottom: '18@vs',
    paddingHorizontal: '8@ms',
  },
  genButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  genBtnText: {
    color: '#FFFFFF',
    fontSize: '14@ms',
    fontWeight: '700',
    marginLeft: '6@ms',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  resultCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: '14@ms',
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: '14@vs',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  resultHeaderTitle: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: '6@ms',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '4@vs',
  },
  resultKey: {
    fontSize: '12@ms',
    color: '#475569',
  },
  resultVal: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  policyCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: '14@ms',
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  policyTitle: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: '6@vs',
  },
  policyItem: {
    fontSize: '12@ms',
    color: '#1E3A8A',
    lineHeight: '18@vs',
    marginVertical: '1@vs',
  },
});

export default AdminSalaryScreen;
