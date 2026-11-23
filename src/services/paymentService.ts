import api from './api';
import { type PaymentDto } from '../types/payment';

export const paymentService = {
  // Инициировать оплату — создаёт платёж и возвращает paymentId
  initiatePayment: async (ticketId: string): Promise<PaymentDto> => {
    const response = await api.post<PaymentDto>(`/payments/initiate/${ticketId}`);
    return response.data;
  },

  // Подтвердить оплату — переводит платёж в Processing
  confirmPayment: async (paymentId: string): Promise<PaymentDto> => {
    const response = await api.post<PaymentDto>(`/payments/${paymentId}/confirm`, {});
    return response.data;
  },

  // Получить статус платежа по ID
  getPayment: async (paymentId: string): Promise<PaymentDto> => {
    const response = await api.get<PaymentDto>(`/payments/${paymentId}`);
    return response.data;
  },

  // Отменить оплату
  cancelPayment: async (paymentId: string): Promise<void> => {
    await api.post(`/payments/${paymentId}/cancel`, {});
  },

  // Получить список своих платежей
  getMyPayments: async (): Promise<PaymentDto[]> => {
    const response = await api.get<PaymentDto[]>('/payments/my');
    return response.data;
  },
};
