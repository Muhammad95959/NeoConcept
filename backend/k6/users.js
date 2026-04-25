import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { makeRequest, uniqueId, randomEmail, checkResponse, thinkTime, API_BASE_URL, login } from './utils.js';


// Set expected status codes for all HTTP requests to avoid k6 treating non-200 responses as errors, which allows us to test various scenarios without prematurely failing the test.
// For example, some endpoints might return 403 for unauthorized access, and we want to check that behavior without k6 marking it as a failed request.
// We can adjust the expected status codes as needed based on the endpoints we are testing.
http.setResponseCallback(http.expectedStatuses(200, 201, 400, 403, 409));

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function usersLoadTest() {
  // Login as a test user first to get the auth cookie for subsequent requests
  login();
  sleep(thinkTime());

  group('Users - Get Tracks', function () {
    // Make an authenticated request to get user tracks
    const response = makeRequest('GET', '/user/tracks');
    checkResponse(response, 200, 'Get User Tracks');
    sleep(thinkTime());
  });

  group('Users - Get Courses', function () {
    // Make an authenticated request to get user courses
    const response = makeRequest('GET', '/user/courses');
    checkResponse(response, 200, 'Get User Courses');
    sleep(thinkTime());
  });

  group('Users - Update Profile', function () {
    // Updating user profile with a new username
    const updatePayload = JSON.stringify({
      username: `updated_user${uniqueId()}`,
    });

    const response = makeRequest('PATCH', '/user', updatePayload);
    check(response, {
      'Update user status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    sleep(thinkTime());
  });

  group('Users - Get Staff Requests', function () {
    // Make an authenticated request to get staff requests
    const response = makeRequest('GET', '/user/staff-requests');
    check(response, {
      'Get staff requests status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    sleep(thinkTime());
  });

  group('Users - Get Student Requests', function () {
    // Make an authenticated request to get student requests
    const response = makeRequest('GET', '/user/student-requests');
    check(response, {
      'Get student requests status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    sleep(thinkTime());
  });
}
