// screens/employee/profile/ChangePasswordScreen.jsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import AppTextInput from '../../../components/common/AppTextInput';
import AppButton from '../../../components/common/AppButton';
import { changePasswordAction } from '../../../redux/auth/authAction';
import COLORS from '../../../assets/styles/color';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { changePasswordLoading, error, message } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!formData.currentPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!formData.newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }
    if (formData.newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    try {
      await dispatch(
        changePasswordAction({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      ).unwrap();

      Alert.alert('Thành công', 'Đổi mật khẩu thành công', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      // Error handled in slice
    }
  }, [dispatch, formData, navigation]);

  const renderPasswordInput = ({ field, label, placeholder, show, onToggleShow }) => (
    <View style={styles.inputWrapper}>
      <AppTextInput
        label={label}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => handleChange(field, value)}
        leftIcon="lock-closed-outline"
        rightComponent={
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={onToggleShow}
            activeOpacity={0.7}
          >
            <Ionicons
              name={show ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        }
        secureTextEntry={!show}
        style={styles.textInput}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Đổi mật khẩu"
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#0047BB" />
            <Text style={styles.infoText}>
              Mật khẩu mới phải có ít nhất 6 ký tự và khác mật khẩu hiện tại
            </Text>
          </View>

          {renderPasswordInput({
            field: 'currentPassword',
            label: 'Mật khẩu hiện tại',
            placeholder: 'Nhập mật khẩu hiện tại',
            show: showCurrent,
            onToggleShow: () => setShowCurrent(!showCurrent),
          })}

          {renderPasswordInput({
            field: 'newPassword',
            label: 'Mật khẩu mới',
            placeholder: 'Nhập mật khẩu mới (tối thiểu 6 ký tự)',
            show: showNew,
            onToggleShow: () => setShowNew(!showNew),
          })}

          {renderPasswordInput({
            field: 'confirmPassword',
            label: 'Xác nhận mật khẩu mới',
            placeholder: 'Nhập lại mật khẩu mới',
            show: showConfirm,
            onToggleShow: () => setShowConfirm(!showConfirm),
          })}

          <View style={styles.buttonContainer}>
            <AppButton
              title="Đổi mật khẩu"
              onPress={handleSubmit}
              loading={changePasswordLoading}
              disabled={changePasswordLoading}
              style={styles.saveButton}
            />
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: '16@s',
    paddingTop: '16@vs',
    paddingBottom: '30@vs',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: '10@s',
    padding: '12@s',
    marginBottom: '20@vs',
    gap: '10@s',
  },
  infoText: {
    fontSize: '13@s',
    color: '#1E40AF',
    lineHeight: 20,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: '16@vs',
  },
  textInput: {},
  eyeButton: {
    padding: '8@s',
  },
  buttonContainer: {
    marginTop: '24@vs',
    marginBottom: '16@vs',
  },
  saveButton: {
    backgroundColor: '#0047BB',
  },
});

export default ChangePasswordScreen;