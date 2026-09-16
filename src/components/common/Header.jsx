import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import COLORS from '../../assets/styles/color';

// ---------- Component con: Nút quay lại ----------
const BackButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.backButton} activeOpacity={0.7}>
    <View style={styles.backButtonCircle}>
      <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
    </View>
  </TouchableOpacity>
);

// ---------- Component con: Nút hành động với badge ----------
const ActionButton = ({ action }) => (
  <TouchableOpacity
    style={styles.actionButton}
    onPress={action.onPress}
    activeOpacity={0.7}
  >
    <View style={styles.actionButtonCircle}>
      <MaterialCommunityIcons name={action.icon} size={20} color="#FFFFFF" />
      {(action.badgeCount ?? 0) > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {action.badgeCount > 9 ? '9+' : action.badgeCount}
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

// ---------- Component chính ----------
const Header = ({
  title,
  canGoBack = false,
  onBack,
  rightActions,
  rightComponent,
  username,
  onNotificationPress,
  unreadCount = 0,
  showNotification = false,
  backgroundColor,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const actions = useMemo(() => {
    if (rightActions) return rightActions;

    const defaultActions = [];
    if (showNotification) {
      defaultActions.push({
        icon: 'bell-outline',
        onPress: onNotificationPress ?? (() => navigation.navigate('Notification')),
        badgeCount: unreadCount,
      });
    }
    return defaultActions;
  }, [rightActions, showNotification, unreadCount, onNotificationPress, navigation]);

  const headerBg = backgroundColor ?? COLORS.BRAND_COLOR;
  const canGoBackActual = canGoBack && navigation.canGoBack();
  const showTitle = Boolean(title) && !username;
  const isBottomTabScreen = route.name.includes('Tab');

  const handleGoBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  // Giao diện Trang chủ (Home Header)
  if (username) {
    return (
      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top + 8, backgroundColor: headerBg },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.homeLeft}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.greetingBox}>
              <Text style={styles.greeting}>Xin chào,</Text>
              <Text style={styles.username} numberOfLines={1}>
                {username}
              </Text>
            </View>
          </View>
          <View style={styles.homeRight}>
            {rightComponent ? (
              rightComponent
            ) : (
              actions.map((action, index) => (
                <ActionButton key={index} action={action} />
              ))
            )}
          </View>
        </View>
      </View>
    );
  }

  // Giao diện Header chuẩn cho các màn hình con
  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: insets.top + 8, backgroundColor: headerBg },
      ]}
    >
      <View style={styles.row}>
        {/* Bên trái: Nút Back */}
        <View style={styles.leftSlot}>
          {canGoBackActual && !isBottomTabScreen ? (
            <BackButton onPress={handleGoBack} />
          ) : (
            <View style={styles.slotSpacer} />
          )}
        </View>

        {/* Giữa: Tiêu đề */}
        <View style={styles.centerSlot}>
          {showTitle && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        {/* Bên phải: Actions hoặc Custom Component */}
        <View style={styles.rightSlot}>
          {rightComponent ? (
            rightComponent
          ) : actions.length > 0 ? (
            actions.map((action, index) => (
              <ActionButton key={index} action={action} />
            ))
          ) : (
            <View style={styles.slotSpacer} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSlot: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rightSlot: {
    minWidth: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  homeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  avatarMini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  greetingBox: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 1,
  },
  homeRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  backButton: {
    padding: 2,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    marginLeft: 10,
    padding: 2,
  },
  actionButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSpacer: {
    width: 36,
    height: 36,
  },
  badgeContainer: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default Header;