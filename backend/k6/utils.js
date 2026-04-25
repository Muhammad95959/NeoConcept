import http from 'k6/http';
import { check, sleep } from 'k6';

// Use explicit IPv4 loopback by default to avoid localhost resolution issues on some environments.
export const API_BASE_URL_DEFAULT = 'http://127.0.0.1:9595/api/v1';
// Configurable base URL and test user credentials via environment variables
export const API_BASE_URL = __ENV.API_URL || API_BASE_URL_DEFAULT;
export const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'loadtest@test.com',
  password: __ENV.TEST_PASSWORD || 'test123456',
  username: __ENV.TEST_USERNAME || 'loadtestuser',
};

let authCookie = null;

// The login function will be used across multiple test modules to authenticate and store the session cookie for subsequent requests.
export function login() {
  // Payload for login request
  const loginPayload = JSON.stringify({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  // Parameters for the login request, including headers
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  };

  const response = http.post(`${API_BASE_URL}/auth/login`, loginPayload, params);

  // Checking the response status to ensure login was successful
  check(response, {
    'login status is 200': (r) => r.status === 200,
  });

  // Extract cookie from Set-Cookie header
  const cookies = response && response.headers ? response.headers['Set-Cookie'] : null;
  if (cookies && cookies.length > 0) {
    authCookie = cookies[0];
  }

  return response;
}


// Function to get the current auth cookie (if needed in other modules)
export function getAuthCookie() {
  return authCookie;
}

// Function to clear the auth cookie (for logout or cleanup)
export function clearAuthCookie() {
  authCookie = null;
}

// Helper function to make authenticated requests using the stored auth cookie
export function makeRequest(method, path, payload = null, params = {}) {
  const url = `${API_BASE_URL}${path}`;
  // Merge default headers with any additional params provided
  const defaultParams = {
    ...params,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie || '',
      ...(params.headers || {}),
    },
  };

  let response;
  // Switch case to handle different HTTP methods
  switch (method.toUpperCase()) {
    case 'GET':
      response = http.get(url, defaultParams);
      break;
    case 'POST':
      response = http.post(url, payload, defaultParams);
      break;
    case 'PUT':
      response = http.put(url, payload, defaultParams);
      break;
    case 'PATCH':
      response = http.patch(url, payload, defaultParams);
      break;
    case 'DELETE':
      response = http.del(url, defaultParams);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  return response;
}


// Helper function to generate a unique ID for test data
export function uniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to generate a random email address for testing purposes
export function randomEmail() {
  return `test${uniqueId()}@test.com`;
}

// Helper function to check response status and body for a given description, used across multiple test modules for consistency in assertions
export function checkResponse(response, expectedStatus, description) {
  const hasBody = !!(response && typeof response.body === 'string' && response.body.length > 0);

  check(response, {
    [`${description} - Status ${expectedStatus}`]: (r) => !!r && r.status === expectedStatus,
    [`${description} - Has body`]: () => hasBody,
  });
}

// Helper function to simulate user think time between actions, with configurable minimum and maximum delay in milliseconds
export function thinkTime(minMs = 100, maxMs = 500) {
  // k6 sleep() expects seconds, while callers pass milliseconds.
  const delayMs = Math.random() * (maxMs - minMs) + minMs;
  return delayMs / 1000;
}
