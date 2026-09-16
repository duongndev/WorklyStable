// screens/employee/profile/EditProfileScreen.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import 'moment/locale/vi';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import AppTextInput from '../../../components/common/AppTextInput';
import AppButton from '../../../components/common/AppButton';
import { updateProfileAction } from '../../../redux/auth/authAction';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { user, updateProfileLoading } = useSelector((state) => state.auth);

  const initialData = route.params?.user || user || {};

  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phoneNumber: initialData.phone || initialData.phoneNumber || '',
    address: initialData.address || '',
    department: initialData.department || '',
    position: initialData.position || '',
  });

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phoneNumber?.trim() || '',
      address: formData.address?.trim() || '',
    };

    try {
      await dispatch(updateProfileAction(payload)).unwrap();
      Alert.alert('Thành công', 'Cập nhật thông tin cá nhân thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err || 'Không thể cập nhật thông tin');
    }
  }, [formData, dispatch, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Chỉnh sửa thông tin" canGoBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section: Thông tin cơ bản */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

            <AppTextInput
              label="Họ và tên *"
              value={formData.fullName}
              onChangeText={(val) => handleChange('fullName', val)}
              placeholder="Nhập họ và tên"
              leftIcon="account-outline"
            />

            <AppTextInput
              label="Email *"
              value={formData.email}
              onChangeText={(val) => handleChange('email', val)}
              placeholder="Nhập email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email-outline"
            />

            <AppTextInput
              label="Số điện thoại"
              value={formData.phoneNumber}
              onChangeText={(val) => handleChange('phoneNumber', val)}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              leftIcon="phone-outline"
            />

            <AppTextInput
              label="Địa chỉ"
              value={formData.address}
              onChangeText={(val) => handleChange('address', val)}
              placeholder="Nhập địa chỉ cư trú"
              leftIcon="map-marker-outline"
            />
          </View>

          {/* Section: Thông tin công việc (Chỉ xem) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin công việc</Text>

            <AppTextInput
              label="Phòng ban"
              value={formData.department || 'Chưa phân bổ'}
              editable={false}
              leftIcon="domain"
            />

            <AppTextInput
              label="Chức vụ"
              value={formData.position || 'Nhân viên'}
              editable={false}
              leftIcon="badge-account-outline"
            />
          </View>

          {/* Nút lưu */}
          <AppButton
            title="Lưu thay đổi"
            onPress={handleSubmit}
            loading={updateProfileLoading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: '16@ms',
    paddingBottom: '32@vs',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '16@ms',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: '15@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '12@vs',
  },
  submitButton: {
    marginTop: '8@vs',
  },
});

export default EditProfileScreen;