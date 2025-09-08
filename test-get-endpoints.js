/**
 * Test Script for GET Endpoints
 * 
 * This script demonstrates how to use all the new GET endpoints
 * in the EdUTEND system. Run this with Node.js to test the endpoints.
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'student',
    department: 'Computer Science',
    studentId: 'ST001',
    course: 'Computer Science',
    year: 2
  },
  course: {
    name: 'Test Course',
    code: 'TC101',
    department: 'Computer Science',
    credits: 3,
    description: 'A test course for demonstration'
  },
  attendance: {
    studentId: 'ST001',
    courseId: 'COURSE_ID_HERE', // Replace with actual course ID
    date: '2025-01-20',
    status: 'present',
    notes: 'Test attendance'
  },
  qr: {
    courseId: 'COURSE_ID_HERE', // Replace with actual course ID
    duration: 60,
    title: 'Test Session',
    notes: 'Test QR generation'
  }
};

// Helper function to make GET requests
async function testGetEndpoint(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📍 Endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data.message || 'Request successful');
      if (data.data) {
        console.log('📊 Data received');
      }
    } else {
      console.log('❌ Error:', data.message || 'Request failed');
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test all GET endpoints
async function runAllTests() {
  console.log('🚀 Starting GET Endpoints Test Suite');
  console.log('=====================================');
  
  // Test 1: User Registration
  const registerParams = new URLSearchParams({
    name: testData.user.name,
    email: testData.user.email,
    password: testData.user.password,
    role: testData.user.role,
    department: testData.user.department,
    studentId: testData.user.studentId,
    course: testData.user.course,
    year: testData.user.year
  });
  
  await testGetEndpoint(
    `${API_BASE_URL}/auth/register?${registerParams}`,
    'User Registration (GET)'
  );
  
  // Test 2: User Login
  const loginParams = new URLSearchParams({
    email: testData.user.email,
    password: testData.user.password,
    role: testData.user.role
  });
  
  const loginResult = await testGetEndpoint(
    `${API_BASE_URL}/auth/login?${loginParams}`,
    'User Login (GET)'
  );
  
  let authToken = null;
  if (loginResult.success && loginResult.data.data) {
    authToken = loginResult.data.data.token;
    console.log('🔑 Authentication token received');
  }
  
  // Test 3: Course Creation (requires authentication)
  if (authToken) {
    const courseParams = new URLSearchParams({
      name: testData.course.name,
      code: testData.course.code,
      department: testData.course.department,
      credits: testData.course.credits,
      description: testData.course.description
    });
    
    const courseResult = await testGetEndpoint(
      `${API_BASE_URL}/courses/create?${courseParams}`,
      'Course Creation (GET)'
    );
    
    // Update test data with actual course ID if creation was successful
    if (courseResult.success && courseResult.data.data) {
      testData.attendance.courseId = courseResult.data.data.course._id;
      testData.qr.courseId = courseResult.data.data.course._id;
      console.log('📚 Course created, ID:', testData.attendance.courseId);
    }
  }
  
  // Test 4: QR Generation (requires authentication)
  if (authToken && testData.qr.courseId) {
    const qrParams = new URLSearchParams({
      courseId: testData.qr.courseId,
      duration: testData.qr.duration,
      title: testData.qr.title,
      notes: testData.qr.notes
    });
    
    await testGetEndpoint(
      `${API_BASE_URL}/qr/generate?${qrParams}`,
      'QR Generation (GET)'
    );
  }
  
  // Test 5: Attendance Marking (requires authentication)
  if (authToken && testData.attendance.courseId) {
    const attendanceParams = new URLSearchParams({
      studentId: testData.attendance.studentId,
      courseId: testData.attendance.courseId,
      date: testData.attendance.date,
      status: testData.attendance.status,
      notes: testData.attendance.notes
    });
    
    await testGetEndpoint(
      `${API_BASE_URL}/attendance/mark?${attendanceParams}`,
      'Attendance Marking (GET)'
    );
  }
  
  // Test 6: Password Change (requires authentication)
  if (authToken) {
    const passwordParams = new URLSearchParams({
      currentPassword: testData.user.password,
      newPassword: 'newpassword456'
    });
    
    await testGetEndpoint(
      `${API_BASE_URL}/auth/change-password?${passwordParams}`,
      'Password Change (GET)'
    );
  }
  
  console.log('\n🎉 Test Suite Completed!');
  console.log('========================');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

// Export for use in other modules
module.exports = {
  testGetEndpoint,
  runAllTests,
  testData
};
