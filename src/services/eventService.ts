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
  status?: EventStatusType;
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
  status: EventStatusType;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export type EventStatusType = 'Draft' | 'Published' | 'InProgress' | 'Completed' | 'Cancelled';

// Ищет индекс значения в словаре (проходит циклом)
const findIndexByValue = <T extends Record<string, string>>(dict: T, value: string): number | null => {
  const entries = Object.entries(dict);
  for (let i = 0; i < entries.length; i++) {
    if (entries[i][1] === value) return i;
  }
  return null;
};

export interface MyEventItem {
  id: string;
  title: string;
  description: string;
  type: EventType;
  start: string;
  end: string;
  city: string;
  address: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  availableSpots: number;
  status: EventStatusType;
  imageUrl: string | null;
  organizerName: string;
  isPublished: boolean;
  createdAt: string;
}

export interface MyEventsApiResponse {
  data: {
    items: MyEventItem[];
    totalCount: number;
  };
  dictionaries: [Record<string, string>, Record<EventStatusType, string>];
}

export interface EventsListResponse {
  events: EventResponse[];
  totalCount: number;
}

// Преобразует PascalCase EventData в camelCase payload для API-запросов
const toApiPayload = (data: EventData, dictionaries?: MyEventsApiResponse['dictionaries'] | null) => {
  const statusDict = dictionaries?.[1];
  let statusValue: number;
  if (data.status && statusDict) {
    statusValue = findIndexByValue(statusDict, data.status) ?? 0;
  } else {
    statusValue = 0;
  }
  return {
    title: data.Title,
    description: data.Description,
    type: data.type,
    start: data.Start,
    end: data.End,
    city: data.City,
    address: data.Address,
    price: data.Price,
    maxParticipants: data.maxParticipants,
    status: statusValue,
  };
};

export const eventService = {
  // Создание нового мероприятия (требует роль Organizer или Admin)
  createEvent: async (data: EventData, dictionaries?: MyEventsApiResponse['dictionaries'] | null): Promise<EventResponse> => {
    const response = await api.post('/Event', toApiPayload(data, dictionaries));
    return response.data;
  },

  // Получение данных о мероприятии (без авторизации)
  getEvent: async (eventId: string): Promise<EventResponse> => {
    const response = await api.get(`/Event/${eventId}`);
    return response.data;
  },

  // Обновление данных мероприятия (требует роль Organizer или Admin)
  updateEvent: async (eventId: string, data: EventData, dictionaries?: MyEventsApiResponse['dictionaries'] | null): Promise<EventResponse> => {
    const response = await api.put(`/Event/${eventId}`, toApiPayload(data, dictionaries));
    return response.data;
  },

  // Получить свои мероприятия (Organizer) с пагинацией
  getMyEvents: async (page: number = 0, pageSize: number = 10): Promise<{ events: EventResponse[]; totalCount: number; dictionaries: MyEventsApiResponse['dictionaries'] }> => {
    const response = await api.get<MyEventsApiResponse>('/Event/my', { params: { page, pageSize } });
    const { items, totalCount } = response.data.data;
    const events: EventResponse[] = items.map(item => ({
      id: item.id,
      Title: item.title,
      Description: item.description,
      type: item.type,
      Start: item.start,
      End: item.end,
      City: item.city,
      Address: item.address,
      Price: item.price,
      maxParticipants: item.maxParticipants,
      isPublished: item.isPublished,
      status: item.status,
      organizerId: '',
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    }));
    return { events, totalCount, dictionaries: response.data.dictionaries };
  },

  // Удалить своё мероприятие (Organizer или Admin)
  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/Event/${eventId}`);
  },
};