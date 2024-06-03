// axiosConfig.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
  baseURL: 'https://makemake-839412403029.herokuapp.com/', // Your API base URL
  // baseURL: 'http://localhost:3000',
  // Any other global settings
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }

    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      config.headers['x-user-id'] = userId;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
