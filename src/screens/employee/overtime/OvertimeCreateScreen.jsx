// screens/employee/overtime/OvertimeCreateScreen.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { createOvertimeRequestAction } from '../../../redux/overtime/overtimeAction';

const OT_TYPES = [
  { id: 'weekday', label: 'Ngày thường', multiplier: '1.5x', color: '#2563EB', desc: '150% lương giờ cơ bản' },
  { id: 'weekend', label: 'Cuối tuần', multiplier: '2.0x', color: '#D97706', desc: '200% lương giờ cơ bản' },
  { id: 'holiday', label: 'Ngày lễ / Tết', multiplier: '3.0x', color: '#DC2626', desc: '300% lương giờ cơ bản' },
];

const OvertimeCreateScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Form State
  const [selectedOtType, setSelectedOtType] = useState(OT_TYPES[0]);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(18, 0, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(21, 0, 0, 0)));
  const [projectName, setProjectName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Picker States
  const [pickerMode, setPickerMode] = useState('date'); // 'date' | 'time'
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('date'); // 'date' | 'start' | 'end'

  // Tính số giờ làm thêm
  const calculatedHours = useMemo(() => {
    const startMom = moment(startTime);
    const endMom = moment(endTime);
    let diffMinutes = endMom.diff(startMom, 'minutes');
    if (diffMinutes <= 0) diffMinutes += 24 * 60; // Qua đêm
    const hours = Number((diffMinutes / 60).toFixed(1));
    return Math.max(0.5, hours);
  }, [startTime, endTime]);

  const handlePickerChange = (event, selected) => {
    setShowPicker(false);
    if (selected) {
      if (pickerTarget === 'date') {
        setDate(selected);
        // Tự động gợi ý loại ngày dựa vào thứ 7 / CN
        const dayOfWeek = moment(selected).day();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          setSelectedOtType(OT_TYPES[1]); // Weekend
        } else {
          setSelectedOtType(OT_TYPES[0]); // Weekday
        }
      } else if (pickerTarget === 'start') {
        setStartTime(selected);
      } else if (pickerTarget === 'end') {
        setEndTime(selected);
      }
    }
  };

  const openPicker = (target, mode) => {
    setPickerTarget(target);
    setPickerMode(mode);
    setShowPicker(true);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do làm thêm giờ.');
      return;
    }

    const payload = {
      date: moment(date).format('YYYY-MM-DD'),
      startTime: moment(startTime).format('HH:mm'),
      endTime: moment(endTime).format('HH:mm'),
      durationHours: calculatedHours,
      otType: selectedOtType.id,
      projectName: projectName.trim(),
      reason: reason.trim(),
    };

    setLoading(true);
    try {
      await dispatch(createOvertimeRequestAction(payload)).unwrap();
      Alert.alert('Thành công', 'Đơn đăng ký làm thêm giờ đã được gửi thành công!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err || 'Không thể tạo đơn làm thêm giờ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Đăng ký làm thêm giờ (OT)" canGoBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Chọn loại ngày OT */}
        <Text style={styles.sectionHeading}>1. Chọn loại ngày làm thêm</Text>
        <View style={styles.typesRow}>
          {OT_TYPES.map((type) => {
            const isSelected = selectedOtType.id === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  isSelected && { borderColor: type.color, backgroundColor: type.color + '10' },
                ]}
                onPress={() => setSelectedOtType(type)}
              >
                <View style={[styles.multiplierPill, { backgroundColor: type.color }]}>
                  <Text style={styles.multiplierPillText}>{type.multiplier}</Text>
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    isSelected && { color: type.color, fontWeight: '700' },
                  ]}
                >
                  {type.label}
                </Text>
                <Text style={styles.typeDesc}>{type.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Ngày làm thêm */}
        <Text style={styles.sectionHeading}>2. Ngày làm thêm</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => openPicker('date', 'date')}
        >
          <View style={styles.pickerLeft}>
            <Icon name="calendar-month" size={20} color="#2563EB" />
            <Text style={styles.pickerText}>
              {moment(date).format('dddd, DD/MM/YYYY')}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* 3. Khoảng thời gian */}
        <Text style={styles.sectionHeading}>3. Khung giờ làm việc</Text>
        <View style={styles.timePickerRow}>
          <TouchableOpacity
            style={styles.timeCard}
            onPress={() => openPicker('start', 'time')}
          >
            <Text style={styles.timeLabel}>Giờ bắt đầu</Text>
            <View style={styles.timeValRow}>
              <Icon name="clock-start" size={18} color="#2563EB" />
              <Text style={styles.timeValText}>
                {moment(startTime).format('HH:mm')}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.timeArrow}>
            <Icon name="arrow-right" size={20} color="#94A3B8" />
          </View>

          <TouchableOpacity
            style={styles.timeCard}
            onPress={() => openPicker('end', 'time')}
          >
            <Text style={styles.timeLabel}>Giờ kết thúc</Text>
            <View style={styles.timeValRow}>
              <Icon name="clock-end" size={18} color="#2563EB" />
              <Text style={styles.timeValText}>
                {moment(endTime).format('HH:mm')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Calculation Summary Box */}
        <View style={styles.calcBox}>
          <View style={styles.calcItem}>
            <Text style={styles.calcLbl}>Tổng thời lượng:</Text>
            <Text style={styles.calcVal}>{calculatedHours} giờ</Text>
          </View>
          <View style={styles.calcDivider} />
          <View style={styles.calcItem}>
            <Text style={styles.calcLbl}>Hệ số lương:</Text>
            <Text style={[styles.calcVal, { color: selectedOtType.color }]}>
              {selectedOtType.multiplier} ({selectedOtType.label})
            </Text>
          </View>
        </View>

        {/* 4. Dự án & Lý do */}
        <Text style={styles.sectionHeading}>4. Tên dự án / Khách hàng (Tùy chọn)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Dự án Workly Mobile, Triển khai Golive..."
          placeholderTextColor="#94A3B8"
          value={projectName}
          onChangeText={setProjectName}
        />

        <Text style={styles.sectionHeading}>5. Lý do làm thêm giờ *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Mô tả công việc cần xử lý gấp và lý do cần OT..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          value={reason}
          onChangeText={setReason}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Gửi đơn đăng ký OT</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Native DateTimePicker */}
      {showPicker ? (
        <DateTimePicker
          value={
            pickerTarget === 'date'
              ? date
              : pickerTarget === 'start'
              ? startTime
              : endTime
          }
          mode={pickerMode}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      ) : null}
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
  sectionHeading: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginTop: '16@vs',
    marginBottom: '10@vs',
  },
  typesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: '12@ms',
    paddingVertical: '12@vs',
    paddingHorizontal: '6@ms',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  multiplierPill: {
    paddingHorizontal: '8@ms',
    paddingVertical: '2@vs',
    borderRadius: '6@ms',
    marginBottom: '6@vs',
  },
  multiplierPillText: {
    color: '#FFFFFF',
    fontSize: '11@ms',
    fontWeight: '800',
  },
  typeLabel: {
    fontSize: '12@ms',
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '2@vs',
  },
  typeDesc: {
    fontSize: '9@ms',
    color: '#64748B',
    textAlign: 'center',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: '14@ms',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: '14@ms',
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: '10@ms',
    textTransform: 'capitalize',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: '12@ms',
    padding: '12@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeLabel: {
    fontSize: '11@ms',
    color: '#64748B',
    marginBottom: '6@vs',
  },
  timeValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValText: {
    fontSize: '16@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: '6@ms',
  },
  timeArrow: {
    paddingHorizontal: '8@ms',
  },
  calcBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: '12@ms',
    padding: '12@ms',
    marginTop: '12@vs',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  calcItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '2@vs',
  },
  calcLbl: {
    fontSize: '13@ms',
    color: '#475569',
  },
  calcVal: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#1E40AF',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#BFDBFE',
    marginVertical: '6@vs',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12@ms',
    paddingHorizontal: '12@ms',
    paddingVertical: '10@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: '13@ms',
    color: '#0F172A',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12@ms',
    padding: '12@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: '13@ms',
    color: '#0F172A',
    minHeight: '80@vs',
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: '14@vs',
    borderRadius: '14@ms',
    marginTop: '24@vs',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: '15@ms',
    fontWeight: '700',
    marginLeft: '8@ms',
  },
});

export default OvertimeCreateScreen;