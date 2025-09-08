/**
 * EdUTEND System - Lecturer Dashboard Integration
 * 
 * @fileoverview Integrates Lecturer dashboard with backend services, replacing localStorage functionality
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class LecturerDashboard {
    constructor() {
        this.authManager = null;
        this.dataService = null;
        this.socketService = null;
        this.currentUser = null;
        this.courses = [];
        this.attendance = [];
        this.qrSessions = [];
        this.currentQR = null;
        this.qrTimer = null;
        
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
            
            console.log('Lecturer Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Lecturer Dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    /**
     * Check if user is authenticated and has lecturer role
     */
    checkAuth() {
        const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
            window.location.href = 'index.html';
            return false;
        }

        const user = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER) || '{}');
        if (user.role !== 'lecturer') {
            alert('Access denied. Lecturer privileges required.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    /**
     * Set up real-time event listeners
     */
    setupRealTimeListeners() {
        // QR Code events
        document.addEventListener('qr:generated', (event) => {
            this.handleQRUpdate('generated', event.detail);
        });

        document.addEventListener('qr:expired', (event) => {
            this.handleQRUpdate('expired', event.detail);
        });

        document.addEventListener('qr:scanned', (event) => {
            this.handleQRScanned(event.detail);
        });

        // Attendance events
        document.addEventListener('attendance:marked', (event) => {
            this.handleAttendanceUpdate('marked', event.detail);
        });

        // Course events
        document.addEventListener('course:updated', (event) => {
            this.handleCourseUpdate('updated', event.detail);
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
            const [courses, attendance, qrSessions] = await Promise.all([
                this.loadCourses(),
                this.loadAttendance(),
                this.loadQRSessions()
            ]);

            // Update dashboard sections
            this.updateDashboardStats();
            this.renderCourses();
            this.renderAttendance();
            this.renderQRSessions();
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to load dashboard data');
            this.showLoading(false);
        }
    }

    /**
     * Load lecturer's courses from backend
     */
    async loadCourses() {
        try {
            const response = await this.dataService.apiService.getCourses({
                lecturerId: this.currentUser._id || this.currentUser.id
            });
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
            const response = await this.dataService.apiService.getAttendanceReport({
                lecturerId: this.currentUser._id || this.currentUser.id
            });
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
     * Load QR sessions from backend
     */
    async loadQRSessions() {
        try {
            const response = await this.dataService.apiService.getQRSessions({
                lecturerId: this.currentUser._id || this.currentUser.id
            });
            if (response.success && response.data) {
                this.qrSessions = response.data;
                return this.qrSessions;
            }
            return [];
        } catch (error) {
            console.error('Failed to load QR sessions:', error);
            return [];
        }
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const totalCourses = this.courses.length;
        const totalStudents = this.courses.reduce((sum, course) => sum + (course.students?.length || 0), 0);
        const totalAttendance = this.attendance.length;
        const activeQRSessions = this.qrSessions.filter(session => 
            new Date(session.expiresAt) > new Date()
        ).length;

        // Update stats display
        this.updateStatElement('total-courses', totalCourses);
        this.updateStatElement('total-students', totalStudents);
        this.updateStatElement('total-attendance', totalAttendance);
        this.updateStatElement('active-qr-sessions', activeQRSessions);
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
     * Render courses table
     */
    renderCourses() {
        const coursesContainer = document.getElementById('courses-container');
        if (!coursesContainer) return;

        const coursesHtml = this.courses.map(course => `
            <tr>
                <td>${course.name}</td>
                <td>${course.code}</td>
                <td>${course.department}</td>
                <td>${course.students?.length || 0}</td>
                <td>${new Date(course.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="lecturerDashboard.editCourse('${course._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="lecturerDashboard.generateQRForCourse('${course._id}')">
                        <i class="fas fa-qrcode"></i>
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
                <td>${record.time}</td>
                <td><span class="badge badge-${record.status}">${record.status}</span></td>
            </tr>
        `).join('');

        attendanceContainer.innerHTML = attendanceHtml;
    }

    /**
     * Render QR sessions table
     */
    renderQRSessions() {
        const qrSessionsContainer = document.getElementById('qr-sessions-container');
        if (!qrSessionsContainer) return;

        const qrSessionsHtml = this.qrSessions.map(session => `
            <tr>
                <td>${session.course?.name || 'N/A'}</td>
                <td>${new Date(session.createdAt).toLocaleString()}</td>
                <td>${new Date(session.expiresAt).toLocaleString()}</td>
                <td>${session.scannedCount || 0}</td>
                <td>
                    <span class="badge badge-${new Date(session.expiresAt) > new Date() ? 'success' : 'danger'}">
                        ${new Date(session.expiresAt) > new Date() ? 'Active' : 'Expired'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="lecturerDashboard.viewQRSession('${session._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        qrSessionsContainer.innerHTML = qrSessionsHtml;
    }

    /**
     * Generate QR code for a course
     */
    async generateQRForCourse(courseId) {
        try {
            const course = this.courses.find(c => c._id === courseId);
            if (!course) {
                throw new Error('Course not found');
            }

            const qrData = {
                courseId: courseId,
                lecturerId: this.currentUser._id || this.currentUser.id,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                sessionName: `${course.name} - ${new Date().toLocaleDateString()}`
            };

            const response = await this.dataService.generateQR(qrData);
            if (response) {
                this.currentQR = response;
                this.displayQRCode(response);
                this.startQRTimer(response.expiresAt);
                this.showNotification('QR Code generated successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to generate QR code:', error);
            this.showError(error.message);
        }
    }

    /**
     * Display QR code on the page
     */
    displayQRCode(qrData) {
        const qrContainer = document.getElementById('qr-display');
        if (!qrContainer) return;

        // Clear previous QR code
        qrContainer.innerHTML = '';

        // Create QR code element
        const qrElement = document.createElement('div');
        qrElement.className = 'qr-code-container';
        qrElement.innerHTML = `
            <h3>${qrData.sessionName}</h3>
            <div id="qrcode"></div>
            <p class="qr-info">
                <strong>Course:</strong> ${this.courses.find(c => c._id === qrData.courseId)?.name || 'N/A'}<br>
                <strong>Expires:</strong> <span id="qr-expiry">${new Date(qrData.expiresAt).toLocaleString()}</span><br>
                <strong>Status:</strong> <span class="badge badge-success">Active</span>
            </p>
            <button class="btn btn-danger" onclick="lecturerDashboard.stopQRSession()">
                <i class="fas fa-stop"></i> Stop Session
            </button>
        `;

        qrContainer.appendChild(qrElement);

        // Generate QR code using QRCode.js
        if (typeof QRCode !== 'undefined') {
            new QRCode(document.getElementById('qrcode'), {
                text: qrData.qrCode || qrData._id,
                width: 200,
                height: 200
            });
        }
    }

    /**
     * Start QR code timer
     */
    startQRTimer(expiresAt) {
        if (this.qrTimer) {
            clearInterval(this.qrTimer);
        }

        this.qrTimer = setInterval(() => {
            const now = new Date();
            const expiry = new Date(expiresAt);
            const timeLeft = expiry - now;

            if (timeLeft <= 0) {
                this.expireQRSession();
                return;
            }

            // Update expiry display
            const expiryElement = document.getElementById('qr-expiry');
            if (expiryElement) {
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                expiryElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    /**
     * Stop QR code session
     */
    async stopQRSession() {
        if (!this.currentQR) return;

        try {
            // Stop the timer
            if (this.qrTimer) {
                clearInterval(this.qrTimer);
                this.qrTimer = null;
            }

            // Clear QR display
            const qrContainer = document.getElementById('qr-display');
            if (qrContainer) {
                qrContainer.innerHTML = '<p class="text-muted">No active QR session</p>';
            }

            this.currentQR = null;
            this.showNotification('QR session stopped', 'info');

        } catch (error) {
            console.error('Failed to stop QR session:', error);
            this.showError('Failed to stop QR session');
        }
    }

    /**
     * Expire QR code session
     */
    async expireQRSession() {
        if (this.qrTimer) {
            clearInterval(this.qrTimer);
            this.qrTimer = null;
        }

        // Clear QR display
        const qrContainer = document.getElementById('qr-display');
        if (qrContainer) {
            qrContainer.innerHTML = '<p class="text-muted">QR session expired</p>';
        }

        this.currentQR = null;
        this.showNotification('QR session expired', 'warning');
    }

    /**
     * Handle QR updates from real-time events
     */
    handleQRUpdate(action, qrData) {
        switch (action) {
            case 'generated':
                this.qrSessions.push(qrData);
                break;
            case 'expired':
                this.qrSessions = this.qrSessions.filter(s => s._id !== qrData._id);
                if (this.currentQR && this.currentQR._id === qrData._id) {
                    this.expireQRSession();
                }
                break;
        }
        
        this.updateDashboardStats();
        this.renderQRSessions();
    }

    /**
     * Handle QR code scanned event
     */
    handleQRScanned(qrData) {
        // Update attendance count for current QR session
        if (this.currentQR && this.currentQR._id === qrData.qrSessionId) {
            this.currentQR.scannedCount = (this.currentQR.scannedCount || 0) + 1;
            this.updateQRDisplay();
        }

        // Show notification
        this.showNotification(`Attendance marked for ${qrData.student?.name || 'Student'}`, 'success');
    }

    /**
     * Update QR display with new data
     */
    updateQRDisplay() {
        if (!this.currentQR) return;

        const qrContainer = document.getElementById('qr-display');
        if (qrContainer) {
            const scannedCountElement = qrContainer.querySelector('.scanned-count');
            if (scannedCountElement) {
                scannedCountElement.textContent = this.currentQR.scannedCount || 0;
            }
        }
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
     * Handle course updates from real-time events
     */
    handleCourseUpdate(action, courseData) {
        if (action === 'updated') {
            const courseIndex = this.courses.findIndex(c => c._id === courseData._id);
            if (courseIndex >= 0) {
                this.courses[courseIndex] = courseData;
                this.updateDashboardStats();
                this.renderCourses();
            }
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
            case 'courses':
                await this.loadCourses();
                this.renderCourses();
                break;
            case 'attendance':
                await this.loadAttendance();
                this.renderAttendance();
                break;
            case 'qrcode':
                await this.loadQRSessions();
                this.renderQRSessions();
                break;
        }
    }

    /**
     * Course management methods
     */
    async editCourse(courseId) {
        // Implementation for editing course
        console.log('Edit course:', courseId);
    }

    /**
     * View QR session details
     */
    async viewQRSession(sessionId) {
        try {
            const session = this.qrSessions.find(s => s._id === sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Show session details in a modal or new section
            this.showQRSessionDetails(session);
        } catch (error) {
            console.error('Failed to view QR session:', error);
            this.showError(error.message);
        }
    }

    /**
     * Show QR session details
     */
    showQRSessionDetails(session) {
        // Implementation for showing session details
        console.log('Show session details:', session);
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

// Initialize lecturer dashboard when DOM is loaded
let lecturerDashboard;
document.addEventListener('DOMContentLoaded', () => {
    lecturerDashboard = new LecturerDashboard();
});

// Export for global access
window.LecturerDashboard = LecturerDashboard;
