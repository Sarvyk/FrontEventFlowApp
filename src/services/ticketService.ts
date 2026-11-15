import api from './api';

export interface TicketResponse {
  id: string;
  userId: string;
  eventId: string;
  ticketNumber: string;
  createdAt: string;
  updatedAt: string;
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