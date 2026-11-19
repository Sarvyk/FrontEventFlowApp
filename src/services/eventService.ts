import api from './api';

export type EventType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 99;

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  0: 'Конференция',
  1: 'Семинар',
  2: 'Мастер-класс',
  3: 'Спортивное мероприятие',
  4: 'Концерт',
  5: 'Выставка',
  6: 'Встреча',
  7: 'День рождения',
  8: 'Похороны',
  9: 'Свадьба',
  99: 'Другое',
};

export interface EventData {
  Title: string;
  Description: string;
  type: EventType;
  Start: string;
  End: string;
  City: string;
  Address: string;
  Price: number;
  maxParticipants: number;
  isPublished: boolean;
}

export interface EventResponse {
  id: string;
  Title: string;
  Description: string;
  type: EventType;
  Start: string;
  End: string;
  City: string;
  Address: string;
  Price: number;
  maxParticipants: number;
  isPublished: boolean;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventsListResponse {
  events: EventResponse[];
  totalCount: number;
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

  // Получить свои мероприятия (Organizer) с пагинацией
  getMyEvents: async (page: number = 0, pageSize: number = 10): Promise<EventsListResponse> => {
    const response = await api.get<EventsListResponse>('/Event/my', { params: { page, pageSize } });
    return response.data;
  },

  // Удалить своё мероприятие (Organizer или Admin)
  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/Event/${eventId}`);
  },
};