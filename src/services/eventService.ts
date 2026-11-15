import api from './api';

export interface EventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
}

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export const eventService = {
  // Создание нового мероприятия (требует роль Organizer или Admin)
  createEvent: async (data: EventData): Promise<EventResponse> => {
    const response = await api.post('/Event', data);
    return response.data;
  },

  // Получение данных о мероприятии (без авторизации)
  getEvent: async (eventId: string): Promise<EventResponse> => {
    const response = await api.get(`/Event/${eventId}`);
    return response.data;
  },

  // Обновление данных мероприятия (требует роль Organizer или Admin)
  updateEvent: async (eventId: string, data: EventData): Promise<EventResponse> => {
    const response = await api.put(`/Event/${eventId}`, data);
    return response.data;
  },
};