import React, { useState } from 'react';
import { organizerService } from '../services/organizerService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './OrganizerApplication.css';

interface CreateOrganizerCommand {
  companyName: string;
  description: string;
  webSite: string;
}

const OrganizerApplication: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [webSite, setWebSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Пользователь не авторизован');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const command: CreateOrganizerCommand = {
        companyName: companyName || '',
        description: description || '',
        webSite: webSite || ''
      };

      const response = await organizerService.createApplication(command);
      setApplicationData(response);
      setSuccess(true);
      // Перенаправляем на профиль после успешной отправки
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      
      // Проверяем, есть ли сообщение об ошибке от API
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 409) {
        setError('Вы уже подали заявку на организатора. Пожалуйста, дождитесь рассмотрения вашей заявки.');
      } else {
        setError(err.message || 'Ошибка при отправке заявки');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organizer-application-container">
      <h2>Подать заявку на организатора</h2>
      
      {success ? (
        <div className="application-success">
          <p>Заявка успешно отправлена!</p>
          {applicationData && (
            <div className="application-details">
              <h3>Информация о заявке:</h3>
              <p><strong>ID:</strong> {applicationData.id}</p>
              <p><strong>Статус:</strong> {applicationData.status}</p>
              <p><strong>Создано:</strong> {new Date(applicationData.createdAt).toLocaleString('ru-RU')}</p>
            </div>
          )}
          <p>Вы будете перенаправлены в профиль.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="organizer-application-form">
          <div className="form-group">
            <label htmlFor="companyName">Название компании (необязательно):</label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание (необязательно):</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="webSite">Веб-сайт (необязательно):</label>
            <input
              type="url"
              id="webSite"
              value={webSite}
              onChange={(e) => setWebSite(e.target.value)}
              className="form-input"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      )}
    </div>
  );
};

export default OrganizerApplication;