import React, { useState, useEffect } from "react";
import PolicyContext from "./PolicyContext";
import axios from "axios";
const backendUrl = import.meta.env.VITE_API_BASE_URL;

const PolicyState = (props) => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  // Set default auth headers for all axios requests
  useEffect(() => {
  const requestInterceptor = axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  });

  // Cleanup interceptor on unmount to avoid duplicates
  return () => {
    axios.interceptors.request.eject(requestInterceptor);
  };
}, []);


  const info_getter = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user-info/`);
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const history_getter = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/my-queries/`);
      setHistory(res.data);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  return (
    <PolicyContext.Provider
      value={{
        profile,
        history,
        info_getter,
        history_getter,
      }}
    >
      {props.children}
    </PolicyContext.Provider>
  );
};

export default PolicyState;
