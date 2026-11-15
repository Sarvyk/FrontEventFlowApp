import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

const HomePage: React.FC = () => {
  // Используем контекст для проверки авторизации вместо локального состояния
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <main className="app-main">
        <section className="hero-section">
          <h2>Добро пожаловать на EventFlow</h2>
          <p>Платформа для организации и участия в мероприятиях. Найдите интересные вам события или создайте свои собственные мероприятия.</p>
        </section>
        
        <section className="features-section">
          <a href="/events" className="feature-card-link">
            <div className="feature-card">
              <h3>Поиск мероприятий</h3>
              <p>Найдите интересные вам мероприятия по категориям и локации. Сортируйте по дате, популярности или рейтингу.</p>
            </div>
          </a>
          
          <div className="feature-card">
            <h3>Организация событий</h3>
            <p>Создавайте и управляйте своими мероприятиями. Управляйте регистрацией участников и информацией о событии.</p>
          </div>
          
          <div className="feature-card">
            <h3>Участие в мероприятиях</h3>
            <p>Записывайтесь на события и общайтесь с другими участниками. Получайте уведомления о важных изменениях.</p>
          </div>
        </section>

        {!isAuthenticated && (
          <section className="cta-section">
            <div className="cta-card">
              <h3>Готовы начать?</h3>
              <p>Создайте учетную запись и начните исследовать мир мероприятий</p>
              <div className="cta-buttons">
                <a href="/register" className="cta-button primary">Зарегистрироваться</a>
                <a href="/login" className="cta-button secondary">Войти</a>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default HomePage;