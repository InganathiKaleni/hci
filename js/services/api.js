/**
 * EdUTEND System - API Service
 * 
 * @fileoverview Handles all HTTP requests to the backend API with authentication, error handling, and retry logic
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class ApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    this.refreshToken = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    this.isRefreshing = false;
    this.failedQueue = [];
    
    this.init();
  }

  init() {
    // Set up token refresh interval
    this.setupTokenRefresh();
    
    // Set up request interceptor for expired tokens
    this.setupRequestInterceptor();
  }

  /**
   * Set authentication tokens
   * @param {string} token - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    if (refreshToken) {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get request headers with authentication
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Process failed requests queue after token refresh
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * Set up request interceptor for expired tokens
   */
  setupRequestInterceptor() {
    // This will be used by the request method to handle 401 responses
    this.handleUnauthorized = async (response) => {
      if (response.status === 401 && this.refreshToken && !this.isRefreshing) {
        this.isRefreshing = true;

        try {
          const newTokens = await this.refreshAuthToken();
          this.setTokens(newTokens.token, newTokens.refreshToken);
          this.processQueue(null, newTokens.token);
          return true; // Token refreshed successfully
        } catch (error) {
          this.processQueue(error, null);
          this.clearTokens();
          this.redirectToLogin();
          return false; // Token refresh failed
        } finally {
          this.isRefreshing = false;
        }
      }
      return false; // No token refresh needed
    };
  }

  /**
   * Set up automatic token refresh
   */
  setupTokenRefresh() {
    // Refresh token 5 minutes before expiry
    const refreshInterval = setInterval(async () => {
      if (this.refreshToken && !this.isRefreshing) {
        try {
          const newTokens = await this.refreshAuthToken();
          this.setTokens(newTokens.token, newTokens.refreshToken);
        } catch (error) {
          console.warn('Token refresh failed:', error);
          // Don't clear tokens here, let the next request handle it
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Store interval ID for cleanup
    this.refreshInterval = refreshInterval;
  }

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} New tokens
   */
  async refreshAuthToken() {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: this.refreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return await response.json();
  }

  /**
   * Redirect to login page
   */
  redirectToLogin() {
    // Clear user data
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER);
    
    // Redirect to login
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
      window.location.href = 'index.html';
    }
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}, attempt = 1) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      console.log(`🌐 Making ${config.method || 'GET'} request to: ${url}`);
      
      const response = await fetch(url, config);
      
      console.log(`📡 Response received: ${response.status} ${response.statusText}`);
      
      // Handle unauthorized responses
      if (response.status === 401) {
        const tokenRefreshed = await this.handleUnauthorized(response);
        if (tokenRefreshed && attempt < API_CONFIG.RETRY.MAX_ATTEMPTS) {
          // Retry the request with new token
          return this.request(endpoint, options, attempt + 1);
        }
      }

      // Handle other error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Log detailed error information
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          method: config.method || 'GET',
          headers: config.headers,
          errorData: errorData
        });
        
        // Special handling for 405 Method Not Allowed
        if (response.status === 405) {
          throw new Error(`Method not allowed. The server does not support ${config.method || 'GET'} requests to this endpoint. Please check if the backend server is running and the endpoint is configured correctly.`);
        }
        
        // Special handling for connection refused
        if (response.status === 0 || response.statusText === 'Failed to fetch') {
          throw new Error(`Cannot connect to server. Please ensure the backend server is running on ${this.baseUrl}. Run 'npm start' to start the server.`);
        }
        
        throw new Error(errorMessage);
      }

      // Parse response
      const data = await response.json();
      console.log('✅ Request successful:', data);
      return data;

    } catch (error) {
      console.error('💥 Request failed:', error);
      
      // Retry logic for network errors
      if (attempt < API_CONFIG.RETRY.MAX_ATTEMPTS && 
          (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
        console.warn(`🔄 Request failed, retrying... (${attempt}/${API_CONFIG.RETRY.MAX_ATTEMPTS})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY.DELAY * attempt));
        
        return this.request(endpoint, options, attempt + 1);
      }

      // Enhanced error messages for common issues
      if (error.message.includes('Failed to fetch')) {
        error.message = `Cannot connect to server at ${this.baseUrl}. Please ensure the backend server is running. Run 'npm start' in the project directory.`;
      }

      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    try {
      const queryString = new URLSearchParams(credentials).toString();
      const endpoint = `${API_CONFIG.ENDPOINTS.AUTH.LOGIN}?${queryString}`;
      
      console.log('Attempting GET login to:', `${this.baseUrl}${endpoint}`);
      
      const response = await this.request(endpoint);

      if (response.success && response.data) {
        this.setTokens(response.data.token, response.data.refreshToken);
      }

      return response;
    } catch (error) {
      console.error('Login error details:', error);
      throw error;
    }
  }

  async register(userData) {
    const queryString = new URLSearchParams(userData).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.AUTH.REGISTER}?${queryString}`;
    return await this.request(endpoint);
  }

  async logout() {
    try {
      await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST'
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokens();
      this.redirectToLogin();
    }
  }

  async getCurrentUser() {
    return await this.request(API_CONFIG.ENDPOINTS.AUTH.ME);
  }

  async changePassword(passwordData) {
    const queryString = new URLSearchParams(passwordData).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD}?${queryString}`;
    return await this.request(endpoint);
  }

  // User management methods
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${API_CONFIG.ENDPOINTS.USERS.LIST}?${queryString}` : API_CONFIG.ENDPOINTS.USERS.LIST;
    return await this.request(endpoint);
  }

  async createUser(userData) {
    return await this.request(API_CONFIG.ENDPOINTS.USERS.CREATE, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(userId, userData) {
    const endpoint = API_CONFIG.ENDPOINTS.USERS.UPDATE.replace(':id', userId);
    return await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId) {
    const endpoint = API_CONFIG.ENDPOINTS.USERS.DELETE.replace(':id', userId);
    return await this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // Course management methods
  async getCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${API_CONFIG.ENDPOINTS.COURSES.LIST}?${queryString}` : API_CONFIG.ENDPOINTS.COURSES.LIST;
    return await this.request(endpoint);
  }

  async createCourse(courseData) {
    const queryString = new URLSearchParams(courseData).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.COURSES.CREATE}?${queryString}`;
    return await this.request(endpoint);
  }

  async updateCourse(courseId, courseData) {
    const endpoint = API_CONFIG.ENDPOINTS.COURSES.UPDATE.replace(':id', courseId);
    return await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  }

  async deleteCourse(courseId) {
    const endpoint = API_CONFIG.ENDPOINTS.COURSES.DELETE.replace(':id', courseId);
    return await this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // Attendance methods
  async markAttendance(attendanceData) {
    const queryString = new URLSearchParams(attendanceData).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.ATTENDANCE.MARK}?${queryString}`;
    return await this.request(endpoint);
  }

  async getAttendanceReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${API_CONFIG.ENDPOINTS.ATTENDANCE.REPORT}?${queryString}` : API_CONFIG.ENDPOINTS.ATTENDANCE.REPORT;
    return await this.request(endpoint);
  }

  // QR Code methods
  async generateQR(qrData) {
    const queryString = new URLSearchParams(qrData).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.QR.GENERATE}?${queryString}`;
    return await this.request(endpoint);
  }

  async validateQR(qrCode) {
    const endpoint = `${API_CONFIG.ENDPOINTS.QR.VALIDATE}?qrCode=${encodeURIComponent(qrCode)}`;
    return await this.request(endpoint);
  }

  // Report methods
  async generateReport(reportData) {
    return await this.request(API_CONFIG.ENDPOINTS.REPORTS.GENERATE, {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  async exportReport(reportId, format = 'pdf') {
    const endpoint = `${API_CONFIG.ENDPOINTS.REPORTS.EXPORT}?reportId=${reportId}&format=${format}`;
    return await this.request(endpoint);
  }

  /**
   * Cleanup method for cleanup on logout
   */
  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.failedQueue = [];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
} else {
  window.ApiService = ApiService;
}
