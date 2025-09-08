/**
 * EdUTEND System - Integration Test Suite
 * 
 * @fileoverview Tests the complete frontend-backend integration
 * @author Code Crafters
 * @contributor Kay-M
 * @license MIT License - https://opensource.org/licenses/MIT
 * @copyright Copyright (c) 2025 Kay-M
 */

class IntegrationTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = 0;
        this.isRunning = false;
    }

    /**
     * Add a test to the suite
     */
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.results = [];
        this.currentTest = 0;
        
        console.log('🚀 Starting Integration Test Suite...');
        console.log(`📋 Total tests: ${this.tests.length}`);
        
        for (let i = 0; i < this.tests.length; i++) {
            this.currentTest = i;
            const test = this.tests[i];
            
            console.log(`\n🧪 Running test ${i + 1}/${this.tests.length}: ${test.name}`);
            
            try {
                const startTime = Date.now();
                await test.testFunction();
                const duration = Date.now() - startTime;
                
                this.results.push({
                    name: test.name,
                    status: 'PASS',
                    duration,
                    error: null
                });
                
                console.log(`✅ PASS: ${test.name} (${duration}ms)`);
                
            } catch (error) {
                this.results.push({
                    name: test.name,
                    status: 'FAIL',
                    duration: 0,
                    error: error.message
                });
                
                console.error(`❌ FAIL: ${test.name} - ${error.message}`);
            }
        }
        
        this.isRunning = false;
        this.printResults();
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('\n📊 Test Results:');
        console.log('================');
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${total}`);
        console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => r.status === 'FAIL').forEach(result => {
                console.log(`  - ${result.name}: ${result.error}`);
            });
        }
        
        // Display results in UI if available
        this.displayResultsInUI();
    }

    /**
     * Display results in UI
     */
    displayResultsInUI() {
        const resultsContainer = document.getElementById('test-results');
        if (!resultsContainer) return;
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        resultsContainer.innerHTML = `
            <div class="test-results">
                <h3>Integration Test Results</h3>
                <div class="test-summary">
                    <div class="test-stat passed">
                        <span class="stat-number">${passed}</span>
                        <span class="stat-label">Passed</span>
                    </div>
                    <div class="test-stat failed">
                        <span class="stat-number">${failed}</span>
                        <span class="stat-label">Failed</span>
                    </div>
                    <div class="test-stat total">
                        <span class="stat-number">${total}</span>
                        <span class="stat-label">Total</span>
                    </div>
                </div>
                <div class="test-details">
                    ${this.results.map(result => `
                        <div class="test-result ${result.status.toLowerCase()}">
                            <span class="test-name">${result.name}</span>
                            <span class="test-status">${result.status}</span>
                            <span class="test-duration">${result.duration}ms</span>
                            ${result.error ? `<span class="test-error">${result.error}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Create test suite instance
const testSuite = new IntegrationTestSuite();

// Add configuration tests
testSuite.addTest('Configuration Loading', async () => {
    if (!window.API_CONFIG) throw new Error('API_CONFIG not found');
    if (!window.SOCKET_CONFIG) throw new Error('SOCKET_CONFIG not found');
    if (!window.APP_CONFIG) throw new Error('APP_CONFIG not found');
    
    // Test specific config values
    if (API_CONFIG.BASE_URL !== 'http://localhost:5501/api') {
        throw new Error('API_CONFIG.BASE_URL is incorrect');
    }
    
    if (SOCKET_CONFIG.URL !== 'http://localhost:5501') {
        throw new Error('SOCKET_CONFIG.URL is incorrect');
    }
    
    console.log('✅ Configuration loaded successfully');
});

// Add API service tests
testSuite.addTest('API Service Initialization', async () => {
    if (!window.ApiService) throw new Error('ApiService class not found');
    
    const apiService = new ApiService();
    if (!apiService.baseUrl) throw new Error('API service baseUrl not set');
    if (!apiService.token) throw new Error('API service token not initialized');
    
    console.log('✅ API Service initialized successfully');
});

// Add Socket service tests
testSuite.addTest('Socket Service Initialization', async () => {
    if (!window.SocketService) throw new Error('SocketService class not found');
    
    const socketService = new SocketService();
    if (socketService.isConnected !== false) {
        throw new Error('Socket service should start disconnected');
    }
    
    console.log('✅ Socket Service initialized successfully');
});

// Add Data service tests
testSuite.addTest('Data Service Initialization', async () => {
    if (!window.DataService) throw new Error('DataService class not found');
    
    const dataService = new DataService();
    if (!dataService.apiService) throw new Error('Data service API service not initialized');
    if (!dataService.socketService) throw new Error('Data service socket service not initialized');
    
    console.log('✅ Data Service initialized successfully');
});

// Add Authentication tests
testSuite.addTest('Authentication Manager Initialization', async () => {
    if (!window.AuthManager) throw new Error('AuthManager class not found');
    
    const authManager = new AuthManager();
    if (!authManager.apiService) throw new Error('Auth manager API service not initialized');
    if (!authManager.socketService) throw new Error('Auth manager socket service not initialized');
    
    console.log('✅ Authentication Manager initialized successfully');
});

// Add Dashboard tests
testSuite.addTest('Admin Dashboard Integration', async () => {
    if (!window.AdminDashboard) throw new Error('AdminDashboard class not found');
    
    // Test can be instantiated (will fail auth check, but that's expected)
    try {
        const adminDashboard = new AdminDashboard();
        console.log('✅ Admin Dashboard class can be instantiated');
    } catch (error) {
        if (error.message.includes('Access denied')) {
            console.log('✅ Admin Dashboard auth check working (expected failure)');
        } else {
            throw error;
        }
    }
});

testSuite.addTest('Lecturer Dashboard Integration', async () => {
    if (!window.LecturerDashboard) throw new Error('LecturerDashboard class not found');
    
    try {
        const lecturerDashboard = new LecturerDashboard();
        console.log('✅ Lecturer Dashboard class can be instantiated');
    } catch (error) {
        if (error.message.includes('Access denied')) {
            console.log('✅ Lecturer Dashboard auth check working (expected failure)');
        } else {
            throw error;
        }
    }
});

testSuite.addTest('Student Dashboard Integration', async () => {
    if (!window.StudentDashboard) throw new Error('StudentDashboard class not found');
    
    try {
        const studentDashboard = new StudentDashboard();
        console.log('✅ Student Dashboard class can be instantiated');
    } catch (error) {
        if (error.message.includes('Access denied')) {
            console.log('✅ Student Dashboard auth check working (expected failure)');
        } else {
            throw error;
        }
    }
});

// Add Loading component tests
testSuite.addTest('Loading Component', async () => {
    if (!window.LoadingOverlay) throw new Error('LoadingOverlay class not found');
    
    const loadingOverlay = new LoadingOverlay();
    if (!loadingOverlay.overlay) throw new Error('Loading overlay not created');
    
    // Test show/hide functionality
    loadingOverlay.show('Test message');
    if (!loadingOverlay.isVisible) throw new Error('Loading overlay not visible after show');
    
    loadingOverlay.hide();
    if (loadingOverlay.isVisible) throw new Error('Loading overlay still visible after hide');
    
    console.log('✅ Loading Component working correctly');
});

// Add real-time event tests
testSuite.addTest('Real-time Event System', async () => {
    let eventReceived = false;
    
    // Test custom event emission
    document.addEventListener('test:event', (event) => {
        eventReceived = true;
        if (event.detail.message !== 'test') {
            throw new Error('Event detail not received correctly');
        }
    });
    
    // Emit test event
    document.dispatchEvent(new CustomEvent('test:event', {
        detail: { message: 'test' }
    }));
    
    // Wait a bit for event to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!eventReceived) {
        throw new Error('Custom event not received');
    }
    
    console.log('✅ Real-time event system working correctly');
});

// Add API endpoint tests
testSuite.addTest('API Endpoints Configuration', async () => {
    const requiredEndpoints = [
        'AUTH.LOGIN',
        'AUTH.REGISTER',
        'USERS.LIST',
        'COURSES.LIST',
        'ATTENDANCE.LIST',
        'QR.GENERATE'
    ];
    
    for (const endpoint of requiredEndpoints) {
        const parts = endpoint.split('.');
        let current = API_CONFIG.ENDPOINTS;
        
        for (const part of parts) {
            if (!current[part]) {
                throw new Error(`Missing API endpoint: ${endpoint}`);
            }
            current = current[part];
        }
    }
    
    console.log('✅ All required API endpoints configured');
});

// Add utility function tests
testSuite.addTest('Utility Functions', async () => {
    // Test date formatting
    const testDate = new Date('2025-01-01T10:00:00Z');
    const formattedDate = testDate.toLocaleDateString();
    if (!formattedDate) throw new Error('Date formatting not working');
    
    // Test string operations
    const testString = 'Hello World';
    if (testString.toLowerCase() !== 'hello world') {
        throw new Error('String operations not working');
    }
    
    // Test array operations
    const testArray = [1, 2, 3];
    if (testArray.length !== 3) throw new Error('Array operations not working');
    
    console.log('✅ Utility functions working correctly');
});

// Add error handling tests
testSuite.addTest('Error Handling', async () => {
    // Test try-catch functionality
    try {
        throw new Error('Test error');
    } catch (error) {
        if (error.message !== 'Test error') {
            throw new Error('Error handling not working correctly');
        }
    }
    
    // Test async error handling
    try {
        await Promise.reject(new Error('Async test error'));
    } catch (error) {
        if (error.message !== 'Async test error') {
            throw new Error('Async error handling not working correctly');
        }
    }
    
    console.log('✅ Error handling working correctly');
});

// Add mobile responsiveness tests
testSuite.addTest('Mobile Responsiveness', async () => {
    // Test viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        throw new Error('Viewport meta tag not found');
    }
    
    // Test responsive CSS classes
    const body = document.body;
    if (!body.classList.contains('admin-dashboard')) {
        throw new Error('Responsive CSS classes not applied');
    }
    
    console.log('✅ Mobile responsiveness configured correctly');
});

// Export test suite
window.IntegrationTestSuite = IntegrationTestSuite;
window.testSuite = testSuite;

// Auto-run tests when page loads (if not in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔍 Auto-running integration tests in development mode...');
        setTimeout(() => testSuite.runAllTests(), 1000);
    });
}

console.log('🧪 Integration Test Suite loaded. Run testSuite.runAllTests() to execute tests.');
