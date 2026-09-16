import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import { logoutAction } from '../../../redux/auth/authAction';
import COLORS from '../../../assets/styles/color';

// Import Face ID
import FaceAttendanceModal from '../../../components/employee/attendance/FaceAttendanceModal';
import { registerFaceApi, getFaceStatusApi } from '../../../api/attendanceAPI';

const MENU_GROUPS = [
  {
    title: 'Quản lý Công việc',
    items: [
      { id: 'salary', icon: 'cash-multiple', label: 'Bảng lương cá nhân', color: '#2563EB', route: 'Salary' },
      { id: 'attendance_history', icon: 'calendar-check-outline', label: 'Lịch sử chấm công', color: '#16A34A', route: 'Attendance' },
      { id: 'leave_history', icon: 'beach', label: 'Quản lý nghỉ phép', color: '#D97706', route: 'LeaveRequest' },
      { id: 'overtime_history', icon: 'clock-time-eight-outline', label: 'Quản lý làm thêm (OT)', color: '#E11D48', route: 'Overtime' },
    ]
  },
  {
    title: 'Hệ thống',
    items: [
      { id: 'announcements', icon: 'bullhorn-outline', label: 'Bảng tin doanh nghiệp', color: '#0D9488', route: 'Announcement' },
      { id: 'notifications', icon: 'bell-outline', label: 'Thông báo hệ thống', color: '#4F46E5', route: 'Notification' },
    ]
  },
  {
    title: 'Tài khoản & Bảo mật',
    items: [
      { id: 'profile', icon: 'account-edit-outline', label: 'Thông tin cá nhân', color: '#0284C7', route: 'EditProfile' },
      { id: 'change_password', icon: 'shield-lock-outline', label: 'Đổi mật khẩu', color: '#7C3AED', route: 'ChangePassword' },
      { id: 'biometrics', icon: 'fingerprint', label: 'Đăng nhập sinh trắc học', color: '#059669', route: 'BiometricSetup' },
      { id: 'face_setup', icon: 'face-recognition', label: 'Dữ liệu khuôn mặt chấm công', color: '#10B981', action: 'face_setup' },
    ]
  }
];

