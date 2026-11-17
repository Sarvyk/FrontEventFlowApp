import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerService, type OrganizerDto } from '../services/organizerService';
import { useAuth } from '../contexts/AuthContext';
import './AdminPanel.css';

const PAGE_SIZES = [5, 10, 20, 50];

const AdminPanel: React.FC = () => {
  const [data, setData] = useState<{ items: OrganizerDto[]; totalCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    if (!hasRole('Admin')) {
      navigate('/');
      return;
    }

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const raw = await organizerService.getAllApplications(page * pageSize, pageSize);

        // Result<IEnumerable<Organizer>> может вернуться как массив или объект с полями
        let items: OrganizerDto[] = [];
        let totalCount = 0;

        if (Array.isArray(raw)) {
          items = raw;
          totalCount = raw.length;
        } else if (raw && typeof raw === 'object') {
          // Пробуем разные возможные формы Result-обёртки
          const source = (raw as any).Data ?? (raw as any).items ?? (raw as any).results ?? raw;
          if (Array.isArray(source)) {
            items = source;
            totalCount = source.length;
          } else if ((raw as any).totalCount !== undefined) {
            items = (raw as any).items ?? [];
            totalCount = (raw as any).totalCount;
          }
        }

        setData({ items, totalCount });
      } catch (err: any) {
        setError(err.message || 'Ошибка при загрузке заявок');
        console.error('[AdminPanel] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [hasRole, navigate, page, pageSize]);

  const handleApprove = async (item: OrganizerDto) => {
    setActionLoading(item.id);
    try {
      await organizerService.updateApplicationStatus(item.id, true);
      setData(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, isVerified: true } : i)
      } : prev);
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении заявки');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (item: OrganizerDto) => {
    const reason = prompt('Причина отклонения (необязательно):');
    if (reason === null) return; // Отмена

    setActionLoading(item.id);
    try {
      await organizerService.updateApplicationStatus(item.id, false, reason || undefined);
      setData(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, isVerified: false, reason: reason || null } : i)
      } : prev);
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении заявки');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (isVerified: boolean, isDelete: boolean) => {
    if (isDelete) {
      return <span className="status-badge status-rejected">Удалена</span>;
    }
    if (isVerified) {
      return <span className="status-badge status-approved">Принята</span>;
    }
    return <span className="status-badge status-pending">Ожидает</span>;
  };

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  if (loading && !data) {
    return <div className="admin-panel-loading">Загрузка заявок...</div>;
  }

  if (error && !data) {
    return (
      <div className="admin-panel-container">
        <h2>Управление заявками на организатора</h2>
        <div className="admin-error">{error}</div>
        <button onClick={() => navigate(-1)} className="admin-back-btn">Назад</button>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <h2>Управление заявками на организатора</h2>

      {!data || !data.items || data.items.length === 0 ? (
        <div className="admin-empty">Нет заявок на рассмотрение</div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Компания</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const userName = item.user ? `${item.user.firstName} ${item.user.lastName}` : '—';
                  const userEmail = item.user?.email || '—';
                  return (
                    <tr key={item.id}>
                      <td>{userName}</td>
                      <td>{userEmail}</td>
                      <td>{item.companyName || '—'}</td>
                      <td>{getStatusBadge(item.isVerified, item.isDelete)}</td>
                      <td className="admin-actions">
                        {!item.isVerified && !item.isDelete && (
                          <>
                            <button
                              onClick={() => handleApprove(item)}
                              disabled={actionLoading === item.id}
                              className="admin-approve-btn"
                            >
                              {actionLoading === item.id ? '...' : 'Принять'}
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              disabled={actionLoading === item.id}
                              className="admin-reject-btn"
                            >
                              {actionLoading === item.id ? '...' : 'Отклонить'}
                            </button>
                          </>
                        )}
                        {(item.isVerified || item.isDelete) && (
                          <span className="admin-status-text">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <div className="admin-page-size">
              <label>Показывать по: </label>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="admin-page-size-select"
              >
                {PAGE_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="admin-pagination-controls">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="admin-page-btn"
              >
                ← Назад
              </button>
              <span className="admin-page-info">
                Страница {page + 1} из {totalPages} ({data.totalCount} шт.)
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="admin-page-btn"
              >
                Вперёд →
              </button>
            </div>
          </div>
        </>
      )}

      <button onClick={() => navigate(-1)} className="admin-back-btn">Назад</button>
    </div>
  );
};

export default AdminPanel;
