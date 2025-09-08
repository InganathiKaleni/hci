const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5501;
let PUBLIC_URL = process.env.PUBLIC_URL || null; // allow manual configuration

// Simple in-memory user store for testing
// In production, this would be a real database
const mockUsers = new Map();

// Add some default test users
mockUsers.set('admin@test.com', {
    _id: 'default-admin-id',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'Admin',
    password: 'password123',
    department: 'Administration'
});

mockUsers.set('lecturer@test.com', {
    _id: 'default-lecturer-id',
    name: 'Lecturer User',
    email: 'lecturer@test.com',
    role: 'Lecturer',
    password: 'password123',
    lecturerId: 'LEC001',
    department: 'Computer Science'
});

mockUsers.set('student@test.com', {
    _id: 'default-student-id',
    name: 'Student User',
    email: 'student@test.com',
    role: 'Student',
    password: 'password123',
    studentId: 'STU001',
    department: 'Computer Science',
    course: 'Computer Science',
    year: 1
});

console.log('Default test users loaded:', mockUsers.size);

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://localhost:5501', 'http://127.0.0.1:5500', 'file://'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Prevent favicon 404 warnings
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Authentication routes
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', { email, password: password ? '***' : 'missing' });
        
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Look up the user in our mock database
        const storedUser = mockUsers.get(email.toLowerCase());
        
        if (storedUser && storedUser.password === password) {
            // User found and password matches
            const mockUser = {
                _id: storedUser._id,
                name: storedUser.name,
                email: storedUser.email,
                role: storedUser.role,
                ...(storedUser.studentId && { studentId: storedUser.studentId }),
                ...(storedUser.lecturerId && { lecturerId: storedUser.lecturerId }),
                ...(storedUser.department && { department: storedUser.department }),
                ...(storedUser.course && { course: storedUser.course }),
                ...(storedUser.year && { year: storedUser.year })
            };
            
            console.log('User logged in successfully:', { 
                email: mockUser.email, 
                role: mockUser.role 
            });
            
            // Mock tokens
            const mockToken = 'mock-jwt-token-' + Date.now();
            const mockRefreshToken = 'mock-refresh-token-' + Date.now();
            
            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: mockUser,
                    token: mockToken,
                    refreshToken: mockRefreshToken
                }
            });
        } else if (storedUser) {
            // User found but password doesn't match
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        } else {
            // User not found
            return res.status(401).json({
                success: false,
                message: 'User not found. Please register first.'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/auth/register', (req, res) => {
    try {
        const userData = req.body;
        
        console.log('Registration attempt:', { 
            name: userData.name, 
            email: userData.email, 
            role: userData.role 
        });
        
        // Basic validation
        if (!userData.name || !userData.email || !userData.password || !userData.role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required'
            });
        }
        
        if (userData.password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Store the user in our mock database
        const userId = 'mock-user-id-' + Date.now();
        const newUser = {
            _id: userId,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            password: userData.password, // In production, this would be hashed
            ...(userData.role === 'Student' && {
                studentId: userData.studentId || 'STU' + Math.floor(Math.random() * 1000),
                department: userData.department || 'Computer Science',
                course: userData.course || 'Computer Science',
                year: userData.year || 1
            }),
            ...(userData.role === 'Lecturer' && {
                lecturerId: userData.lecturerId || 'LEC' + Math.floor(Math.random() * 1000),
                department: userData.department || 'Computer Science'
            }),
            ...(userData.role === 'Admin' && {
                department: userData.department || 'Administration'
            })
        };
        
        mockUsers.set(userData.email.toLowerCase(), newUser);
        
        console.log('User registered and stored:', { 
            email: newUser.email, 
            role: newUser.role,
            totalUsers: mockUsers.size
        });
        
        // Mock successful registration
        return res.json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/auth/logout', (req, res) => {
    // Mock successful logout
    return res.json({
        success: true,
        message: 'Logout successful'
    });
});

app.get('/api/auth/me', (req, res) => {
    // Mock current user endpoint
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No valid token provided'
        });
    }
    
    // Mock user data
    const mockUser = {
        _id: 'mock-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'Student'
    };
    
    return res.json({
        success: true,
        data: mockUser
    });
});

app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token is required'
        });
    }
    
    // Mock token refresh
    const newToken = 'new-mock-jwt-token-' + Date.now();
    const newRefreshToken = 'new-mock-refresh-token-' + Date.now();
    
    return res.json({
        success: true,
        data: {
            token: newToken,
            refreshToken: newRefreshToken
        }
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper: get first LAN IPv4 address
function getLanIPv4() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                // Prefer private IPv4 ranges
                if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(net.address)) {
                    return net.address;
                }
            }
        }
    }
    // Fallback: first non-internal IPv4 if no private match
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return null;
}

// Endpoint to expose host LAN IP for QR usage
app.get('/api/host', (req, res) => {
    try {
        const ip = getLanIPv4();
        const protocol = req.protocol || 'http';
        const port = PORT;
        const baseUrl = ip ? `${protocol}://${ip}:${port}` : `${protocol}://${req.hostname}:${port}`;
        res.json({ success: true, ip, port, baseUrl, publicUrl: PUBLIC_URL });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to determine host IP' });
    }
});

// Optional: start a public tunnel for external access (set TUNNEL=true)
async function maybeStartTunnel() {
    // Skip if PUBLIC_URL is already provided
    if (PUBLIC_URL) {
        console.log(`🌐 Using provided PUBLIC_URL: ${PUBLIC_URL}`);
        return;
    }
    if (process.env.TUNNEL === 'true') {
        try {
            // Lazy require so it's optional
            const localtunnel = require('localtunnel');
            const tunnel = await localtunnel({ port: PORT });
            PUBLIC_URL = tunnel.url;
            console.log(`🌐 Public URL (tunnel): ${PUBLIC_URL}`);
            tunnel.on('close', () => {
                PUBLIC_URL = null;
            });
        } catch (err) {
            console.warn('⚠️  Failed to start tunnel. Install with: npm i -D localtunnel');
            console.warn(err.message);
        }
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Debug endpoint to see stored users (remove in production)
app.get('/api/debug/users', (req, res) => {
    const users = Array.from(mockUsers.values()).map(user => ({
        email: user.email,
        role: user.role,
        name: user.name
    }));
    
    res.json({
        success: true,
        totalUsers: mockUsers.size,
        users: users
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 EdUTEND System Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`🐛 Debug: http://localhost:${PORT}/api/debug/users`);
    console.log(`\n📋 Default test users:`);
    console.log(`   Admin: admin@test.com / password123`);
    console.log(`   Lecturer: lecturer@test.com / password123`);
    console.log(`   Student: student@test.com / password123`);
    console.log(`\n💡 You can also register new users or use these test accounts`);
    await maybeStartTunnel();
});

module.exports = app;
