import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService, type EventResponse, type EventData, type MyEventsApiResponse } from '../services/eventService';
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
  description?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  street?: string;
  house?: string;
  apartment?: string;
  price?: string;
  maxParticipants?: string;
}

const defaultFormData: EventData = {
  Title: '',
  Description: '',
  type: 0,
  Start: '',
  End: '',
  City: '',
  Street: '',
  House: '',
  Apartment: '',
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
    // Конвертируем числовой type в строковый ключ словаря
    let eventType: unknown = event.type;
    if (dictionaries?.[0]) {
      const typeDict = dictionaries[0];
      const keys = Object.keys(typeDict);
      const idx = Number(event.type);
      if (idx >= 0 && idx < keys.length) {
        eventType = keys[idx];
      }
    }
    setFormData({
      Title: event.Title,
      Description: event.Description,
      type: eventType as number | string,
      Start: isoToLocalDatetime(event.Start),
      End: isoToLocalDatetime(event.End),
      City: event.City,
      Street: event.Street,
      House: event.House,
      Apartment: event.Apartment,
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

    // Title
    if (!formData.Title.trim()) {
      errors.title = 'Название мероприятия обязательно';
    } else if (formData.Title.length < 3) {
      errors.title = 'Название должно содержать минимум 3 символа';
    } else if (formData.Title.length > 200) {
      errors.title = 'Название не должно превышать 200 символов';
    }

    // Description
    if (!formData.Description.trim()) {
      errors.description = 'Описание обязательно';
    } else if (formData.Description.length > 2000) {
      errors.description = 'Описание не должно превышать 2000 символов';
    }

    // Start date
    if (!formData.Start || formData.Start.length < 10) {
      errors.startDate = 'Дата начала обязательна';
    } else {
      const start = new Date(formData.Start).getTime();
      if (isNaN(start)) {
        errors.startDate = 'Некорректная дата начала';
      } else if (!editingEvent && start < Date.now()) {
        errors.startDate = 'Дата начала должна быть в будущем';
      }
    }

    // End date
    if (!formData.End || formData.End.length < 10) {
      errors.endDate = 'Дата окончания обязательна';
    } else {
      const start = new Date(formData.Start).getTime();
      const end = new Date(formData.End).getTime();
      if (isNaN(end)) {
        errors.endDate = 'Некорректная дата окончания';
      } else if (!formData.Start || formData.Start.length < 10) {
        // start already validated above, but guard here for safety
      } else if (end <= start) {
        errors.endDate = 'Дата окончания должна быть позже даты начала';
      } else if (start === end) {
        errors.startDate = 'Дата начала и окончания не могут совпадать';
      }
    }

    // City
    if (!formData.City.trim()) {
      errors.city = 'Город обязателен';
    } else if (formData.City.length > 100) {
      errors.city = 'Название города не должно превышать 100 символов';
    }

    // Address: Street, House, Apartment — all required
    const addressParts = [formData.Street, formData.House, formData.Apartment];
    if (!addressParts.some(p => p.trim())) {
      errors.street = 'Адрес обязателен';
      errors.house = 'Адрес обязателен';
      errors.apartment = 'Адрес обязателен';
    } else {
      const combinedAddress = addressParts.filter(Boolean).join(', ');
      if (combinedAddress.length > 300) {
        errors.street = 'Адрес не должен превышать 300 символов';
      }
    }

    // Price
    if (formData.Price < 0) {
      errors.price = 'Цена не может быть отрицательной';
    }

    // Max participants
    const maxP = parseInt(formData.maxParticipants as unknown as string) || 1;
    if (maxP <= 0) {
      errors.maxParticipants = 'Количество участников должно быть больше 0';
    } else if (maxP > 100000) {
      errors.maxParticipants = 'Количество участников слишком велико';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---- Работа с датами ----
  // ISO-строка (с timezone/секундами) → формат datetime-local: "YYYY-MM-DDTHH:MM"
  const isoToLocalDatetime = (iso: string): string => {
    if (!iso || iso.length < 16) return iso;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Значение из datetime-local → строка для отправки на сервер (UTC с Z)
  const normalizeDate = (value: string): string => {
    if (!value || value.length < 10) return value;
    if (value.length === 16) return `${value}:00Z`;
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
      street: 'Street',
      house: 'House',
      apartment: 'Apartment',
      price: 'Price',
    };
    const propName = keyMap[name] ?? (name as keyof EventData);
    setFormData(prev => {
      if (propName === 'maxParticipants') return { ...prev, [propName]: Math.min(100000, Math.max(1, parseInt(value) || 1)) };
      if (propName === 'Price') return { ...prev, [propName]: parseFloat(value) || 0 };
      if (propName === 'type') {
        return { ...prev, [propName]: value };
      }
      if (propName === 'isPublished') return { ...prev, [propName]: (e.target as HTMLInputElement).checked };
      return { ...prev, [propName]: value };
    });
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const getTypeLabel = (type: unknown): string => {
    const typeDict = dictionaries?.[0];
    if (typeDict) {
      const typeStr = String(type);
      for (const [key, label] of Object.entries(typeDict)) {
        if (key === typeStr || String(Object.keys(typeDict).indexOf(key)) === typeStr) return label;
      }
    }
    return 'Не указан';
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
                  <p><strong>Место:</strong> {event.City || event.Street ? `${event.City}${event.City && (event.Street || event.House || event.Apartment) ? ', ' : ''}${[event.Street, event.House, event.Apartment].filter(Boolean).join(', ')}` : 'Не указано'}</p>
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
      {formOpen && dictionaries?.[0] && (
        <div className="event-form-overlay">
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
                  maxLength={200}
                  className={formErrors.title ? 'input-error' : ''}
                />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Описание *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.Description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={2000}
                  className={formErrors.description ? 'input-error' : ''}
                />
                {formErrors.description && <span className="field-error">{formErrors.description}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Тип мероприятия</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type as unknown as string}
                    onChange={handleChange}
                  >
                    {dictionaries?.[0] ? (
                      Object.entries(dictionaries[0]).map(([t, label]) => (
                        <option key={t} value={t}>{label}</option>
                      ))
                    ) : (
                      <option value="">Загрузка...</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="status">Статус</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                  >
                    {dictionaries?.[1] ? (
                      Object.entries(dictionaries[1]).map(([s, label]) => (
                        <option key={s} value={s}>{label}</option>
                      ))
                    ) : (
                      <option value="">Загрузка...</option>
                    )}
                  </select>
                </div>
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
                  <label htmlFor="city">Город *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.City}
                    onChange={handleChange}
                    maxLength={100}
                    className={formErrors.city ? 'input-error' : ''}
                  />
                  {formErrors.city && <span className="field-error">{formErrors.city}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="street">Улица *</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.Street}
                    onChange={handleChange}
                    maxLength={100}
                    className={formErrors.street ? 'input-error' : ''}
                  />
                  {formErrors.street && <span className="field-error">{formErrors.street}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="house">Дом *</label>
                  <input
                    type="text"
                    id="house"
                    name="house"
                    value={formData.House}
                    onChange={handleChange}
                    maxLength={20}
                    className={formErrors.house ? 'input-error' : ''}
                  />
                  {formErrors.house && <span className="field-error">{formErrors.house}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="apartment">Квартира *</label>
                  <input
                    type="text"
                    id="apartment"
                    name="apartment"
                    value={formData.Apartment}
                    onChange={handleChange}
                    maxLength={10}
                    className={formErrors.apartment ? 'input-error' : ''}
                  />
                  {formErrors.apartment && <span className="field-error">{formErrors.apartment}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Цена (руб.) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min={0}
                    step={0.01}
                    value={formData.Price}
                    onChange={handleChange}
                    className={formErrors.price ? 'input-error' : ''}
                  />
                  {formErrors.price && <span className="field-error">{formErrors.price}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="maxParticipants">Макс. участников *</label>
                  <input
                    type="number"
                    id="maxParticipants"
                    name="maxParticipants"
                    min={1}
                    max={100000}
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    className={formErrors.maxParticipants ? 'input-error' : ''}
                  />
                  {formErrors.maxParticipants && <span className="field-error">{formErrors.maxParticipants}</span>}
                </div>
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
