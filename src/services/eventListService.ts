import api from './api';
import { type EventDto } from '../types/event';

export interface EventsResponse {
  items: EventDto[];
  totalCount: number;
}

export interface EventsApiResponse {
  data: EventsResponse;
  dictionaries: [Record<string, string>, Record<string, string>];
}

export const eventListService = {
  // Получение списка мероприятий с пагинацией
  getEvents: async (page: number = 0, pageSize: number = 10): Promise<EventsApiResponse> => {
    const response = await api.get<EventsApiResponse>('/Event', {
      params: {
        page,
        pageSize
      }
    });
    return response.data;
  },
};