import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

interface OrganizerDto {
  companyName: string | null;
  description: string | null;
  webSite: string | null;
  isVerified: boolean;
  eventsCount: number;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  organizerProfile: OrganizerDto | null;
}

interface UpdateProfileCommand {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserResponse>>({});
  const [updateError, setUpdateError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await userService.getProfile();
        setUser(profileData);
        setEditedUser({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber || '' // Убедимся, что phone всегда будет строкой
        });
      } catch (err) {
        setError('Ошибка при загрузке профиля пользователя');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setUpdateError(null); // Очищаем ошибки при начале редактирования
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setEditedUser({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || ''
      });
    }
    setUpdateError(null); // Очищаем ошибки при отмене
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Подготавливаем данные для отправки в формате UpdateProfileCommand
      const updateData: UpdateProfileCommand = {
        userId: user.id,
        firstName: editedUser.firstName || '',
        lastName: editedUser.lastName || '',
        email: editedUser.email || '',
        phoneNumber: editedUser.phoneNumber || undefined
      };

      await userService.updateUserProfile(updateData);
      
      // Обновляем отображаемые данные после успешного сохранения
      setUser({
        ...user,
        firstName: editedUser.firstName || user.firstName,
        lastName: editedUser.lastName || user.lastName,
        email: editedUser.email || user.email,
        phoneNumber: editedUser.phoneNumber !== undefined ? editedUser.phoneNumber : user.phoneNumber
      });
      
      setIsEditing(false);
      setUpdateError(null); // Очищаем ошибки при успешном сохранении
    } catch (err: any) {
      // Отображаем конкретную ошибку от API
      if (err.message) {
        setUpdateError(err.message);
      } else {
        setError('Ошибка при обновлении профиля');
      }
      console.error('Profile update error:', err);
    }
  };

  const handleApplyOrganizer = () => {
    // Переход на страницу подачи заявки
    navigate('/organizer-application');
  };
  
  if (loading) {
    return <div className="profile-loading">Загрузка профиля...</div>;
  }

  if (error) {
    return <div className="profile-error">{error}</div>;
  }

  if (!user) {
    return <div className="profile-empty">Профиль не найден</div>;
  }

  // Проверяем, является ли пользователь верифицированным организатором
  const isVerifiedOrganizer = user.organizerProfile?.isVerified === true;

  return (
    <div className="profile-container">
      <h2>Профиль пользователя</h2>
      
      {isEditing ? (
        <div className="profile-edit-form">
          {updateError && <div className="profile-update-error">{updateError}</div>}
          <div className="profile-item">
            <span className="profile-label">Имя:</span>
            <input
              type="text"
              name="firstName"
              value={editedUser.firstName || ''}
              onChange={handleChange}
              className="profile-input"
            />
          </div>
          <div className="profile-item">
            <span className="profile-label">Фамилия:</span>
            <input
              type="text"
              name="lastName"
              value={editedUser.lastName || ''}
              onChange={handleChange}
              className="profile-input"
            />
          </div>
          <div className="profile-item">
            <span className="profile-label">Email:</span>
            <input
              type="email"
              name="email"
              value={editedUser.email || ''}
              onChange={handleChange}
              className="profile-input"
            />
          </div>
          <div className="profile-item">
            <span className="profile-label">Телефон:</span>
            <input
              type="tel"
              name="phoneNumber"
              value={editedUser.phoneNumber || ''}
              onChange={handleChange}
              className="profile-input"
            />
          </div>
          <div className="profile-actions">
            <button onClick={handleSave} className="profile-save-btn">Сохранить</button>
            <button onClick={handleCancel} className="profile-cancel-btn">Отмена</button>
          </div>
        </div>
      ) : (
        <div className="profile-info">
          {/* Основной профиль пользователя */}
          <>
            <div className="profile-item">
              <span className="profile-label">Имя:</span>
              <span className="profile-value">{user.firstName}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Фамилия:</span>
              <span className="profile-value">{user.lastName}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{user.email}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Телефон:</span>
              <span className="profile-value">{user.phoneNumber || 'Не указан'}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Роль:</span>
              <span className="profile-value">{user.role}</span>
            </div>

            {/* Информация об организации — только для верифицированных организаторов */}
            {isVerifiedOrganizer && user.organizerProfile ? (
              <>
                <hr className="profile-divider" />
                <h3 className="profile-org-title">Информация об организации</h3>
                <div className="profile-item">
                  <span className="profile-label">Компания:</span>
                  <span className="profile-value">{user.organizerProfile.companyName || 'Не указано'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Описание:</span>
                  <span className="profile-value">{user.organizerProfile.description || 'Не указано'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Веб-сайт:</span>
                  <span className="profile-value">{user.organizerProfile.webSite || 'Не указано'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Количество мероприятий:</span>
                  <span className="profile-value">{user.organizerProfile.eventsCount}</span>
                </div>
              </>
            ) : !isVerifiedOrganizer && (
              <div className="profile-actions">
                <button onClick={handleEdit} className="profile-edit-btn">Изменить профиль</button>
                <button
                  onClick={handleApplyOrganizer}
                  className="profile-apply-organizer-btn"
                >
                  Подать заявку на организатора
                </button>
              </div>
            )}

            {isVerifiedOrganizer && (
              <div className="profile-actions">
                <button onClick={handleEdit} className="profile-edit-btn">Изменить профиль</button>
              </div>
            )}
          </>
        </div>
      )}
    </div>
  );
};

export default Profile;