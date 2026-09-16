import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScaledSheet } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import RNBiometrics from 'react-native-biometrics';

import AppButton from '../../components/common/AppButton';
import AppTextInput from '../../components/common/AppTextInput';
import { loginAction, updateFCMTokenAction, getUserInfoAction } from '../../redux/auth/authAction';
import { getFCMToken, getBiometricCredentials, saveBiometricCredentials, saveTokens } from '../../services/storageService';
import { saveSecureBiometricCredentials, getSecureRefreshToken, saveSecureRefreshToken, clearSecureCredentials } from '../../services/secureStorageService';
import { refreshTokenApi } from '../../services/tokenService';
import { navigateBasedOnRole } from '../../utils/navigationHelpers';
import logo from '../../assets/images/logo_removebg.png';

const LoginScreen = () => {
  // ---- Form state ----
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ---- Error state ----
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // ---- Redux ----
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { loginLoading } = useSelector((state) => state.auth);

  // ---- Biometrics ----
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState(null);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const rnBiometrics = useRef(new RNBiometrics()).current;

  // ---- Animation ----
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ---- Input change handlers ----
  const handleEmailChange = useCallback((text) => {
    setEmail(text);
    setEmailError('');
    setGeneralError('');
  }, []);

  const handlePasswordChange = useCallback((text) => {
    setPassword(text);
    setPasswordError('');
    setGeneralError('');
  }, []);

  const handleUnknownRole = useCallback(() => {
    Alert.alert('Lỗi', 'Không xác định được vai trò người dùng.');
  }, []);

  /** Cập nhật FCM token sau khi đăng nhập thành công */
  const updateFCMTokenInBackground = useCallback(async () => {
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        dispatch(updateFCMTokenAction({ fcmToken }));
      }
    } catch (error) {
      console.error('Lỗi cập nhật FCM token:', error);
    }
  }, [dispatch]);

  // ---- Validation ----
  const validateForm = useCallback(() => {
    let isValid = true;
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Email không hợp lệ');
      isValid = false;
    }
    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu tối thiểu 6 ký tự');
      isValid = false;
    }
    return isValid;
  }, [email, password]);

  /** Xử lý đăng nhập bằng Face ID / Touch ID / Vân tay */
  const handleBiometricLogin = useCallback(async () => {
    if (!biometricsAvailable || !hasBiometricCredentials || biometricLoading) return;

    setBiometricLoading(true);
    setGeneralError('');

    try {
      // 1. Bắt buộc xác thực sinh trắc học TRƯỚC — không xác thực thì không đăng nhập
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Xác thực sinh trắc học để đăng nhập Workly',
        fallbackPromptMessage: 'Nhập mật khẩu thiết bị',
        cancelButtonText: 'Hủy',
      });

      if (!success) {
        // Người dùng hủy xác thực — dừng lại, không đăng nhập
        return;
      }

      // 2. Luồng ưu tiên: refresh token bảo mật (chỉ chạy sau khi đã xác thực sinh trắc học)
      const secureToken = await getSecureRefreshToken();
      if (secureToken) {
        try {
          const response = await refreshTokenApi(secureToken);
          const payload = response.data || response;
          const newAccessToken = payload?.accessToken || payload?.tokens?.accessToken;
          const newRefreshToken = payload?.refreshToken || payload?.tokens?.refreshToken;

          if (response.success && newAccessToken) {
            const tokens = {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken || secureToken,
            };

            try {
              await saveTokens(tokens.accessToken, tokens.refreshToken);
              if (newRefreshToken) {
                await saveSecureRefreshToken(newRefreshToken);
              }
            } catch (saveErr) {
              console.warn('Không thể lưu token khi đăng nhập sinh trắc học:', saveErr);
            }

            // Đồng bộ token vào Redux store để các request sau dùng được ngay
            dispatch({ type: 'auth/refreshToken/fulfilled', payload: { tokens } });

            const user = await dispatch(getUserInfoAction()).unwrap();
            updateFCMTokenInBackground();
            navigateBasedOnRole(navigation, user?.role, handleUnknownRole);
            return;
          }
        } catch (refreshErr) {
          console.warn(
            'Làm mới token thất bại, chuyển sang đăng nhập bằng credentials:',
            refreshErr?.message || refreshErr,
          );
        }
      }

      // 3. Fallback: đăng nhập bằng email/mật khẩu đã lưu
      const creds = await getBiometricCredentials();
      if (creds?.email && creds?.password) {
        const resultAction = await dispatch(
          loginAction({ email: creds.email, password: creds.password }),
        );

        if (loginAction.fulfilled.match(resultAction)) {
          const { tokens, user } = resultAction.payload;
          try {
            if (tokens?.refreshToken) {
              await saveSecureRefreshToken(tokens.refreshToken);
            }
          } catch (saveErr) {
            console.warn('Không thể lưu refresh token bảo mật:', saveErr);
          }
          updateFCMTokenInBackground();
          navigateBasedOnRole(navigation, user?.role, handleUnknownRole);
          return;
        }

        if (loginAction.rejected.match(resultAction)) {
          // Cả refresh token lẫn credentials đều không hợp lệ → yêu cầu đăng nhập bằng mật khẩu
          try {
            await clearSecureCredentials();
          } catch (clearErr) {
            console.warn('Không thể xóa credentials sinh trắc học:', clearErr);
          }
          await saveBiometricCredentials(null, null);
          setHasBiometricCredentials(false);
          setGeneralError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng mật khẩu.');
          return;
        }
      }

      // Chưa có credentials — yêu cầu đăng nhập thường
      Alert.alert(
        'Chưa kích hoạt',
        'Vui lòng đăng nhập bằng mật khẩu để kích hoạt đăng nhập sinh trắc học.',
      );
    } catch (error) {
      console.error('Biometric login error:', error);
      setGeneralError('Đã có lỗi xảy ra khi xác thực sinh trắc học.');
    } finally {
      setBiometricLoading(false);
    }
  }, [
    biometricsAvailable,
    hasBiometricCredentials,
    biometricLoading,
    dispatch,
    navigation,
    updateFCMTokenInBackground,
    handleUnknownRole,
    rnBiometrics,
  ]);


  /** Đăng nhập chính */
  const handleLogin = useCallback(async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    setGeneralError('');

    try {
      const resultAction = await dispatch(
        loginAction({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      );

      if (loginAction.fulfilled.match(resultAction)) {
        const { tokens, user } = resultAction.payload;

        // Lưu refresh token + credentials sinh trắc học (không được chặn đăng nhập nếu thất bại)
        try {
          if (tokens?.refreshToken) {
            await saveSecureRefreshToken(tokens.refreshToken);
          }
        } catch (saveErr) {
          console.error('Lỗi lưu refresh token:', saveErr);
        }

        updateFCMTokenInBackground();
        navigateBasedOnRole(navigation, user?.role, handleUnknownRole);
      } else if (loginAction.rejected.match(resultAction)) {
        const errorMessage =
          resultAction.payload || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        setGeneralError(errorMessage);
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      setGeneralError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  }, [
    dispatch,
    email,
    password,
    navigation,
    validateForm,
    updateFCMTokenInBackground,
    handleUnknownRole,
  ]);

  // ---- Check biometrics ----
  const checkBiometrics = useCallback(async () => {
    try {
      const { available, biometryType: type } = await rnBiometrics.isSensorAvailable();
      setBiometricsAvailable(available);
      setBiometryType(type); // 'FaceID' | 'TouchID' | 'Biometrics'

      // Chỉ hiển thị nút đăng nhập nhanh khi người dùng đã kích hoạt tính năng
      const creds = await getBiometricCredentials();
      setHasBiometricCredentials(Boolean(creds?.email && creds?.password));
    } catch (error) {
      console.error('Biometrics check error:', error);
      setBiometricsAvailable(false);
      setHasBiometricCredentials(false);
    }
  }, [rnBiometrics]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    checkBiometrics();
  }, [checkBiometrics, fadeAnim, slideAnim]);

  // ---- Icon Face ID / Touch ID ----
  const getBiometricIcon = () => {
    if (biometryType === 'FaceID') return 'face-recognition';
    if (biometryType === 'TouchID') return 'fingerprint';
    return 'shield-key-outline';
  };

  const getBiometricLabel = () => {
    if (biometryType === 'FaceID') return 'Face ID';
    if (biometryType === 'TouchID') return 'Vân tay';
    return 'Sinh trắc học';
  };

  // ======================= RENDER =======================

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* ===== Logo & Tiêu đề ===== */}
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>WorklyStable</Text>
              <Text style={styles.subtitle}>
                Hệ thống Quản lý Chấm công & Nhân sự
              </Text>
            </View>

            {/* ===== Form ===== */}
            <View>
              <AppTextInput
                label="Địa chỉ email"
                placeholder="example@workly.com"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
                disabled={loginLoading}
                leftIcon={<Icon name="email" size={20} color="#9CA3AF" />}
                containerStyle={styles.inputContainer}
              />

              <AppTextInput
                label="Mật khẩu"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={passwordError}
                disabled={loginLoading}
                leftIcon={<Icon name="lock" size={20} color="#9CA3AF" />}
                containerStyle={styles.inputContainer}
              />

              {/* ===== Biometric Login Button ===== */}
              {biometricsAvailable && hasBiometricCredentials && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={loginLoading || biometricLoading}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={getBiometricIcon()}
                    size={22}
                    color="#2563EB"
                  />
                  <Text style={styles.biometricButtonText}>
                    {biometricLoading
                      ? 'Đang xác thực...'
                      : `Đăng nhập bằng ${getBiometricLabel()}`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* ===== Thông báo lỗi chung ===== */}
              {generalError ? (
                <View style={styles.generalErrorContainer}>
                  <Icon name="error-outline" size={16} color="#DC2626" />
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              ) : null}

              {/* ===== Nút Đăng nhập ===== */}
              <AppButton
                title="Đăng nhập"
                onPress={handleLogin}
                loading={loginLoading}
                style={styles.loginButton}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ======================= STYLES =======================
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: '20@ms',
    paddingVertical: '24@vs',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    paddingHorizontal: '20@ms',
    paddingVertical: '28@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: '24@vs',
  },
  logo: {
    width: '80@ms',
    height: '80@ms',
    marginBottom: '12@vs',
  },
  title: {
    fontSize: '24@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '6@vs',
  },
  subtitle: {
    fontSize: '13@ms',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: '18@vs',
    paddingHorizontal: '12@ms',
  },
  inputContainer: {
    marginBottom: '14@vs',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    marginBottom: '14@vs',
  },
  biometricButtonText: {
    marginLeft: '8@ms',
    fontSize: '14@ms',
    fontWeight: '600',
    color: '#2563EB',
  },
  generalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: '12@ms',
    paddingVertical: '8@vs',
    borderRadius: '8@ms',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: '14@vs',
  },
  generalErrorText: {
    fontSize: '12@ms',
    color: '#DC2626',
    marginLeft: '6@ms',
    flex: 1,
  },
  loginButton: {
    marginTop: '6@vs',
  },
});

export default LoginScreen;