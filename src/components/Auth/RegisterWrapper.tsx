import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { jwtService } from '../../services/jwtService';
import Register from './Register';

const RegisterWrapper: React.FC = () => {
  const navigate = useNavigate();

  // Проверяем, авторизован ли пользователь
  React.useEffect(() => {
    const { token } = authService.getAuthTokens();
    if (token && !authService.isTokenExpired() && !jwtService.isTokenExpired(token)) {
      navigate('/');
    }
  }, [navigate]);

  return <Register />;
};

export default RegisterWrapper;