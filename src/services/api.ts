// Сервис для работы с API
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { authService } from './authService';

// Создаем экземпляр axios с базовым URL
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Временный URL, будет изменен на реальный
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик запросов для добавления токена в заголовки
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Получаем токен из localStorage
    const { token } = authService.getAuthTokens();
    
    // Если токен есть, добавляем его в заголовки
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки истекших токенов
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Если ошибка 401 и запрос не был попыткой обновления токена
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Пытаемся обновить токен
        const { refreshToken } = authService.getAuthTokens();
        
        // Если у нас есть refresh токен, пытаемся обновить access токен
        if (refreshToken) {
          const newTokens = await authService.refreshToken();
          
          // Сохраняем новые токены с временем истечения
          authService.saveAuthTokens(newTokens.accessToken, newTokens.refreshToken, newTokens.expiresAt);
          
          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Если не удалось обновить токен, очищаем все токены и редиректим на логин
        authService.clearAuthTokens();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;