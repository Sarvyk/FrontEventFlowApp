# EventFlow — Frontend

Веб-приложение для организации и участия в мероприятиях. React 19 + Vite 8 + TypeScript.

## Быстрый старт

```bash
# 1. Клонировать репозиторий (если ещё не сделано)
git clone <url-репозитория>
cd FrontEventFlowApp

# 2. Установить зависимости
npm install

# 3. Запустить dev-сервер
npm run dev
```

Dev-сервер доступен на `http://localhost:5173/`.

## Скрипты

| Команда         | Описание                        |
|----------------|----------------------------------|
| `npm run dev`   | Запуск dev-сервера               |
| `npm run build` | Сборка для продакшена            |
| `npm run lint`  | Проверка кода ESLint             |
| `npm run preview` | Предпросмотр продакшен-сборки   |

## Стек

- **React** 19 · **TypeScript** ~6.0 · **Vite** 8
- **axios** — HTTP-запросы
- **react-router-dom** v7 — маршрутизация
- **jwt-decode** v4 — декодирование JWT на клиенте

## Структура проекта

```
src/
├── components/
│   ├── Auth/          # Login, Register, ProtectedRoute
│   ├── Header.tsx
│   └── Profile.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── EventListPage.tsx
│   ├── OrganizerApplication.tsx
│   ├── AdminPanel.tsx
│   └── OrganizerDashboard.tsx
├── services/          # API-сервисы (auth, event, organizer, registration и др.)
├── types/             # TypeScript интерфейсы
├── contexts/AuthContext.tsx
├── App.tsx            # Маршруты
└── main.tsx           # Точка входа
```

## Маршруты

| Путь                    | Описание                                    | Доступ          |
|-------------------------|---------------------------------------------|------------------|
| `/`                     | Главная страница                            | Все              |
| `/events`               | Список мероприятий (с пагинацией)           | Все (публичный)  |
| `/login`                | Вход                                        | Неавторизованные |
| `/register`             | Регистрация                                 | Неавторизованные |
| `/profile`              | Профиль пользователя                        | Авторизованные   |
| `/organizer-application`| Заявка на роль организатора                 | Авторизованные   |
| `/admin`                | Админ-панель управления заявками            | Только Admin     |

## API (бэкенд)

Dev-сервер проксирует запросы:
- `/api/*` → `https://localhost:7218/api/`
- `/images/*` → `https://localhost:7218/images/`

Бэкенд должен быть запущен на `https://localhost:7218`.

Ключевые эндпоинты:

| Метод | Путь                        | Описание                           |
|-------|-----------------------------|-------------------------------------|
| POST  | `/Auth/RegisterUser`        | Регистрация пользователя            |
| POST  | `/Auth/UserLogin`           | Вход (возвращает accessToken, refreshToken) |
| POST  | `/Auth/refresh`             | Обновление access-токена            |
| GET   | `/Event?page=&pageSize=`    | Список мероприятий                  |
| GET   | `/Event/{id}`               | Данные мероприятия                  |
| POST  | `/Event`                    | Создание мероприятия (Organizer/Admin) |
| PUT   | `/Event/{id}`               | Обновление мероприятия              |
| POST  | `/Event/upload-image/{eventId}` | Загрузка обложки мероприятия      |
| GET   | `/Event/my`                 | Список мероприятий организатора     |
| POST  | `/Organizer`                | Подать заявку на организатора       |
| GET   | `/Registration/my`          | Свои регистрации                    |
| POST  | `/Registration/{eventId}`   | Зарегистрироваться на мероприятие    |
| PUT   | `/User/UpdateUserProfile`   | Обновить профиль                    |
| GET   | `/User/GetProfile`          | Профиль пользователя                |

## Роли пользователей

- **User** — просмотр мероприятий, регистрация, управление профилем
- **Organizer** — создание и редактирование своих мероприятий
- **Admin** — доступ к админ-панели (управление заявками на роль организатора)
