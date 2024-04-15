// axiosConfig.js
import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: 'http://localhost:3000',
  baseURL: 'https://makemake-839412403029.herokuapp.com/', // Your API base URL
  // Any other global settings
});

export default axiosInstance;
