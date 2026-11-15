import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { jwtService } from '../services/jwtService';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, expiresAt?: Date | string) => void;
  logout: () => void;
  checkAuthStatus: () => void;
  getUserRoles: () => string[];
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getUsername: () => string | null;
  getUserEmail: () => string | null;
  getUserId: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем статус при монтировании
    checkAuthStatus();

    // Подписываемся на изменения в localStorage
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkAuthStatus = () => {
    const { token } = authService.getAuthTokens();
    const isTokenValid = token && !authService.isTokenExpired() && !jwtService.isTokenExpired(token);
    
    setIsAuthenticated(!!isTokenValid);
    
    if (token && isTokenValid) {
      // Получаем роли пользователя из токена
      const roles = jwtService.getUserRoles(token);
      setUserRoles(roles);
      
      // Получаем дополнительную информацию о пользователе
      setUsername(jwtService.getUsername(token));
      setUserEmail(jwtService.getUserEmail(token));
      setUserId(jwtService.getUserId(token));
    } else {
      setUserRoles([]);
      setUsername(null);
      setUserEmail(null);
      setUserId(null);
    }
  };

  const login = (token: string, refreshToken: string, expiresAt?: Date | string) => {
    authService.saveAuthTokens(token, refreshToken, expiresAt);
    checkAuthStatus();
  };

  const logout = () => {
    authService.clearAuthTokens();
    checkAuthStatus();
  };

  // Методы для получения информации о роли пользователя
  const getUserRoles = () => {
    return userRoles;
  };

  const hasRole = (role: string) => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: string[]) => {
    return userRoles.some(userRole => roles.includes(userRole));
  };

  const getUsername = () => {
    return username;
  };

  const getUserEmail = () => {
    return userEmail;
  };

  const getUserId = () => {
    return userId;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      checkAuthStatus,
      getUserRoles,
      hasRole,
      hasAnyRole,
      getUsername,
      getUserEmail,
      getUserId
    }}>
      {children}
    </AuthContext.Provider>
  );
};