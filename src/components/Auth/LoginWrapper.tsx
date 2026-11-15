import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Login from './Login';

const LoginWrapper: React.FC = () => {
  const navigate = useNavigate();

  // Проверяем, авторизован ли пользователь
  React.useEffect(() => {
    if (!authService.isTokenExpired()) {
      // Если пользователь уже авторизован, перенаправляем на главную страницу
      navigate('/');
    }
  }, [navigate]);

  return <Login />;
};

export default LoginWrapper;