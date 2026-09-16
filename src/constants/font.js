// ─── FONT SIZES ──────────────────────────────────────────────────────────────
// Kích thước chữ được thống nhất trong dự án
// Sử dụng function fontScale() từ responsive.js để scale đồng bộ giữa iOS & Android

import { moderateScale } from 'react-native-size-matters';

// ─── Font Sizes (dựa trên base size cho iPhone 14: 390x844) ──────────────────
// Các kích thước này đã được apply fontScale() để đồng nhất giữa iOS & Android

export const FONT_SIZE = {
  // Titres / Tiêu đề lớn
  XLARGE: moderateScale(26),    // 26px - Tiêu đề rất lớn (Splash screen title)
  LARGE:  moderateScale(24),    // 24px - Tiêu đề lớn
  
  // Headings / Các cấp độ heading
  XLARGE_HEAD: moderateScale(22),    // 22px - Heading lớn
  LARGE_HEAD:  moderateScale(20),    // 20px - Heading trung bình lớn
  MEDIUM_HEAD: moderateScale(18),    // 18px - Heading trung bình
  
  // Body / Nội dung chính
  LARGE_BODY: moderateScale(16),   // 16px - Nội dung lớn (section title)
  MEDIUM_BODY: moderateScale(14),  // 14px - Nội dung trung bình (task label, section subtitle)
  SMALL_BODY: moderateScale(12),   // 12px - Nội dung nhỏ (statistic unit, description)
  
  // Text / Văn bản phụ
  XSMALL: moderateScale(11),       // 11px - Văn bản nhỏ (status label, task time)
  XS:      moderateScale(10),      // 10px - Văn bản rất nhỏ
  
  // Micro text / Chữ siêu nhỏ
  MICRO:   moderateScale(9),       // 9px - Chữ siêu nhỏ
  
  // Tiny / Siêu nhỏ
  TINY:    moderateScale(8),       // 8px - Siêu nhỏ
};

// ─── Font Sizes dùng @ms (moderate scale) ────────────────────────────────────
// Các giá trị này đã được tích hợp sẵn hàm moderateScale(factor = 0.5)
// Phù hợp cho các thẻ Card, Header, Button với padding vừa phải

export const FONT_SIZE_MS = {
  // Large - Dùng cho tiêu đề lớn, danh mục chính
  '26@ms': moderateScale(26),      // 26px
  '24@ms': moderateScale(24),      // 24px
  
  // X-Large - Tiêu đề con, heading cấp cao
  '22@ms': moderateScale(22),      // 22px
  
  // Large - Heading trung bình, tiêu đề section
  '20@ms': moderateScale(20),      // 20px (Header title)
  
  // Medium - Nội dung chính, heading cấp thấp hơn
  '18@ms': moderateScale(18),      // 18px
  
  // Normal - Nội dung body thông thường
  '16@ms': moderateScale(16),      // 16px (section title)
  
  // Small - Nội dung phụ, text helper
  '14@ms': moderateScale(14),      // 14px (task label, section subtitle)
  '13@ms': moderateScale(13),      // 13px
  
  // X-Small - Label nhỏ, text description
  '12@ms': moderateScale(12),      // 12px (statistic unit, task progress percent)
  '11@ms': moderateScale(11),      // 11px (status label, quick label, task time)
  
  // XXS - Siêu nhỏ
  '10@ms': moderateScale(10),      // 10px
  
  // XS - Chữ rất nhỏ
  '9@ms':  moderateScale(9),       // 9px
};

// ─── Font Sizes dùng @vs (vertical scale) ────────────────────────────────────
// Dùng cho kích thước font theo chiều dọc, phù hợp với màn hình khác nhau

export const FONT_SIZE_VS = {
  '18@vs': moderateScale(18),      // 18px
  '16@vs': moderateScale(16),      // 16px
  '14@vs': moderateScale(14),      // 14px
  '12@vs': moderateScale(12),      // 12px
  '11@vs': moderateScale(11),      // 11px
};

// ─── Export utility function ──────────────────────────────────────────────────
// Xuất ra hàm để tạo kích thước font tùy chỉnh
export const createFontSize = (baseSize, scaleType = 'ms') => {
  if (scaleType === 'ms') return moderateScale(baseSize);
  if (scaleType === 'vs') return FONT_SIZE_VS[`${baseSize}@vs`] || moderateScale(baseSize);
  return moderateScale(baseSize);
};

// ─── Quick Reference ──────────────────────────────────────────────────────────
// Hướng dẫn sử dụng:
// 
// • Titres: FONT_SIZE.XLARGE, FONT_SIZE.LARGE
// • Headings: FONT_SIZE.XLARGE_HEAD, FONT_SIZE.LARGE_HEAD, FONT_SIZE.MEDIUM_HEAD
// • Body content: FONT_SIZE.LARGE_BODY, FONT_SIZE.MEDIUM_BODY
// • Text helper: FONT_SIZE.SMALL_BODY, FONT_SIZE.XSMALL
// 
// Hoặc dùng các giá trị có sẵn với scale:
// • FONT_SIZE_MS.'20@ms' - Tiêu đề header
// • FONT_SIZE_MS.'14@ms' - Task label
// • FONT_SIZE_MS.'12@ms' - Statistic unit
// • FONT_SIZE_MS.'11@ms' - Status/Quick label