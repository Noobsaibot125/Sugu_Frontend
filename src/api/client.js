import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('sugu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use((response) => {
  if (response.data && typeof response.data === 'object') {
    try {
      const jsonStr = JSON.stringify(response.data);
      if (jsonStr.includes('http://localhost:4000')) {
        const cleanedStr = jsonStr.replace(/http:\/\/localhost:4000/g, '');
        response.data = JSON.parse(cleanedStr);
      }
    } catch (e) {
      // Ignore if serialization fails
    }
  }
  return response;
});

export default client;
