// API Configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://soundhub-backend-634858473264.us-central1.run.app'
  : 'http://localhost:8000';

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      reviews: '/api/sessions',
      marketplace: '/api/assets',
    }
  }
};
