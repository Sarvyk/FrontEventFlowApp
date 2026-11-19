import api from './api';
import { type EventDto } from '../types/event';

export interface EventsResponse {
  items: EventDto[];
  totalCount: number;
}

export const eventListService = {
  // Получение списка мероприятий с пагинацией
  getEvents: async (page: number = 0, pageSize: number = 10): Promise<EventsResponse> => {
    const response = await api.get<EventsResponse>('/Event', {
      params: {
        page,
        pageSize
      }
    });
    return response.data;
  },
};