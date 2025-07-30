// src/components/setupAxios.jsx
import axios from "axios";

const setupAxios = () => {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  });
};

export default setupAxios;
