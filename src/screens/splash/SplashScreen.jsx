import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Image, Animated, Easing, Alert } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import logo from '../../assets/images/logo_removebg.png';
import {
  BRAND_COLOR,
  TEXT_SECONDARY,
  TEXT_MUTED,
  BRAND_COLOR_LIGHT,
} from '../../constants/color';
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, clearError, clearMessage } from '../../redux/auth/authSlice';
import { getUserInfoAction, refreshTokenAction } from '../../redux/auth/authAction';
import { isTokenExpired } from '../../services/tokenService';
import { navigateBasedOnRole } from '../../utils/navigationHelpers';
// ─── PulsingDot ───────────────────────────────────────────────────────────────
const PulsingDot = ({ pulseAnim }) => {
  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View style={[styles.dot, { transform: [{ scale }], opacity }]} />
  );
};

// ─── LoadingDots ──────────────────────────────────────────────────────────────
const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const dots = useMemo(() => [dot1, dot2, dot3], [dot1, dot2, dot3]);

  useEffect(() => {
    const animations = dots.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    Animated.parallel(animations).start();
  }, [dots]);

  return (
    <View style={styles.dotsContainer}>
      {dots.map((anim, index) => (
        <PulsingDot key={index} pulseAnim={anim} />
      ))}
    </View>
  );
};

// ─── LogoSection ──────────────────────────────────────────────────────────────
const LogoSection = ({ fadeAnim, slideAnim }) => (
  <Animated.View
    style={[
      styles.content,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      },
    ]}
  >
    <View style={styles.logoWrapper}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
    </View>
    <Text style={styles.appName}>WorklyStable</Text>
    <Text style={styles.appDescription}>
      Hệ thống Quản lý Chấm công & Nhân sự
    </Text>
  </Animated.View>
);

// ─── FooterSection ────────────────────────────────────────────────────────────
const FooterSection = ({ fadeAnim }) => (
  <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
    <LoadingDots />
    <Text style={styles.loadingText}>Đang khởi tạo hệ thống...</Text>
    {/* <Text style={styles.version}>v1.0.0</Text> */}
  </Animated.View>
);

// ─── SplashScreen ─────────────────────────────────────────────────────────────
const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const navigation = useNavigation();
  const { tokens, profileLoading } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigationRef = useRef(navigation);
  const dispatchRef = useRef(dispatch);
  const accessTokenRef = useRef(tokens);

  useEffect(() => {
    navigationRef.current = navigation;
    dispatchRef.current = dispatch;
    accessTokenRef.current = tokens;
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

  }, [fadeAnim, slideAnim, navigation]);


  // Xử lý token và điều hướng
  useEffect(() => {

    const checkTokenAndNavigate = async () => {
      console.log('SplashScreen: Kiểm tra token...');
      if (!tokens) {
        console.log('SplashScreen: Không tìm thấy token, điều hướng đến Auth');
        navigation.replace('Auth');
        return;
      }
      try {
        // Kiểm tra token hết hạn
        if (isTokenExpired(tokens)) {
          console.log('SplashScreen: Token hết hạn, đang thử làm mới...');

          const refreshResult = await dispatch(refreshTokenAction());

          if (refreshTokenAction.fulfilled.match(refreshResult)) {
            console.log('SplashScreen: Làm mới token thành công, tiếp tục.');
          } else {
            console.log('SplashScreen: Làm mới token thất bại, đăng xuất');
            dispatch(logoutUser());
            dispatch(clearError());
            dispatch(clearMessage());
            navigation.replace('Auth');
            return;
          }
        }

        // Nếu có token hợp lệ, kiểm tra xem đã có thông tin user chưa
        console.log('Đang lấy thông tin user...');
        const resultAction = await dispatch(getUserInfoAction());

        if (getUserInfoAction.fulfilled.match(resultAction)) {
          const { user } = resultAction.payload;

          if (!user) {
            console.warn('SplashScreen: User payload bị rỗng');
            dispatch(logoutUser());
            dispatch(clearError());
            dispatch(clearMessage());
            navigation.replace('Auth');
            return;
          }

          console.log('Lấy thông tin user thành công', user?.role);
          navigateBasedOnRole(navigation, user.role, handleUnknownRole);
        } else {
          console.log('Lấy thông tin user thất bại');
          dispatch(logoutUser());
          dispatch(clearError());
          dispatch(clearMessage());
          navigation.replace('Auth');
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra token:', err);
        dispatch(logoutUser());
        dispatch(clearError());
        dispatch(clearMessage());
        navigation.replace('Auth');
      }
    };


    const timerId = setTimeout(() => {
      checkTokenAndNavigate();
    }, profileLoading ? 1000 : 2000);
    return () => clearTimeout(timerId);
  }, [dispatch, tokens, profileLoading, navigation]);

  const handleUnknownRole = (role) => {
    Alert.alert('Cảnh báo', 'Vai trò người dùng không xác định. Vui lòng liên hệ quản trị viên.');
  };

  return (
    <View style={styles.container}>
      <LogoSection fadeAnim={fadeAnim} slideAnim={slideAnim} />
      <FooterSection fadeAnim={fadeAnim} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: '48@vs',
  },

  // Logo section
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: '120@s',
    height: '120@s',
    borderRadius: '32@s',
    backgroundColor: BRAND_COLOR_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16@vs',
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: '72@s',
    height: '72@s',
  },
  appName: {
    fontSize: '26@ms',
    fontWeight: '800',
    color: BRAND_COLOR,
    letterSpacing: 0.5,
    marginBottom: '6@vs',
  },
  appDescription: {
    fontSize: '14@ms',
    color: TEXT_SECONDARY,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Footer section
  footer: {
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: '12@vs',
  },
  dot: {
    width: '8@s',
    height: '8@s',
    borderRadius: '4@s',
    backgroundColor: BRAND_COLOR,
    marginHorizontal: '4@s',
  },
  loadingText: {
    fontSize: '13@ms',
    color: TEXT_SECONDARY,
    letterSpacing: 0.2,
  },
  version: {
    fontSize: '11@ms',
    color: TEXT_MUTED,
    marginTop: '6@vs',
  },
});

export default SplashScreen;
