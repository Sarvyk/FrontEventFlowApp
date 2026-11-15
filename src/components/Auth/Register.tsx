import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

interface RegisterData {
  UserName: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  PhoneNumber: string;
  urlToController: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    UserName: '',
    FirstName: '',
    LastName: '',
    Email: '',
    Password: '',
    PhoneNumber: '',
    urlToController: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Выполняем регистрацию через сервис
      await authService.register(formData);
      
      // После успешной регистрации устанавливаем флаг успеха
      setSuccess(true);
      
      // Перенаправляем на страницу входа после небольшой задержки
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
    console.error('Registration error:', err);

    const data = err?.response?.data;

    let message: string;

    if (typeof data === 'string') {
        message = data;
    } else if (Array.isArray(data)) {
        message = data.map((e: any) => (typeof e === 'string' ? e : e?.message)).filter(Boolean).join('; ');
    } else if (data?.errors) {
        message = Object.values(data.errors).flat().filter(Boolean).join('; ');
    } else {
        message = data?.message || data?.detail || data?.title || 'Ошибка при регистрации пользователя';
    }

    setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Регистрация</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Регистрация прошла успешно! Вы будете перенаправлены на страницу входа.</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="UserName">Имя пользователя:</label>
          <input
            type="text"
            id="UserName"
            name="UserName"
            value={formData.UserName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="FirstName">Имя:</label>
          <input
            type="text"
            id="FirstName"
            name="FirstName"
            value={formData.FirstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="LastName">Фамилия:</label>
          <input
            type="text"
            id="LastName"
            name="LastName"
            value={formData.LastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Email">Email:</label>
          <input
            type="email"
            id="Email"
            name="Email"
            value={formData.Email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Password">Пароль:</label>
          <input
            type="password"
            id="Password"
            name="Password"
            value={formData.Password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="PhoneNumber">Номер телефона:</label>
          <input
            type="tel"
            id="PhoneNumber"
            name="PhoneNumber"
            value={formData.PhoneNumber}
            onChange={handleChange}
            required
          />
        </div>

        {/* Поле urlToController скрыто, но передается в API */}
        <input
          type="hidden"
          id="urlToController"
          name="urlToController"
          value={formData.urlToController}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
};

export default Register;