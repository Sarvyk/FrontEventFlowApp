import api from './api';

export interface RegisterData {
  UserName: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  PhoneNumber: string;
  urlToController: string
}

export interface LoginData {
  email: string;
  password: string;
}

// Интерфейс для ответа от API авторизации
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | string; // Может быть как строкой, так и объектом Date
}

// Интерфейс для запроса логина
export interface LoginQuery {
  Email: string;
  Password: string;
}

export interface ConfirmEmailParams {
  userId: string;
  code: string;
}

export const authService = {
  // Регистрация нового пользователя
  register: async (data: RegisterData): Promise<AuthResponseDto> => {
    const response = await api.post('/Auth/RegisterUser', data);
    return response.data;
  },

  // Авторизация по Email и паролю
  login: async (data: LoginData): Promise<AuthResponseDto> => {
    // Создаем объект LoginQuery для отправки на API
    const loginQuery: LoginQuery = {
      Email: data.email,
      Password: data.password
    };
    
    const response = await api.post('/Auth/UserLogin', loginQuery);
    return response.data;
  },

  // Обновление токена авторизации
  refreshToken: async (): Promise<AuthResponseDto> => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      throw new Error('No refresh token found');
    }
    
    const response = await api.post('/Auth/refresh', { refresh });
    return response.data;
  },

  // Подтверждение email
  confirmEmail: async (params: ConfirmEmailParams): Promise<void> => {
    const response = await api.get(`/Auth/confirm-email?userId=${params.userId}&code=${params.code}`);
    return response.data;
  },

  // Сохранение токенов в localStorage
  saveAuthTokens: (token: string, refreshToken: string, expiresAt?: Date | string): void => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    if (expiresAt) {
      // Конвертируем дату в строку для сохранения в localStorage
      const expiresAtString = typeof expiresAt === 'string' ? expiresAt : expiresAt.toISOString();
      localStorage.setItem('tokenExpiresAt', expiresAtString);
    }
  },

  // Получение токенов из localStorage
  getAuthTokens: (): { token: string | null; refreshToken: string | null; expiresAt: Date | null } => {
    const token = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const expiresAtString = localStorage.getItem('tokenExpiresAt');
    
    return {
      token,
      refreshToken,
      expiresAt: expiresAtString ? new Date(expiresAtString) : null,
    };
  },

  // Удаление токенов
  clearAuthTokens: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
  },

  // Проверка истечения срока действия токена
  isTokenExpired: (): boolean => {
    const expiresAtString = localStorage.getItem('tokenExpiresAt');
    if (!expiresAtString) return true;
    
    const expirationDate = new Date(expiresAtString);
    const now = new Date();
    
    return now >= expirationDate;
  },
};