const ProfileMenuItem = ({ icon, label, color, onPress, isLast, extraLabel }) => (
  <TouchableOpacity
    style={[styles.menuItem, isLast && styles.menuItemLast]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <View style={{ flex: 1, paddingRight: 10 }}>
      <Text style={styles.menuLabel}>{label}</Text>
      {extraLabel && <Text style={{ fontSize: 11, color: '#16A34A', marginTop: 2, fontWeight: '600' }}>{extraLabel}</Text>}
    </View>
    <MaterialCommunityIcons name="chevron-right" size={22} color="#CBD5E1" />
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => state.auth.user);
  const unreadCount = useSelector((state) => state.notification?.unreadCount || 0);

  const [loggingOut, setLoggingOut] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);

  useEffect(() => {
    getFaceStatusApi()
      .then(res => {
        if (res.data?.isRegistered) setFaceRegistered(true);
      })
      .catch(console.log);
  }, []);

  const handleRegisterFace = async (extraData) => {
    try {
      await registerFaceApi({
        photoUrl: extraData.photoUrl,
        faceDescriptor: extraData.faceDescriptor,
      });
      setFaceRegistered(true);
      Alert.alert('Thành công', 'Đăng ký khuôn mặt thành công!');
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể đăng ký khuôn mặt');
    } finally {
      setShowFaceModal(false);
    }
  };

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await dispatch(logoutAction()).unwrap();
            } catch (err) {
              console.log('Logout notice:', err);
            } finally {
              setLoggingOut(false);
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
            }
          },
        },
      ],
    );
  }, [dispatch, navigation]);

  const handleMenuPress = (item) => {
    if (item.action === 'face_setup') {
      setShowFaceModal(true);
    } else if (item.route) {
      navigation.navigate(item.route);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Banner */}
      <View style={[styles.headerBanner, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Hồ Sơ Của Bạn</Text>
          <TouchableOpacity 
            style={styles.notificationBtn} 
            onPress={() => navigation.navigate('Notification')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showFaceModal && (
        <Modal
          visible={showFaceModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFaceModal(false)}
        >
          <FaceAttendanceModal
            visible={showFaceModal}
            type="register"
            onSuccess={handleRegisterFace}
            onClose={() => setShowFaceModal(false)}
          />
        </Modal>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardInner}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'W'}
                </Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.fullName || 'Nhân viên'}</Text>
              <Text style={styles.userPosition}>{user?.position || 'Nhân viên chính thức'}</Text>
              <View style={styles.userBadge}>
                <MaterialCommunityIcons name="office-building-outline" size={14} color="#2563EB" />
                <Text style={styles.userBadgeText}>{user?.department || 'Trụ sở chính'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.userInfoRow}>
            <View style={styles.userInfoItem}>
              <MaterialCommunityIcons name="email-outline" size={18} color="#64748B" />
              <Text style={styles.userInfoText} numberOfLines={1}>{user?.email || '--'}</Text>
            </View>
            <View style={styles.userInfoItem}>
              <MaterialCommunityIcons name="phone-outline" size={18} color="#64748B" />
              <Text style={styles.userInfoText}>{user?.phone || user?.phoneNumber || 'Chưa cập nhật'}</Text>
            </View>
          </View>
        </View>

        {/* Grouped Menus */}
        {MENU_GROUPS.map((group, gIndex) => (
          <View key={gIndex} style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>{group.title}</Text>
            <View style={styles.menuContainer}>
              {group.items.map((item, index) => (
                <ProfileMenuItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  color={item.color}
                  extraLabel={item.id === 'face_setup' && faceRegistered ? 'Đã có dữ liệu ✓' : null}
                  onPress={() => handleMenuPress(item)}
                  isLast={index === group.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <MaterialCommunityIcons name="logout-variant" size={22} color="#DC2626" />
              <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Nền xám nhạt hiện đại
  },
  headerBanner: {
    backgroundColor: '#2563EB',
    paddingBottom: '60@vs', // Để card có thể đè lên
    borderBottomLeftRadius: '24@ms',
    borderBottomRightRadius: '24@ms',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '20@ms',
    paddingTop: '12@vs',
    paddingBottom: '16@vs',
  },
  headerTitle: {
    fontSize: '22@ms',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  notificationBtn: {
    padding: '8@ms',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '12@ms',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '-4@ms',
    right: '-4@ms',
    backgroundColor: '#EF4444',
    borderRadius: '10@ms',
    paddingHorizontal: '5@ms',
    paddingVertical: '2@ms',
    minWidth: '20@ms',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: '10@ms',
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
    marginTop: '-50@vs', // Kéo nội dung lên đè lên banner
  },
  content: {
    paddingHorizontal: '16@ms',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    padding: '20@ms',
    marginBottom: '24@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  avatarContainer: {
    marginRight: '16@ms',
  },
  avatar: {
    width: '72@ms',
    height: '72@ms',
    borderRadius: '36@ms',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    color: '#2563EB',
    fontSize: '28@ms',
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: '19@ms',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '4@vs',
  },
  userPosition: {
    fontSize: '14@ms',
    color: '#475569',
    marginBottom: '8@vs',
    fontWeight: '500',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: '10@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
    alignSelf: 'flex-start',
  },
  userBadgeText: {
    color: '#2563EB',
    fontSize: '12@ms',
    fontWeight: '700',
    marginLeft: '4@ms',
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: '16@vs',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfoText: {
    fontSize: '13@ms',
    color: '#475569',
    marginLeft: '8@ms',
    fontWeight: '500',
    flexShrink: 1,
  },
  menuGroup: {
    marginBottom: '20@vs',
  },
  menuGroupTitle: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: '8@vs',
    marginLeft: '4@ms',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20@ms',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '14@vs',
    paddingHorizontal: '16@ms',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: '40@ms',
    height: '40@ms',
    borderRadius: '12@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '14@ms',
  },
  menuLabel: {
    fontSize: '15@ms',
    color: '#1E293B',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: '16@vs',
    borderRadius: '20@ms',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: '16@vs',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: '15@ms',
    fontWeight: '800',
    marginLeft: '10@ms',
  },
  versionText: {
    textAlign: 'center',
    fontSize: '12@ms',
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: '24@vs',
  },
});

export default ProfileScreen;
