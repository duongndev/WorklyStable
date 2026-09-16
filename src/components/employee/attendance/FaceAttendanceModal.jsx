// src/components/employee/attendance/FaceAttendanceModal.jsx
/**
 * ================================================================
 * FACE ATTENDANCE MODAL — Chấm công bằng khuôn mặt
 * ================================================================
 * Luồng:
 *  idle → bấm "Chụp khuôn mặt" → camera mở (launchCamera)
 *  → preview ảnh → bấm "Xác nhận chấm công" → gọi API → thành công
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureFacePhoto, uploadFacePhoto, extractFaceDescriptor } from '../../../services/faceService';

const FaceAttendanceModal = ({
  visible,
  type = 'checkin', // 'checkin' | 'checkout' | 'register'
  onSuccess,
  onClose,
  onError,
}) => {
  const [step, setStep] = useState('idle');         // idle | capturing | preview | submitting | success
  const [capturedPhoto, setCapturedPhoto] = useState(null); // { uri, fileName, type }
  const successScale = useRef(new Animated.Value(0)).current;

  // ── Reset khi đóng modal ──
  const handleClose = useCallback(() => {
    setStep('idle');
    setCapturedPhoto(null);
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  // ── Bước 1: Mở camera chụp khuôn mặt ──
  const handleCapture = useCallback(async () => {
    try {
      setStep('capturing');
      const photo = await captureFacePhoto();
      if (!photo) {
        // Người dùng huỷ camera
        setStep('idle');
        return;
      }
      setCapturedPhoto(photo);
      setStep('preview');
    } catch (err) {
      setStep('idle');
      const msg = err?.message || 'Không thể mở camera.';
      if (typeof onError === 'function') onError(msg);
      else Alert.alert('Lỗi Camera', msg);
    }
  }, [onError]);

  // ── Bước 2: Upload & Trích xuất (nếu cần) & Gửi thông tin về cha ──
  const handleSubmit = useCallback(async () => {
    if (!capturedPhoto) return;
    try {
      setStep('submitting');
      // 1. Upload ảnh lấy URL
      const imageUrl = await uploadFacePhoto(capturedPhoto);
      
      // 2. Trích xuất Face Descriptor mô phỏng
      const faceDescriptor = await extractFaceDescriptor(imageUrl);

      // Animation báo thành công
      setStep('success');
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();

      // Đóng modal & callback sau 1.5s
      setTimeout(() => {
        if (typeof onSuccess === 'function') {
          onSuccess({ method: 'face', photoUrl: imageUrl, faceDescriptor });
        }
        handleClose();
      }, 1500);
    } catch (err) {
      setStep('preview'); // Quay lại preview để cho chụp lại
      const msg = err?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.';
      if (typeof onError === 'function') onError(msg);
      else Alert.alert('Lỗi', msg);
    }
  }, [capturedPhoto, onSuccess, onError, handleClose, successScale]);

  // ── Chụp lại ──
  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setStep('idle');
  }, []);

  const actionLabel = type === 'checkin' ? 'Vào Ca' : 'Kết Thúc Ca';

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerDrag} />
            <Text style={styles.headerTitle}>Chấm Công Khuôn Mặt</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <View style={styles.centerBox}>
              <Animated.View style={[styles.successCircle, { transform: [{ scale: successScale }] }]}>
                <MaterialCommunityIcons name="check" size={52} color="#FFFFFF" />
              </Animated.View>
              <Text style={styles.successTitle}>
                {type === 'checkin' ? 'Chấm công vào ca!' : 'Kết thúc ca thành công!'}
              </Text>
              <Text style={styles.successSub}>Khuôn mặt đã được xác minh ✓</Text>
            </View>
          )}

          {/* ── IDLE: Hướng dẫn + nút chụp ── */}
          {step === 'idle' && (
            <View style={styles.centerBox}>
              {/* Khung oval khuôn mặt minh hoạ */}
              <View style={styles.faceFrameOuter}>
                <View style={styles.faceFrameInner}>
                  <MaterialCommunityIcons name="face-recognition" size={72} color="#2563EB" />
                </View>
              </View>
              <Text style={styles.guideTitle}>Hướng mặt vào camera</Text>
              <Text style={styles.guideSub}>
                Đặt khuôn mặt vào giữa khung và đảm bảo ánh sáng đủ sáng.{'\n'}
                Hệ thống sẽ so sánh với ảnh đã đăng ký của bạn.
              </Text>
              <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.85}>
                <MaterialCommunityIcons name="camera-front" size={22} color="#FFFFFF" />
                <Text style={styles.captureBtnText}>Chụp Khuôn Mặt</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── CAPTURING ── */}
          {step === 'capturing' && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.statusText}>Đang mở camera...</Text>
            </View>
          )}

          {/* ── PREVIEW: Xem lại + xác nhận ── */}
          {step === 'preview' && capturedPhoto && (
            <View style={styles.centerBox}>
              <View style={styles.previewWrapper}>
                <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} />
                <View style={styles.previewBadge}>
                  <MaterialCommunityIcons name="camera-check" size={14} color="#16A34A" />
                  <Text style={styles.previewBadgeText}>Đã chụp</Text>
                </View>
              </View>
              <Text style={styles.guideTitle}>Kiểm tra ảnh khuôn mặt</Text>
              <Text style={styles.guideSub}>
                Đảm bảo khuôn mặt rõ nét, không bị che khuất.
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="camera-retake" size={18} color="#2563EB" />
                  <Text style={styles.retakeBtnText}>Chụp lại</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="fingerprint" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Xác nhận {actionLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── SUBMITTING ── */}
          {step === 'submitting' && (
            <View style={styles.centerBox}>
              <View style={styles.faceFrameOuter}>
                <View style={[styles.faceFrameInner, { borderColor: '#2563EB' }]}>
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              </View>
              <Text style={styles.guideTitle}>Đang xác minh khuôn mặt...</Text>
              <Text style={styles.guideSub}>Hệ thống đang so sánh với ảnh đã đăng ký.</Text>
            </View>
          )}
        </View>
      </View>
  );
};

