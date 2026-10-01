import { useState, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user] = useState({
    name: 'Guest User',
    email: 'guest@rainsense.ai',
    id: 'guest_user',
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null,
        loading: false,
        login: () => {},
        logout: () => {},
        isAuthenticated: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: { name: 'Guest User', email: 'guest@rainsense.ai', id: 'guest_user' },
      token: null,
      loading: false,
      login: () => {},
      logout: () => {},
      isAuthenticated: true,
    };
  }
  return context;
}
