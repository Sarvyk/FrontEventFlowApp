import api from './api';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  organizerProfile: {
    companyName: string | null;
    description: string | null;
    webSite: string | null;
    isVerified: boolean;
    eventsCount: number;
  } | null;
}

export const userService = {
  // Обновление профиля пользователя
  updateUserProfile: async (data: UserProfile): Promise<UserResponse> => {
    try {
      const response = await api.put('/User/UpdateUserProfile', data);
      return response.data;
    } catch (error: any) {
      // Если есть конкретная ошибка от API, пробрасываем её
      if (error.response && error.response.data) {
        // Проверяем, есть ли сообщение в разных форматах
        const errorMessage = error.response.data.message || 
                            error.response.data.error || 
                            error.response.data ||
                            'Ошибка при обновлении профиля';
        throw new Error(errorMessage);
      }
      throw new Error('Ошибка при обновлении профиля');
    }
  },

  // Получение данных профиля пользователя
  getProfile: async (): Promise<UserResponse> => {
    const response = await api.get('/User/GetProfile');
    return response.data;
  },
  
  // Подача заявки на организатора
  applyForOrganizer: async (): Promise<void> => {
    try {
      const response = await api.post('/User/ApplyForOrganizer');
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message || 
                            error.response.data.error || 
                            error.response.data ||
                            'Ошибка при подаче заявки на организатора';
        throw new Error(errorMessage);
      }
      throw new Error('Ошибка при подаче заявки на организатора');
    }
  },
};