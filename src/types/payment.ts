export type PaymentStatus = 'Pending' | 'Processing' | 'Confirmed' | 'Cancelled' | 'Returned';

export interface PaymentDto {
  id: string;
  paymentId: string;
  ticketId: string;
  userId: string;
  price: number;
  status: PaymentStatus;
  payUrl?: string | null;
  paymentCreationDate: string;
  lastModificationDate: string | null;
  paidAt: string | null;
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
