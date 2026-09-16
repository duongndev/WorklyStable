// components/employee/salary/PinModal.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PIN_LENGTH = 6;

const PinModal = ({
  visible,
  onClose,
  onSuccess,
  isSetup = false,
  onVerifyPin,
  onSetupPin,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('enter'); // 'enter' | 'confirm'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setErrorMsg('');
      setLoading(false);
    }
  }, [visible]);

  const handleKeyPress = (num) => {
    setErrorMsg('');
    if (isSetup && step === 'confirm') {
      if (confirmPin.length < PIN_LENGTH) {
        const next = confirmPin + num;
        setConfirmPin(next);
        if (next.length === PIN_LENGTH) {
          handleFinishSetup(pin, next);
        }
      }
    } else {
      if (pin.length < PIN_LENGTH) {
        const next = pin + num;
        setPin(next);
        if (next.length === PIN_LENGTH) {
          if (isSetup) {
            setStep('confirm');
          } else {
            handleVerify(next);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    if (isSetup && step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleVerify = async (code) => {
    setLoading(true);
    try {
      if (onVerifyPin) {
        const res = await onVerifyPin(code);
        if (res?.success || res?.token) {
          onSuccess?.(res?.token);
          onClose?.();
        } else {
          setErrorMsg(res?.message || 'Mã PIN không chính xác.');
          setPin('');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Mã PIN không chính xác.';
      setErrorMsg(msg);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = async (initialPin, confirmed) => {
    if (initialPin !== confirmed) {
      setErrorMsg('Mã PIN xác nhận không khớp. Vui lòng thử lại.');
      setConfirmPin('');
      setStep('enter');
      setPin('');
      return;
    }

    setLoading(true);
    try {
      if (onSetupPin) {
        await onSetupPin(initialPin);
        Alert.alert('Thành công', 'Thiết lập mã PIN xem lương thành công!', [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              onClose?.();
            },
          },
        ]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Thiết lập PIN thất bại.';
      setErrorMsg(msg);
      setPin('');
      setConfirmPin('');
      setStep('enter');
    } finally {
      setLoading(false);
    }
  };

  const currentPinStr = isSetup && step === 'confirm' ? confirmPin : pin;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Icon name="lock-outline" size={28} color="#2563EB" />
            </View>
            <Text style={styles.title}>
              {isSetup
                ? step === 'enter'
                  ? 'Tạo mã PIN xem lương'
                  : 'Xác nhận mã PIN mới'
                : 'Nhập mã PIN bảo mật'}
            </Text>
            <Text style={styles.subtitle}>
              {isSetup
                ? step === 'enter'
                  ? 'Nhập 6 chữ số để bảo vệ thông tin bảng lương của bạn'
                  : 'Nhập lại mã PIN vừa tạo để xác nhận'
                : 'Nhập mã PIN để mở khóa chi tiết phiếu lương'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Icon name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {Array.from({ length: PIN_LENGTH }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx < currentPinStr.length && styles.dotFilled,
                  errorMsg ? styles.dotError : null,
                ]}
              />
            ))}
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {loading && <ActivityIndicator size="small" color="#2563EB" style={styles.spinner} />}

          {/* Keypad */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['', '0', 'del'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((btn, cIdx) => {
                  if (btn === '') {
                    return <View key={cIdx} style={styles.keyBtnEmpty} />;
                  }
                  if (btn === 'del') {
                    return (
                      <TouchableOpacity
                        key={cIdx}
                        style={styles.keyBtn}
                        onPress={handleDelete}
                        disabled={loading}
                      >
                        <Icon name="backspace-outline" size={24} color="#475569" />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={cIdx}
                      style={styles.keyBtn}
                      onPress={() => handleKeyPress(btn)}
                      disabled={loading}
                    >
                      <Text style={styles.keyNumber}>{btn}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = ScaledSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '24@ms',
    borderTopRightRadius: '24@ms',
    paddingHorizontal: '24@ms',
    paddingTop: '20@vs',
    paddingBottom: '34@vs',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    marginBottom: '20@vs',
  },
  iconCircle: {
    width: '56@ms',
    height: '56@ms',
    borderRadius: '28@ms',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12@vs',
  },
  title: {
    fontSize: '18@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '6@vs',
  },
  subtitle: {
    fontSize: '13@ms',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: '16@ms',
    lineHeight: '18@vs',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: '6@ms',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: '16@vs',
  },
  dot: {
    width: '16@ms',
    height: '16@ms',
    borderRadius: '8@ms',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginHorizontal: '8@ms',
    backgroundColor: '#F8FAFC',
  },
  dotFilled: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dotError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    fontSize: '12@ms',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: '8@vs',
    fontWeight: '500',
  },
  spinner: {
    marginVertical: '8@vs',
  },
  keypad: {
    width: '100%',
    marginTop: '10@vs',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: '6@vs',
  },
  keyBtn: {
    width: '68@ms',
    height: '68@ms',
    borderRadius: '34@ms',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  keyBtnEmpty: {
    width: '68@ms',
    height: '68@ms',
  },
  keyNumber: {
    fontSize: '24@ms',
    fontWeight: '600',
    color: '#1E293B',
  },
});

export default PinModal;
