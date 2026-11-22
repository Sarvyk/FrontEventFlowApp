import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, hasRole, logout, getUsername } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const username = getUsername();
  const initials = username ? username[0].toUpperCase() : '👤';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const dropdownItems = [
    { label: 'Профиль', to: '/profile' },
    ...(hasRole('Organizer') ? [{ label: 'Мои мероприятия', to: '/organizer/dashboard' }] : []),
    ...(hasRole('Admin') ? [{ label: 'Админ-панель', to: '/admin' }] : []),
  ];

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          EventFlow
        </Link>
        <nav className="header-nav">
          {!isAuthenticated ? (
            <ul className="header-nav-list">
              <li><Link to="/" className="header-nav-link">Главная</Link></li>
              <li><Link to="/login" className="header-nav-link">Вход</Link></li>
              <li><Link to="/register" className="header-nav-link">Регистрация</Link></li>
            </ul>
          ) : (
            <div ref={dropdownRef} className="user-dropdown">
              <button
                className="avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={`Пользователь: ${username || 'User'}`}
              >
                {initials}
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Выйти
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;