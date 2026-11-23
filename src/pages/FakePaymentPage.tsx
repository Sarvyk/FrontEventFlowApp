import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { ticketService } from '../services/ticketService';
import { eventService } from '../services/eventService';
import { type PaymentDto } from '../types/payment';
import { useAuth } from '../contexts/AuthContext';
import './FakePaymentPage.css';

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_SECONDS = 30;

async function loadEventTitle(ticketId: string, setTitle: React.Dispatch<React.SetStateAction<string>>): Promise<void> {
  try {
    const ticket = await ticketService.getTicketById(ticketId);
    if (ticket.eventId) {
      const evt = await eventService.getEvent(ticket.eventId);
      setTitle(evt.Title);
    }
  } catch {
    // Название не критично — показываем общий текст
  }
}

const FakePaymentPage: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  const getStoredPayment = (pid: string | undefined): PaymentDto | null => {
    if (!pid) return null;
    try {
      const raw = sessionStorage.getItem(`payment_${pid}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const [payment, setPayment] = useState<PaymentDto | null>(
    () => getStoredPayment(paymentId)
  );
  const [eventTitle, setEventTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(() => getStoredPayment(paymentId) === null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<number>(0);

  const hasAttemptedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Если нет начальных данных — пробуем получить через API (один раз за сессию)
    if (!payment && paymentId && !hasAttemptedRef.current && !error) {
      hasAttemptedRef.current = true;
      setLoading(true);
      paymentService.getPayment(paymentId)
        .then((data) => {
          setPayment(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Платёж не найден. Пожалуйста, зарегистрируйтесь на мероприятие заново.');
          setLoading(false);
        });
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [paymentId, isAuthenticated, isLoadingAuth, navigate, error]);

  const startPolling = () => {
    elapsedRef.current = 0;
    pollTimerRef.current = setInterval(async () => {
      elapsedRef.current += 1;
      if (!paymentId) return;

      try {
        const updated = await paymentService.getPayment(paymentId);
        setPayment(updated);

        if (updated.status === 'Подтверждена') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          loadEventTitle(updated.ticketId, setEventTitle);
        } else if (elapsedRef.current >= MAX_POLL_SECONDS) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setError('Время ожидания истекло. Пожалуйста, попробуйте снова.');
        }
      } catch {
        // Игнорируем ошибки при опросе — повторим следующую секунду
      }
    }, POLL_INTERVAL_MS);
  };

  const handleConfirm = async () => {
    if (!paymentId) return;
    setConfirming(true);
    try {
      const data = await paymentService.confirmPayment(paymentId);
      setPayment(data);
      setConfirmed(true);
      sessionStorage.removeItem(`payment_${paymentId}`);
      startPolling();
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number }; message?: string };
      if (axiosError.response?.status === 401) {
        navigate('/login');
      } else {
        setError(axiosError.message || 'Ошибка при подтверждении оплаты');
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!paymentId) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await paymentService.cancelPayment(paymentId);
      sessionStorage.removeItem(`payment_${paymentId}`);
      navigate('/');
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number }; message?: string };
      if (axiosError.response?.status === 401) {
        navigate('/login');
      } else {
        setError(axiosError.message || 'Ошибка при отмене оплаты');
      }
    }
  };

  const isLoading = isLoadingAuth || loading;

  if (isLoading) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-container payment-error">
          <h2>Ошибка</h2>
          <p className="error-text">{error}</p>
          <button className="back-btn" onClick={() => navigate('/events')}>
            Вернуться к списку мероприятий
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <p>Платёж не найден</p>
          <button className="back-btn" onClick={() => navigate('/events')}>
            Вернуться к списку мероприятий
          </button>
        </div>
      </div>
    );
  }

  // Успешная оплата
  if (payment.status === 'Подтверждена') {
    return (
      <div className="payment-page">
        <div className="payment-container payment-success">
          <div className="success-icon">✓</div>
          <h2>Оплата подтверждена</h2>
          {eventTitle ? (
            <p>Вы успешно зарегистрированы на мероприятие «{eventTitle}»</p>
          ) : (
            <p>Вы успешно зарегистрированы на мероприятие</p>
          )}
          <button className="back-btn" onClick={() => navigate('/events')}>
            Перейти к мероприятиям
          </button>
        </div>
      </div>
    );
  }

  // Processing — показываем экран обработки
  if (payment.status === 'Обработка') {
    return (
      <div className="payment-page">
        <div className="payment-container payment-processing">
          <div className="spinner" />
          <h2>Обработка...</h2>
          <p>Платёж обрабатывается. Это займёт несколько секунд.</p>
        </div>
      </div>
    );
  }

  // Pending — показываем кнопку подтверждения или данные платежа после нажатия
  return (
    <div className="payment-page">
      <div className="payment-container">
        <h2>Оплата мероприятия</h2>
        {confirmed ? (
          <>
            <div className="payment-summary payment-details">
              <p><strong>ID платежа:</strong> {payment.id}</p>
              <p><strong>ID билета:</strong> {payment.ticketId}</p>
              <p><strong>ID пользователя:</strong> {payment.userId}</p>
              <p><strong>Сумма:</strong> {payment.price} руб.</p>
              <p><strong>Статус:</strong> {payment.status}</p>
              <p><strong>Дата создания:</strong> {new Date(payment.paymentCreationDate).toLocaleString('ru-RU')}</p>
            </div>
            <div className="spinner" />
          </>
        ) : (
          <>
            <div className="payment-summary">
              <p><strong>Сумма:</strong> {payment.price} руб.</p>
              <p><strong>Статус:</strong> Ожидает оплаты</p>
            </div>
            <button
              className="confirm-pay-btn"
              disabled={confirming}
              onClick={handleConfirm}
            >
              {confirming ? 'Обработка...' : 'Подтвердить оплату'}
            </button>
            <button className="back-btn" onClick={handleCancel}>
              Отмена
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FakePaymentPage;
