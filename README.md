# EdUTEND System - Enhanced QR Code Attendance Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/edutend-system) [![Status](https://img.shields.io/badge/status-active-brightgreen.svg)](https://github.com/yourusername/edutend-system)

## 🎓 Project Overview

**EdUTEND** is a comprehensive, web-based attendance management system designed specifically for educational institutions. The system leverages QR code technology to streamline attendance tracking while providing robust user management, calendar functionality, and real-time reporting capabilities.

## ✨ Key Features

### 🔐 **Authentication & User Management**

- **Multi-role Support**: Administrator, Lecturer, and Student roles
- **Secure Login/Registration**: Email-based authentication with role validation
- **Session Management**: Automatic timeout and secure logout
- **User Profile Management**: Comprehensive profile settings and preferences

### 📱 **QR Code Attendance System**

- **Dynamic QR Generation**: Lecturers can generate unique QR codes for each session
- **Real-time Scanning**: Students scan QR codes to mark attendance instantly
- **Session Management**: Course-specific QR sessions with configurable timeouts
- **Attendance Tracking**: Comprehensive logging of all attendance events

### 📅 **Advanced Calendar & Event Management**

- **Enhanced Calendar Interface**: Modern, responsive calendar with event management
- **Admin Event Sharing**: Events created by administrators automatically appear across user roles
- **Recurring Events**: Support for daily, weekly, bi-weekly, and monthly recurring events
- **Event Types**: Lecture, Tutorial, Exam, Assignment, Meeting, and more
- **Export Functionality**: CSV export of events and attendance data

### 📊 **Comprehensive Reporting**

- **Attendance Analytics**: Detailed attendance statistics and trends
- **Student Reports**: Individual student performance tracking
- **Course Reports**: Course-level attendance analysis
- **Export Options**: PDF and DOCX report generation
- **Real-time Dashboard**: Live statistics and performance metrics

### 🎨 **Modern User Interface**

- **Responsive Design**: Mobile-first approach with desktop optimization
- **Glassmorphism Design**: Modern, elegant visual styling
- **Dark/Light Themes**: Customizable appearance preferences
- **Accessibility Features**: Screen reader support and keyboard navigation

## 🏗️ System Architecture

### **Frontend Technologies**

- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Advanced styling with CSS Grid, Flexbox, and custom properties
- **Vanilla JavaScript**: ES6+ features with modular architecture
- **Progressive Web App**: Offline capabilities and mobile app-like experience

### **External Libraries**

- **QRCode.js**: QR code generation and scanning
- **html2pdf.js**: PDF report generation
- **docx**: Microsoft Word document creation
- **date-fns**: Advanced date manipulation and formatting
- **Font Awesome**: Comprehensive icon library

### **Data Storage**

- **Local Storage**: Client-side data persistence
- **Session Storage**: Temporary session data
- **IndexedDB**: Advanced client-side database (future enhancement)

## 👥 User Roles & Permissions

### **🔧 Administrator**

- **User Management**: Create, edit, and delete users across all roles
- **System Configuration**: Global settings and preferences
- **Event Management**: Create institutional events visible to all users
- **Data Export**: Comprehensive system data export
- **System Monitoring**: Performance and usage analytics

### **👨‍🏫 Lecturer**

- **QR Code Management**: Generate and manage course-specific QR codes
- **Attendance Tracking**: Monitor real-time attendance during sessions
- **Event Management**: Personal and course-related calendar events
- **Student Management**: View and manage enrolled students
- **Reporting**: Generate attendance and performance reports

### **👨‍🎓 Student**

- **QR Code Scanning**: Scan QR codes to mark attendance
- **Calendar View**: View course schedules and institutional events
- **Attendance History**: Track personal attendance records
- **Profile Management**: Update personal information and preferences
- **Course Access**: View enrolled courses and schedules

## 🚀 Getting Started

### **Prerequisites**

- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+)
- Local web server (Python, Node.js, or any HTTP server)
- No database setup required (uses client-side storage)

### **Installation**

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd HCI-Project
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start Development Server**

   ```bash
   npm start
   # or
   python -m http.server 8000
   ```

4. **Access the Application**
   - Open `http://localhost:8000` in your browser
   - Navigate to `index.html` for login/registration

### **Quick Start Guide**

1. **First Time Setup**
   - Register as an Administrator
   - Create lecturer and student accounts
   - Set up course information

2. **Daily Usage**
   - Lecturers: Generate QR codes for sessions
   - Students: Scan QR codes to mark attendance
   - Administrators: Monitor system usage and create events

## 📁 Project Structure

HCI-Project/
├── 📄 HTML Files
│   ├── index.html          # Main login/registration page
│   ├── Admin.html          # Administrator dashboard
│   ├── Lecturer.html       # Lecturer dashboard
│   ├── Student.html        # Student dashboard
│   ├── adminc.html         # Admin course management
│   ├── lecturec.html       # Lecturer course management
│   └── studentc.html       # Student course view
├── 🎨 CSS Files
│   ├── style.css           # Main stylesheet
│   ├── index.css           # Login page styles
│   └── css/
│       └── components/
│           └── notifications.css
├── ⚡ JavaScript Files
│   ├── js/
│   │   ├── app.js          # Main application logic
│   │   └── modules/
│   │       ├── auth.js     # Authentication module
│   │       └── qr-manager.js # QR code management
│   ├── script.js           # Login/registration logic
│   ├── sub.js              # Additional utilities
│   └── index.js            # Entry point
├── 📦 Configuration
│   ├── package.json        # Project dependencies
│   └── .hintrc            # Code quality settings
└── 📚 Documentation
    └── README.md           # This file
