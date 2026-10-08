// screens/employee/profile/BiometricSetupScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { saveBiometricCredentials, getBiometricCredentials, saveSecureBiometricCredentials } from '../../../services/storageService';
import { clearSecureCredentials } from '../../../services/secureStorageService';

const BiometricSetupScreen = () => {
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth?.user || {});

  const [biometryType, setBiometryType] = useState(null);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [isBiometricLoginEnabled, setIsBiometricLoginEnabled] = useState(false);
  const [checkingSensor, setCheckingSensor] = useState(true);

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

  // 2. Bật/Tắt tính năng đăng nhập bằng sinh trắc học
  const handleToggleBiometricLogin = useCallback(
    async (value) => {
      if (value) {
        if (!sensorAvailable) {
          Alert.alert(
            'Không hỗ trợ',
            'Thiết bị của bạn không có phần cứng sinh trắc học hoặc bạn chưa cài đặt trong Cài đặt hệ thống.',
          );
          return;
        }

        try {
          const rnBiometrics = new ReactNativeBiometrics();
          const { success } = await rnBiometrics.simplePrompt({
            promptMessage: 'Xác thực sinh trắc học để kích hoạt đăng nhập nhanh',
            cancelButtonText: 'Hủy',
          });

          if (success) {
            if (user?.email) {
              await saveBiometricCredentials(user.email, 'BIOMETRIC_TOKEN_PLACEHOLDER');
              await saveSecureBiometricCredentials(user.email, 'BIOMETRIC_TOKEN_PLACEHOLDER');
            }
            setIsBiometricLoginEnabled(true);
            Alert.alert(
              'Thành công',
              'Đã kích hoạt đăng nhập nhanh bằng sinh trắc học cho tài khoản này trên thiết bị.',
            );
          }
        } catch (err) {
          console.error('Lỗi xác thực sinh trắc học:', err);
          Alert.alert('Thất bại', 'Không thể xác thực sinh trắc học.');
        }
      } else {
        try {
          await saveBiometricCredentials('', '');
          await clearSecureCredentials();
          setIsBiometricLoginEnabled(false);
          Alert.alert('Đã tắt', 'Đã hủy kích hoạt đăng nhập nhanh trên thiết bị này.');
        } catch (err) {
          console.error('Lỗi hủy sinh trắc học:', err);
        }
      }
    },
    [sensorAvailable, user?.email],
  );

  // Tên loại cảm biến sinh trắc học
  const getBiometricName = () => {
    if (biometryType === BiometryTypes.FaceID) return 'Face ID (Nhận diện khuôn mặt Apple)';
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

        {/* Device Biometric Login Switch */}
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

        {/* Security & Attendance Policy Note */}
        <View style={styles.guidelinesCard}>
          <View style={styles.guideHeader}>
            <MaterialCommunityIcons name="map-marker-check" size={18} color="#2563EB" />
            <Text style={styles.guideTitle}>Chính Sách Chấm Công</Text>
          </View>
          <Text style={styles.guideItem}>• Hệ thống hiện áp dụng phương thức chấm công bằng định vị vị trí (GPS) tại nơi làm việc.</Text>
          <Text style={styles.guideItem}>• Sinh trắc học trên thiết bị chỉ dùng cho mục đích mở khóa và bảo mật đăng nhập nhanh.</Text>
          <Text style={styles.guideItem}>• Dữ liệu sinh trắc học được lưu trữ an toàn trong vùng bảo mật (Secure Enclave / Keystore) của điện thoại.</Text>
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
  guidelinesCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: '14@ms',
    padding: '14@ms',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: '12@vs',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '6@vs',
  },
  guideTitle: {
    fontSize: '13@ms',
    fontWeight: '800',
    color: '#1D4ED8',
    marginLeft: '4@ms',
  },
  guideItem: {
    fontSize: '11@ms',
    color: '#1E40AF',
    lineHeight: '17@vs',
    marginBottom: '4@vs',
  },
});

export default BiometricSetupScreen;
