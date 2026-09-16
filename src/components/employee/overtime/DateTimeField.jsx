import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { parseDate, formatOutput } from '../../../utils/Helpers';
import { ScaledSheet } from 'react-native-size-matters';
import COLORS from '../../../assets/styles/color';
import BottomSheet from './BottomSheet';

const DateTimeField = ({
  label,
  mode,
  value,
  onChange,
  minimumDate,
  title,
  error,
}) => {
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [tempDate, setTempDate] = useState(
    value ? parseDate(value, mode) : new Date(),
  );

  const openPicker = () => {
    if (Platform.OS === 'ios') {
      setTempDate(value ? parseDate(value, mode) : new Date());
      setShowIOSSheet(true);
    } else {
      setShowAndroidPicker(true);
    }
  };

  const handleIOSConfirm = () => {
    onChange(formatOutput(tempDate, mode));
    setShowIOSSheet(false);
  };

  const displayValue = value || label;

  return (
    <>
      <TouchableOpacity onPress={openPicker} activeOpacity={0.7}>
        <View style={[styles.inputGroup, error && styles.inputError]}>
          <View style={styles.inputIcon}>
            <MaterialCommunityIcons
              name={
                mode === 'date' ? 'calendar-month-outline' : 'clock-outline'
              }
              size={24}
            />
          </View>
          <Text style={[styles.pickerText, !value && { color: '#9CA3AF' }]}>
            {displayValue}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>

      {/* iOS: Bottom Sheet */}
      {Platform.OS === 'ios' && (
        <BottomSheet
          visible={showIOSSheet}
          onClose={() => setShowIOSSheet(false)}
          title={title}
          height={mode === 'date' ? 400 : 340}
        >
          <DateTimePicker
            value={tempDate}
            mode={mode}
            display="spinner"
            onValueChange={(event, date) => date && setTempDate(date)}
            minimumDate={minimumDate}
            style={styles.picker}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.sheetButton, styles.cancelButton]}
              onPress={() => setShowIOSSheet(false)}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sheetButton,
                { backgroundColor: COLORS.BRAND_COLOR },
              ]}
              onPress={handleIOSConfirm}
            >
              <Text style={styles.confirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      )}

      {/* Android: native dialog */}
      {Platform.OS === 'android' && showAndroidPicker && (
        <DateTimePicker
          value={value ? parseDate(value, mode) : new Date()}
          mode={mode}
          display="default"
          // Sửa lỗi deprecated: tách thành onValueChange và onDismiss
          onValueChange={(event, selectedDate) => {
            setShowAndroidPicker(false);
            if (selectedDate) {
              onChange(formatOutput(selectedDate, mode));
            }
          }}
          onDismiss={() => setShowAndroidPicker(false)}
          minimumDate={minimumDate}
        />
      )}
    </>
  );
};

export default DateTimeField;

const styles = ScaledSheet.create({
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 16, height: '100%' },
  pickerText: { flex: 1, fontSize: 16 },
  inputError: { borderColor: '#EF4444' },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#F1F5F9' },
  cancelText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