```

## 🔧 Configuration & Customization

### **Environment Variables**
- No environment variables required for basic functionality
- All configuration stored in localStorage

### **Customization Options**
- **Theme Colors**: Modify CSS custom properties in `style.css`
- **QR Code Settings**: Adjust timeout and session parameters
- **Calendar Preferences**: Customize event types and display options
- **Report Templates**: Modify PDF and DOCX generation settings

### **Localization**
- Currently supports English
- Easy to extend with additional languages
- Date and time formatting follows user's locale

## 📱 Mobile & Responsive Design

### **Mobile-First Approach**
- Responsive design that works on all screen sizes
- Touch-friendly interface for mobile devices
- Optimized for both portrait and landscape orientations

### **Progressive Web App Features**
- Offline functionality for core features
- Installable on mobile devices
- Fast loading and smooth performance

## 🔒 Security Features

### **Authentication Security**
- Password-based authentication
- Session timeout management
- Role-based access control
- Secure logout functionality

### **Data Protection**
- Client-side data storage
- No sensitive data transmitted to external servers
- Local data encryption (future enhancement)

## 📊 Performance & Optimization

### **Loading Performance**
- Lazy loading of non-critical components
- Optimized asset delivery
- Minimal external dependencies

### **Memory Management**
- Efficient event handling
- Proper cleanup of event listeners
- Optimized data structures

## 🧪 Testing & Quality Assurance

### **Code Quality**
- ESLint configuration for JavaScript
- Prettier for code formatting
- Consistent coding standards

### **Browser Compatibility**
- Modern browser support
- Graceful degradation for older browsers
- Progressive enhancement approach

## 🚀 Deployment

### **Local Development**
- Simple HTTP server setup
- No build process required
- Instant development feedback

### **Production Deployment**
- Static file hosting
- CDN for external libraries
- HTTPS recommended for production

## 🤝 Contributing

### **Development Guidelines**
1. Follow existing code style and conventions
2. Test changes across different user roles
3. Ensure mobile responsiveness
4. Update documentation for new features

### **Code Standards**
- Use semantic HTML
- Follow CSS best practices
- Implement proper error handling
- Add meaningful comments
- Include MIT License headers in all JavaScript files
- Follow the license header template in `LICENSE_HEADER_TEMPLATE.txt`

## 📈 Future Enhancements

### **Planned Features**
- **Real-time Notifications**: Push notifications for events and attendance
- **Advanced Analytics**: Machine learning-based attendance predictions
- **API Integration**: RESTful API for external system integration
- **Cloud Storage**: Optional cloud-based data storage
- **Multi-language Support**: Internationalization features

### **Technical Improvements**
- **Service Workers**: Enhanced offline functionality
- **WebAssembly**: Performance-critical operations
- **Progressive Web App**: Enhanced mobile experience
- **Real-time Sync**: WebSocket-based live updates

## 🐛 Troubleshooting

### **Common Issues**

1. **QR Code Not Scanning**
   - Ensure camera permissions are granted
   - Check QR code is within frame
   - Verify QR code hasn't expired

2. **Events Not Appearing**
   - Refresh the page to reload admin events
   - Check browser console for errors
   - Verify localStorage permissions

3. **Mobile Display Issues**
   - Clear browser cache
   - Ensure responsive design is enabled
   - Check device orientation

### **Debug Mode**
- Open browser developer tools
- Check console for error messages
- Monitor localStorage for data integrity

## 📞 Support & Contact

### **Technical Support**
- Check this README for common solutions
- Review browser console for error messages
- Ensure all dependencies are loaded

### **Development Team**
- **Code Crafters**: Main development team
- **Kay-M**: Project lead and maintainer

## 📄 License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **MIT License Benefits**
- ✅ **Permissive**: Allows commercial use, modification, and distribution
- ✅ **Simple**: Easy to understand and comply with
- ✅ **Compatible**: Works well with other open-source licenses
- ✅ **Business-friendly**: No restrictions on commercial applications

### **What You Can Do**
- Use the code commercially
- Modify and adapt the code
- Distribute the code
- Use it privately
- Sublicense it

### **Requirements**
- Include the original copyright notice
- Include the MIT License text

For the full license text, see [LICENSE](LICENSE) file in the project root.

## 🙏 Acknowledgments

- **QR Code Technology**: Based on open-source QR code libraries
- **UI/UX Design**: Inspired by modern design systems
- **Educational Institutions**: Feedback and requirements from academic partners

---

**EdUTEND System** - Transforming attendance management in education through innovative technology and user-centered design.

*Last updated: August 2025*
