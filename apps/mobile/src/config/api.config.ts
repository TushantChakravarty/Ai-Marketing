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

/*
  Note: The BASE_URL is set to the same value for both development and production in this example. 
  In a real-world scenario, you would typically have different URLs for development and production environments. 
  You can adjust the BASE_URL values as needed when deploying to production.
    BASE_URL: __DEV__
    ? 'http://192.168.29.218:3001/api/v1'
    : 'http://192.168.29.218:3001/api/v1',
*/
