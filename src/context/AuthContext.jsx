import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chargement, setChargement] = useState(true);

  // Restaure la session au chargement si un token est présent.
  useEffect(() => {
    const token = localStorage.getItem('sugu_token');
    if (!token) {
      setChargement(false);
      return;
    }
    client
      .get('/auth/moi')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('sugu_token'))
      .finally(() => setChargement(false));
  }, []);

  function ouvrirSession({ token, user }) {
    localStorage.setItem('sugu_token', token);
    setUser(user);
  }

  function deconnexion() {
    localStorage.removeItem('sugu_token');
    setUser(null);
    window.location.href = '/';
  }

  function mettreAJourUser(nouveauUser) {
    setUser(nouveauUser);
  }

  return (
    <AuthContext.Provider value={{ user, chargement, ouvrirSession, deconnexion, mettreAJourUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
