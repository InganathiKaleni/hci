/**
 * EdUTEND System - Admin Dashboard Integration
 * 
 * @fileoverview Integrates Admin dashboard with backend services, replacing localStorage functionality
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class AdminDashboard {
    constructor() {
        this.authManager = null;
        this.dataService = null;
        this.socketService = null;
        this.currentUser = null;
        this.users = [];
        this.courses = [];
        this.attendance = [];
        this.settings = {};
        
        this.init();
    }

    async init() {
        try {
            // Check authentication
            if (!this.checkAuth()) return;
            
            // Initialize services
            this.authManager = new AuthManager();
            this.dataService = new DataService();
            this.socketService = new SocketService();
            
            // Load current user
            this.currentUser = this.authManager.getCurrentUser();
            
            // Set up real-time listeners
            this.setupRealTimeListeners();
            
            // Initialize dashboard
            await this.initializeDashboard();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('Admin Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Admin Dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    /**
     * Check if user is authenticated and has admin role
     */
    checkAuth() {
        const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
            window.location.href = 'index.html';
            return false;
        }

        const user = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER) || '{}');
        if (user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    /**
     * Set up real-time event listeners
     */
    setupRealTimeListeners() {
        // User events
        document.addEventListener('user:created', (event) => {
            this.handleUserUpdate('created', event.detail);
        });

        document.addEventListener('user:updated', (event) => {
            this.handleUserUpdate('updated', event.detail);
        });

        document.addEventListener('user:deleted', (event) => {
            this.handleUserUpdate('deleted', event.detail);
        });

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

        // Socket connection events
        document.addEventListener('socket:connected', () => {
            this.updateConnectionStatus(true);
        });

        document.addEventListener('socket:disconnected', () => {
            this.updateConnectionStatus(false);
        });
    }

    /**
     * Initialize dashboard data
     */
    async initializeDashboard() {
        try {
            this.showLoading(true);
            
            // Load all data in parallel
            const [users, courses, attendance, settings] = await Promise.all([
                this.loadUsers(),
                this.loadCourses(),
                this.loadAttendance(),
                this.loadSettings()
            ]);

            // Update dashboard sections
            this.updateDashboardStats();
            this.renderUsers();
            this.renderCourses();
            this.renderAttendance();
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to load dashboard data');
            this.showLoading(false);
        }
    }

    /**
     * Load users from backend
     */
    async loadUsers() {
        try {
            const response = await this.dataService.apiService.getUsers();
            if (response.success && response.data) {
                this.users = response.data;
                return this.users;
            }
            return [];
        } catch (error) {
            console.error('Failed to load users:', error);
            return [];
        }
    }

    /**
     * Load courses from backend
     */
    async loadCourses() {
        try {
            const response = await this.dataService.apiService.getCourses();
            if (response.success && response.data) {
                this.courses = response.data;
                return this.courses;
            }
            return [];
        } catch (error) {
            console.error('Failed to load courses:', error);
            return [];
        }
    }

    /**
     * Load attendance data from backend
     */
    async loadAttendance() {
        try {
            const response = await this.dataService.apiService.getAttendanceReport();
            if (response.success && response.data) {
                this.attendance = response.data;
                return this.attendance;
            }
            return [];
        } catch (error) {
            console.error('Failed to load attendance:', error);
            return [];
        }
    }

    /**
     * Load admin settings
     */
    async loadSettings() {
        try {
            // For now, load from localStorage, but this could be moved to backend
            const settings = localStorage.getItem('adminSettings');
            this.settings = settings ? JSON.parse(settings) : this.getDefaultSettings();
            return this.settings;
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = this.getDefaultSettings();
            return this.settings;
        }
    }

    /**
     * Get default admin settings
     */
    getDefaultSettings() {
        return {
            autoBackup: true,
            backupInterval: 24, // hours
            emailNotifications: true,
            attendanceTimeout: 30, // minutes
            qrCodeExpiry: 30, // minutes
            maxUsersPerPage: 50,
            theme: 'dark'
        };
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const totalUsers = this.users.length;
        const totalLecturers = this.users.filter(u => u.role === 'lecturer').length;
        const totalStudents = this.users.filter(u => u.role === 'student').length;
        const totalCourses = this.courses.length;
        const totalAttendance = this.attendance.length;

        // Update stats display
        this.updateStatElement('total-users', totalUsers);
        this.updateStatElement('total-lecturers', totalLecturers);
        this.updateStatElement('total-students', totalStudents);
        this.updateStatElement('total-courses', totalCourses);
        this.updateStatElement('total-attendance', totalAttendance);
    }

    /**
     * Update stat element
     */
    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toLocaleString();
        }
    }

    /**
     * Render users table
     */
    renderUsers() {
        const usersContainer = document.getElementById('users-container');
        if (!usersContainer) return;

        const usersHtml = this.users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge badge-${user.role}">${user.role}</span></td>
                <td>${user.department || 'N/A'}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.editUser('${user._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteUser('${user._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        usersContainer.innerHTML = usersHtml;
    }

    /**
     * Render courses table
     */
    renderCourses() {
        const coursesContainer = document.getElementById('courses-container');
        if (!coursesContainer) return;

        const coursesHtml = this.courses.map(course => `
            <tr>
                <td>${course.name}</td>
                <td>${course.code}</td>
                <td>${course.lecturer?.name || 'N/A'}</td>
                <td>${course.department}</td>
                <td>${course.students?.length || 0}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.editCourse('${course._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteCourse('${course._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        coursesContainer.innerHTML = coursesHtml;
    }

    /**
     * Render attendance table
     */
    renderAttendance() {
        const attendanceContainer = document.getElementById('attendance-container');
        if (!attendanceContainer) return;

        const attendanceHtml = this.attendance.map(record => `
            <tr>
                <td>${record.student?.name || 'N/A'}</td>
                <td>${record.course?.name || 'N/A'}</td>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.status}</td>
                <td>${record.lecturer?.name || 'N/A'}</td>
            </tr>
        `).join('');

        attendanceContainer.innerHTML = attendanceHtml;
    }

    /**
     * Handle user updates from real-time events
     */
    handleUserUpdate(action, userData) {
        switch (action) {
            case 'created':
                this.users.push(userData);
                break;
            case 'updated':
                const userIndex = this.users.findIndex(u => u._id === userData._id);
                if (userIndex >= 0) {
                    this.users[userIndex] = userData;
                }
                break;
            case 'deleted':
                this.users = this.users.filter(u => u._id !== userData._id);
                break;
        }
        
        this.updateDashboardStats();
        this.renderUsers();
        this.showNotification(`User ${action} successfully`, 'success');
    }

    /**
     * Handle course updates from real-time events
     */
    handleCourseUpdate(action, courseData) {
        switch (action) {
            case 'created':
                this.courses.push(courseData);
                break;
            case 'updated':
                const courseIndex = this.courses.findIndex(c => c._id === courseData._id);
                if (courseIndex >= 0) {
                    this.courses[courseIndex] = courseData;
                }
                break;
            case 'deleted':
                this.courses = this.courses.filter(c => c._id !== courseData._id);
                break;
        }
        
        this.updateDashboardStats();
        this.renderCourses();
        this.showNotification(`Course ${action} successfully`, 'success');
    }

    /**
     * Handle attendance updates from real-time events
     */
    handleAttendanceUpdate(action, attendanceData) {
        if (action === 'marked') {
            this.attendance.push(attendanceData);
            this.updateDashboardStats();
            this.renderAttendance();
        }
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
            statusElement.textContent = isConnected ? 'Connected' : 'Disconnected';
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.lecturer-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.getAttribute('href') === '#') {
                    e.preventDefault();
                    this.showSection(item.getAttribute('data-target'));
                }
            });
        });

        // Logout
        document.querySelectorAll('[data-target="logout"]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Mobile sidebar
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebar = document.getElementById('sidebar2');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                sidebar.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Close sidebar when clicking outside
        if (sidebar) {
            sidebar.addEventListener('click', (e) => {
                if (e.target === sidebar) {
                    sidebar.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

        // Escape key to close sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (sidebar && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    }

    /**
     * Show specific section
     */
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Remove active class from all nav items
        document.querySelectorAll('.lecturer-nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Add active class to clicked nav item
        const activeNavItem = document.querySelector(`[data-target="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    /**
     * Load section-specific data
     */
    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboardStats();
                break;
            case 'users':
                await this.loadUsers();
                this.renderUsers();
                break;
            case 'courses':
                await this.loadCourses();
                this.renderCourses();
                break;
            case 'attendance':
                await this.loadAttendance();
                this.renderAttendance();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    /**
     * User management methods
     */
    async createUser(userData) {
        try {
            const response = await this.dataService.apiService.createUser(userData);
            if (response.success) {
                this.showNotification('User created successfully', 'success');
                await this.loadUsers();
                this.renderUsers();
                return response.data;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            this.showError(error.message);
            throw error;
        }
    }

    async editUser(userId) {
        // Implementation for editing user
        console.log('Edit user:', userId);
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await this.dataService.apiService.deleteUser(userId);
            if (response.success) {
                this.showNotification('User deleted successfully', 'success');
                await this.loadUsers();
                this.renderUsers();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            this.showError(error.message);
        }
    }

    /**
     * Course management methods
     */
    async createCourse(courseData) {
        try {
            const response = await this.dataService.apiService.createCourse(courseData);
            if (response.success) {
                this.showNotification('Course created successfully', 'success');
                await this.loadCourses();
                this.renderCourses();
                return response.data;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Failed to create course:', error);
            this.showError(error.message);
            throw error;
        }
    }

    async editCourse(courseId) {
        // Implementation for editing course
        console.log('Edit course:', courseId);
    }

    async deleteCourse(courseId) {
        if (!confirm('Are you sure you want to delete this course?')) return;

        try {
            const response = await this.dataService.apiService.deleteCourse(courseId);
            if (response.success) {
                this.showNotification('Course deleted successfully', 'success');
                await this.loadCourses();
                this.renderCourses();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Failed to delete course:', error);
            this.showError(error.message);
        }
    }

    /**
     * Utility methods
     */
    showLoading(show) {
        const loadingElement = document.getElementById('loading-overlay');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    async logout() {
        try {
            await this.authManager.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout fails
            window.location.href = 'index.html';
        }
    }
}

// Initialize admin dashboard when DOM is loaded
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Export for global access
window.AdminDashboard = AdminDashboard;
