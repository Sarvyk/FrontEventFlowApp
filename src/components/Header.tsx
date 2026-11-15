import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          EventFlow
        </Link>
        <nav className="header-nav">
          <ul className="header-nav-list">
            <li className="header-nav-item">
              <Link to="/" className="header-nav-link">Главная</Link>
            </li>
            {!isAuthenticated && (
              <>
                <li className="header-nav-item">
                  <Link to="/login" className="header-nav-link">Вход</Link>
                </li>
                <li className="header-nav-item">
                  <Link to="/register" className="header-nav-link">Регистрация</Link>
                </li>
              </>
            )}
            {isAuthenticated && (
              <>
                <li className="header-nav-item">
                  <Link to="/profile" className="header-nav-link">Профиль</Link>
                </li>
                <li className="header-nav-item">
                  <button onClick={handleLogout} className="header-nav-link button-link">Выйти</button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;