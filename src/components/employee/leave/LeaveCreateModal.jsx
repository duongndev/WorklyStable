// components/employee/leave/LeaveRequestModal.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet, vs, s } from 'react-native-size-matters';
import AppButton from '../../../components/common/AppButton';
import AppTextInput from '../../../components/common/AppTextInput';

const { height } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const LEAVE_TYPES = [
  { id: 'annual', label: 'Nghỉ phép năm', icon: 'calendar-star', color: '#3B82F6' },
  { id: 'sick', label: 'Nghỉ ốm', icon: 'medical-bag', color: '#EF4444' },
  { id: 'unpaid', label: 'Không lương', icon: 'cash-off', color: '#F59E0B' },
  { id: 'other', label: 'Khác', icon: 'dots-horizontal', color: '#8B5CF6' },
];

const DATE_REGEX = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatDateInput = (text) => {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
};

const validateDate = (value) => DATE_REGEX.test(value);

const parseDateToMs = (ddmm) => {
  const [dd, mm] = ddmm.split('/').map(Number);
  const year = new Date().getFullYear();
  return new Date(year, mm - 1, dd).getTime();
};

// ─────────────────────────────────────────────
// Sub-component: DateBlock
// ─────────────────────────────────────────────
const DateBlock = ({ label, icon, value, onChange, error, accentColor }) => (
  <View style={[styles.dateBlock, error && styles.dateBlockError]}>
    <View style={[styles.dateHeader, { backgroundColor: accentColor + '15' }]}>
      <Text style={[styles.dateLabel, { color: accentColor }]}>{label}</Text>
    </View>
    <View style={styles.dateInputContainer}>
      <MaterialCommunityIcons
        name={icon}
        size={s(32)}
        color={accentColor}
        style={styles.dateIconBg}
      />
      <TextInput
        style={styles.dateInputBig}
        placeholder="DD/MM"
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        maxLength={5}
        textAlign="center"
      />
    </View>
    {!!error && <Text style={styles.dateError}>{error}</Text>}
  </View>
);

