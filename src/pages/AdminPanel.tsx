import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerService, type OrganizerRequestDto } from '../services/organizerService';
import { useAuth } from '../contexts/AuthContext';
import './AdminPanel.css';

const PAGE_SIZES = [5, 10, 20, 50];

const AdminPanel: React.FC = () => {
  const [data, setData] = useState<{ items: OrganizerRequestDto[]; totalCount: number } | null>(null);
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
        const result = await organizerService.getAllApplications(page * pageSize, pageSize);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Ошибка при загрузке заявок');
        console.error('[AdminPanel] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [hasRole, navigate, page, pageSize]);

  const handleApprove = async (item: OrganizerRequestDto) => {
    setActionLoading(item.id);
    try {
      await organizerService.approveOrganizer(item.id);
      setData(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, status: 1 as number, approvedAt: new Date().toISOString() } : i)
      } : prev);
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении заявки');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (item: OrganizerRequestDto) => {
    const reason = prompt('Причина отклонения (необязательно):');
    if (reason === null) return; // Отмена

    setActionLoading(item.id);
    try {
      await organizerService.rejectOrganizer(item.id, reason);
      setData(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, status: 2 as number, rejectionReason: reason } : i)
      } : prev);
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении заявки');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return <span className="status-badge status-approved">Принята</span>;
      case 2: return <span className="status-badge status-rejected">Отклонена</span>;
      default: return <span className="status-badge status-pending">Ожидает</span>;
    }
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
                  <th>ID заявки</th>
                  <th>Пользователь</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                  <th>Дата одобрения</th>
                  <th>Причина отказа</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const formattedCreatedAt = item.createdAt
                    ? new Date(item.createdAt).toLocaleString('ru-RU')
                    : '—';
                  const formattedApprovedAt = item.approvedAt
                    ? new Date(item.approvedAt).toLocaleString('ru-RU')
                    : '—';
                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.userName || '—'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{formattedCreatedAt}</td>
                      <td>{formattedApprovedAt}</td>
                      <td>{item.rejectionReason || '—'}</td>
                      <td className="admin-actions">
                        {item.status === 0 && (
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
                        {(item.status === 1 || item.status === 2) && (
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
