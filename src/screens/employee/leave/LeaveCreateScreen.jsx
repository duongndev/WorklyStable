// screens/employee/leave/LeaveCreateScreen.jsx
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet, vs, s, verticalScale } from 'react-native-size-matters';
import DateTimePicker from '@react-native-community/datetimepicker';

import Header from '../../../components/common/Header';
import { createLeaveRequestAction, updateLeaveRequestAction } from '../../../redux/leave/leaveAction';
import { getDetailLeavesRequestApi } from '../../../api/leaveAPI';
import COLORS from '../../../assets/styles/color';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const LEAVE_TYPES = [
  { id: 'annual_leave', label: 'Nghỉ phép năm', icon: 'calendar-star', color: '#2563EB' },
  { id: 'holiday_leave', label: 'Nghỉ lễ', icon: 'calendar-heart', color: '#10B981' },
  { id: 'sick_leave', label: 'Nghỉ ốm', icon: 'medical-bag', color: '#EF4444' },
  { id: 'unpaid_leave', label: 'Không lương', icon: 'cash-off', color: '#F59E0B' },
  { id: 'maternity_leave', label: 'Thai sản', icon: 'baby-carriage', color: '#EC4899' },
  { id: 'personal_leave', label: 'Việc riêng', icon: 'account', color: '#8B5CF6' },
  { id: 'compassionate_leave', label: 'Hiếu hỉ', icon: 'heart', color: '#14B8A6' },
  { id: 'marriage_leave', label: 'Kết hôn', icon: 'ring', color: '#F43F5E' },
  { id: 'paternity_leave', label: 'Nghỉ sinh (Nam)', icon: 'human-male-child', color: '#06B6D4' },
  { id: 'study_leave', label: 'Đi học', icon: 'book-education', color: '#6366F1' },
  { id: 'other', label: 'Khác', icon: 'dots-horizontal', color: '#64748B' },
];

const DURATION_TYPES = [
  { id: 'full_day', label: 'Cả ngày' },
  { id: 'half_day', label: 'Nửa ngày' },
  { id: 'time_based', label: 'Theo giờ' },
];

const SESSIONS = [
  { id: 'morning', label: 'Sáng' },
  { id: 'afternoon', label: 'Chiều' },
];

