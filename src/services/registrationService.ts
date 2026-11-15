import api from './api';

export interface RegistrationResponse {
  id: string;
  userId: string;
  eventId: string;
  createdAt: string;
}

export const registrationService = {
  // Регистрация на мероприятие
  registerForEvent: async (eventId: string): Promise<RegistrationResponse> => {
    const response = await api.post(`/Registration/${eventId}`);
    return response.data;
  },

  // Отмена регистрации на мероприятие
  unregisterFromEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/Registration/${eventId}`);
  },

  // Получить список своих регистраций на мероприятия
  getMyRegistrations: async (): Promise<RegistrationResponse[]> => {
    const response = await api.get('/Registration/my');
    return response.data;
  },

  // Получить список зарегистрировавшихся на мероприятие (требует роль Organizer или Admin)
  getAllRegistrationsForEvent: async (eventId: string): Promise<RegistrationResponse[]> => {
    const response = await api.get(`/Registration/${eventId}/all`);
    return response.data;
  },
};