// screens/admin/announcement/AdminCreateAnnouncementScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

import Header from '../../../components/common/Header';
import { createAnnouncementAdminApi } from '../../../api/announcementAPI';
import COLORS from '../../../assets/styles/color';

const CATEGORIES = [
  { id: 'general', label: 'Tin tức chung' },
  { id: 'policy', label: 'Chính sách mới' },
  { id: 'event', label: 'Sự kiện công ty' },
  { id: 'holiday', label: 'Thông báo nghỉ lễ' },
  { id: 'achievement', label: 'Vinh danh & Khen thưởng' },
  { id: 'urgent', label: 'Khẩn cấp' },
];

const AdminCreateAnnouncementScreen = () => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề bài viết.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập nội dung bài viết.');
      return;
    }

    setLoading(true);
    try {
      await createAnnouncementAdminApi({
        title: title.trim(),
        content: content.trim(),
        category,
        bannerUrl: bannerUrl.trim() || undefined,
        isPinned,
        sendPush,
      });

      Alert.alert('Thành công', 'Đã đăng bài viết và gửi thông báo tới toàn thể nhân viên!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể tạo thông báo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Đăng Tin Tức Doanh Nghiệp"
        canGoBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View style={styles.card}>
          <Text style={styles.label}>Tiêu đề thông báo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Kế hoạch nghỉ lễ Quốc Khánh..."
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Danh mục thông báo</Text>
          <View style={styles.categoryWrap}>
            {CATEGORIES.map((c) => {
              const isSelected = category === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  onPress={() => setCategory(c.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Content */}
        <View style={styles.card}>
          <Text style={styles.label}>Nội dung chi tiết *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Nhập toàn bộ nội dung thông báo gửi đến toàn thể nhân viên..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={6}
            value={content}
            onChangeText={setContent}
          />
        </View>

        {/* Banner URL */}
        <View style={styles.card}>
          <Text style={styles.label}>Ảnh bìa Banner (Tùy chọn URL)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/banner.png"
            placeholderTextColor="#94A3B8"
            value={bannerUrl}
            onChangeText={setBannerUrl}
          />
        </View>

        {/* Switches */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Ghim bài viết lên đầu trang</Text>
              <Text style={styles.switchSub}>Bài viết sẽ luôn nằm trên cùng bảng tin</Text>
            </View>
            <Switch
              value={isPinned}
              onValueChange={setIsPinned}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={isPinned ? '#2563EB' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Gửi thông báo đẩy (Push Notification)</Text>
              <Text style={styles.switchSub}>Phát thông báo tức thì đến điện thoại nhân viên</Text>
            </View>
            <Switch
              value={sendPush}
              onValueChange={setSendPush}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={sendPush ? '#2563EB' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Phát Hành Thông Báo</Text>
            </>
          )}
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@ms',
    padding: '16@ms',
    marginBottom: '12@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '8@vs',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: '10@ms',
    padding: '10@ms',
    fontSize: '13@ms',
    color: '#0F172A',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: '12@ms',
    paddingVertical: '8@vs',
    borderRadius: '8@ms',
    backgroundColor: '#F1F5F9',
    marginRight: '8@ms',
    marginBottom: '8@vs',
  },
  categoryPillActive: {
    backgroundColor: '#2563EB',
  },
  categoryPillText: {
    fontSize: '12@ms',
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: '10@ms',
    padding: '10@ms',
    fontSize: '13@ms',
    color: '#0F172A',
    minHeight: '120@vs',
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    paddingRight: '12@ms',
  },
  switchTitle: {
    fontSize: '13@ms',
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: '11@ms',
    color: '#64748B',
    marginTop: '2@vs',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: '12@vs',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: '14@vs',
    borderRadius: '14@ms',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: '8@vs',
  },
  submitBtnText: {
    fontSize: '14@ms',
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: '6@ms',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default AdminCreateAnnouncementScreen;
