import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventListService, type EventsApiResponse } from '../services/eventListService';
import { registrationService } from '../services/registrationService';
import { paymentService } from '../services/paymentService';
import { type EventDto } from '../types/event';
import { useAuth } from '../contexts/AuthContext';
import './EventListPage.css';

interface EventListProps {
  page?: number;
  pageSize?: number;
}

const PAGE_SIZES = [5, 10, 20, 50];

function getTypeLabel(type: string, typeDict: Record<string, string> | undefined): string {
  return typeDict?.[type] ?? type;
}

function getStatusLabel(status: string, statusDict: Record<string, string> | undefined): string {
  return statusDict?.[status] ?? status;
}

const EventListPage: React.FC<EventListProps> = ({ page = 0, pageSize = 10 }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [typeDict, setTypeDict] = useState<Record<string, string> | undefined>(undefined);
  const [statusDict, setStatusDict] = useState<Record<string, string> | undefined>(undefined);
  const [registerLoading, setRegisterLoading] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<Record<string, string>>({});

  const handleRegister = async (event: EventDto) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setRegisterLoading(event.id);
    setRegisterError(prev => ({ ...prev, [event.id]: '' }));
    try {
      if (event.isUserRegistered) {
        await registrationService.unregisterFromEvent(event.id);
        setEvents(prev => prev.map(e =>
          e.id === event.id ? { ...e, isUserRegistered: false } : e
        ));
      } else {
        const ticketId = await registrationService.registerForEvent(event.id);
        // Инициируем оплату и перенаправляем на экран оплаты
        const payment = await paymentService.initiatePayment(ticketId);
        sessionStorage.setItem(`payment_${payment.id}`, JSON.stringify(payment));
        navigate(payment.payUrl ?? `/pay/${payment.id}`);
      }
    } catch (err: unknown) {
      let message = '';
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      console.error('Registration error raw:', axiosErr.response?.data);
      if (axiosErr.response?.data) {
        const d = axiosErr.response.data as Record<string, unknown>;
        // Пробуем разные форматы ответа ASP.NET Core: ProblemDetails, ValidationProblemDetails, кастомный
        message = (d.message as string)
          ?? (d.detail as string)
          ?? (d.title as string)
          ?? (Array.isArray(d.errors) ? (d.errors as string[]).join('\n') : '')
          ?? ((typeof d.errors === 'object' && d.errors !== null)
            ? Object.values(d.errors as Record<string, string[]>).flat().join('\n')
            : '');
        // Если ничего не нашли — берём весь body как строку
        if (!message) {
          message = typeof axiosErr.response.data === 'string'
            ? axiosErr.response.data
            : JSON.stringify(axiosErr.response.data);
        }
      }
      if (!message) message = 'Не удалось зарегистрироваться. Попробуйте позже.';
      setRegisterError(prev => ({ ...prev, [event.id]: message }));
      console.error('Registration error:', err);
    } finally {
      setRegisterLoading(null);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response: EventsApiResponse = await eventListService.getEvents(currentPage, currentPageSize);
        setEvents(response.data.items ?? []);
        setTotalCount(response.data.totalCount ?? 0);
        setTypeDict(response.dictionaries?.[0]);
        setStatusDict(response.dictionaries?.[1]);
      } catch (err) {
        setError('Ошибка при загрузке мероприятий');
        console.error('Error fetching events:', err);
        setEvents([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentPage, currentPageSize]);

  const totalPages = Math.ceil(totalCount / currentPageSize) || 1;

  if (loading) {
    return (
      <div className="event-list-page">
        <h2>Список мероприятий</h2>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-list-page">
        <h2>Список мероприятий</h2>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="event-list-page">
      <h2>Список мероприятий</h2>

      {events.length === 0 ? (
        <p>Мероприятия не найдены</p>
      ) : (
        <>
          <div className="events-list">
            {events.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-card-image-wrap">
                  {event.imageUrl && (
                    <img src={event.imageUrl} alt={event.title} className="event-card-image" />
                  )}
                </div>
                <div className="event-card-info">
                  <h3>{event.title}</h3>
                  <p><strong>Тип:</strong> {getTypeLabel(event.type, typeDict)}</p>
                  <p><strong>Дата:</strong> {new Date(event.start).toLocaleDateString('ru-RU')} — {new Date(event.end).toLocaleDateString('ru-RU')}</p>
                  {event.address && <p><strong>Место:</strong> {event.city}, {event.address}</p>}
                  {!event.address && <p><strong>Место:</strong> {event.city}</p>}
                  <p><strong>Описание:</strong> {event.description}</p>
                  <p><strong>Цена:</strong> {event.price > 0 ? `${event.price} руб.` : 'Бесплатно'}</p>
                  <p><strong>Участники:</strong> {event.currentParticipants}/{event.maxParticipants}</p>
                  {event.organizerName && (
                    <p><strong>Организатор:</strong> {event.organizerName}</p>
                  )}
                </div>
                <div className="event-card-sidebar">
                  <span className={`event-status-badge ${event.status === 'Published' ? 'published' : event.status === 'Cancelled' ? 'cancelled' : 'draft'}`}>
                    {getStatusLabel(event.status, statusDict)}
                  </span>
                  {event.status === 'Published' && (
                    event.isUserRegistered ? (
                      <>
                        <button
                          className="event-unregister-btn"
                          disabled={registerLoading === event.id}
                          onClick={() => handleRegister(event)}
                        >
                          {registerLoading === event.id ? 'Загрузка...' : 'Отменить регистрацию'}
                        </button>
                        <span className="event-registered-text">Уже зарегистрирован</span>
                      </>
                    ) : (
                      <>
                        <button
                          className="event-register-btn"
                          disabled={registerLoading === event.id}
                          onClick={() => handleRegister(event)}
                        >
                          {registerLoading === event.id ? 'Загрузка...' : 'Зарегистрироваться'}
                        </button>
                        {registerError[event.id] && (
                          <span className="event-register-error">{registerError[event.id]}</span>
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalCount > 5 && (
            <div className="dashboard-pagination">
              <div className="page-size-select">
                <label>Показывать по: </label>
                <select
                  value={currentPageSize}
                  onChange={(e) => { setCurrentPageSize(Number(e.target.value)); setCurrentPage(0); }}
                >
                  {PAGE_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>← Назад</button>
              <span>Страница {currentPage + 1} из {totalPages} ({totalCount} шт.)</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>Вперёд →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventListPage;