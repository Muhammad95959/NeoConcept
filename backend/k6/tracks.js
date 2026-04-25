import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { API_BASE_URL, login, makeRequest, uniqueId, checkResponse, thinkTime } from './utils.js';

// Set expected status codes for all HTTP requests to avoid k6 treating non-200 responses as errors, which allows us to test various scenarios without prematurely failing the test.
// For example, some endpoints might return 403 for unauthorized access, and we want to check that behavior without k6 marking it as a failed request.
// We can adjust the expected status codes as needed based on the endpoints we are testing.
http.setResponseCallback(http.expectedStatuses(200, 201, 401, 403,500));

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

let createdTrackId = null;

export default function tracksLoadTest() {
  login();
  sleep(thinkTime());

  // Get all tracks (public endpoint)
  group('Tracks - List All', function () {
    const response = http.get(`${API_BASE_URL}/tracks`, {
      headers: { 'Content-Type': 'application/json' },
    });
    checkResponse(response, 200, 'List Tracks');
    
    // Try to extract a track ID for later use
    try {
      const body = JSON.parse(response.body);
      if (body.data && Array.isArray(body.data) && body.data.length > 0) {
        createdTrackId = body.data[0].id;
      }
    } catch (e) {
      // Continue even if parsing fails
    }
    sleep(thinkTime());
  });

  // Get track by ID
  if (createdTrackId) {
    group('Tracks - Get by ID', function () {
      const response = http.get(`${API_BASE_URL}/tracks/${createdTrackId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      checkResponse(response, 200, 'Get Track by ID');
      sleep(thinkTime());
    });

    // Get track staff
    group('Tracks - Get Staff', function () {
      const response = makeRequest('GET', `/tracks/${createdTrackId}/staff`);
      check(response, {
        'Get track staff status is 200 or 401 or 403': (r) => r.status === 200 || r.status === 401 || r.status === 403, // 401 if not authenticated, 403 if authenticated but not authorized (He's not in the track)
      });
      sleep(thinkTime());
    });
  }

  // List with search
  group('Tracks - Search', function () {
    const response = http.get(`${API_BASE_URL}/tracks?search=test`, {
      headers: { 'Content-Type': 'application/json' },
    });
    checkResponse(response, 200, 'Search Tracks');
    sleep(thinkTime());
  });

  // Test creating a track (requires admin - will likely fail but tests the endpoint)
  group('Tracks - Create (Admin only)', function () {
    login();
    
    const trackPayload = JSON.stringify({
      name: `LoadTestTrack${uniqueId()}`,
      shortDescription: 'Load test track',
      longDescription: 'This is a load test track',
      domain: 'Engineering',
      level: 'Intermediate',
      language: 'English',
      targetAudience: 'Everyone',
      learningOutcomes: ['Outcome 1', 'Outcome 2'],
      relatedJobs: ['Job 1', 'Job 2'],
      pricingModel: 'Free',
    });

    const response = makeRequest('POST', '/tracks', trackPayload);
    console.log(`Create track response status: ${response.status}` + `, body: ${response.body}`);
    check(response, {
      'Create track status is 201 or 403 or 500': (r) => r.status === 201 || r.status === 403 || r.status === 500, // 403 if not admin, 500 for the unique creator id contraint
    });
    sleep(thinkTime());
  });
}
