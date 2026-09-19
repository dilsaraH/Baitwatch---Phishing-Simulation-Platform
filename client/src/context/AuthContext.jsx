import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Rehydrate state from localStorage on initial load
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('baitwatch_auth');
    return stored ? JSON.parse(stored).token : null;
  });
  
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('baitwatch_auth');
    return stored ? JSON.parse(stored).user : null;
  });

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('baitwatch_auth', JSON.stringify({ token: newToken, user: newUser }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('baitwatch_auth');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);