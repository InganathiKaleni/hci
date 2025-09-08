/**
 * EdUTEND System - Configuration
 * 
 * @fileoverview Central configuration for API endpoints, socket settings, and app constants
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

const API_CONFIG = {
  // Backend server URL - matches backend server.js PORT
  BASE_URL: 'http://localhost:5501/api',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
      CHANGE_PASSWORD: '/auth/change-password'
    },
    USERS: {
      LIST: '/users',
      CREATE: '/users',
      UPDATE: '/users/:id',
      DELETE: '/users/:id',
      PROFILE: '/users/profile'
    },
    COURSES: {
      LIST: '/courses',
      CREATE: '/courses/create',
      UPDATE: '/courses/:id',
      DELETE: '/courses/:id',
      ENROLL: '/courses/:id/enroll',
      UNENROLL: '/courses/:id/unenroll'
    },
    ATTENDANCE: {
      LIST: '/attendance',
      MARK: '/attendance/mark',
      REPORT: '/attendance/report',
      COURSE: '/attendance/course/:courseId',
      STUDENT: '/attendance/student/:studentId'
    },
    QR: {
      GENERATE: '/qr/generate',
      VALIDATE: '/qr/validate',
      SESSIONS: '/qr/sessions',
      ACTIVE: '/qr/active'
    },
    REPORTS: {
      GENERATE: '/reports/generate',
      EXPORT: '/reports/export',
      TEMPLATES: '/reports/templates'
    }
  },
  
  // Request timeout (5 seconds)
  TIMEOUT: 5000,
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000
  }
};

const SOCKET_CONFIG = {
  // Socket.IO server URL
  URL: 'http://localhost:5501',
  
  // Socket events
  EVENTS: {
    // QR Code events
    QR_GENERATED: 'qr_generated',
    QR_EXPIRED: 'qr_expired',
    QR_SCANNED: 'qr_scanned',
    
    // Attendance events
    ATTENDANCE_MARKED: 'attendance_marked',
    ATTENDANCE_UPDATED: 'attendance_updated',
    
    // Course events
    COURSE_CREATED: 'course_created',
    COURSE_UPDATED: 'course_updated',
    COURSE_DELETED: 'course_deleted',
    
    // User events
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    USER_UPDATED: 'user_updated',
    
    // System events
    SYSTEM_NOTIFICATION: 'system_notification',
    ERROR_OCCURRED: 'error_occurred'
  },
  
  // Reconnection settings
  RECONNECTION: {
    ENABLED: true,
    MAX_ATTEMPTS: 5,
    DELAY: 1000
  }
};

const APP_CONFIG = {
  // App settings
  NAME: 'EdUTEND System',
  VERSION: '1.0.0',
  
  // Local storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
    CURRENT_USER: 'currentUser',
    USER_PREFERENCES: 'userPreferences',
    THEME: 'theme',
    LANGUAGE: 'language'
  },
  
  // Session timeout (30 minutes)
  SESSION_TIMEOUT: 30 * 60 * 1000,
  
  // Theme options
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
  },
  
  // Supported languages
  LANGUAGES: {
    EN: 'en',
    // Add more languages as needed
  }
};

// Export configurations
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, SOCKET_CONFIG, APP_CONFIG };
} else {
  window.API_CONFIG = API_CONFIG;
  window.SOCKET_CONFIG = SOCKET_CONFIG;
  window.APP_CONFIG = APP_CONFIG;
}
