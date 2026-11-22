import api from './api';

// Статус билета на уровне БД — числовой enum (0=Pending, 1=Confirmed, 2=Cancelled, 3=Expired)
export type TicketStatusDb = number;
export const TICKET_STATUS_PENDING = 0;
export const TICKET_STATUS_CONFIRMED = 1;
export const TICKET_STATUS_CANCELLED = 2;
export const TICKET_STATUS_EXPIRED = 3;

export interface TicketResponse {
  id: string;               // первичный ключ БД
  ticketId: string;         // бизнес-ID (Guid), используется в API
  userId: string;
  eventId: string;
  ticketNumber: string;
  status: TicketStatusDb;
  ticketCreationDate: string;
  lastModificationDate: string | null;
  price: number;
  seatNumber: string | null;
  rowNumber: string | null;
  sector: string | null;
}

export const ticketService = {
  // Возвращает билет по идентификатору билета
  getTicketById: async (id: string): Promise<TicketResponse> => {
    const response = await api.get(`/Ticket/${id}`);
    return response.data;
  },

  // Возвращает список билетов авторизованного пользователя
  getUserTickets: async (): Promise<TicketResponse[]> => {
    const response = await api.get('/users/me/tickets');
    return response.data;
  },

  // Возвращает список билетов по Id мероприятия (требует роль Organizer или Admin)
  getTicketsByEventId: async (eventId: string): Promise<TicketResponse[]> => {
    const response = await api.get(`/Ticket/${eventId}/all`);
    return response.data;
  },
};