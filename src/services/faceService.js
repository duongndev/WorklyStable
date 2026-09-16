// src/services/faceService.js
/**
 * =============================================================
 * WORKLY FACE SERVICE — Mở camera & upload ảnh khuôn mặt
 * =============================================================
 *
 * Luồng:
 *  1. Mở camera trước (front camera)
 *  2. Người dùng chụp ảnh
 *  3. Upload ảnh lên server qua POST /api/upload/image
 *  4. Trả về { imageUrl } để dùng cho register-face hoặc check-in face
 */

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';
import { axiosClient } from '../api/axiosConfig';

/**
 * Xin quyền truy cập Camera (Android)
 */
export const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Cấp Quyền Camera',
          message: 'Ứng dụng cần quyền truy cập camera để chụp ảnh xác thực khuôn mặt.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Từ chối',
          buttonPositive: 'Đồng ý',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Lỗi xin quyền camera:', err);
      return false;
    }
  }
  // iOS tự động hiển thị prompt từ hệ thống dựa trên Info.plist
  return true;
};

/**
 * Mở camera trước và trả về kết quả ảnh
 * @returns {Promise<{uri: string, fileName: string, type: string}|null>}
 */
export const captureFacePhoto = async () => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    throw new Error('Chưa cấp quyền truy cập Camera. Vui lòng cấp quyền trong Cài đặt ứng dụng.');
  }

  return new Promise((resolve, reject) => {
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'front',      // Camera trước để chụp khuôn mặt
        quality: 0.8,
        maxWidth: 640,
        maxHeight: 640,
        saveToPhotos: false,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          resolve(null);
          return;
        }
        if (response.errorCode === 'camera_unavailable') {
          console.log('Camera không khả dụng (máy ảo Simulator). Tự động chuyển sang mở Thư viện ảnh để test...');
          launchImageLibrary(
            {
              mediaType: 'photo',
              quality: 0.8,
              maxWidth: 640,
              maxHeight: 640,
              includeBase64: false,
            },
            (libResponse) => {
              if (libResponse.didCancel) {
                resolve(null);
                return;
              }
              if (libResponse.errorCode) {
                reject(new Error(libResponse.errorMessage || `Lỗi thư viện ảnh: ${libResponse.errorCode}`));
                return;
              }
              const asset = libResponse.assets?.[0];
              if (!asset?.uri) {
                reject(new Error('Không lấy được ảnh từ thư viện.'));
                return;
              }
              resolve({
                uri: asset.uri,
                fileName: asset.fileName || `face_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
              });
            },
          );
          return;
        }

        if (response.errorCode) {
          reject(new Error(response.errorMessage || `Camera error: ${response.errorCode}`));
          return;
        }
        const asset = response.assets?.[0];
        if (!asset?.uri) {
          reject(new Error('Không lấy được ảnh từ camera.'));
          return;
        }
        resolve({
          uri: asset.uri,
          fileName: asset.fileName || `face_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
      },
    );
  });
};

/**
 * Upload ảnh khuôn mặt lên server, trả về URL ảnh đã lưu
 * @param {{ uri: string, fileName: string, type: string }} photo
 * @param {string} folder - Thư mục lưu trên Cloudinary
 * @returns {Promise<string>} imageUrl
 */
export const uploadFacePhoto = async (photo, folder = 'workly_hrm/faces') => {
  const formData = new FormData();
  formData.append('image', {
    uri: photo.uri,
    name: photo.fileName,
    type: photo.type,
  });
  formData.append('folder', folder);

  const response = await axiosClient.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const imageUrl = response.data?.data?.imageUrl;
  if (!imageUrl) {
    throw new Error('Upload ảnh thất bại, không nhận được URL.');
  }
  return imageUrl;
};

/**
 * Tiện ích gộp: mở camera → upload → trả về URL
 * @param {string} folder
 * @returns {Promise<string|null>} imageUrl hoặc null nếu người dùng huỷ
 */
export const captureFaceAndUpload = async (folder = 'workly_hrm/faces') => {
  const photo = await captureFacePhoto();
  if (!photo) return null; // Người dùng huỷ camera
  const imageUrl = await uploadFacePhoto(photo, folder);
  return imageUrl;
};


/**
 * Mock: Giả lập trích xuất Face Descriptor 128D trên client.
 * (Sau này thay bằng thư viện AI thật: face-api.js hoặc TFLite)
 */
export const extractFaceDescriptor = async (imageUrl) => {
  return Array(128).fill(0.5);
};