export default FaceAttendanceModal;

const styles = ScaledSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '24@ms',
    borderTopRightRadius: '24@ms',
    paddingBottom: '32@vs',
    minHeight: '400@vs',
  },
  header: {
    alignItems: 'center',
    paddingTop: '12@vs',
    paddingBottom: '8@vs',
    paddingHorizontal: '20@ms',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerDrag: {
    width: '40@ms',
    height: '4@vs',
    borderRadius: '2@ms',
    backgroundColor: '#CBD5E1',
    marginBottom: '10@vs',
  },
  headerTitle: {
    fontSize: '17@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    position: 'absolute',
    right: '16@ms',
    top: '18@vs',
    padding: '4@ms',
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: '24@ms',
    paddingTop: '28@vs',
    paddingBottom: '12@vs',
  },
  faceFrameOuter: {
    width: '160@ms',
    height: '200@vs',
    borderRadius: '80@ms',
    borderWidth: 3,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20@vs',
  },
  faceFrameInner: {
    width: '130@ms',
    height: '160@vs',
    borderRadius: '65@ms',
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    fontSize: '16@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '8@vs',
    textAlign: 'center',
  },
  guideSub: {
    fontSize: '13@ms',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: '18@vs',
    marginBottom: '24@vs',
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: '28@ms',
    paddingVertical: '14@vs',
    borderRadius: '14@ms',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  captureBtnText: {
    fontSize: '15@ms',
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: '8@ms',
  },
  previewWrapper: {
    position: 'relative',
    marginBottom: '16@vs',
  },
  previewImage: {
    width: '150@ms',
    height: '150@ms',
    borderRadius: '75@ms',
    borderWidth: 3,
    borderColor: '#2563EB',
  },
  previewBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: '8@ms',
    paddingVertical: '3@vs',
    borderRadius: '10@ms',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  previewBadgeText: {
    fontSize: '11@ms',
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: '3@ms',
  },
  actionRow: {
    flexDirection: 'row',
    gap: '12@ms',
    marginTop: '4@vs',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: '18@ms',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  retakeBtnText: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: '6@ms',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: '18@ms',
    paddingVertical: '12@vs',
    borderRadius: '12@ms',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  confirmBtnText: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: '6@ms',
  },
  successCircle: {
    width: '100@ms',
    height: '100@ms',
    borderRadius: '50@ms',
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20@vs',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: '18@ms',
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: '8@vs',
  },
  successSub: {
    fontSize: '14@ms',
    color: '#16A34A',
    fontWeight: '600',
  },
  statusText: {
    fontSize: '14@ms',
    color: '#64748B',
    marginTop: '14@vs',
  },
});
