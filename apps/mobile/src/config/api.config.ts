const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'https://ai-marketing-12a2.onrender.com/api/v1'
    : 'https://ai-marketing-12a2.onrender.com/api/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

export default API_CONFIG;
