import api from './api';
import { type EventDto } from '../types/event';

export const eventListService = {
  // Получение списка мероприятий с пагинацией
  getEvents: async (page: number = 0, pageSize: number = 10): Promise<EventDto[]> => {
    const response = await api.get<EventDto[]>('/Event', {
      params: {
        page,
        pageSize
      }
    });
    return response.data;
  },
};