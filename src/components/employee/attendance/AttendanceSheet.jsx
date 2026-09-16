import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';
import ReactNativeBiometrics from 'react-native-biometrics';
import FaceAttendanceModal from './FaceAttendanceModal';

import {
  BRAND_COLOR,
  SUCCESS,
  DANGER,
} from '../../../constants/color';

const formatTime = (date) => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const AttendanceSheet = ({ visible, type, onClose, onSuccess, onError, latitude, longitude, workplaceId }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Hiệu ứng icon: nhịp thở + sóng lan tỏa
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;

  const [authState, setAuthState] = useState('idle');
  const [biometryName, setBiometryName] = useState('Sinh trắc học');
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const rnBiometrics = useRef(new ReactNativeBiometrics()).current;
  const hasStartedRef = useRef(false);
  const mountedRef = useRef(true);
  const pulseLoopRef = useRef(null);
  const ring1LoopRef = useRef(null);
  const ring2LoopRef = useRef(null);

  const stopIconEffects = useCallback(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }
    if (ring1LoopRef.current) {
      ring1LoopRef.current.stop();
      ring1LoopRef.current = null;
    }
    if (ring2LoopRef.current) {
      ring2LoopRef.current.stop();
      ring2LoopRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopIconEffects();
    };
  }, [stopIconEffects]);

  const executeAttendanceApi = useCallback(async (extraData = {}) => {
    if (!mountedRef.current) return;
    setAuthState('processing');
    try {
      if (typeof onSuccess === 'function') {
        await onSuccess(extraData);
      }
      if (!mountedRef.current) return;
      setAuthState('success');
      setTimeout(() => {
        if (mountedRef.current && typeof onClose === 'function') onClose();
      }, 2000);
    } catch (error) {
      if (!mountedRef.current) return;
      setAuthState('error');
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === 'string' ? error : 'Chấm công thất bại. Vui lòng kiểm tra lại GPS.');
      if (typeof onError === 'function') onError(msg);
      else Alert.alert('Lỗi Chấm Công', msg);
    }
  }, [onSuccess, onClose, onError]);

  const startAuthentication = useCallback(async () => {
    if (hasStartedRef.current || !mountedRef.current) return;
    hasStartedRef.current = true;
    
    // Bỏ qua xác thực sinh trắc học phần cứng hệ thống (vân tay/face id nội bộ),
    // tiến hành gọi trực tiếp API chấm công (GPS). Nếu lỗi sẽ hiển thị nút Face Attendance.
    await executeAttendanceApi();
  }, [executeAttendanceApi]);

  useEffect(() => {
    if (visible) {
      setAuthState('idle');
      hasStartedRef.current = false;
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, startAuthentication, fadeAnim, slideAnim]);

  // Hiệu ứng icon khi xác thực/chấm công: nhịp thở + 2 vòng sóng lan tỏa
  useEffect(() => {
    if (authState === 'authenticating' || authState === 'processing') {
      pulseAnim.setValue(0);
      ring1Anim.setValue(0);
      ring2Anim.setValue(0);

      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
      );
      ring1LoopRef.current = Animated.loop(
        Animated.timing(ring1Anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      );
      ring2LoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(ring2Anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoopRef.current.start();
      ring1LoopRef.current.start();
      ring2LoopRef.current.start();
    } else {
      stopIconEffects();
      pulseAnim.setValue(0);
      ring1Anim.setValue(0);
      ring2Anim.setValue(0);
    }

    return stopIconEffects;
  }, [authState, stopIconEffects, pulseAnim, ring1Anim, ring2Anim]);

  const handleRetry = () => {
    hasStartedRef.current = false;
    startAuthentication();
  };

  const renderContent = () => {
    const now = new Date();
    const timeStr = formatTime(now);

    if (authState === 'idle') {
      return (
        <View style={styles.contentCenter}>
          <Text style={[styles.authTitle, { marginBottom: 24, fontSize: 16, marginTop: 10 }]}>
            Chọn phương thức chấm công
          </Text>

          <TouchableOpacity style={[styles.primaryBtn, { height: 50, marginBottom: 14 }]} onPress={startAuthentication} activeOpacity={0.85}>
            <MaterialCommunityIcons name="map-marker-radius" size={22} color="#FFFFFF" />
            <Text style={[styles.primaryBtnText, { fontSize: 15 }]}>Chấm công bằng GPS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.faceBtn, { height: 50, marginBottom: 20 }]}
            onPress={() => setShowFaceModal(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="face-recognition" size={22} color="#2563EB" />
            <Text style={[styles.faceBtnText, { fontSize: 15 }]}>Chấm công bằng Khuôn Mặt</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (authState === 'success') {
      return (
        <View style={styles.contentCenter}>
          <View style={styles.successCircle}>
            <MaterialCommunityIcons name="check" size={48} color="#FFF" />
          </View>
          <Text style={styles.successTitle}>
            {type === 'checkin' ? 'Chấm công thành công' : 'Kết thúc ca thành công'}
          </Text>
          <Text style={styles.successTime}>{timeStr}</Text>
          <Text style={styles.successSub}>
            {type === 'checkin' ? 'Chúc bạn một ngày làm việc hiệu quả!' : 'Hẹn gặp lại bạn vào ca làm tiếp theo!'}
          </Text>
        </View>
      );
    }

    if (authState === 'processing') {
      const ringScale = ring1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.2],
      });
      const ringOpacity = ring1Anim.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [0.4, 0.18, 0],
      });
      const ring2Scale = ring2Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.2],
      });
      const ring2Opacity = ring2Anim.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [0.4, 0.18, 0],
      });
      const iconScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.08],
      });

      return (
        <View style={styles.contentCenter}>
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.rippleRing,
                { transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
            <Animated.View
              style={[
                styles.rippleRing,
                { transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.iconCircle,
                { transform: [{ scale: iconScale }] },
              ]}
            >
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={48}
                color="#FFFFFF"
              />
            </Animated.View>
          </View>

          <Text style={styles.authTitle}>
            Đang xác thực tọa độ GPS & Ghi nhận ca...
          </Text>
          <Text style={styles.authSub}>Vui lòng giữ điện thoại tại vị trí làm việc</Text>
          <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 12 }} />
        </View>
      );
    }

    return (
      <View style={styles.contentCenter}>
        <View style={styles.errorCircle}>
          <MaterialCommunityIcons name="alert-circle-outline" size={44} color={DANGER} />
        </View>
        <Text style={styles.errorTitle}>Chưa Hoàn Tất Xác Thực</Text>
        <Text style={styles.errorText}>
          Vui lòng đảm bảo đã bật định vị GPS và cấp quyền truy cập vị trí cho ứng dụng.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry} activeOpacity={0.85}>
          <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Không phát hiện vị trí GPS. Thử lại</Text>
        </TouchableOpacity>

        {/* Nút chấm công bằng khuôn mặt thay thế */}
        <TouchableOpacity
          style={styles.faceBtn}
          onPress={() => setShowFaceModal(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="face-recognition" size={20} color="#2563EB" />
          <Text style={styles.faceBtnText}>Dùng Khuôn Mặt thay thế</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {showFaceModal ? (
        <FaceAttendanceModal
          visible={showFaceModal}
          type={type}
          onSuccess={(extraData) => {
            setShowFaceModal(false);
            // Truyền method: 'face' và photoUrl lên component cha xử lý qua API/Redux
            executeAttendanceApi(extraData);
          }}
          onClose={() => setShowFaceModal(false)}
          onError={(msg) => {
            if (typeof onError === 'function') onError(msg);
            else Alert.alert('Lỗi Chấm Công', msg);
          }}
        />
      ) : (
        <TouchableWithoutFeedback onPress={authState === 'idle' || authState === 'error' ? onClose : null}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.handle} />
                <Text style={styles.sheetTitle}>
                  {type === 'checkin' ? 'Chấm Công Vào Ca' : 'Chấm Công Kết Thúc Ca'}
                </Text>
                {renderContent()}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </Modal>
  );
};

const styles = ScaledSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '24@ms',
    borderTopRightRadius: '24@ms',
    paddingHorizontal: '20@ms',
    paddingTop: '12@vs',
    paddingBottom: Platform.OS === 'ios' ? '34@vs' : '24@vs',
    minHeight: '340@vs',
  },
  handle: {
    width: '44@ms',
    height: '4@vs',
    backgroundColor: '#CBD5E1',
    borderRadius: '2@ms',
    alignSelf: 'center',
    marginBottom: '16@vs',
  },
  sheetTitle: {
    fontSize: '18@ms',
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: '16@vs',
  },
  contentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '6@vs',
  },
  iconContainer: {
    width: '120@ms',
    height: '120@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16@vs',
  },
  rippleRing: {
    position: 'absolute',
    width: '84@ms',
    height: '84@ms',
    borderRadius: '42@ms',
    backgroundColor: '#BFDBFE',
  },
  iconCircle: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '40@ms',
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  authTitle: {
    fontSize: '15@ms',
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: '6@vs',
  },
  authSub: {
    fontSize: '12@ms',
    color: '#64748B',
    textAlign: 'center',
    marginTop: '4@vs',
  },
  successCircle: {
    width: '76@ms',
    height: '76@ms',
    borderRadius: '38@ms',
    backgroundColor: SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '14@vs',
    shadowColor: SUCCESS,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successTitle: {
    fontSize: '18@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '6@vs',
  },
  successTime: {
    fontSize: '24@ms',
    fontWeight: '900',
    color: '#16A34A',
    marginBottom: '6@vs',
  },
  successSub: {
    fontSize: '13@ms',
    color: '#64748B',
    textAlign: 'center',
  },
  errorCircle: {
    width: '68@ms',
    height: '68@ms',
    borderRadius: '34@ms',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  errorTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: '6@vs',
  },
  errorText: {
    fontSize: '12@ms',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: '16@ms',
    lineHeight: '18@vs',
    marginBottom: '16@vs',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    marginBottom: '8@vs',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: '6@ms',
  },
  closeBtn: {
    paddingVertical: '8@vs',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: '13@ms',
    color: '#64748B',
    fontWeight: '600',
  },
  faceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    width: '100%',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    marginBottom: '8@vs',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  faceBtnText: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: '6@ms',
  },
});

export default AttendanceSheet;
