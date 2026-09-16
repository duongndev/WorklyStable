// screens/employee/profile/BiometricSetupScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { registerFaceApi } from '../../../api/authAPI';
import { getUserInfoAction } from '../../../redux/auth/authAction';
import { saveBiometricCredentials, getBiometricCredentials, getRefreshToken, saveSecureBiometricCredentials } from '../../../services/storageService';
import { getSecureRefreshToken, saveSecureRefreshToken, clearSecureCredentials } from '../../../services/secureStorageService';
import { captureFaceAndUpload } from '../../../services/faceService';
import COLORS from '../../../assets/styles/color';

const BiometricSetupScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user || {});

  const [biometryType, setBiometryType] = useState(null);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [isBiometricLoginEnabled, setIsBiometricLoginEnabled] = useState(false);
  const [checkingSensor, setCheckingSensor] = useState(true);

  // Face ID registration photo state
  const [photoUrl, setPhotoUrl] = useState(user?.faceData?.registeredPhotoUrl || '');
  const [updatingFace, setUpdatingFace] = useState(false);

  // 1. Kiểm tra cảm biến phần cứng thiết bị
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        setCheckingSensor(true);
        const rnBiometrics = new ReactNativeBiometrics();
        const { available, biometryType: type } = await rnBiometrics.isSensorAvailable();

        setSensorAvailable(available);
        setBiometryType(type);

        // Kiểm tra xem đã lưu thông tin đăng nhập sinh trắc học trước đó chưa
        const creds = await getBiometricCredentials();
        setIsBiometricLoginEnabled(Boolean(creds?.email && creds?.password));
      } catch (err) {
        console.error('Lỗi kiểm tra sinh trắc học:', err);
      } finally {
        setCheckingSensor(false);
      }
    };

    checkBiometrics();
  }, []);

  // 2. Bật / Tắt xác thực sinh trắc học thiết bị
  const handleToggleBiometricLogin = useCallback(
    async (value) => {
      if (!sensorAvailable) {
        Alert.alert('Không khả dụng', 'Thiết bị của bạn không hỗ trợ cảm biến sinh trắc học hoặc chưa thiết lập vân tay/khuôn mặt trong Cài đặt hệ thống.');
        return;
      }

      if (value) {
        try {
          const rnBiometrics = new ReactNativeBiometrics();
          const { success } = await rnBiometrics.simplePrompt({
            promptMessage: 'Xác thực sinh trắc học để kích hoạt đăng nhập nhanh',
            cancelButtonText: 'Hủy',
          });

          if (success) {
            // Lấy credentials đã lưu hoặc yêu cầu xác thực
            const creds = await getBiometricCredentials();
            if (creds?.email && creds?.password) {
              // Lưu credentials vào Keychain yêu cầu sinh trắc học khi truy cập
              await saveSecureBiometricCredentials(creds.email, creds.password);

              // Đảm bảo có refresh token bảo mật để đăng nhập nhanh
              const secureToken = await getSecureRefreshToken();
              if (!secureToken) {
                const asyncToken = await getRefreshToken();
                if (asyncToken) {
                  await saveSecureRefreshToken(asyncToken);
                }
              }

              setIsBiometricLoginEnabled(true);
              Alert.alert('Thành công', 'Đã kích hoạt đăng nhập nhanh bằng sinh trắc học trên thiết bị này!');
            } else {
              // Chưa có credentials - yêu cầu đăng nhập thông thường trước
              Alert.alert('Thông báo', 'Vui lòng đăng nhập bằng mật khẩu trước khi kích hoạt sinh trắc học.');
              setIsBiometricLoginEnabled(false);
            }
          }
        } catch (err) {
          console.error('Lỗi kích hoạt sinh trắc học:', err);
          Alert.alert('Xác thực thất bại', 'Không thể hoàn tất xác thực sinh trắc học.');
        }
      } else {
        try {
          // Tắt hoàn toàn: xóa credentials ở mọi nơi (kể cả refresh token bảo mật)
          await saveBiometricCredentials('', '');
          await clearSecureCredentials();
          setIsBiometricLoginEnabled(false);
          Alert.alert('Đã tắt', 'Đã tắt tính năng đăng nhập nhanh bằng sinh trắc học.');
        } catch (err) {
          console.error('Lỗi tắt đăng nhập sinh trắc học:', err);
          Alert.alert('Lỗi', 'Không thể tắt tính năng lúc này. Vui lòng thử lại.');
        }
      }
    },
    [sensorAvailable],
  );

  // 3. Chụp ảnh khuôn mặt từ camera và đăng ký lên server
  const handleCaptureFace = useCallback(async () => {
    setUpdatingFace(true);
    try {
      const imageUrl = await captureFaceAndUpload('workly_hrm/faces/registered');
      if (!imageUrl) {
        // Người dùng huỷ camera
        return;
      }

      await registerFaceApi({
        registeredPhotoUrl: imageUrl,
        faceDescriptor: [], // Vector sẽ được tính sau khi server phân tích ảnh
      });

      setPhotoUrl(imageUrl);

      // Tải lại thông tin user để đồng bộ store
      await dispatch(getUserInfoAction()).unwrap().catch(() => {});

      Alert.alert(
        'Đăng ký thành công! ✅',
        'Ảnh khuôn mặt đã được lưu trữ. Hệ thống sẽ sử dụng ảnh này để xác minh khi bạn chấm công bằng Face ID.',
      );
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể đăng ký khuôn mặt.');
    } finally {
      setUpdatingFace(false);
    }
  }, [dispatch]);

  // Tên loại cảm biến sinh trắc học
  const getBiometricName = () => {
    if (biometryType === BiometryTypes.FaceID) return 'Face ID (Nhận diện khuôn mặt)';
    if (biometryType === BiometryTypes.TouchID) return 'Touch ID (Vân tay Apple)';
    if (biometryType === BiometryTypes.Biometrics) return 'Vân tay & Sinh trắc học Android';
    return 'Cảm biến Sinh trắc học';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Cài Đặt Sinh Trắc Học"
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hardware Status Banner */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconBox}>
            <MaterialCommunityIcons
              name={sensorAvailable ? 'fingerprint' : 'fingerprint-off'}
              size={36}
              color={sensorAvailable ? '#2563EB' : '#94A3B8'}
            />
          </View>
          <View style={styles.statusTextBox}>
            <Text style={styles.statusTitle}>
              {checkingSensor ? 'Đang kiểm tra phần cứng...' : getBiometricName()}
            </Text>
            <Text style={styles.statusSub}>
              {sensorAvailable
                ? 'Thiết bị sẵn sàng để xác thực sinh trắc học'
                : 'Cảm biến sinh trắc học chưa khả dụng hoặc chưa được bật trong máy'}
            </Text>
          </View>
        </View>

        {/* 1. Device Biometric Login Switch */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#2563EB" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Đăng nhập nhanh 1 chạm</Text>
              <Text style={styles.cardSub}>
                Sử dụng Vân tay hoặc Face ID trên thiết bị để mở khóa ứng dụng
              </Text>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Kích hoạt trên thiết bị này</Text>
            <Switch
              value={isBiometricLoginEnabled}
              onValueChange={handleToggleBiometricLogin}
              disabled={!sensorAvailable}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={isBiometricLoginEnabled ? '#2563EB' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* 2. Face ID Attendance Registration */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: '#F0FDF4' }]}>
              <MaterialCommunityIcons name="face-recognition" size={20} color="#16A34A" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Đăng Ký Khuôn Mặt Chấm Công</Text>
              <Text style={styles.cardSub}>
                Ảnh mẫu được lưu trữ trên hệ thống để đối chiếu khi chấm công
              </Text>
            </View>
          </View>

          {/* Photo Preview Container */}
          <View style={styles.photoContainer}>
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="account-circle-outline" size={60} color="#94A3B8" />
                <Text style={styles.photoPlaceholderText}>Chưa có ảnh mẫu khuôn mặt</Text>
              </View>
            )}
          </View>

          {/* Nút chụp ảnh bằng camera thực */}
          <TouchableOpacity
            style={[styles.saveBtn, updatingFace && styles.btnDisabled]}
            onPress={handleCaptureFace}
            disabled={updatingFace}
            activeOpacity={0.85}
          >
            {updatingFace ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="camera-front" size={20} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {photoUrl ? 'Chụp Lại Khuôn Mặt' : 'Chụp Ảnh Đăng Ký'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {photoUrl ? (
            <Text style={styles.registeredNote}>
              ✅ Đã đăng ký — có thể chụp lại bất kỳ lúc nào
            </Text>
          ) : null}
        </View>

        {/* 3. Security Guidelines */}
        <View style={styles.guidelinesCard}>
          <View style={styles.guideHeader}>
            <MaterialCommunityIcons name="information-outline" size={18} color="#D97706" />
            <Text style={styles.guideTitle}>Hướng Dẫn Chụp Ảnh Chuẩn Xác</Text>
          </View>
          <Text style={styles.guideItem}>• Chụp góc chính diện khuôn mặt, không nghiêng quá 15 độ.</Text>
          <Text style={styles.guideItem}>• Đảm bảo ánh sáng rõ ràng, không bị chói sáng hoặc bóng râm.</Text>
          <Text style={styles.guideItem}>• Không đeo khẩu trang hoặc kính râm che khuất mắt.</Text>
          <Text style={styles.guideItem}>• Dữ liệu sinh trắc học được mã hóa và bảo mật tuyệt đối.</Text>
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusIconBox: {
    width: '54@ms',
    height: '54@ms',
    borderRadius: '27@ms',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@ms',
  },
  statusTextBox: {
    flex: 1,
  },
  statusTitle: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  statusSub: {
    fontSize: '11@ms',
    color: '#64748B',
    marginTop: '2@vs',
    lineHeight: '16@vs',
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
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  cardHeaderIcon: {
    width: '36@ms',
    height: '36@ms',
    borderRadius: '10@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10@ms',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: '11@ms',
    color: '#64748B',
    marginTop: '1@vs',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10@vs',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#334155',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: '12@vs',
  },
  photoPreview: {
    width: '120@ms',
    height: '120@ms',
    borderRadius: '60@ms',
    borderWidth: 3,
    borderColor: '#2563EB',
  },
  photoPlaceholder: {
    width: '120@ms',
    height: '120@ms',
    borderRadius: '60@ms',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  photoPlaceholderText: {
    fontSize: '10@ms',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: '4@vs',
    paddingHorizontal: '8@ms',
  },
  inputLabel: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6@vs',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: '10@ms',
    paddingHorizontal: '12@ms',
    paddingVertical: '10@vs',
    fontSize: '13@ms',
    color: '#0F172A',
    marginBottom: '8@vs',
  },
  presetRow: {
    flexDirection: 'row',
    marginBottom: '14@vs',
  },
  presetPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: '10@ms',
    paddingVertical: '4@vs',
    borderRadius: '6@ms',
    marginRight: '8@ms',
  },
  presetText: {
    fontSize: '11@ms',
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: '13@ms',
    fontWeight: '700',
    marginLeft: '6@ms',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  guidelinesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: '14@ms',
    padding: '14@ms',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: '12@vs',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '6@vs',
  },
  guideTitle: {
    fontSize: '12@ms',
    fontWeight: '800',
    color: '#92400E',
    marginLeft: '4@ms',
  },
  guideItem: {
    fontSize: '11@ms',
    color: '#B45309',
    lineHeight: '16@vs',
    marginBottom: '2@vs',
  },
});

export default BiometricSetupScreen;
