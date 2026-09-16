// screens/admin/attendance/AdminAttendanceQRScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { generateWorkplaceQRApi } from '../../../api/adminAPI';
import COLORS from '../../../assets/styles/color';

const AdminAttendanceQRScreen = () => {
  const navigation = useNavigation();

  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(60);

  const fetchQR = useCallback(async () => {
    try {
      setLoading(true);
      const res = await generateWorkplaceQRApi();
      if (res?.data) {
        setQrData(res.data);
        setCountdown(res.data.expiresInSeconds || 60);
      }
    } catch (err) {
      console.error('Lỗi sinh mã QR:', err);
      Alert.alert('Lỗi', 'Không thể sinh mã QR điểm danh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

  // Đếm ngược xoay vòng mã QR
  useEffect(() => {
    if (countdown <= 0) {
      fetchQR();
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, fetchQR]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Mã QR Chấm Công"
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main QR Card */}
        <View style={styles.qrCard}>
          <Text style={styles.qrHeaderTitle}>ĐIỂM DANH BẰNG MÃ QR ĐỘNG</Text>
          <Text style={styles.qrHeaderSub}>
            Đặt màn hình này tại quầy lễ tân hoặc cửa ra vào cơ sở
          </Text>

          {/* QR Container */}
          <View style={styles.qrBox}>
            {loading ? (
              <ActivityIndicator size="large" color="#2563EB" />
            ) : (
              <View style={styles.qrInner}>
                <MaterialCommunityIcons name="qrcode-scan" size={180} color="#0F172A" />
                <View style={styles.tokenPill}>
                  <Text style={styles.tokenText}>
                    TOKEN: {qrData?.qrToken?.substring(0, 16) || 'WORKLY-ACTIVE-QR'}...
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Countdown & Refresh */}
          <View style={styles.timerRow}>
            <MaterialCommunityIcons name="timer-sand" size={18} color="#2563EB" />
            <Text style={styles.timerText}>
              Mã tự động đổi mới sau: <Text style={styles.secondsText}>{countdown}s</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchQR}
            activeOpacity={0.8}
            disabled={loading}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#2563EB" />
            <Text style={styles.refreshBtnText}>Làm mới mã QR ngay</Text>
          </TouchableOpacity>
        </View>

        {/* Workplace Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Thông Tin Cơ Sở Làm Việc</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="office-building" size={16} color="#64748B" />
            <Text style={styles.infoKey}>Địa điểm:</Text>
            <Text style={styles.infoVal}>{qrData?.workplaceName || 'Trụ sở chính Workly'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={16} color="#64748B" />
            <Text style={styles.infoKey}>Bán kính:</Text>
            <Text style={styles.infoVal}>300 mét (Geo-fence)</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#16A34A" />
            <Text style={styles.infoKey}>Bảo mật:</Text>
            <Text style={[styles.infoVal, { color: '#16A34A' }]}>Chống chụp màn hình / Fake QR</Text>
          </View>
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
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    padding: '20@ms',
    alignItems: 'center',
    marginBottom: '14@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  qrHeaderTitle: {
    fontSize: '15@ms',
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  qrHeaderSub: {
    fontSize: '12@ms',
    color: '#64748B',
    textAlign: 'center',
    marginTop: '4@vs',
    marginBottom: '16@vs',
  },
  qrBox: {
    width: '240@ms',
    height: '240@ms',
    borderRadius: '16@ms',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: '16@vs',
  },
  qrInner: {
    alignItems: 'center',
  },
  tokenPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: '10@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
    marginTop: '6@vs',
  },
  tokenText: {
    fontSize: '10@ms',
    fontWeight: '700',
    color: '#2563EB',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  timerText: {
    fontSize: '13@ms',
    color: '#475569',
    marginLeft: '6@ms',
  },
  secondsText: {
    color: '#2563EB',
    fontWeight: '800',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: '16@ms',
    paddingVertical: '8@vs',
    borderRadius: '10@ms',
  },
  refreshBtnText: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: '6@ms',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '16@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoTitle: {
    fontSize: '14@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '10@vs',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: '4@vs',
  },
  infoKey: {
    fontSize: '12@ms',
    color: '#64748B',
    marginLeft: '6@ms',
    flex: 1,
  },
  infoVal: {
    fontSize: '12@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
});

export default AdminAttendanceQRScreen;
