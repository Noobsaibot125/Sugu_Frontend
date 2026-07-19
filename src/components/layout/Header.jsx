import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import client from '../../api/client';
import PopupLimiteAnnonces from '../ui/PopupLimiteAnnonces';
import { COMMUNES } from '../../data/mock';
import './Header.css';
import logoImg from '../../assets/TrouveTout_Logo.png';

export default function Header() {
  const { user, deconnexion } = useAuth();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState('');
  const [commune, setCommune] = useState(COMMUNES[0]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [limiteOpen, setLimiteOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({ count: 0, quota: 5, subName: 'Particulier Gratuit' });

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (recherche.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await client.get(`/annonces/suggestions?q=${encodeURIComponent(recherche)}`);
        setSuggestions(data);
      } catch (err) {
        console.error("Suggestions error:", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [recherche]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectionnerSuggestion = (suggestion) => {
    const params = new URLSearchParams();
    if (suggestion.type === 'categorie') {
      params.set('categorie', suggestion.slug);
    } else {
      params.set('q', suggestion.text);
      setRecherche(suggestion.text);
    }
    if (commune && commune !== COMMUNES[0]) {
      params.set('commune', commune);
    }
    setShowSuggestions(false);
    navigate(`/recherche?${params.toString()}`);
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchUnreadCount = async () => {
      try {
        const { data } = await client.get('/messages/non-lus/count');
        setUnreadCount(data.count || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const soumettreRecherche = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (recherche) params.set('q', recherche);
    if (commune && commune !== COMMUNES[0]) params.set('commune', commune);
    navigate(`/recherche${params.toString() ? `?${params}` : ''}`);
  };

  const handleDeposer = async () => {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (user.role === 'admin') {
      navigate('/publier');
      return;
    }
    try {
      const { data } = await client.get('/annonces/mon/quota');
      if (data.atteint) {
        setQuotaInfo({ count: data.count, quota: data.quota, subName: data.subName });
        setLimiteOpen(true);
      } else {
        navigate('/publier');
      }
    } catch (err) {
      // En cas d'erreur, on laisse passer (le backend rejettera si besoin)
      navigate('/publier');
    }
  };

  return (
    <header className="sugu-header">
      <style>{`
        @keyframes pulse-orange-header {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(226, 90, 56, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 5px rgba(226, 90, 56, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(226, 90, 56, 0); }
        }
      `}</style>
      <div className="sugu-header__inner">
        <Link to="/" className="sugu-logo" aria-label="TrouveTout accueil">
          <img src={logoImg} alt="TrouveTout" className="sugu-logo__img" />
        </Link>

        <div ref={wrapperRef} className="sugu-search-wrapper">
          <form className="sugu-search" onSubmit={soumettreRecherche} style={{ width: '100%', margin: 0 }}>
            <div className="sugu-search__query">
              <span>🔍</span>
              <input
                type="search"
                placeholder="iPhone, Toyota, terrain, canapé…"
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
            </div>
            <button type="submit" className="sugu-btn sugu-search__button">
              Rechercher
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="sugu-search-suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="sugu-search-suggestion-item"
                  onClick={() => selectionnerSuggestion(suggestion)}
                >
                  <span className="sugu-search-suggestion-icon">
                    {suggestion.type === 'categorie' ? '📁' : '🔍'}
                  </span>
                  <span className="sugu-search-suggestion-text">{suggestion.text}</span>
                  <span className="sugu-search-suggestion-type">
                    {suggestion.type === 'categorie' ? 'Catégorie' : 'Annonce'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sugu-header__actions">
          {user ? (
            <div className="sugu-header__user">
              {user.role !== 'admin' && (
                <Link to="/tableau-de-bord?tab=messages" className="sugu-header__icon" aria-label="Messagerie" style={{ position: 'relative' }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      backgroundColor: '#E25A38',
                      color: '#fff',
                      borderRadius: '50%',
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      lineHeight: 1,
                      border: '1.5px solid var(--sugu-surface)',
                      animation: 'pulse-orange-header 2s infinite'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="sugu-btn" style={{
                  background: '#FFF',
                  border: '1.5px solid #106C62',
                  color: '#106C62',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginRight: '6px'
                }}>
                  🛡️ Admin
                </Link>
              )}
              {user.role !== 'admin' && (
                <Link to="/tableau-de-bord" className="sugu-header__profile">
                  <Avatar src={user.avatar_url} nom={user.nom} size={36} />
                </Link>
              )}
              <button type="button" className="sugu-btn sugu-header__logout" onClick={deconnexion}>
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/connexion" className="sugu-link sugu-header__login">
              Se connecter
            </Link>
          )}

          {user && user.role !== 'admin' && (
            <Link 
              to={user.type_compte === 'pro' ? '/tableau-de-bord?tab=abonnement' : '/passer-pro'} 
              style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: 'var(--sugu-primary)',
                textDecoration: 'none',
                marginRight: '12px'
              }}
            >
              {user.type_compte === 'pro' ? '💼 Espace Pro' : '💼 Passer en Pro'}
            </Link>
          )}

          <button type="button" className="sugu-btn sugu-header__post" onClick={handleDeposer}>
            <span>＋</span> Déposer une annonce
          </button>
        </div>
      </div>

      <PopupLimiteAnnonces
        isOpen={limiteOpen}
        onClose={() => setLimiteOpen(false)}
        count={quotaInfo.count}
        quota={quotaInfo.quota}
        subName={quotaInfo.subName}
      />
    </header>
  );
}