const formatDate = (date) => {
  if (!date) return '';
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}/${m}`;
};

const formatTime = (date) => {
  if (!date) return '';
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const LeaveCreateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const editId = route.params?.id || route.params?.leave?._id;

  // ── Form State ──
  const [selectedType, setSelectedType] = useState('annual_leave');
  const [durationType, setDurationType] = useState('full_day');
  const [session, setSession] = useState('morning');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [fromTime, setFromTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [toTime, setToTime] = useState(new Date(new Date().setHours(12, 0, 0, 0)));
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // ── Modals / Pickers ──
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [pickerMode, setPickerMode] = useState(null); // 'fromDate' | 'toDate' | 'fromTime' | 'toTime'

  const currentType = useMemo(
    () => LEAVE_TYPES.find((t) => t.id === selectedType) || LEAVE_TYPES[0],
    [selectedType],
  );

  // ── Load detail if in Edit mode ──
  useEffect(() => {
    if (editId) {
      setInitialLoading(true);
      getDetailLeavesRequestApi(editId)
        .then((res) => {
          const item = res?.data || res;
          if (item) {
            if (item.leaveType) setSelectedType(item.leaveType);
            if (item.leaveDurationType) setDurationType(item.leaveDurationType);
            if (item.session) setSession(item.session);
            if (item.reason) setReason(item.reason);
            if (item.startDate) setFromDate(new Date(item.startDate));
            if (item.endDate) setToDate(new Date(item.endDate));
          }
        })
        .catch((err) => {
          Alert.alert('Lỗi', 'Không thể tải thông tin đơn nghỉ để chỉnh sửa.');
        })
        .finally(() => {
          setInitialLoading(false);
        });
    }
  }, [editId]);

  // ── Tính số ngày nghỉ ──
  const dayCount = useMemo(() => {
    if (durationType === 'half_day') return 0.5;
    if (durationType === 'time_based') return 0.25;

    const start = moment(fromDate).startOf('day');
    const end = moment(toDate).startOf('day');
    const diff = end.diff(start, 'days') + 1;
    return Math.max(1, diff);
  }, [durationType, fromDate, toDate]);

  // ── Validate & Submit ──
  const handleSubmit = useCallback(async () => {
    if (!reason.trim()) {
      Alert.alert('Lưu ý', 'Vui lòng nhập lý do xin nghỉ phép.');
      return;
    }

    setLoading(true);

    const startDateStr = moment(fromDate).format('YYYY-MM-DD');
    const endDateStr = durationType === 'full_day' ? moment(toDate).format('YYYY-MM-DD') : startDateStr;
    const startTimeStr = durationType === 'time_based' ? moment(fromTime).format('HH:mm') : (session === 'morning' ? '08:00' : '13:30');
    const endTimeStr = durationType === 'time_based' ? moment(toTime).format('HH:mm') : (session === 'morning' ? '12:00' : '17:30');

    const payload = {
      leaveType: selectedType,
      leaveDurationType: durationType,
      session: durationType === 'half_day' ? session : undefined,
      startDate: startDateStr,
      endDate: endDateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      reason: reason.trim(),
    };

    try {
      if (editId) {
        await dispatch(updateLeaveRequestAction({ id: editId, data: payload })).unwrap();
        Alert.alert('Thành công', 'Cập nhật đơn xin nghỉ thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await dispatch(createLeaveRequestAction(payload)).unwrap();
        Alert.alert('Thành công', 'Gửi đơn xin nghỉ phép thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert(
        'Lỗi',
        typeof error === 'string'
          ? error
          : error?.message || (editId ? 'Lỗi khi cập nhật đơn.' : 'Lỗi khi gửi đơn xin nghỉ.'),
      );
    } finally {
      setLoading(false);
    }
  }, [editId, dispatch, navigation, selectedType, durationType, session, fromDate, toDate, fromTime, toTime, reason]);

  const handlePickerChange = (event, selectedDate) => {
    const currentPicker = pickerMode;
    setPickerMode(null);
    if (selectedDate && event.type !== 'dismissed') {
      if (currentPicker === 'fromDate') {
        setFromDate(selectedDate);
        if (moment(selectedDate).isAfter(moment(toDate))) {
          setToDate(selectedDate);
        }
      } else if (currentPicker === 'toDate') {
        if (moment(selectedDate).isBefore(moment(fromDate))) {
          Alert.alert('Lưu ý', 'Ngày kết thúc không thể trước ngày bắt đầu.');
          setToDate(fromDate);
        } else {
          setToDate(selectedDate);
        }
      } else if (currentPicker === 'fromTime') {
        setFromTime(selectedDate);
      } else if (currentPicker === 'toTime') {
        setToTime(selectedDate);
      }
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title={editId ? 'Chỉnh sửa đơn nghỉ' : 'Tạo đơn xin nghỉ'} canGoBack onBack={() => navigation.goBack()} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title={editId ? 'Chỉnh sửa đơn nghỉ' : 'Tạo đơn xin nghỉ'}
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card 1: Chọn loại nghỉ phép */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Loại nghỉ phép</Text>
            <TouchableOpacity
              style={styles.selectTypeBtn}
              onPress={() => setShowTypeModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.typeLeft}>
                <View style={[styles.typeIconCircle, { backgroundColor: currentType.color + '15' }]}>
                  <MaterialCommunityIcons name={currentType.icon} size={22} color={currentType.color} />
                </View>
                <Text style={styles.typeLabelText}>{currentType.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Card 2: Hình thức nghỉ (Cả ngày / Nửa ngày / Theo giờ) */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Hình thức nghỉ</Text>
            <View style={styles.durationRow}>
              {DURATION_TYPES.map((d) => {
                const isSelected = durationType === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.durationPill, isSelected && styles.durationPillActive]}
                    onPress={() => setDurationType(d.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        isSelected && styles.durationPillTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Nếu chọn Nửa ngày: chọn Ca sáng / Ca chiều */}
            {durationType === 'half_day' ? (
              <View style={styles.sessionRow}>
                {SESSIONS.map((sItem) => {
                  const isSelected = session === sItem.id;
                  return (
                    <TouchableOpacity
                      key={sItem.id}
                      style={[styles.sessionBtn, isSelected && styles.sessionBtnActive]}
                      onPress={() => setSession(sItem.id)}
                    >
                      <MaterialCommunityIcons
                        name={sItem.id === 'morning' ? 'weather-sunny' : 'weather-sunset'}
                        size={18}
                        color={isSelected ? '#2563EB' : '#64748B'}
                      />
                      <Text style={[styles.sessionBtnText, isSelected && styles.sessionBtnTextActive]}>
                        {sItem.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>

          {/* Card 3: Thời gian nghỉ */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Thời gian</Text>

            {durationType === 'full_day' ? (
              <View style={styles.dateTimeGrid}>
                <View style={styles.dateTimeCol}>
                  <Text style={styles.dateTimeSubLbl}>Từ ngày</Text>
                  <TouchableOpacity
                    style={styles.pickerBox}
                    onPress={() => setPickerMode('fromDate')}
                  >
                    <MaterialCommunityIcons name="calendar" size={18} color="#2563EB" />
                    <Text style={styles.pickerValText}>{moment(fromDate).format('DD/MM/YYYY')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateTimeCol}>
                  <Text style={styles.dateTimeSubLbl}>Đến ngày</Text>
                  <TouchableOpacity
                    style={styles.pickerBox}
                    onPress={() => setPickerMode('toDate')}
                  >
                    <MaterialCommunityIcons name="calendar" size={18} color="#2563EB" />
                    <Text style={styles.pickerValText}>{moment(toDate).format('DD/MM/YYYY')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.dateTimeGrid}>
                <View style={styles.dateTimeCol}>
                  <Text style={styles.dateTimeSubLbl}>Ngày nghỉ</Text>
                  <TouchableOpacity
                    style={styles.pickerBox}
                    onPress={() => setPickerMode('fromDate')}
                  >
                    <MaterialCommunityIcons name="calendar" size={18} color="#2563EB" />
                    <Text style={styles.pickerValText}>{moment(fromDate).format('DD/MM/YYYY')}</Text>
                  </TouchableOpacity>
                </View>

                {durationType === 'time_based' ? (
                  <View style={styles.dateTimeCol}>
                    <Text style={styles.dateTimeSubLbl}>Khung giờ</Text>
                    <View style={styles.timeBoxRow}>
                      <TouchableOpacity
                        style={styles.timeMiniBtn}
                        onPress={() => setPickerMode('fromTime')}
                      >
                        <Text style={styles.pickerValText}>{formatTime(fromTime)}</Text>
                      </TouchableOpacity>
                      <Text style={{ marginHorizontal: 4, color: '#94A3B8' }}>-</Text>
                      <TouchableOpacity
                        style={styles.timeMiniBtn}
                        onPress={() => setPickerMode('toTime')}
                      >
                        <Text style={styles.pickerValText}>{formatTime(toTime)}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {/* Total Days Summary Banner */}
            <View style={styles.totalDaysBanner}>
              <Text style={styles.totalDaysKey}>Tổng thời gian nghỉ dự kiến:</Text>
              <Text style={styles.totalDaysVal}>{dayCount} ngày</Text>
            </View>
          </View>

          {/* Card 4: Lý do xin nghỉ */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Lý do xin nghỉ</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Nhập lý do chi tiết..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {editId ? 'Cập Nhật Đơn Nghỉ' : 'Gửi Đơn Xin Nghỉ'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DateTime Picker Modal */}
      {pickerMode && (
        <DateTimePicker
          value={
            pickerMode === 'fromDate'
              ? fromDate
              : pickerMode === 'toDate'
              ? toDate
              : pickerMode === 'fromTime'
              ? fromTime
              : toTime
          }
          mode={pickerMode.includes('Time') ? 'time' : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      )}

      {/* Modal chọn loại nghỉ phép */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalSheetTitle}>Chọn loại nghỉ phép</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {LEAVE_TYPES.map((item) => {
                const isSelected = selectedType === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.typeOptionRow, isSelected && styles.typeOptionRowSelected]}
                    onPress={() => {
                      setSelectedType(item.id);
                      setShowTypeModal(false);
                    }}
                  >
                    <View style={[styles.typeIconCircle, { backgroundColor: item.color + '15' }]}>
                      <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text
                      style={[
                        styles.typeOptionText,
                        isSelected && { color: '#2563EB', fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <MaterialCommunityIcons name="check" size={20} color="#2563EB" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  scrollContent: {
    paddingHorizontal: '16@ms',
    paddingTop: '12@vs',
    paddingBottom: '36@vs',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '10@vs',
  },
  selectTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: '12@ms',
    padding: '12@ms',
  },
  typeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconCircle: {
    width: '36@ms',
    height: '36@ms',
    borderRadius: '18@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10@ms',
  },
  typeLabelText: {
    fontSize: '14@ms',
    fontWeight: '600',
    color: '#0F172A',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: '10@vs',
    marginHorizontal: '4@ms',
    backgroundColor: '#F8FAFC',
    borderRadius: '10@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  durationPillText: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#64748B',
  },
  durationPillTextActive: {
    color: '#FFFFFF',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '12@vs',
  },
  sessionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '8@vs',
    marginHorizontal: '4@ms',
    backgroundColor: '#EFF6FF',
    borderRadius: '8@ms',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sessionBtnActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  sessionBtnText: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: '#64748B',
    marginLeft: '6@ms',
  },
  sessionBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  dateTimeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeCol: {
    flex: 1,
    marginHorizontal: '4@ms',
  },
  dateTimeSubLbl: {
    fontSize: '11@ms',
    color: '#64748B',
    marginBottom: '6@vs',
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: '10@ms',
    padding: '10@ms',
  },
  pickerValText: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: '6@ms',
  },
  timeBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeMiniBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: '8@ms',
    paddingVertical: '10@vs',
    alignItems: 'center',
  },
  totalDaysBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: '10@ms',
    padding: '12@ms',
    marginTop: '12@vs',
  },
  totalDaysKey: {
    fontSize: '12@ms',
    color: '#2563EB',
    fontWeight: '500',
  },
  totalDaysVal: {
    fontSize: '14@ms',
    color: '#1E40AF',
    fontWeight: '800',
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: '10@ms',
    padding: '12@ms',
    fontSize: '13@ms',
    color: '#0F172A',
    minHeight: '80@vs',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: '14@ms',
    paddingVertical: '14@vs',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '8@vs',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: '15@ms',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '24@ms',
    borderTopRightRadius: '24@ms',
    padding: '20@ms',
    maxHeight: '70%',
  },
  modalHandle: {
    width: '40@ms',
    height: '4@vs',
    borderRadius: '2@ms',
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: '12@vs',
  },
  modalSheetTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '14@vs',
    textAlign: 'center',
  },
  typeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '10@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  typeOptionRowSelected: {
    backgroundColor: '#EFF6FF',
    borderRadius: '10@ms',
    paddingHorizontal: '8@ms',
  },
  typeOptionText: {
    flex: 1,
    fontSize: '14@ms',
    fontWeight: '600',
    color: '#334155',
    marginLeft: '6@ms',
  },
});

export default LeaveCreateScreen;
