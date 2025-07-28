import React, { useState, useEffect } from "react";
import PolicyContext from "./PolicyContext";
import axios from "axios";

const PolicyState = (props) => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  // Set default auth headers for all axios requests
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Token ${token}`;
    }
  }, []);

  const info_getter = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/user-info/");
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const history_getter = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/my-queries/");
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
