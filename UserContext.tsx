import React, { createContext, useContext, useState, useEffect } from "react";

interface UserContextValue {
  username: string;
  setUsername: (name: string) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsernameState] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("wp_username");
    if (stored) setUsernameState(stored);
  }, []);

  const setUsername = (name: string) => {
    setUsernameState(name);
    localStorage.setItem("wp_username", name);
  };

  return (
    <UserContext.Provider value={{ username, setUsername }}>{children}</UserContext.Provider>
  );
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
};
