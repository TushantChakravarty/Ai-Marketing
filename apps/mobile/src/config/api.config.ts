const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://192.168.29.218:3001/api/v1'
    : 'http://192.168.29.218:3001/api/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

export default API_CONFIG;
