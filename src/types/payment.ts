export type PaymentStatus = 'Ожидание' | 'Обработка' | 'Подтверждена' | 'Отменена' | 'Возврат';

export interface PaymentDto {
  id: string;
  ticketId: string;
  userId: string;
  price: number;
  status: PaymentStatus;
  payUrl?: string | null;
  paymentCreationDate: string;
}

export type TicketStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Expired';

export interface TicketDto {
  id: string;
  ticketId: string;
  eventId: string;
  userId: string;
  ticketNumber: string;
  status: TicketStatus;
  ticketCreationDate: string;
  lastModificationDate: string | null;
  price: number;
  seatNumber: string | null;
  rowNumber: string | null;
  sector: string | null;
}
