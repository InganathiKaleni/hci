/**
 * EdUTEND System - Student Dashboard Integration
 * 
 * @fileoverview Integrates Student dashboard with backend services, replacing localStorage functionality
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class StudentDashboard {
    constructor() {
        this.authManager = null;
        this.dataService = null;
        this.socketService = null;
        this.currentUser = null;
        this.courses = [];
        this.attendance = [];
        this.qrScanner = null;
        this.isScanning = false;
        
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
            
            console.log('Student Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Student Dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    /**
     * Check if user is authenticated and has student role
     */
    checkAuth() {
        const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
            window.location.href = 'index.html';
            return false;
        }

        const user = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER) || '{}');
        if (user.role !== 'student') {
            alert('Access denied. Student privileges required.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    /**
     * Set up real-time event listeners
     */
    setupRealTimeListeners() {
        // Course events
        document.addEventListener('course:updated', (event) => {
            this.handleCourseUpdate('updated', event.detail);
        });

        // Attendance events
        document.addEventListener('attendance:marked', (event) => {
            this.handleAttendanceUpdate('marked', event.detail);
        });

        // QR Code events
        document.addEventListener('qr:generated', (event) => {
            this.handleQRUpdate('generated', event.detail);
        });

        document.addEventListener('qr:expired', (event) => {
            this.handleQRUpdate('expired', event.detail);
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
            const [courses, attendance] = await Promise.all([
                this.loadCourses(),
                this.loadAttendance()
            ]);

            // Update dashboard sections
            this.updateDashboardStats();
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
     * Load student's courses from backend
     */
    async loadCourses() {
        try {
            const response = await this.dataService.apiService.getCourses({
                studentId: this.currentUser._id || this.currentUser.id
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
     * Load student's attendance data from backend
     */
    async loadAttendance() {
        try {
            const response = await this.dataService.apiService.getAttendanceReport({
                studentId: this.currentUser._id || this.currentUser.id
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
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const totalCourses = this.courses.length;
        const totalAttendance = this.attendance.length;
        const attendanceRate = this.courses.length > 0 ? 
            (this.attendance.length / (this.courses.length * 30)) * 100 : 0; // Assuming 30 sessions per course

        // Update stats display
        this.updateStatElement('total-courses', totalCourses);
        this.updateStatElement('total-attendance', totalAttendance);
        this.updateStatElement('attendance-rate', attendanceRate.toFixed(1) + '%');
    }

    /**
     * Update stat element
     */
    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
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
                <td>${course.lecturer?.name || 'N/A'}</td>
                <td>${course.department}</td>
                <td>${course.schedule || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="studentDashboard.viewCourseDetails('${course._id}')">
                        <i class="fas fa-eye"></i>
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
                <td>${record.course?.name || 'N/A'}</td>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.time}</td>
                <td><span class="badge badge-${record.status}">${record.status}</span></td>
                <td>${record.lecturer?.name || 'N/A'}</td>
            </tr>
        `).join('');

        attendanceContainer.innerHTML = attendanceHtml;
    }

    /**
     * Initialize QR code scanner
     */
    initQRScanner() {
        const scannerContainer = document.getElementById('qr-scanner-container');
        if (!scannerContainer) return;

        // Check if device supports camera
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showError('Camera access not supported on this device');
            return;
        }

        // Create video element for camera
        const video = document.createElement('video');
        video.id = 'qr-video';
        video.style.width = '100%';
        video.style.maxWidth = '400px';
        video.style.height = 'auto';

        // Create canvas for QR detection
        const canvas = document.createElement('canvas');
        canvas.id = 'qr-canvas';
        canvas.style.display = 'none';

        // Create scanner controls
        const controls = document.createElement('div');
        controls.className = 'scanner-controls';
        controls.innerHTML = `
            <button id="start-scan" class="btn btn-primary">
                <i class="fas fa-play"></i> Start Scanning
            </button>
            <button id="stop-scan" class="btn btn-danger" style="display: none;">
                <i class="fas fa-stop"></i> Stop Scanning
            </button>
            <p class="scanner-status">Ready to scan QR codes</p>
        `;

        // Clear container and add elements
        scannerContainer.innerHTML = '';
        scannerContainer.appendChild(video);
        scannerContainer.appendChild(canvas);
        scannerContainer.appendChild(controls);

        // Set up scanner controls
        this.setupScannerControls(video, canvas);
    }

    /**
     * Set up QR scanner controls
     */
    setupScannerControls(video, canvas) {
        const startBtn = document.getElementById('start-scan');
        const stopBtn = document.getElementById('stop-scan');
        const status = document.querySelector('.scanner-status');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startScanning(video, canvas, status);
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopScanning(video, status);
                startBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';
            });
        }
    }

    /**
     * Start QR code scanning
     */
    async startScanning(video, canvas, status) {
        try {
            this.isScanning = true;
            status.textContent = 'Starting camera...';

            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera if available
            });

            video.srcObject = stream;
            video.play();

            status.textContent = 'Scanning for QR codes...';

            // Start QR detection loop
            this.scanLoop(video, canvas, status);

        } catch (error) {
            console.error('Failed to start scanning:', error);
            this.showError('Failed to access camera: ' + error.message);
            status.textContent = 'Camera access failed';
            this.isScanning = false;
        }
    }

    /**
     * Stop QR code scanning
     */
    stopScanning(video, status) {
        this.isScanning = false;
        status.textContent = 'Scanning stopped';

        // Stop camera stream
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    }

    /**
     * Main scanning loop for QR detection
     */
    scanLoop(video, canvas, status) {
        if (!this.isScanning) return;

        try {
            // Draw video frame to canvas
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data for QR detection
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Use jsQR library to detect QR codes
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    this.handleQRCodeDetected(code.data, status);
                    return;
                }
            }

            // Continue scanning
            requestAnimationFrame(() => this.scanLoop(video, canvas, status));

        } catch (error) {
            console.error('Scanning error:', error);
            status.textContent = 'Scanning error';
            this.isScanning = false;
        }
    }

    /**
     * Handle detected QR code
     */
    async handleQRCodeDetected(qrData, status) {
        try {
            status.textContent = 'QR Code detected! Processing...';

            // Validate QR code with backend
            const response = await this.dataService.validateQR(qrData);
            
            if (response && response.valid) {
                // Mark attendance
                await this.markAttendance(response.sessionId, response.courseId);
                status.textContent = 'Attendance marked successfully!';
                this.showNotification('Attendance marked successfully!', 'success');
            } else {
                status.textContent = 'Invalid or expired QR code';
                this.showNotification('Invalid or expired QR code', 'error');
            }

            // Stop scanning temporarily
            this.isScanning = false;
            setTimeout(() => {
                if (this.isScanning) {
                    status.textContent = 'Scanning for QR codes...';
                }
            }, 2000);

        } catch (error) {
            console.error('Failed to process QR code:', error);
            status.textContent = 'Failed to process QR code';
            this.showError('Failed to process QR code: ' + error.message);
        }
    }

    /**
     * Mark attendance for student
     */
    async markAttendance(sessionId, courseId) {
        try {
            const attendanceData = {
                studentId: this.currentUser._id || this.currentUser.id,
                courseId: courseId,
                sessionId: sessionId,
                date: new Date().toISOString(),
                time: new Date().toLocaleTimeString(),
                status: 'present'
            };

            const response = await this.dataService.markAttendance(attendanceData);
            
            if (response) {
                // Update local attendance data
                this.attendance.push(response);
                this.updateDashboardStats();
                this.renderAttendance();
                
                // Emit real-time event
                document.dispatchEvent(new CustomEvent('attendance:marked', {
                    detail: response
                }));
            }

            return response;
        } catch (error) {
            console.error('Failed to mark attendance:', error);
            throw error;
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
     * Handle attendance updates from real-time events
     */
    handleAttendanceUpdate(action, attendanceData) {
        if (action === 'marked' && attendanceData.studentId === (this.currentUser._id || this.currentUser.id)) {
            this.attendance.push(attendanceData);
            this.updateDashboardStats();
            this.renderAttendance();
        }
    }

    /**
     * Handle QR updates from real-time events
     */
    handleQRUpdate(action, qrData) {
        // Update UI based on QR code status
        if (action === 'expired') {
            // Show notification that QR code has expired
            this.showNotification('A QR code session has expired', 'warning');
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
                this.initQRScanner();
                break;
        }
    }

    /**
     * View course details
     */
    async viewCourseDetails(courseId) {
        try {
            const course = this.courses.find(c => c._id === courseId);
            if (!course) {
                throw new Error('Course not found');
            }

            // Show course details in a modal or new section
            this.showCourseDetails(course);
        } catch (error) {
            console.error('Failed to view course details:', error);
            this.showError(error.message);
        }
    }

    /**
     * Show course details
     */
    showCourseDetails(course) {
        // Implementation for showing course details
        console.log('Show course details:', course);
        
        // Create modal or update section with course details
        const detailsHtml = `
            <div class="course-details">
                <h3>${course.name}</h3>
                <p><strong>Code:</strong> ${course.code}</p>
                <p><strong>Lecturer:</strong> ${course.lecturer?.name || 'N/A'}</p>
                <p><strong>Department:</strong> ${course.department}</p>
                <p><strong>Schedule:</strong> ${course.schedule || 'N/A'}</p>
                <p><strong>Description:</strong> ${course.description || 'No description available'}</p>
            </div>
        `;

        // Update course details section
        const detailsContainer = document.getElementById('course-details');
        if (detailsContainer) {
            detailsContainer.innerHTML = detailsHtml;
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

// Initialize student dashboard when DOM is loaded
let studentDashboard;
document.addEventListener('DOMContentLoaded', () => {
    studentDashboard = new StudentDashboard();
});

// Export for global access
window.StudentDashboard = StudentDashboard;
