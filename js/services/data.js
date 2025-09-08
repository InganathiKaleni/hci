/**
 * EdUTEND System - Data Service
 * 
 * @fileoverview Handles course and attendance data management with backend integration
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class DataService {
    constructor() {
        this.apiService = null;
        this.socketService = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.init();
    }

    async init() {
        // Initialize API service
        this.apiService = new ApiService();
        
        // Initialize socket service
        this.socketService = new SocketService();
        
        // Set up real-time event listeners
        this.setupRealTimeListeners();
    }

    /**
     * Set up real-time event listeners for data updates
     */
    setupRealTimeListeners() {
        // Course events
        document.addEventListener('course:created', (event) => {
            this.handleCourseUpdate('created', event.detail);
        });

        document.addEventListener('course:updated', (event) => {
            this.handleCourseUpdate('updated', event.detail);
        });

        document.addEventListener('course:deleted', (event) => {
            this.handleCourseUpdate('deleted', event.detail);
        });

        // Attendance events
        document.addEventListener('attendance:marked', (event) => {
            this.handleAttendanceUpdate('marked', event.detail);
        });

        document.addEventListener('attendance:updated', (event) => {
            this.handleAttendanceUpdate('updated', event.detail);
        });

        // QR Code events
        document.addEventListener('qr:generated', (event) => {
            this.handleQRUpdate('generated', event.detail);
        });

        document.addEventListener('qr:expired', (event) => {
            this.handleQRUpdate('expired', event.detail);
        });
    }

    /**
     * Handle course updates from real-time events
     * @param {string} action - Update action
     * @param {Object} data - Course data
     */
    handleCourseUpdate(action, data) {
        const cacheKey = 'courses';
        
        switch (action) {
            case 'created':
                this.addToCache(cacheKey, data);
                break;
            case 'updated':
                this.updateInCache(cacheKey, data);
                break;
            case 'deleted':
                this.removeFromCache(cacheKey, data._id || data.id);
                break;
        }

        // Emit custom event for UI updates
        document.dispatchEvent(new CustomEvent('data:course:updated', {
            detail: { action, data }
        }));
    }

    /**
     * Handle attendance updates from real-time events
     * @param {string} action - Update action
     * @param {Object} data - Attendance data
     */
    handleAttendanceUpdate(action, data) {
        const cacheKey = 'attendance';
        
        switch (action) {
            case 'marked':
                this.addToCache(cacheKey, data);
                break;
            case 'updated':
                this.updateInCache(cacheKey, data);
                break;
        }

        // Emit custom event for UI updates
        document.dispatchEvent(new CustomEvent('data:attendance:updated', {
            detail: { action, data }
        }));
    }

    /**
     * Handle QR code updates from real-time events
     * @param {string} action - Update action
     * @param {Object} data - QR code data
     */
    handleQRUpdate(action, data) {
        const cacheKey = 'qr_sessions';
        
        switch (action) {
            case 'generated':
                this.addToCache(cacheKey, data);
                break;
            case 'expired':
                this.removeFromCache(cacheKey, data._id || data.id);
                break;
        }

        // Emit custom event for UI updates
        document.dispatchEvent(new CustomEvent('data:qr:updated', {
            detail: { action, data }
        }));
    }

    // Cache management methods
    /**
     * Add item to cache
     * @param {string} key - Cache key
     * @param {Object} item - Item to cache
     */
    addToCache(key, item) {
        if (!this.cache.has(key)) {
            this.cache.set(key, []);
        }
        
        const items = this.cache.get(key);
        const existingIndex = items.findIndex(i => (i._id || i.id) === (item._id || item.id));
        
        if (existingIndex >= 0) {
            items[existingIndex] = item;
        } else {
            items.push(item);
        }
        
        this.cache.set(key, items);
    }

    /**
     * Update item in cache
     * @param {string} key - Cache key
     * @param {Object} item - Updated item
     */
    updateInCache(key, item) {
        if (!this.cache.has(key)) return;
        
        const items = this.cache.get(key);
        const index = items.findIndex(i => (i._id || i.id) === (item._id || item.id));
        
        if (index >= 0) {
            items[index] = { ...items[index], ...item };
            this.cache.set(key, items);
        }
    }

    /**
     * Remove item from cache
     * @param {string} key - Cache key
     * @param {string} itemId - Item ID to remove
     */
    removeFromCache(key, itemId) {
        if (!this.cache.has(key)) return;
        
        const items = this.cache.get(key);
        const filteredItems = items.filter(i => (i._id || i.id) !== itemId);
        this.cache.set(key, filteredItems);
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {Array} Cached data
     */
    getCachedData(key) {
        return this.cache.get(key) || [];
    }

    /**
     * Clear cache
     * @param {string} key - Cache key (optional, clears all if not specified)
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    // Course management methods
    /**
     * Get all courses
     * @param {Object} params - Query parameters
     * @param {boolean} useCache - Whether to use cached data
     * @returns {Promise<Array>} Courses array
     */
    async getCourses(params = {}, useCache = true) {
        const cacheKey = 'courses';
        
        // Check cache first if enabled
        if (useCache && this.cache.has(cacheKey)) {
            const cachedData = this.getCachedData(cacheKey);
            if (cachedData.length > 0) {
                return this.filterCachedData(cachedData, params);
            }
        }

        try {
            const response = await this.apiService.getCourses(params);
            if (response.success && response.data) {
                // Cache the data
                response.data.forEach(course => this.addToCache(cacheKey, course));
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            return [];
        }
    }

    /**
     * Create new course
     * @param {Object} courseData - Course data
     * @returns {Promise<Object>} Created course
     */
    async createCourse(courseData) {
        try {
            const response = await this.apiService.createCourse(courseData);
            if (response.success && response.data) {
                // Add to cache
                this.addToCache('courses', response.data);
                return response.data;
            }
            throw new Error(response.message || 'Failed to create course');
        } catch (error) {
            console.error('Failed to create course:', error);
            throw error;
        }
    }

    /**
     * Update course
     * @param {string} courseId - Course ID
     * @param {Object} courseData - Updated course data
     * @returns {Promise<Object>} Updated course
     */
    async updateCourse(courseId, courseData) {
        try {
            const response = await this.apiService.updateCourse(courseId, courseData);
            if (response.success && response.data) {
                // Update cache
                this.updateInCache('courses', response.data);
                return response.data;
            }
            throw new Error(response.message || 'Failed to update course');
        } catch (error) {
            console.error('Failed to update course:', error);
            throw error;
        }
    }

    /**
     * Delete course
     * @param {string} courseId - Course ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCourse(courseId) {
        try {
            const response = await this.apiService.deleteCourse(courseId);
            if (response.success) {
                // Remove from cache
                this.removeFromCache('courses', courseId);
                return true;
            }
            throw new Error(response.message || 'Failed to delete course');
        } catch (error) {
            console.error('Failed to delete course:', error);
            throw error;
        }
    }

    // Attendance management methods
    /**
     * Mark attendance
     * @param {Object} attendanceData - Attendance data
     * @returns {Promise<Object>} Marked attendance
     */
    async markAttendance(attendanceData) {
        try {
            const response = await this.apiService.markAttendance(attendanceData);
            if (response.success && response.data) {
                // Add to cache
                this.addToCache('attendance', response.data);
                return response.data;
            }
            throw new Error(response.message || 'Failed to mark attendance');
        } catch (error) {
            console.error('Failed to mark attendance:', error);
            throw error;
        }
    }

    /**
     * Get attendance report
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Attendance report
     */
    async getAttendanceReport(params = {}) {
        try {
            const response = await this.apiService.getAttendanceReport(params);
            return response.success ? response.data : null;
        } catch (error) {
            console.error('Failed to get attendance report:', error);
            throw error;
        }
    }

    // QR Code management methods
    /**
     * Generate QR code
     * @param {Object} qrData - QR code data
     * @returns {Promise<Object>} Generated QR code
     */
    async generateQR(qrData) {
        try {
            const response = await this.apiService.generateQR(qrData);
            if (response.success && response.data) {
                // Add to cache
                this.addToCache('qr_sessions', response.data);
                return response.data;
            }
            throw new Error(response.message || 'Failed to generate QR code');
        } catch (error) {
            console.error('Failed to generate QR code:', error);
            throw error;
        }
    }

    /**
     * Validate QR code
     * @param {string} qrCode - QR code to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateQR(qrCode) {
        try {
            const response = await this.apiService.validateQR(qrCode);
            return response.success ? response.data : null;
        } catch (error) {
            console.error('Failed to validate QR code:', error);
            throw error;
        }
    }

    // Utility methods
    /**
     * Filter cached data based on parameters
     * @param {Array} data - Data to filter
     * @param {Object} params - Filter parameters
     * @returns {Array} Filtered data
     */
    filterCachedData(data, params) {
        let filteredData = [...data];

        // Filter by search term
        if (params.search) {
            const searchTerm = params.search.toLowerCase();
            filteredData = filteredData.filter(item => 
                item.name?.toLowerCase().includes(searchTerm) ||
                item.code?.toLowerCase().includes(searchTerm) ||
                item.description?.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by role
        if (params.role) {
            filteredData = filteredData.filter(item => 
                item.role?.toLowerCase() === params.role.toLowerCase()
            );
        }

        // Filter by department
        if (params.department) {
            filteredData = filteredData.filter(item => 
                item.department?.toLowerCase() === params.department.toLowerCase()
            );
        }

        // Sort data
        if (params.sortBy) {
            filteredData.sort((a, b) => {
                const aVal = a[params.sortBy];
                const bVal = b[params.sortBy];
                
                if (typeof aVal === 'string') {
                    return aVal.localeCompare(bVal);
                }
                return aVal - bVal;
            });
        }

        // Pagination
        if (params.page && params.limit) {
            const start = (params.page - 1) * params.limit;
            const end = start + params.limit;
            filteredData = filteredData.slice(start, end);
        }

        return filteredData;
    }

    /**
     * Export data to various formats
     * @param {string} dataType - Type of data to export
     * @param {Object} params - Export parameters
     * @param {string} format - Export format (pdf, docx, csv)
     * @returns {Promise<Blob>} Exported data
     */
    async exportData(dataType, params = {}, format = 'pdf') {
        try {
            const response = await this.apiService.exportReport(dataType, format);
            return response;
        } catch (error) {
            console.error('Failed to export data:', error);
            throw error;
        }
    }

    /**
     * Refresh all cached data
     */
    async refreshAllData() {
        try {
            // Clear cache
            this.clearCache();
            
            // Fetch fresh data
            await Promise.all([
                this.getCourses({}, false),
                this.getAttendanceReport({}),
                // Add other data types as needed
            ]);
            
            console.log('All data refreshed successfully');
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    }

    /**
     * Cleanup method
     */
    cleanup() {
        this.clearCache();
        this.cache.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
} else {
    window.DataService = DataService;
}
