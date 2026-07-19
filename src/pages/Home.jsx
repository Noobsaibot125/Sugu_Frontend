import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import PopupLimiteAnnonces from '../components/ui/PopupLimiteAnnonces';
import './Home.css';

const populars = ['iPhone', 'Toyota', 'Terrain Bingerville', 'Chambre à louer', 'Réfrigérateur', 'Groupe électrogène'];

const categoryMeta = [
  { id: 'electronique', icon: '📱', label: 'Électronique & Informatique' },
  { id: 'vehicules', icon: '🚗', label: 'Véhicules' },
  { id: 'immobilier', icon: '🏠', label: 'Immobilier' },
  { id: 'mode', icon: '👗', label: 'Mode' },
  { id: 'maison', icon: '🛋️', label: 'Maison' },
  { id: 'services', icon: '🛠️', label: 'Services' },
  { id: 'emploi', icon: '💼', label: 'Emploi' },
];

const stats = [
  { value: '1,2 M+', label: 'annonces publiées' },
  { value: '850 K+', label: 'utilisateurs actifs' },
  { value: '32', label: 'communes couvertes' },
  { value: '15 K+', label: 'professionnels vérifiés' },
];

const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:4000${path}`;
};

function ListingPreview({ item, sponsored = false, faved, onFavorite }) {
  let parsedSpecs = {};
  if (item.caracteristiques) {
    try {
      parsedSpecs = typeof item.caracteristiques === 'string' ? JSON.parse(item.caracteristiques) : item.caracteristiques;
    } catch (e) {}
  }
  const isJob = !!parsedSpecs.type_contrat;

  const formatPrix = (prix) => {
    if (isJob) {
      return (prix || 0) === 0 ? "Salaire à discuter" : `${(prix || 0).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ')} FCFA`;
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        {(prix || 0).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ')} FCFA
        {(item.prix_negociable === 1 || item.prix_negociable === true) && (
          <span className="sugu-card__badge" style={{ display: 'inline-block', fontSize: '10px', color: '#106c62', background: '#e6f4f2', border: '1px solid #ccece6', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>Négociable</span>
        )}
      </span>
    );
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "Récemment";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Récemment";
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  const isNeuf = item.etat === 'neuf';
  const badgeLabel = isJob ? (parsedSpecs.type_contrat || 'Emploi') : (isNeuf ? 'Neuf' : item.etat === 'tres_bon' ? 'Très bon' : item.etat === 'bon' ? 'Bon' : 'Correct');
  const badgeBg = isJob ? 'var(--sugu-primary)' : (isNeuf ? '#106C62' : '#211D18');
  const badgeColor = '#fff';

  return (
    <Link to={'/annonce/' + item.id} className={'sugu-card' + (sponsored ? ' sugu-card--sponsored' : '')}>
      <div className="sugu-card__visual" style={{ background: '#EADFCE' }}>
        <div className="sugu-card__pattern" />
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.titre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
          />
        ) : (
          <span className="sugu-card__image-label">[ photo ]</span>
        )}
        <div className="sugu-card__badges">
          {sponsored && <span className="sugu-card__badge sugu-card__badge--pro">★ Pro</span>}
          <span className="sugu-card__badge" style={{ background: badgeBg, color: badgeColor }}>{badgeLabel}</span>
        </div>
        <button
          type="button"
          className={'sugu-heart' + (faved ? ' is-active' : '')}
          onClick={onFavorite}
          aria-label={faved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          {faved ? '♥' : '♡'}
        </button>
      </div>
      <div className="sugu-card__content">
        <div className="sugu-card__title">{item.titre}</div>
        <div className="sugu-card__price">{formatPrix(item.prix)}</div>
        <div className="sugu-card__meta">📍 {item.commune || 'Abidjan'} · {formatTime(item.created_at)}</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [annonces, setAnnonces] = useState([]);
  const [sponsorisees, setSponsorisees] = useState([]);
  const [favs, setFavs] = useState({});
  const [chargement, setChargement] = useState(true);
  const [activeBanners, setActiveBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [jobOffers, setJobOffers] = useState([]);
  const [randomCategoryBlocks, setRandomCategoryBlocks] = useState([]);
  const [limiteOpen, setLimiteOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({ count: 0, quota: 5, subName: 'Particulier Gratuit' });

  // Vlog states
  const [vlogs, setVlogs] = useState([]);
  const [activeVlog, setActiveVlog] = useState(null);
  const [vlogViewerOpen, setVlogViewerOpen] = useState(false);

  const handleOpenVlog = (vlog) => {
    setActiveVlog(vlog);
    setVlogViewerOpen(true);
    // Incrémenter les vues
    client.post(`/vlogs/${vlog.id}/view`).catch(err => console.error(err));
  };

  const handleDeposer = async () => {
    if (!user) { navigate('/connexion'); return; }
    if (user.role === 'admin') { navigate('/publier'); return; }
    try {
      const { data } = await client.get('/annonces/mon/quota');
      if (data.atteint) {
        setQuotaInfo({ count: data.count, quota: data.quota, subName: data.subName });
        setLimiteOpen(true);
      } else {
        navigate('/publier');
      }
    } catch (err) {
      navigate('/publier');
    }
  };

  const scrollContainer = (id, direction) => {
    const el = document.getElementById(id);
    if (el) {
      const amt = 310;
      el.scrollBy({
        left: direction === 'left' ? -amt : amt,
        behavior: 'smooth'
      });
    }
  };

  // Charger les statistiques de catégories
  useEffect(() => {
    async function chargerCounts() {
      try {
        const res = await client.get('/annonces/categories/counts');
        setCategoryCounts(res.data);
      } catch (err) {
        console.error("Erreur récupération counts categories:", err);
      }
    }
    chargerCounts();
  }, []);

  // Charger les offres d'emploi actives
  useEffect(() => {
    async function chargerOffresEmploi() {
      try {
        const res = await client.get('/annonces?category=Emploi&type_annonce=Offres d\'emploi et Stages');
        setJobOffers(res.data);
      } catch (err) {
        console.error("Erreur récupération offres emploi :", err);
      }
    }
    chargerOffresEmploi();
  }, []);

  // Charger les vlogs tendances
  useEffect(() => {
    async function chargerVlogs() {
      try {
        const res = await client.get('/vlogs');
        setVlogs(res.data);
      } catch (err) {
        console.error("Erreur chargement vlogs tendances :", err);
      }
    }
    chargerVlogs();
  }, []);

  // Charger 2 catégories aléatoires
  useEffect(() => {
    if (Object.keys(categoryCounts).length === 0) return;

    const availableCategories = categoryMeta.filter(cat => 
      cat.id !== 'emploi' && categoryCounts[cat.id] > 0
    );

    if (availableCategories.length === 0) return;

    const shuffled = [...availableCategories].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);

    let isMounted = true;

    async function loadCategoryItems() {
      try {
        const blocks = [];
        for (const cat of selected) {
          const res = await client.get(`/annonces?category=${cat.id}`);
          if (res.data && res.data.length > 0) {
            blocks.push({
              cat,
              items: res.data.slice(0, 8)
            });
          }
        }
        if (isMounted) {
          setRandomCategoryBlocks(blocks);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des catégories aléatoires :", err);
      }
    }
    
    loadCategoryItems();

    return () => { isMounted = false; };
  }, [categoryCounts]);

  // Charger les annonces récentes (dernières 24h) depuis la base de données
  useEffect(() => {
    async function chargerAnnonces() {
      try {
        const res = await client.get('/annonces?recentes=1');
        setAnnonces(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des annonces :", err);
      } finally {
        setChargement(false);
      }
    }
    chargerAnnonces();
  }, []);

  // Charger uniquement les annonces sponsorisées (abonnement Pro actif)
  useEffect(() => {
    async function chargerSponsorisees() {
      try {
        const res = await client.get('/annonces/sponsorisees');
        setSponsorisees(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des annonces sponsorisées :", err);
      }
    }
    chargerSponsorisees();
  }, []);

  // Charger les publicités actives
  useEffect(() => {
    async function chargerBannieres() {
      try {
        const res = await client.get('/annonces/publicites/actives');
        setActiveBanners(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des bannières pub :", err);
      }
    }
    chargerBannieres();
  }, []);

  // Rotation automatique du carrousel de bannières pub
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners]);

  // Charger les favoris de l'utilisateur s'il est connecté
  useEffect(() => {
    async function chargerFavoris() {
      if (!user) return;
      try {
        const res = await client.get('/favoris');
        const map = {};
        res.data.forEach(item => {
          map[item.id] = true;
        });
        setFavs(map);
      } catch (err) {
        console.error("Erreur lors de la récupération des favoris :", err);
      }
    }
    chargerFavoris();
  }, [user]);

  const toggleFav = (id) => async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      navigate('/connexion');
      return;
    }
    try {
      const res = await client.post(`/favoris/${id}`);
      setFavs((current) => ({ ...current, [id]: res.data.favori }));
    } catch (err) {
      console.error(err);
    }
  };

  const sponsoriseesAffichees = sponsorisees;
  const recentesAffichees = annonces;

  return (
    <div className="sugu-home">
      <Header />

      <main>
        <section className="sugu-section sugu-section--hero">
          <div className="sugu-hero">
            <div className="sugu-hero__content">
              <div className="sugu-hero__badge"><span /> N°1 des petites annonces en Côte d'Ivoire</div>
              <h1>Tout se vend, tout s'achète — <span>près de chez toi.</span></h1>
              <p>Électronique, véhicules, immobilier, mode, services… Des milliers d'annonces à Cocody, Yopougon, Plateau et partout en Côte d'Ivoire.</p>
              <div className="sugu-hero__actions">
                <button type="button" className="sugu-btn sugu-hero__cta" onClick={handleDeposer}>Déposer une annonce gratuitement</button>
                <div className="sugu-hero__trust"><span>✓ Gratuit</span><span>✓ Paiement sécurisé</span><span>✓ Pros vérifiés</span></div>
              </div>
            </div>
          </div>
          <div className="sugu-populars">
            <span className="sugu-populars__label">Populaire :</span>
            {populars.map((popular) => (
              <Link key={popular} to={'/recherche?q=' + encodeURIComponent(popular)} className="sugu-link sugu-populars__item">
                {popular}
              </Link>
            ))}
          </div>
        </section>

        <section className="sugu-section">
          <div className="sugu-section__head">
            <h2>Parcourir par catégorie</h2>
            <Link to="/recherche" className="sugu-link sugu-section__more">Toutes les catégories →</Link>
          </div>
          <div className="sugu-categories">
            {categoryMeta.map((cat) => (
              <Link key={cat.id} to={'/recherche?categorie=' + cat.id} className="sugu-cat">
                <div className="sugu-cat__icon">{cat.icon}</div>
                <div className="sugu-cat__label">{cat.label}</div>
                <div className="sugu-cat__count">{(categoryCounts[cat.id] || 0).toLocaleString('fr-FR')}</div>
              </Link>
            ))}
          </div>
        </section>

        {activeBanners.length > 0 && (
          <section className="sugu-section" style={{ padding: '0 0 24px 0' }}>
            <div style={{
              position: 'relative',
              borderRadius: '16px',
              height: '220px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              background: '#F1ECE3'
            }}>
              {activeBanners.map((banner, idx) => (
                <div
                  key={banner.id}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: idx === currentBannerIndex ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                    zIndex: idx === currentBannerIndex ? 1 : 0,
                    pointerEvents: idx === currentBannerIndex ? 'auto' : 'none'
                  }}
                >
                  <img
                    src={getFullUrl(banner.image_url)}
                    alt={banner.titre}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '32px 40px',
                    color: '#fff'
                  }}>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.4)', color: '#fff', maxWidth: '80%' }}>
                      {banner.titre}
                    </h3>
                    {banner.lien && (
                      <a
                        href={banner.lien}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '8px 20px',
                          background: 'var(--sugu-primary)',
                          color: '#fff',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          marginTop: '6px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                        }}
                      >
                        En savoir plus →
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {activeBanners.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '6px',
                  zIndex: 10
                }}>
                  {activeBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        border: 'none',
                        background: idx === currentBannerIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'background 0.3s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {vlogs.length > 0 && (
          <section className="sugu-section">
            <div className="sugu-section__head">
              <h2>Annonce en tendances</h2>
              <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--sugu-primary)', marginLeft: '8px' }}>⚡ Survolez pour lire !</span>
            </div>
            
            <div className="sugu-vlog-carousel-wrapper">
              {vlogs.length > 4 && (
                <>
                  <button 
                    type="button" 
                    className="sugu-vlog-scroll-btn sugu-vlog-scroll-btn--left" 
                    onClick={() => scrollContainer('scroll-vlogs', 'left')}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="sugu-vlog-scroll-btn sugu-vlog-scroll-btn--right" 
                    onClick={() => scrollContainer('scroll-vlogs', 'right')}
                  >
                    ›
                  </button>
                </>
              )}
              
              <div 
                id="scroll-vlogs" 
                className="sugu-vlog-scroll-container"
              >
                {vlogs.map((v) => (
                  <div 
                    key={v.id} 
                    className="sugu-vlog-card"
                    onClick={() => handleOpenVlog(v)}
                  >
                    <div className="sugu-vlog-video-wrapper">
                      {v.type_video === 'upload' ? (
                        <video 
                          src={v.video_url} 
                          muted 
                          playsInline 
                          loop 
                          className="sugu-vlog-video"
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                        />
                      ) : (
                        <div className="sugu-vlog-placeholder">
                          {v.cover_url ? (
                            <img src={v.cover_url} alt={v.annonce_titre} className="sugu-vlog-placeholder-img" />
                          ) : (
                            <div className="sugu-vlog-no-img">📺</div>
                          )}
                          <div className="sugu-vlog-play-badge">▶</div>
                        </div>
                      )}
                      
                      <div className="sugu-vlog-views-badge">
                        👁️ {v.vues >= 1000000 ? `${(v.vues / 1000000).toFixed(1)} M` : v.vues >= 1000 ? `${(v.vues / 1000).toFixed(1)} k` : v.vues} de vues
                      </div>
                    </div>
                    
                    <div className="sugu-vlog-info">
                      <div className="sugu-vlog-title">{v.annonce_titre}</div>
                      <div className="sugu-vlog-vendeur">
                        <img 
                          src={v.vendeur_avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=vlog'} 
                          alt={v.vendeur_nom} 
                          className="sugu-vlog-avatar"
                        />
                        <span className="sugu-vlog-vendeur-name">{v.vendeur_nom}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {sponsoriseesAffichees.length > 0 && (
          <section className="sugu-section">
            <div className="sugu-section__head">
              <div className="sugu-section__title-row">
                <h2>Mises en avant</h2>
                <span className="sugu-sponsored-label">★ SPONSORISÉ</span>
              </div>
              <Link to="/recherche" className="sugu-link sugu-section__more">Voir tout →</Link>
            </div>
            <div className="sugu-card-carousel-wrapper">
              {sponsoriseesAffichees.length > 4 && (
                <>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--left" 
                    onClick={() => scrollContainer('scroll-sponsorisees', 'left')}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--right" 
                    onClick={() => scrollContainer('scroll-sponsorisees', 'right')}
                  >
                    ›
                  </button>
                </>
              )}
              <div id="scroll-sponsorisees" className="sugu-card-scroll-container">
                {sponsoriseesAffichees.map((item) => (
                  <ListingPreview
                    key={item.id}
                    item={item}
                    sponsored
                    faved={!!favs[item.id]}
                    onFavorite={toggleFav(item.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}



        <section className="sugu-section">
          <div className="sugu-section__head">
            <h2>Annonces récentes <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#888', marginLeft: '8px' }}>(dernières 24h)</span></h2>
            <Link to="/recherche" className="sugu-link sugu-section__more">Voir plus →</Link>
          </div>
          {chargement ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Chargement…</div>
          ) : recentesAffichees.length > 0 ? (
            <div className="sugu-card-carousel-wrapper">
              {recentesAffichees.length > 4 && (
                <>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--left" 
                    onClick={() => scrollContainer('scroll-recentes', 'left')}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--right" 
                    onClick={() => scrollContainer('scroll-recentes', 'right')}
                  >
                    ›
                  </button>
                </>
              )}
              <div id="scroll-recentes" className="sugu-card-scroll-container">
                {recentesAffichees.map((item) => (
                  <ListingPreview
                    key={item.id}
                    item={item}
                    faved={!!favs[item.id]}
                    onFavorite={toggleFav(item.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: '#FAF9F6', borderRadius: '12px',
              border: '1px dashed #D4C9B4'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#555', fontSize: '15px' }}>Aucune nouvelle annonce ces 24 dernières heures</p>
              <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '13px' }}>Revenez plus tard ou parcourez toutes les annonces.</p>
              <Link to="/recherche" className="sugu-btn" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', fontSize: '13px' }}>Voir toutes les annonces</Link>
            </div>
          )}
        </section>

        {randomCategoryBlocks.map(block => (
          <section key={block.cat.id} className="sugu-section">
            <div className="sugu-section__head">
              <h2>{block.cat.label}</h2>
              <Link to={`/recherche?categorie=${block.cat.id}`} className="sugu-link sugu-section__more">Voir plus →</Link>
            </div>
            <div className="sugu-card-carousel-wrapper">
              {block.items.length > 4 && (
                <>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--left" 
                    onClick={() => scrollContainer(`scroll-cat-${block.cat.id}`, 'left')}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--right" 
                    onClick={() => scrollContainer(`scroll-cat-${block.cat.id}`, 'right')}
                  >
                    ›
                  </button>
                </>
              )}
              <div id={`scroll-cat-${block.cat.id}`} className="sugu-card-scroll-container">
                {block.items.map((item) => (
                  <ListingPreview
                    key={item.id}
                    item={item}
                    faved={!!favs[item.id]}
                    onFavorite={toggleFav(item.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}

        {jobOffers.length > 0 && (
          <section className="sugu-section">
            <div className="sugu-section__head">
              <h2>Offres d'emploi</h2>
              <Link to="/recherche?categorie=emploi" className="sugu-link sugu-section__more">Voir plus d'annonces →</Link>
            </div>
            
            <div className="sugu-job-carousel-wrapper">
              {jobOffers.length > 3 && (
                <>
                  <button 
                    type="button" 
                    className="sugu-job-scroll-btn sugu-job-scroll-btn--left" 
                    onClick={() => scrollContainer('scroll-jobs', 'left')}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="sugu-job-scroll-btn sugu-job-scroll-btn--right" 
                    onClick={() => scrollContainer('scroll-jobs', 'right')}
                  >
                    ›
                  </button>
                </>
              )}
              
              <div 
                id="scroll-jobs" 
                className="sugu-job-scroll-container"
              >
                {jobOffers.map((item) => {
                  let specs = {};
                  if (item.caracteristiques) {
                    try {
                      specs = typeof item.caracteristiques === 'string' 
                        ? JSON.parse(item.caracteristiques) 
                        : item.caracteristiques;
                    } catch (e) {}
                  }

                  const formatSalary = (val) => {
                    if (!val || val === 0) return "Salaire à discuter";
                    return `${val.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ')} F / mois`;
                  };

                  const formatTime = (dateStr) => {
                    if (!dateStr) return "Récemment";
                    const diff = Date.now() - new Date(dateStr).getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    if (hours < 1) return "Récemment";
                    if (hours < 24) return `il y a ${hours}h`;
                    return `il y a ${Math.floor(hours / 24)}j`;
                  };

                  const isNew = item.created_at && (Date.now() - new Date(item.created_at).getTime() < 24 * 60 * 60 * 1000);
                  const compName = specs.entreprise || "Recruteur";
                  const initials = compName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

                  return (
                    <Link 
                      key={item.id} 
                      to={'/annonce/' + item.id} 
                      className="sugu-job-card"
                    >
                      <div>
                        <h3 className="sugu-job-title">{item.titre}</h3>
                        <div className="sugu-job-contract">{specs.type_contrat || "Contrat non spécifié"}</div>
                        <div className="sugu-job-badge">⚡ Candidature simplifiée</div>
                        <div className="sugu-job-meta">
                          <span>📍 {item.commune || "Abidjan"}</span>
                          <span>💰 {formatSalary(item.prix)}</span>
                          <span style={{ color: isNew ? '#106C62' : '#8a8175', fontWeight: isNew ? 'bold' : 'normal' }}>
                            {formatTime(item.created_at)} {isNew && ' · Nouveau !'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="sugu-job-footer">
                        <div className="sugu-job-company">
                          <div className="sugu-job-logo">
                            {item.cover_url ? (
                              <img src={getFullUrl(item.cover_url)} alt={compName} />
                            ) : (
                              initials || "🏢"
                            )}
                          </div>
                          <span className="sugu-job-company-name" title={compName}>{compName}</span>
                        </div>
                        
                        <button
                          type="button"
                          className={'sugu-job-fav-btn' + (favs[item.id] ? ' is-active' : '')}
                          onClick={toggleFav(item.id)}
                        >
                          {favs[item.id] ? '♥' : '♡'}
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="sugu-section sugu-section--stats">
          <div className="sugu-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="sugu-stat">
                <div className="sugu-stat__value">{stat.value}</div>
                <div className="sugu-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {user?.type_compte !== 'pro' && user?.role !== 'admin' && (
          <section className="sugu-section">
            <div className="sugu-promo">
              <div className="sugu-promo__text">
                <div className="sugu-promo__label">Boutique Pro</div>
                <h3>Vous êtes un professionnel ? Vendez plus, plus vite.</h3>
                <p>Badge « Pro vérifié », mise en avant automatique et statistiques de vues. Le premier mois est offert.</p>
              </div>
              <button 
                type="button" 
                className="sugu-btn sugu-promo__button" 
                onClick={() => {
                  if (!user) {
                    navigate('/connexion');
                  } else if (user.type_compte === 'pro') {
                    navigate('/abonnements');
                  } else {
                    navigate('/passer-pro');
                  }
                }}
              >
                Créer une boutique Pro →
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <PopupLimiteAnnonces
        isOpen={limiteOpen}
        onClose={() => setLimiteOpen(false)}
        count={quotaInfo.count}
        quota={quotaInfo.quota}
        subName={quotaInfo.subName}
      />

      {vlogViewerOpen && activeVlog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000,
          padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: '#FFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '800px',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setVlogViewerOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.5)',
                color: '#FFF',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10
              }}
            >
              ×
            </button>

            {/* Video side */}
            <div style={{
              flex: 1.2,
              background: '#000',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              position: 'relative'
            }}>
              {activeVlog.type_video === 'upload' ? (
                <video
                  src={activeVlog.video_url}
                  controls
                  autoPlay
                  playsInline
                  loop
                  style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#FFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <div style={{ fontSize: '64px' }}>🌐</div>
                  <h3 style={{ margin: 0, fontWeight: 800 }}>Vidéo externe</h3>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.8, maxWidth: '280px', lineHeight: 1.5 }}>
                    Cette vidéo provient de {activeVlog.video_url.includes('tiktok') ? 'TikTok' : activeVlog.video_url.includes('instagram') ? 'Instagram' : 'YouTube'}.
                  </p>
                  <a
                    href={activeVlog.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sugu-btn"
                    style={{
                      background: 'var(--sugu-primary)',
                      color: '#FFF',
                      padding: '12px 24px',
                      borderRadius: '30px',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '13.5px'
                    }}
                  >
                    Regarder la vidéo originale →
                  </a>
                </div>
              )}
            </div>

            {/* Ad detail side */}
            <div style={{
              flex: 1,
              padding: '40px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#FFF'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <img
                    src={activeVlog.vendeur_avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=vlog'}
                    alt={activeVlog.vendeur_nom}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--sugu-ink)', fontSize: '14.5px' }}>{activeVlog.vendeur_nom}</div>
                    <div style={{ color: 'var(--sugu-ink-soft)', fontSize: '12px' }}>Vendeur Sugu</div>
                  </div>
                </div>

                <div style={{ 
                  border: '1.5px solid var(--sugu-border)', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  background: 'var(--sugu-bg-soft)',
                  marginBottom: '20px'
                }}>
                  <Link 
                    to={`/annonce/${activeVlog.annonce_id}`} 
                    onClick={() => setVlogViewerOpen(false)}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    {activeVlog.cover_url && (
                      <img 
                        src={activeVlog.cover_url} 
                        alt={activeVlog.annonce_titre} 
                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px', display: 'block' }}
                      />
                    )}
                    <h4 
                      style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '16px', 
                        fontWeight: 800, 
                        color: 'var(--sugu-ink)',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--sugu-primary)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--sugu-ink)'}
                    >
                      {activeVlog.annonce_titre}
                    </h4>
                  </Link>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--sugu-border)' }}>
                    <span style={{ color: 'var(--sugu-primary)', fontWeight: 800, fontSize: '15px' }}>
                      {activeVlog.annonce_prix?.toLocaleString('fr-FR')} FCFA
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--sugu-ink-soft)' }}>
                      📍 {activeVlog.annonce_commune}
                    </span>
                  </div>

                  {activeVlog.annonce_description && (
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--sugu-ink-soft)',
                      margin: '10px 0 0 0',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activeVlog.annonce_description}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Link
                  to={`/annonce/${activeVlog.annonce_id}`}
                  className="sugu-btn"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '14px',
                    borderRadius: '30px',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '14.5px',
                    color: '#FFF',
                    background: 'var(--sugu-primary)',
                    boxShadow: '0 4px 12px rgba(220,95,0,0.2)'
                  }}
                  onClick={() => setVlogViewerOpen(false)}
                >
                  🏷️ Voir l'annonce complète
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
