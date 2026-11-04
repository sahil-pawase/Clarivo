// Frontend environment variables
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  // Add other frontend environment variables here
};

module.exports = env;