// ─────────────────────────────────────────────
// Main Modal Component
// ─────────────────────────────────────────────
const LeaveCreateModal = ({ visible = false, onClose, onSuccess }) => {
  // Form state
  const [typeIndex, setTypeIndex] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const currentType = LEAVE_TYPES[typeIndex];

  // Reset form khi mở
  useEffect(() => {
    if (visible) {
      setFromDate('');
      setToDate('');
      setReason('');
      setErrors({});
      setTypeIndex(0);
    }
  }, [visible]);

  const cycleType = useCallback(() => {
    setTypeIndex((prev) => (prev + 1) % LEAVE_TYPES.length);
  }, []);

  const handleFromDateChange = useCallback(
    (text) => {
      setFromDate(formatDateInput(text));
      if (errors.fromDate) setErrors((e) => ({ ...e, fromDate: '' }));
    },
    [errors.fromDate]
  );

  const handleToDateChange = useCallback(
    (text) => {
      setToDate(formatDateInput(text));
      if (errors.toDate) setErrors((e) => ({ ...e, toDate: '' }));
    },
    [errors.toDate]
  );

  const validate = useCallback(() => {
    const newErrors = {};

    if (!fromDate) {
      newErrors.fromDate = 'Vui lòng nhập ngày bắt đầu';
    } else if (!validateDate(fromDate)) {
      newErrors.fromDate = 'Định dạng không hợp lệ (DD/MM)';
    }

    if (!toDate) {
      newErrors.toDate = 'Vui lòng nhập ngày kết thúc';
    } else if (!validateDate(toDate)) {
      newErrors.toDate = 'Định dạng không hợp lệ (DD/MM)';
    }

    if (fromDate && toDate && validateDate(fromDate) && validateDate(toDate)) {
      if (parseDateToMs(toDate) < parseDateToMs(fromDate)) {
        newErrors.toDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    if (!reason.trim()) {
      newErrors.reason = 'Vui lòng nhập lý do';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Lý do phải có ít nhất 10 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fromDate, toDate, reason]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSuccess?.();
      onClose?.();
    } catch (error) {
      // Xử lý lỗi nếu cần
    } finally {
      setLoading(false);
    }
  }, [validate, onSuccess, onClose]);

  const dayCount = useMemo(() => {
    if (!validateDate(fromDate) || !validateDate(toDate)) return null;
    const diff = parseDateToMs(toDate) - parseDateToMs(fromDate);
    if (diff < 0) return null;
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.flex}
            >
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Tạo đơn xin nghỉ</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Loại nghỉ */}
                <View style={styles.typeSelector}>
                  <Text style={styles.sectionTitle}>Loại nghỉ</Text>
                  <TouchableOpacity
                    style={[styles.typeChip, { backgroundColor: currentType.color + '15' }]}
                    onPress={cycleType}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={currentType.icon}
                      size={s(20)}
                      color={currentType.color}
                    />
                    <Text style={[styles.typeChipLabel, { color: currentType.color }]}>
                      {currentType.label}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={s(20)}
                      color={currentType.color}
                    />
                  </TouchableOpacity>
                </View>

                {/* Thời gian nghỉ */}
                <Text style={[styles.sectionTitle, { marginTop: vs(16) }]}>
                  Thời gian nghỉ
                </Text>
                <View style={styles.datesRow}>
                  <DateBlock
                    label="TỪ NGÀY"
                    icon="calendar-arrow-right"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    error={errors.fromDate}
                    accentColor={currentType.color}
                  />
                  <MaterialCommunityIcons
                    name="arrow-right-thin"
                    size={s(28)}
                    color="#9CA3AF"
                    style={styles.dateArrow}
                  />
                  <DateBlock
                    label="ĐẾN NGÀY"
                    icon="calendar-arrow-left"
                    value={toDate}
                    onChange={handleToDateChange}
                    error={errors.toDate}
                    accentColor={currentType.color}
                  />
                </View>

                {/* Số ngày */}
                {dayCount !== null && dayCount > 0 && (
                  <View style={styles.dayCountBadge}>
                    <MaterialCommunityIcons name="calendar-clock" size={16} color={currentType.color} />
                    <Text style={[styles.dayCountText, { color: currentType.color }]}>
                      {dayCount} ngày
                    </Text>
                  </View>
                )}

                {/* Lý do */}
                <Text style={[styles.sectionTitle, { marginTop: vs(16) }]}>
                  Lý do
                </Text>
                <AppTextInput
                  placeholder="Nhập lý do xin nghỉ..."
                  value={reason}
                  onChangeText={(t) => {
                    setReason(t);
                    if (errors.reason) setErrors((e) => ({ ...e, reason: '' }));
                  }}
                  multiline
                  style={styles.reasonContainer}
                  placeholderTextColor="#9CA3AF"
                  textArea
                  error={errors.reason}
                  disabled={loading}
                />

                {/* Info */}
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="information-outline" size={s(18)} color="#6B7280" />
                  <Text style={styles.infoText}>
                    Đơn sẽ được gửi đến quản lý trực tiếp để phê duyệt.
                  </Text>
                </View>

                {/* Nút gửi */}
                <AppButton
                  title={loading ? 'Đang gửi...' : 'Gửi đơn xin nghỉ'}
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading}
                  style={{
                    backgroundColor: currentType.color,
                    marginTop: vs(20),
                  }}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

export default LeaveCreateModal;

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = ScaledSheet.create({
  flex: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    maxHeight: height * 0.9,
  },
  safeArea: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '20@s',
    paddingTop: '16@vs',
    paddingBottom: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: '18@s',
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: '4@s',
  },
  content: {
    paddingHorizontal: '20@s',
    paddingTop: '16@vs',
    paddingBottom: '40@vs',
  },
  sectionTitle: {
    fontSize: '12@s',
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: '8@vs',
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '14@s',
    paddingVertical: '8@vs',
    borderRadius: 20,
    gap: 8,
  },
  typeChipLabel: {
    fontSize: '14@s',
    fontWeight: '600',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dateArrow: {
    marginTop: '28@vs',
  },
  dateBlock: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    overflow: 'hidden',
    minHeight: '100@vs',
  },
  dateBlockError: {
    borderColor: '#FCA5A5',
  },
  dateHeader: {
    paddingVertical: '6@vs',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: '10@s',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateInputContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '6@vs',
    position: 'relative',
  },
  dateIconBg: {
    position: 'absolute',
    opacity: 0.08,
  },
  dateInputBig: {
    fontSize: '20@s',
    fontWeight: '700',
    color: '#111827',
    width: '100%',
    padding: 0,
  },
  dateError: {
    fontSize: '10@s',
    color: '#EF4444',
    textAlign: 'center',
    paddingBottom: '4@vs',
  },
  dayCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '8@vs',
    paddingVertical: '6@vs',
    paddingHorizontal: '12@s',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dayCountText: {
    fontSize: '13@s',
    fontWeight: '600',
  },
  reasonContainer: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    padding: '14@s',
    height: '100@vs',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: '16@vs',
    backgroundColor: '#F3F4F6',
    padding: '14@s',
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: '13@s',
    color: '#6B7280',
    lineHeight: 18,
  },
});