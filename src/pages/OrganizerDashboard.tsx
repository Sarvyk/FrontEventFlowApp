import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService, type EventResponse, type EventData, EVENT_TYPE_LABELS, type EventType, type MyEventsApiResponse } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import './OrganizerDashboard.css';

const PAGE_SIZES = [5, 10, 20];

const getApiErrorMessage = (err: unknown): string => {
  const axiosErr = err as { response?: { data?: unknown }; message: string };
  if (axiosErr.response?.data) {
    const data = axiosErr.response.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) {
      const msg = (data as Record<string, unknown>).message;
      if (typeof msg === 'string') return msg;
    }
  }
  return err instanceof Error ? err.message : 'Произошла ошибка';
};

interface FormErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: string;
}

const defaultFormData: EventData = {
  Title: '',
  Description: '',
  type: 99,
  Start: '',
  End: '',
  City: '',
  Address: '',
  Price: 0,
  maxParticipants: 1,
  isPublished: false,
  status: 'Draft',
};

const OrganizerDashboard: React.FC = () => {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dictionaries, setDictionaries] = useState<MyEventsApiResponse['dictionaries'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Форма создания/редактирования
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventResponse | null>(null);
  const [formData, setFormData] = useState<EventData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { hasRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    try {
      const result = await eventService.getMyEvents(page, pageSize);
      setEvents(result.events ?? []);
      setTotalCount(result.totalCount ?? 0);
      setDictionaries(result.dictionaries ?? null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setError(message);
      console.error('[OrganizerDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Organizer')) {
      navigate('/');
      return;
    }

    const loadEvents = async () => {
      setLoading(true);
      await fetchEvents();
    };
    loadEvents();
  }, [hasRole, navigate, isAuthenticated, fetchEvents]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // ---- Форма: открытие/закрытие ----
  const openCreateForm = () => {
    setEditingEvent(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setSubmitError(null);
    setFormOpen(true);
  };

  const openEditForm = (event: EventResponse) => {
    console.log('[OrganizerDashboard] Editing event dates:', event.Start, event.End);
    setEditingEvent(event);
    setFormData({
      Title: event.Title,
      Description: event.Description,
      type: event.type,
      Start: event.Start,
      End: event.End,
      City: event.City,
      Address: event.Address,
      Price: event.Price,
      maxParticipants: event.maxParticipants,
      isPublished: event.isPublished,
      status: event.status,
    });
    setFormErrors({});
    setSubmitError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEvent(null);
    setFormErrors({});
    setSubmitError(null);
  };

  // ---- Валидация ----
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.Title.trim()) errors.title = 'Название обязательно';
    if (!formData.Start || formData.Start.length < 10) errors.startDate = 'Укажите дату начала';
    if (!formData.End || formData.End.length < 10) errors.endDate = 'Укажите дату окончания';
    if (formData.Start && formData.End) {
      const start = new Date(formData.Start).getTime();
      const end = new Date(formData.End).getTime();
      if (isNaN(start) || isNaN(end)) {
        errors.startDate = 'Некорректная дата начала';
        errors.endDate = 'Некорректная дата окончания';
      } else if (start > end) {
        errors.endDate = 'Дата окончания не может быть раньше даты начала';
      } else if (start < new Date('2000-01-01').getTime() || end < new Date('2000-01-01').getTime()) {
        errors.startDate = 'Укажите корректную дату (после 2000 года)';
        errors.endDate = 'Укажите корректную дату (после 2000 года)';
      }
    }
    if (formData.maxParticipants < 1) errors.maxParticipants = 'Минимум 1 участник';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---- Отправка формы ----
  const normalizeDate = (value: string): string => {
    if (!value || value.length < 10) return value;
    // datetime-local: "YYYY-MM-DDTHH:MM" → добавляем секунды, оставляем локальное время
    if (value.length === 16) return `${value}:00`;
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitError(null);
    try {
      const payload: EventData = {
        ...formData,
        Start: normalizeDate(formData.Start),
        End: normalizeDate(formData.End),
      };
      console.log('[OrganizerDashboard] Submitting payload:', JSON.stringify(payload));
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, payload, dictionaries ?? undefined);
      } else {
        await eventService.createEvent(payload, dictionaries ?? undefined);
      }
      closeForm();
      fetchEvents();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setSubmitError(message);
      console.error('[OrganizerDashboard] Submit error:', err);
    }
  };

  // ---- Удаление ----
  const handleDelete = async (event: EventResponse) => {
    if (!confirm(`Удалить мероприятие «${event.Title}»?`)) return;

    setActionLoading(event.id);
    try {
      await eventService.deleteEvent(event.id);
      setEvents(prev => prev.filter(e => e.id !== event.id));
      setTotalCount(prev => prev - 1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setError(message);
      console.error('[OrganizerDashboard] Delete error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // HTML input names are camelCase for UX; map to PascalCase property keys expected by EventData
    const keyMap: Record<string, keyof EventData> = {
      title: 'Title',
      description: 'Description',
      startDate: 'Start',
      endDate: 'End',
      city: 'City',
      address: 'Address',
    };
    const propName = keyMap[name] ?? (name as keyof EventData);
    setFormData(prev => {
      if (propName === 'maxParticipants') return { ...prev, [propName]: Math.max(1, parseInt(value) || 1) };
      if (propName === 'Price') return { ...prev, [propName]: parseFloat(value) || 0 };
      if (propName === 'type') return { ...prev, [propName]: parseInt(value) as EventType };
      if (propName === 'isPublished') return { ...prev, [propName]: (e.target as HTMLInputElement).checked };
      return { ...prev, [propName]: value };
    });
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const getTypeLabel = (type: number): string => {
    const typeDict = dictionaries?.[0];
    if (typeDict) {
      for (const [key, label] of Object.entries(typeDict)) {
        if (String(key) === String(type)) return label;
      }
    }
    return EVENT_TYPE_LABELS[type as EventType] ?? 'Другое';
  };

  const getStatusLabel = (status: string): string => {
    const statusDict = dictionaries?.[1];
    return statusDict?.[status as keyof typeof statusDict] ?? status;
  };

  if (!isAuthenticated || !hasRole('Organizer')) {
    return null;
  }

  return (
    <div className="organizer-dashboard">
      <h2>Мои мероприятия</h2>

      <button onClick={openCreateForm} className="dashboard-create-btn">+ Создать мероприятие</button>

      {error && !events.length && (
        <div className="dashboard-error">{error}</div>
      )}

      {loading ? (
        <div className="dashboard-loading">Загрузка...</div>
      ) : events.length === 0 ? (
        <div className="dashboard-empty">У вас пока нет мероприятий. Создайте первое!</div>
      ) : (
        <>
          <div className="events-list">
            {events.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-card-header">
                  <h3 className="event-card-title">{event.Title}</h3>
                  <span className={`event-status-badge ${event.status === 'Published' ? 'published' : event.status === 'Cancelled' ? 'cancelled' : 'draft'}`}>
                    {getStatusLabel(event.status)}
                  </span>
                </div>
                <div className="event-card-body">
                  <p><strong>Тип:</strong> {getTypeLabel(event.type)}</p>
                  <p><strong>Дата:</strong> {new Date(event.Start).toLocaleDateString('ru-RU')} — {new Date(event.End).toLocaleDateString('ru-RU')}</p>
                  <p><strong>Место:</strong> {event.City || event.Address ? `${event.City}${event.City && event.Address ? ', ' : ''}${event.Address}` : 'Не указано'}</p>
                  <p><strong>Описание:</strong> {event.Description || 'Не указано'}</p>
                  <p><strong>Цена:</strong> {event.Price > 0 ? `${event.Price} руб.` : 'Бесплатно'}</p>
                  <p><strong>Участников (макс.):</strong> {event.maxParticipants}</p>
                </div>
                <div className="event-card-actions">
                  <button onClick={() => openEditForm(event)} className="btn-edit">Редактировать</button>
                  <button
                    onClick={() => handleDelete(event)}
                    disabled={actionLoading === event.id}
                    className="btn-delete"
                  >
                    {actionLoading === event.id ? '...' : 'Удалить'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="dashboard-pagination">
              <div className="page-size-select">
                <label>Показывать по: </label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                >
                  {PAGE_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Назад</button>
              <span>Страница {page + 1} из {totalPages} ({totalCount} шт.)</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Вперёд →</button>
            </div>
          )}
        </>
      )}

      {/* Форма создания/редактирования */}
      {formOpen && (
        <div className="event-form-overlay" onClick={closeForm}>
          <div className="event-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editingEvent ? 'Редактировать мероприятие' : 'Создать мероприятие'}</h3>
            {submitError && <div className="form-error">{submitError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Название *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.Title}
                  onChange={handleChange}
                  className={formErrors.title ? 'input-error' : ''}
                />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Описание</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.Description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Тип мероприятия</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 99] as EventType[]).map(t => (
                    <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Дата начала *</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={formData.Start}
                    onChange={handleChange}
                    className={formErrors.startDate ? 'input-error' : ''}
                  />
                  {formErrors.startDate && <span className="field-error">{formErrors.startDate}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">Дата окончания *</label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formData.End}
                    onChange={handleChange}
                    className={formErrors.endDate ? 'input-error' : ''}
                  />
                  {formErrors.endDate && <span className="field-error">{formErrors.endDate}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">Город</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.City}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Адрес</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.Address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Цена (руб.)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min={0}
                    step={0.01}
                    value={formData.Price}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxParticipants">Макс. участников</label>
                  <input
                    type="number"
                    id="maxParticipants"
                    name="maxParticipants"
                    min={1}
                    value={formData.maxParticipants}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                  />
                  Опубликовать
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeForm} className="btn-cancel">Отмена</button>
                <button type="submit">{editingEvent ? 'Сохранить' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
