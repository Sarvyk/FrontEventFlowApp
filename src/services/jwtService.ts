// Сервис для работы с JWT токенами
import { jwtDecode } from 'jwt-decode';

// Интерфейс для декодированного токена
export interface DecodedToken {
  exp: number;
  iat: number;
  [key: string]: any; // Для других полей токена
}

// Интерфейс для токена с ролями
export interface TokenWithRoles extends DecodedToken {
  role?: string | string[];
  roles?: string[];
}

export const jwtService = {
  /**
   * Декодирует JWT токен
   * @param token - JWT токен
   * @returns Декодированный токен или null, если декодирование не удалось
   */
  decodeToken(token: string): TokenWithRoles | null {
    try {
      return jwtDecode<TokenWithRoles>(token);
    } catch (error) {
      console.error('Ошибка декодирования токена:', error);
      return null;
    }
  },

  /**
   * Проверяет, истек ли срок действия токена
   * @param token - JWT токен
   * @returns true, если токен истек, false в противном случае
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  },

  /**
   * Получает роли пользователя из токена
   * @param token - JWT токен
   * @returns Массив ролей пользователя или пустой массив, если роли не найдены
   */
  getUserRoles(token: string): string[] {
    const decoded = this.decodeToken(token);
    if (!decoded) return [];
    
    // Проверяем разные возможные поля для ролей
    if (Array.isArray(decoded.role)) {
      return decoded.role;
    } else if (typeof decoded.role === 'string') {
      return [decoded.role];
    } else if (Array.isArray(decoded.roles)) {
      return decoded.roles;
    } else if (typeof decoded.roles === 'string') {
      return [decoded.roles];
    }
    
    return [];
  },

  /**
   * Проверяет, имеет ли пользователь указанную роль
   * @param token - JWT токен
   * @param role - Проверяемая роль
   * @returns true, если пользователь имеет указанную роль, false в противном случае
   */
  hasRole(token: string, role: string): boolean {
    const userRoles = this.getUserRoles(token);
    return userRoles.includes(role);
  },

  /**
   * Проверяет, имеет ли пользователь одну из указанных ролей
   * @param token - JWT токен
   * @param roles - Массив проверяемых ролей
   * @returns true, если пользователь имеет хотя бы одну из ролей, false в противном случае
   */
  hasAnyRole(token: string, roles: string[]): boolean {
    const userRoles = this.getUserRoles(token);
    return userRoles.some(userRole => roles.includes(userRole));
  },

  /**
   * Получает имя пользователя из токена
   * @param token - JWT токен
   * @returns Имя пользователя или null, если не найдено
   */
  getUsername(token: string): string | null {
    const decoded = this.decodeToken(token);
    if (!decoded) return null;
    
    // Проверяем разные возможные поля для имени пользователя
    return decoded.name || decoded.unique_name || decoded.sub || null;
  },

  /**
   * Получает email пользователя из токена
   * @param token - JWT токен
   * @returns Email пользователя или null, если не найден
   */
  getUserEmail(token: string): string | null {
    const decoded = this.decodeToken(token);
    if (!decoded) return null;
    
    // Проверяем поле email
    return decoded.email || null;
  },

  /**
   * Получает идентификатор пользователя из токена
   * @param token - JWT токен
   * @returns Идентификатор пользователя или null, если не найден
   */
  getUserId(token: string): string | null {
    const decoded = this.decodeToken(token);
    if (!decoded) return null;
    
    // Проверяем разные возможные поля для идентификатора пользователя
    return decoded.sub || decoded.unique_name || null;
  }
};