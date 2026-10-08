// src/components/employee/attendance/AttendanceSheet.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import { DANGER } from '../../../constants/color';

const formatTime = (date) => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const AttendanceSheet = ({ visible, type, onClose, onSuccess, onError }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Hiệu ứng icon GPS: nhịp thở + sóng radar lan tỏa
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;

  const [authState, setAuthState] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');
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

  const executeAttendanceApi = useCallback(async () => {
    if (!mountedRef.current) return;
    setAuthState('processing');
    setErrorMessage('');
    try {
      if (typeof onSuccess === 'function') {
        await onSuccess({ method: 'gps' });
      }
      if (!mountedRef.current) return;
      setAuthState('success');
      // Ẩn bottom sheet ngay khi thành công
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setAuthState('error');
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === 'string' ? error : 'Chấm công thất bại. Vui lòng kiểm tra lại vị trí GPS.');
      setErrorMessage(msg);
      // Ẩn bottom sheet ngay khi có lỗi
      if (typeof onClose === 'function') {
        onClose();
      }
      if (typeof onError === 'function') {
        onError(msg);
      }
    }
  }, [onSuccess, onClose, onError]);

  // Tự động bắt đầu định vị GPS và gửi chấm công ngay khi mở Sheet
  useEffect(() => {
    if (visible) {
      setAuthState('processing');
      setErrorMessage('');

      // Chạy animation mở sheet mượt mà
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();

      // Bắt đầu định vị GPS ngay lập tức mà không chờ spring animation kết thúc
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        executeAttendanceApi();
      }
    } else {
      hasStartedRef.current = false;
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, executeAttendanceApi, fadeAnim, slideAnim]);

  // Hiệu ứng radar GPS khi đang processing
  useEffect(() => {
    if (authState === 'processing') {
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
    executeAttendanceApi();
  };

  const renderContent = () => {
    const now = new Date();
    const timeStr = formatTime(now);

    // 1. Trạng thái Đang xử lý lấy vị trí GPS
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
                size={44}
                color="#FFFFFF"
              />
            </Animated.View>
          </View>

          <Text style={styles.authTitle}>
            {type === 'checkin'
              ? 'Đang định vị GPS & Chấm công vào ca...'
              : 'Đang định vị GPS & Chấm công kết thúc ca...'}
          </Text>
          <Text style={styles.authSub}>Vui lòng giữ điện thoại tại vị trí làm việc</Text>
          <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 14 }} />
        </View>
      );
    }

    // 2. Trạng thái Thành công
    if (authState === 'success') {
      return (
        <View style={styles.contentCenter}>
          <View style={styles.successCircle}>
            <MaterialCommunityIcons name="check" size={48} color="#FFF" />
          </View>
          <Text style={styles.successTitle}>
            {type === 'checkin' ? 'Chấm công vào thành công!' : 'Chấm công ra thành công!'}
          </Text>
          <Text style={styles.successTime}>{timeStr}</Text>
          <Text style={styles.successSub}>
            {type === 'checkin'
              ? 'Đã ghi nhận tọa độ vị trí GPS hợp lệ. Chúc bạn một ngày làm việc hiệu quả!'
              : 'Đã ghi nhận kết thúc ca làm việc qua GPS. Hẹn gặp lại bạn vào ca tiếp theo!'}
          </Text>
        </View>
      );
    }

    // 3. Trạng thái Thất bại / Lỗi
    return (
      <View style={styles.contentCenter}>
        <View style={styles.errorCircle}>
          <MaterialCommunityIcons name="alert-circle-outline" size={44} color={DANGER} />
        </View>
        <Text style={styles.errorTitle}>Chưa thể ghi nhận chấm công</Text>
        <Text style={styles.errorText}>
          {errorMessage || 'Không thể xác định vị trí GPS hoặc kết nối mạng bị gián đoạn. Vui lòng kiểm tra lại cài đặt định vị.'}
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry} activeOpacity={0.85}>
          <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Thử lại bằng GPS</Text>
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
      <TouchableWithoutFeedback onPress={authState === 'error' ? onClose : null}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>
                {type === 'checkin' ? 'Chấm công vào' : 'Chấm công ra'}
              </Text>
              {renderContent()}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
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
    paddingHorizontal: '24@ms',
    paddingTop: '12@vs',
    paddingBottom: '32@vs',
    minHeight: '320@vs',
    alignItems: 'center',
  },
  handle: {
    width: '40@ms',
    height: '4@vs',
    backgroundColor: '#E2E8F0',
    borderRadius: '2@ms',
    marginBottom: '16@vs',
  },
  sheetTitle: {
    fontSize: '17@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '8@vs',
    textAlign: 'center',
  },
  contentCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '12@vs',
  },
  iconContainer: {
    width: '100@ms',
    height: '100@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: '16@vs',
  },
  rippleRing: {
    position: 'absolute',
    width: '80@ms',
    height: '80@ms',
    borderRadius: '40@ms',
    backgroundColor: '#3B82F6',
  },
  iconCircle: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '40@ms',
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  authTitle: {
    fontSize: '15@ms',
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: '6@vs',
    paddingHorizontal: '12@ms',
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
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14@vs',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successTitle: {
    fontSize: '17@ms',
    fontWeight: '800',
    color: '#15803D',
    textAlign: 'center',
  },
  successTime: {
    fontSize: '22@ms',
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: '6@vs',
  },
  successSub: {
    fontSize: '12@ms',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: '18@vs',
    paddingHorizontal: '16@ms',
  },
  errorCircle: {
    width: '72@ms',
    height: '72@ms',
    borderRadius: '36@ms',
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12@vs',
  },
  errorTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#DC2626',
    textAlign: 'center',
  },
  errorText: {
    fontSize: '13@ms',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: '18@vs',
    marginTop: '6@vs',
    marginBottom: '18@vs',
    paddingHorizontal: '12@ms',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    width: '100%',
    height: '46@vs',
    borderRadius: '12@ms',
    gap: '6@ms',
    marginBottom: '8@vs',
  },
  primaryBtnText: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    paddingVertical: '8@vs',
    paddingHorizontal: '20@ms',
  },
  closeBtnText: {
    fontSize: '13@ms',
    fontWeight: '600',
    color: '#64748B',
  },
});

export default React.memo(AttendanceSheet);
