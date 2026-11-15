import React, { useState, useEffect } from 'react';
import { eventListService, type EventsResponse } from '../services/eventListService';
import { type EventDto } from '../types/event';
import './EventListPage.css';

interface EventListProps {
  page?: number;
  pageSize?: number;
}

const EventListPage: React.FC<EventListProps> = ({ page = 0, pageSize = 10 }) => {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response: EventsResponse = await eventListService.getEvents(currentPage, currentPageSize);
        // Добавляем проверку на наличие данных
        if (response && response.events !== undefined) {
          setEvents(response.events);
          setTotalCount(response.totalCount);
        } else {
          setEvents([]);
          setTotalCount(0);
        }
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage * currentPageSize < totalCount) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    setCurrentPage(0); // Сбрасываем на первую страницу при изменении размера страницы
  };

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

  const totalPages = Math.ceil(totalCount / currentPageSize);

  return (
    <div className="event-list-page">
      <h2>Список мероприятий</h2>
      
      {events && events.length === 0 ? (
        <p>Мероприятия не найдены</p>
      ) : (
        <>
          <div className="events-header">
            <div className="pagination-info">
              Показано {events?.length || 0} из {totalCount} мероприятий
            </div>
            <div className="pagination-controls">
              <label htmlFor="page-size">Размер страницы: </label>
              <select 
                id="page-size"
                value={currentPageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          
          <div className="events-grid">
            {events?.map(event => (
              <div key={event.id} className="event-card">
                <h3>{event.title}</h3>
                <p><strong>Дата:</strong> {new Date(event.start).toLocaleDateString()}</p>
                <p><strong>Место:</strong> {event.city}, {event.address}</p>
                <p><strong>Описание:</strong> {event.description}</p>
                <p><strong>Цена:</strong> {event.price > 0 ? `${event.price} руб.` : 'Бесплатно'}</p>
                <p><strong>Макс. участников:</strong> {event.maxParticipants}</p>
                <p><strong>Тип:</strong> {event.type}</p>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="pagination-button"
              >
                Назад
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`pagination-button ${currentPage === i ? 'active' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="pagination-button"
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventListPage;