# EdUTEND Backend API

A comprehensive Node.js backend for the EdUTEND Attendance System with QR code functionality, real-time updates, and role-based access control.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Admin, Lecturer, and Student roles with specific permissions
- **Course Management**: Complete course lifecycle management
- **QR Code System**: Generate and manage QR codes for attendance
- **Real-time Updates**: Socket.IO integration for live attendance updates
- **Attendance Tracking**: Comprehensive attendance recording and reporting
- **API Security**: Rate limiting, input validation, and security headers
- **Database**: MongoDB with Mongoose ODM
- **File Uploads**: Support for profile pictures and documents

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **File Handling**: Multer

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/edutend

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
# Start MongoDB service
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Cloud MongoDB (MongoDB Atlas):**
- Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create cluster and get connection string
- Update `MONGODB_URI` in `.env`

### 4. Run the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Password reset

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Admin/Lecturer)
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course (Admin only)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/course/:courseId` - Get course attendance
- `GET /api/attendance/student/:studentId` - Get student attendance

### QR Codes
- `POST /api/qr/generate` - Generate QR code (Lecturer)
- `GET /api/qr/active` - Get active QR codes
- `POST /api/qr/scan` - Scan QR code (Student)
- `DELETE /api/qr/:id` - Deactivate QR code

### Reports
- `GET /api/reports/attendance` - Generate attendance report
- `GET /api/reports/course/:courseId` - Generate course report
- `GET /api/reports/student/:studentId` - Generate student report

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles & Permissions

### Admin
- Full system access
- User management
- Course management
- System configuration

### Lecturer
- Manage own courses
- Generate QR codes
- View course attendance
- Student management

### Student
- View enrolled courses
- Mark attendance
- View own attendance
- Profile management

## 🗄️ Database Models

### User
- Basic info (name, email, password)
- Role-based fields (studentId, lecturerId)
- Preferences (theme, language, notifications)
- Timestamps and activity tracking

### Course
- Course details (code, name, description)
- Schedule and prerequisites
- Student enrollment
- Assessment configuration

### Attendance
- Session tracking
- Student presence
- QR code validation
- Timestamp and location

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Prevent abuse and DDoS
- **CORS Protection**: Configured for frontend access
- **Security Headers**: Helmet.js for security headers
- **SQL Injection Protection**: Mongoose ODM protection

## 📡 Real-time Features

Socket.IO integration provides real-time updates for:

- New QR code generation
- Attendance marking
- Course updates
- System notifications

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production database
- Set up email service

### Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name edutend-backend

# Using Docker
docker build -t edutend-backend .
docker run -p 5000:5000 edutend-backend
```

### Monitoring
- Health check endpoint: `GET /health`
- Logging with Morgan
- Error tracking and reporting

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **JWT Token Invalid**
   - Ensure `JWT_SECRET` is set
   - Check token expiration
   - Verify token format

3. **CORS Errors**
   - Check `FRONTEND_URL` in `.env`
   - Verify frontend origin

4. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill process using the port

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and logging.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Happy Coding! 🎉**
