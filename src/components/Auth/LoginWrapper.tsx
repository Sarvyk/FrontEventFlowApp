import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { jwtService } from '../../services/jwtService';
import Login from './Login';

const LoginWrapper: React.FC = () => {
  const navigate = useNavigate();

  // Проверяем, авторизован ли пользователь
  React.useEffect(() => {
    const { token } = authService.getAuthTokens();
    const expired = !token || authService.isTokenExpired() || jwtService.isTokenExpired(token);
    if (!expired) {
      navigate('/');
    }
  }, [navigate]);

  return <Login />;
};

export default LoginWrapper;