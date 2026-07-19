import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PopupCompleterProfil from '../components/ui/PopupCompleterProfil';
import Button from '../components/ui/Button';
import ListingCard from '../components/listings/ListingCard';
import client from '../api/client';
import './AnnonceDetail.css';

export default function AnnonceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [faved, setFaved] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [vendeurAnnonces, setVendeurAnnonces] = useState([]);
  const [annoncesSimilaires, setAnnoncesSimilaires] = useState([]);
  const [estSuivi, setEstSuivi] = useState(false);

  // Scroll helper for carousels
  const scrollContainer = (id, direction) => {
    const el = document.getElementById(id);
    if (el) {
      const scrollAmt = direction === 'left' ? -300 : 300;
      el.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  // Gallery slider logic
  const handlePrevImg = () => {
    if (!listing?.images) return;
    setActiveImg(prev => (prev - 1 + listing.images.length) % listing.images.length);
  };

  const handleNextImg = () => {
    if (!listing?.images) return;
    setActiveImg(prev => (prev + 1) % listing.images.length);
  };

  // Interaction states
  const [profilIncompletOpen, setProfilIncompletOpen] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [simFavs, setSimFavs] = useState({});

  const isOwner = user && listing?.seller && String(user.id) === String(listing.seller.id);

  const formatTime = (dateStr) => {
    if (!dateStr) return "Récemment";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Récemment";
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  // Load dynamic ad details from Backend
  useEffect(() => {
    window.scrollTo(0, 0);
    async function loadData() {
      try {
        setChargement(true);
        const res = await client.get(`/annonces/${id}`);
        const data = res.data;

        let parsedSpecs = {};
        if (data.caracteristiques) {
          try {
            parsedSpecs = typeof data.caracteristiques === 'string' ? JSON.parse(data.caracteristiques) : data.caracteristiques;
          } catch (e) {
            console.error(e);
          }
        }

        const addressMode = parsedSpecs.address_mode || "approx";
        const address = parsedSpecs.address || "";

        // Fetch seller details (specifically registration year)
        // Wait, the detail endpoint already returns the vendeur details.
        const sellerYear = data.vendeur_created_at 
          ? String(new Date(data.vendeur_created_at).getFullYear()) 
          : "2022";

        const mapsRes = await client.get('/config/google-maps-key').catch(() => null);
        const key = mapsRes?.data?.key || "";

        const mapped = {
          id: String(data.id),
          titre: data.titre,
          prix: data.prix,
          commune: data.commune || 'Abidjan',
          ville: data.ville || 'Abidjan',
          quartier: addressMode === "precise" && address ? address : (data.commune || 'Abidjan'),
          addressMode,
          address,
          mapsKey: key,
          publie_depuis: formatTime(data.created_at),
          vues: data.vues,
          prix_negociable: data.prix_negociable === 1 || data.prix_negociable === true,
          description: data.description || 'Aucune description disponible.',
          images: data.images && data.images.length > 0 ? data.images.map(img => ({
            url: img.url,
            tint: '#EADFCE',
            label: `[ photo ]`
          })) : [
            { url: null, tint: '#EADFCE', label: data.category_slug === 'emploi-services' ? "[ offre d'emploi ]" : '[ photo produit ]' }
          ],
          specs: (() => {
            const dynamicSpecs = [];

            const isEmploi = data.category_slug === 'emploi-services' && (parsedSpecs.type_contrat || parsedSpecs.entreprise);

            if (!isEmploi) {
              dynamicSpecs.push({
                icon: "📦",
                label: "État",
                value: data.etat === 'neuf' ? 'Neuf' : data.etat === 'tres_bon' ? 'Très bon état' : data.etat === 'bon' ? 'Bon état' : 'État correct'
              });
            }

            const specMeta = {
              stockage: { icon: "💾", label: "Stockage" },
              couleur: { icon: "🎨", label: "Couleur" },
              batterie: { icon: "🔋", label: "Batterie" },
              reseau: { icon: "📶", label: "Réseau" },
              processeur: { icon: "💻", label: "Processeur" },
              ram: { icon: "🧠", label: "RAM" },
              carte_graphique: { icon: "🎮", label: "Carte Graphique" },
              marque: { icon: "🚘", label: "Marque" },
              modele: { icon: "🚗", label: "Modèle" },
              annee: { icon: "📅", label: "Année" },
              kilometrage: { icon: "🛣️", label: "Kilométrage" },
              transmission: { icon: "⚙️", label: "Boîte de vitesses" },
              carburant: { icon: "⛽", label: "Carburant" },
              type_bien: { icon: "🏢", label: "Type de bien" },
              superficie: { icon: "📐", label: "Superficie" },
              pieces: { icon: "🚪", label: "Nombre de pièces" },
              meuble: { icon: "🛋️", label: "Meublé" },
              entreprise: { icon: "🏢", label: "Entreprise" },
              type_contrat: { icon: "📄", label: "Type de contrat" },
              niveau_etudes: { icon: "🎓", label: "Niveau d'études" },
              experience: { icon: "⏳", label: "Expérience" },
              date_limite: { icon: "📅", label: "Date limite de l'offre" }
            };

            Object.keys(parsedSpecs).forEach(key => {
              if (parsedSpecs[key] && key !== 'type_annonce' && key !== 'address' && key !== 'address_mode') {
                const meta = specMeta[key] || { icon: "✨", label: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ') };
                let val = parsedSpecs[key];
                if (key === 'date_limite') {
                  try {
                    const date = new Date(val);
                    if (!isNaN(date.getTime())) {
                      val = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                    }
                  } catch (e) {}
                }
                dynamicSpecs.push({
                  icon: meta.icon,
                  label: meta.label,
                  value: val
                });
              }
            });

            if (!isEmploi && parsedSpecs.facture_fournie) {
              dynamicSpecs.push({
                icon: "🛡️",
                label: "Garantie",
                value: "Facture fournie"
              });
            }

            if (data.prix_negociable === 1 || data.prix_negociable === true) {
              dynamicSpecs.push({
                icon: "🤝",
                label: "Négociation",
                value: "Prix négociable"
              });
            }


            return dynamicSpecs;
          })(),
          isEmploi: data.category_slug === 'emploi-services' && (
            (() => {
              try {
                const p = data.caracteristiques ? (typeof data.caracteristiques === 'string' ? JSON.parse(data.caracteristiques) : data.caracteristiques) : {};
                return !!(p.type_contrat || p.entreprise);
              } catch (e) {
                return false;
              }
            })()
          ),
          isBoosted: data.is_boosted || data.boosted || false,
          delivery: data.delivery || null,
          similar: [],
          seller: {
            id: data.user_id,
            nom: data.vendeur_nom || 'Utilisateur',
            initials: data.vendeur_nom ? data.vendeur_nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "SU",
            avatar_url: data.vendeur_avatar,
            est_pro: data.vendeur_est_pro === 1,
            est_verifie: true,
            note: "4.8",
            nombre_avis: 126,
            membre_depuis: sellerYear,
            delai_reponse: "~1h"
          }
        };

        setListing(mapped);

        // Fetch seller's other ads
        const otherRes = await client.get(`/annonces?user_id=${data.user_id}`);
        setVendeurAnnonces(otherRes.data.filter(a => String(a.id) !== String(data.id)));

        // Fetch similar ads
        const similarRes = await client.get(`/annonces/${id}/similaires`);
        setAnnoncesSimilaires(similarRes.data);

        // Check if faved
        if (user) {
          const favRes = await client.get('/favoris');
          const isFaved = favRes.data.some(f => String(f.id) === String(data.id));
          setFaved(isFaved);

          // Check if seller is followed
          if (String(user.id) !== String(data.user_id)) {
            const suiviRes = await client.get(`/auth/suivi/${data.user_id}`);
            setEstSuivi(suiviRes.data.estSuivi);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChargement(false);
      }
    }
    loadData();
  }, [id, user]);

  const handleToggleSuivre = async () => {
    if (!user) {
      navigate('/connexion');
      return;
    }
    try {
      if (estSuivi) {
        await client.delete(`/auth/suivre/${listing.seller.id}`);
        setEstSuivi(false);
      } else {
        await client.post(`/auth/suivre/${listing.seller.id}`);
        setEstSuivi(true);
      }
    } catch (err) {
      console.error("Erreur lors de l'action de suivi:", err);
    }
  };

  const handleContacterClick = () => {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (user.role !== 'admin' && (!user.telephone || !user.adresse || !user.adresse.ville || !user.adresse.commune)) {
      setProfilIncompletOpen(true);
      setOnSuccessCallback(() => () => {
        setChatOpen(true);
        setSent(false);
        setMessageText('');
      });
      return;
    }
    setChatOpen(true);
    setSent(false);
    setMessageText('');
  };

  const handleCopyLink = () => {
    if (!listing) return;
    navigator.clipboard.writeText(`sugu.ci/a/${listing.id}`);
    setCopied(true);
  };

  const handleSendQuickMessage = async (msg) => {
    setMessageText(msg);
    try {
      await client.post('/messages/conversations/creer', {
        annonceId: listing.id,
        premierMessage: msg
      });
      setSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCustomMessage = async (e) => {
    e.preventDefault();
    if (messageText.trim() && listing) {
      try {
        await client.post('/messages/conversations/creer', {
          annonceId: listing.id,
          premierMessage: messageText.trim()
        });
        setSent(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleFav = async () => {
    if (!user) {
      navigate('/connexion');
      return;
    }
    try {
      const res = await client.post(`/favoris/${listing.id}`);
      setFaved(res.data.favori);
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrix = (n) => {
    if (listing?.isEmploi) {
      return (n || 0) === 0 ? "Salaire à discuter" : `${(n || 0).toLocaleString("fr-FR").replace(/\u202f|,/g, " ")} FCFA / mois`;
    }
    return (n || 0).toLocaleString("fr-FR").replace(/\u202f|,/g, " ") + " FCFA";
  };

  if (chargement || !listing) {
    return (
      <div className="sugu-detail-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--sugu-ink-soft)' }}>Chargement des détails de l'annonce...</div>
      </div>
    );
  }

  const quickMsgs = listing.isEmploi ? [
    "Bonjour, je suis très intéressé par cette offre d'emploi.",
    "Bonjour, ce poste est-il toujours à pourvoir ?",
    "Bonjour, puis-je vous envoyer mon CV ?"
  ] : [
    "Bonjour, est-ce toujours disponible ?",
    "Quel est votre dernier prix ?",
    `Peut-on se rencontrer à ${listing.commune} aujourd'hui ?`
  ];

  return (
    <div className="sugu-detail-page">
      <div className="container" style={{ paddingTop: '20px' }}>
        
        {/* Breadcrumb */}
        <div className="sugu-detail-page__breadcrumb">
          <Link to="/" className="sugu-link">Accueil</Link>
          <span>›</span>
          <span className="sugu-link">Marketplace</span>
          <span>›</span>
          <span style={{ color: 'var(--sugu-ink-soft)', fontWeight: 600 }}>{listing.titre}</span>
        </div>

        {/* Layout grid */}
        <div className="sugu-detail-page__grid">

          {/* ===== LEFT COLUMN ===== */}
          <div className="sugu-detail-page__content">
            
            {/* Gallery */}
            <div className="sugu-detail-page__gallery">
              <div className="sugu-detail-page__gallery-main" style={{ backgroundColor: listing.images[activeImg]?.tint || '#EADFCE', position: 'relative', overflow: 'hidden' }}>
                <div className="sugu-detail-page__gallery-bg-pattern" />
                {listing.images[activeImg]?.url ? (
                  <img
                    src={listing.images[activeImg].url}
                    alt={listing.titre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                  />
                ) : (
                  <span className="sugu-detail-page__gallery-label">{listing.images[activeImg]?.label}</span>
                )}

                <div className="sugu-detail-page__gallery-badges">
                  <span className="sugu-detail-page__gallery-badge">Annonce</span>
                  <span className="sugu-detail-page__gallery-badge sugu-detail-page__gallery-badge--count">📷 {listing.images.length} photos</span>
                </div>

                <button
                  type="button"
                  className="sugu-detail-page__gallery-fav-btn"
                  onClick={handleToggleFav}
                  style={{ color: faved ? 'var(--sugu-primary)' : 'var(--sugu-ink-faint)' }}
                >
                  {faved ? '♥' : '♡'}
                </button>

                <button type="button" className="sugu-detail-page__gallery-arrow sugu-detail-page__gallery-arrow--prev" onClick={handlePrevImg}>
                  ‹
                </button>
                <button type="button" className="sugu-detail-page__gallery-arrow sugu-detail-page__gallery-arrow--next" onClick={handleNextImg}>
                  ›
                </button>

                <div className="sugu-detail-page__gallery-counter">
                  {activeImg + 1} / {listing.images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="sugu-detail-page__gallery-thumbs">
                {listing.images.map((img, i) => (
                  <div
                    key={i}
                    className="sugu-detail-page__gallery-thumb"
                    style={{
                      backgroundColor: img.tint || '#EADFCE',
                      borderColor: i === activeImg ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                      borderWidth: i === activeImg ? '2.5px' : '1px',
                      borderStyle: 'solid',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => setActiveImg(i)}
                  >
                    {img.url && (
                      <img
                        src={img.url}
                        alt="Thumbnail"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Title & Price Card */}
            <div className="sugu-detail-page__card">
              <div className="sugu-detail-page__card-header">
                <div style={{ minWidth: 0, flex: 1 }}>
                  {listing.isBoosted && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(90deg, #FFF7E6 0%, #FFE8B3 100%)', color: '#D35400', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', boxShadow: '0 2px 8px rgba(211, 84, 0, 0.15)' }}>
                      ⚡ Annonce Boostée
                    </div>
                  )}
                  <h1 className="sugu-detail-page__title">{listing.titre}</h1>
                  <div className="sugu-detail-page__meta-info">
                    <span>📍 {listing.commune}, {listing.ville}</span>
                    <span>·</span>
                    <span>Publiée {listing.publie_depuis}</span>
                    <span>·</span>
                    <span>{listing.vues} vues</span>
                  </div>
                </div>
                {listing.isEmploi ? (
                  <span className="sugu-detail-page__badge-state" style={{ backgroundColor: '#F7ECE0', color: 'var(--sugu-primary)' }}>
                    💼 {listing.specs.find(s => s.label === "Type de contrat")?.value || "Offre d'emploi"}
                  </span>
                ) : (
                  <span className="sugu-detail-page__badge-state">Etat : {listing.specs[0]?.value}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className="sugu-detail-page__price">{formatPrix(listing.prix)}</div>
                {listing.prix_negociable && (
                  <span style={{ 
                    background: '#e6f4f2', 
                    color: '#106c62', 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🤝 Prix négociable
                  </span>
                )}
              </div>
            </div>

             {/* Description Card */}
            <div className="sugu-detail-page__card">
              <h2 className="sugu-detail-page__subtitle">Description</h2>
              <div className="sugu-detail-page__desc-text">
                {listing.description.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Key Specs Card */}
            <div className="sugu-detail-page__card">
              <h2 className="sugu-detail-page__subtitle">Caractéristiques</h2>
              <div className="sugu-detail-page__specs-grid">
                {listing.specs.map(sp => (
                  <div key={sp.label} className="sugu-detail-page__spec-item">
                    <span className="sugu-detail-page__spec-icon">{sp.icon}</span>
                    <div className="sugu-detail-page__spec-info">
                      <span className="sugu-detail-page__spec-name">{sp.label}</span>
                      <span className="sugu-detail-page__spec-val">{sp.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modes de remise Card */}
            {!listing.isEmploi && (
              <div className="sugu-detail-page__card" style={{ marginTop: '20px' }}>
                <h2 className="sugu-detail-page__subtitle" style={{ marginBottom: '20px' }}>Modes de remise</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {listing.delivery === 'both' ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '24px' }}>✨</div>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15.5px', fontWeight: 800, color: 'var(--sugu-ink)' }}>
                          Remise en main propre &amp; Livraison possible
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            background: '#E6F7FF', 
                            color: '#1890FF', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            📍 À {listing.commune}
                          </div>
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            background: '#FFF7E6', 
                            color: '#FA8C16', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            📦 Expédition possible
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5 }}>
                          Rencontrez le vendeur dans un lieu public pour vérifier l'article (remise en main propre à {listing.commune}), ou faites-vous livrer à domicile (frais de livraison à la charge de l'acheteur, modalités à définir directement en échangeant avec le vendeur).
                        </p>
                      </div>
                    </div>
                  ) : listing.delivery === 'main' ? (
                    /* Remise en main propre uniquement */
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '24px' }}>🤝</div>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15.5px', fontWeight: 800, color: 'var(--sugu-ink)' }}>
                          Remise en main propre uniquement
                        </h4>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: '#E6F7FF', 
                          color: '#1890FF', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '8px'
                        }}>
                          📍 À {listing.commune}
                        </div>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5 }}>
                          Rencontrez le vendeur dans un lieu public pour vérifier l'article. Si tout est ok, payez-le directement ou effectuez le transfert.
                        </p>
                      </div>
                    </div>
                  ) : listing.delivery === 'livraison' ? (
                    /* Livraison uniquement */
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '24px' }}>🚚</div>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15.5px', fontWeight: 800, color: 'var(--sugu-ink)' }}>
                          Livraison à domicile uniquement
                        </h4>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: '#FFF7E6', 
                          color: '#FA8C16', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '12px',
                          fontWeight: 700,
                          marginBottom: '8px'
                        }}>
                          📦 Expédition standard
                        </div>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5 }}>
                          <b>Frais de livraison à la charge de l'acheteur / client.</b> Définissez les modalités (tarifs, transporteur) directement en échangeant avec le vendeur.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Aucun mode de remise précisé */
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--sugu-ink-soft)' }}>
                      Modalités à définir directement avec le vendeur.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Safety Notice Card for Candidates */}
            {listing.isEmploi && (
              <div className="sugu-detail-page__card" style={{
                background: '#FFF1F0',
                border: '1px solid #FFA39E',
                borderRadius: '16px',
                padding: '24px',
                marginTop: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>🔔</span>
                  <h2 style={{
                    margin: 0,
                    fontFamily: 'var(--sugu-font-heading)',
                    fontWeight: 800,
                    fontSize: '22px',
                    color: '#CF1322',
                    border: 'none',
                    padding: 0
                  }}>
                    Avis important aux candidats
                  </h2>
                </div>
                
                <p style={{ fontWeight: 600, fontSize: '15px', color: '#1f1f1f', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  Votre sécurité est notre priorité. Aucun paiement ne doit vous être demandé dans le cadre d'un processus de recrutement sur la plateforme <b>Sugu</b>.
                </p>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: '#434343' }}>
                    <span>❌</span> <b>Ne versez jamais d'argent</b> à un recruteur.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: '#434343' }}>
                    <span>⚠️</span> Méfiez-vous des <b>frais de dossier</b> ou de formation.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: '#434343' }}>
                    <span>📢</span> <b>Signalez</b> toute activité suspecte.
                  </li>
                </ul>
                
                <p style={{ fontSize: '13.5px', color: '#595959', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                  Sugu décline toute responsabilité en cas de fraude et se réserve le droit d'engager des poursuites.
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: '#1f1f1f', fontWeight: 600 }}>
                  <span>📥</span> Signaler un abus à : <a href="mailto:plainte@trouvetout.ci" style={{ color: '#CF1322', textDecoration: 'underline' }}>plainte@trouvetout.ci</a>
                </div>
              </div>
            )}

            {/* Location Map Card */}
            <div className="sugu-detail-page__card">
              <h2 className="sugu-detail-page__subtitle">Localisation</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'var(--sugu-ink-soft)' }}>
                <span style={{ color: 'var(--sugu-secondary)' }}>📍</span>
                <b>{listing.commune}</b>, {listing.ville} — {listing.quartier}
              </div>
              <div className="sugu-detail-page__map-container" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', height: '300px', display: 'block', marginTop: '16px' }}>
                {listing.mapsKey ? (
                  <iframe
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${listing.mapsKey}&q=${encodeURIComponent(
                      listing.addressMode === "precise" && listing.address
                        ? listing.address
                        : `${listing.commune}, ${listing.ville}, Côte d'Ivoire`
                    )}`}
                  />
                ) : (
                  <>
                    <div className="sugu-detail-page__map-grid" />
                    <div className="sugu-detail-page__map-pin-wrap">
                      <div className="sugu-detail-page__map-pin" />
                      <span style={{ fontFamily: 'var(--sugu-font-mono)', fontSize: '11px', color: '#6E7A70', marginTop: '8px' }}>
                        [ zone approximative ]
                      </span>
                    </div>
                  </>
                )}

                {/* Badge visible for approximate zone */}
                {listing.addressMode === "approx" && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--sugu-ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>📍</span> Zone approximative : {listing.commune}
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* ===== RIGHT SIDEBAR ===== */}
          <aside className="sugu-detail-page__sidebar">
            
            {/* Seller profile card */}
            <div className="sugu-detail-page__seller-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: 'var(--sugu-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vendu par</h3>
              <div className="sugu-detail-page__seller-profile">
                <div className="sugu-detail-page__seller-avatar-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
                  {listing.seller.avatar_url ? (
                    <img src={listing.seller.avatar_url} alt={listing.seller.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    listing.seller.initials
                  )}
                  {listing.seller.est_verifie && <span className="sugu-detail-page__seller-avatar-check">✓</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <span className="sugu-detail-page__seller-name">
                    {listing.seller.nom}
                  </span>
                  <br />
                  {listing.seller.est_pro && <span className="sugu-detail-page__seller-badge-pro">★ PRO VÉRIFIÉ</span>}
                </div>
                {!isOwner && (
                  <button
                    type="button"
                    onClick={handleToggleSuivre}
                    style={{
                      marginLeft: 'auto',
                      padding: '8px 18px',
                      borderRadius: '24px',
                      border: estSuivi ? '1px solid var(--sugu-border)' : '1px solid var(--sugu-primary)',
                      background: estSuivi ? 'var(--sugu-bg-soft)' : 'transparent',
                      color: estSuivi ? 'var(--sugu-ink-soft)' : 'var(--sugu-primary)',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: estSuivi ? 'none' : '0 2px 8px rgba(220,95,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!estSuivi) {
                        e.target.style.background = 'var(--sugu-primary)';
                        e.target.style.color = '#FFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!estSuivi) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = 'var(--sugu-primary)';
                      }
                    }}
                  >
                    {estSuivi ? 'Suivi ✓' : 'Suivre'}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="sugu-detail-page__seller-stats">
                <div className="sugu-detail-page__seller-stat">
                  <div className="sugu-detail-page__seller-stat-val">
                    {listing.seller.note} <span style={{ color: 'var(--sugu-accent)' }}>★</span>
                  </div>
                  <span className="sugu-detail-page__seller-stat-label">{listing.seller.nombre_avis} avis</span>
                </div>
                <div style={{ width: '1px', background: 'var(--sugu-border)' }} />
                <div className="sugu-detail-page__seller-stat">
                  <div className="sugu-detail-page__seller-stat-val">{listing.seller.membre_depuis}</div>
                  <span className="sugu-detail-page__seller-stat-label">membre depuis</span>
                </div>
                <div style={{ width: '1px', background: 'var(--sugu-border)' }} />
                <div className="sugu-detail-page__seller-stat">
                  <div className="sugu-detail-page__seller-stat-val" style={{ color: 'var(--sugu-secondary)' }}>
                    {listing.seller.delai_reponse}
                  </div>
                  <span className="sugu-detail-page__seller-stat-label">répond en</span>
                </div>
              </div>

              {/* Actions */}
              <div className="sugu-detail-page__sidebar-actions">
                {isOwner ? (
                  <Button fullWidth onClick={() => navigate('/tableau-de-bord?tab=listings')} style={{ backgroundColor: 'var(--sugu-secondary)' }}>
                    ⚙️ Gérer mon annonce
                  </Button>
                ) : (
                  <Button fullWidth onClick={handleContacterClick} style={{ backgroundColor: listing.isEmploi ? 'var(--sugu-primary)' : undefined }}>
                    {listing.isEmploi ? "💼 Postuler à l'offre" : "💬 Contacter le vendeur"}
                  </Button>
                )}
                <div className="sugu-detail-page__sidebar-action-row">
                  <button type="button" className="sugu-detail-page__action-btn-outline" onClick={handleToggleFav} style={{
                    borderColor: faved ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                    color: faved ? 'var(--sugu-primary)' : 'var(--sugu-ink-soft)'
                  }}>
                    {faved ? '♥ Enregistré' : '♡ Favoris'}
                  </button>
                  <button type="button" className="sugu-detail-page__action-btn-outline" onClick={() => { setShareOpen(true); setCopied(false); }}>
                    ↗ Partager
                  </button>
                </div>
              </div>

              {/* Safety banner */}
              <div className="sugu-detail-page__safety-tip">
                <span style={{ fontSize: '15px' }}>🛡️</span>
                <span>
                  {listing.isEmploi
                    ? "Ne payez jamais de frais pour obtenir un emploi ou passer un entretien. Restez vigilant."
                    : "Ne payez jamais d'avance. Vérifiez le produit avant tout achat."}
                </span>
              </div>

            </div>

            {/* Reference & Report */}
            <div className="sugu-detail-page__report-card">
              <span>Réf. 4821{listing.id}</span>
              <span className="sugu-detail-page__report-link">⚑ Signaler l'annonce</span>
            </div>

          </aside>

        </div>

        {/* Vendeur other ads */}
        {vendeurAnnonces.length > 0 && (
          <div style={{ marginTop: '40px', borderTop: '1px solid var(--sugu-border)', paddingTop: '40px' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 800, 
              color: 'var(--sugu-ink)', 
              marginBottom: '20px',
              fontFamily: 'var(--sugu-font-heading)'
            }}>
              Les annonces de {listing.seller.nom}
            </h3>
            
            <div className="sugu-card-carousel-wrapper">
              {vendeurAnnonces.length > 4 && (
                <>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--left" 
                    onClick={() => scrollContainer('scroll-vendeur-annonces', 'left')}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--right" 
                    onClick={() => scrollContainer('scroll-vendeur-annonces', 'right')}
                  >
                    ›
                  </button>
                </>
              )}
              
              <div 
                id="scroll-vendeur-annonces" 
                className="sugu-card-scroll-container"
              >
                {vendeurAnnonces.map((item) => (
                  <ListingCard
                    key={item.id}
                    annonce={{
                      ...item,
                      id: String(item.id),
                      image: item.cover_url || null,
                      image_label: item.cover_url ? null : '[ photo ]',
                      vendeur_nom: item.vendeur_nom || listing.seller.nom,
                      est_pro: item.vendeur_est_pro || listing.seller.est_pro
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ces annonces peuvent vous intéresser */}
        {annoncesSimilaires.length > 0 && (
          <div style={{ marginTop: '40px', borderTop: '1px solid var(--sugu-border)', paddingTop: '40px', marginBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 800, 
                color: 'var(--sugu-ink)', 
                margin: 0,
                fontFamily: 'var(--sugu-font-heading)'
              }}>
                Ces annonces peuvent vous intéresser
              </h3>
              <Link to="/recherche" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--sugu-primary)', textDecoration: 'none' }}>
                Voir plus d'annonces →
              </Link>
            </div>
            
            <div className="sugu-card-carousel-wrapper">
              {annoncesSimilaires.length > 4 && (
                <>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--left" 
                    onClick={() => scrollContainer('scroll-similar-annonces', 'left')}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="sugu-card-scroll-btn sugu-card-scroll-btn--right" 
                    onClick={() => scrollContainer('scroll-similar-annonces', 'right')}
                  >
                    ›
                  </button>
                </>
              )}
              
              <div 
                id="scroll-similar-annonces" 
                className="sugu-card-scroll-container"
              >
                {annoncesSimilaires.map((item) => (
                  <ListingCard
                    key={item.id}
                    annonce={{
                      ...item,
                      id: String(item.id),
                      image: item.cover_url || null,
                      image_label: item.cover_url ? null : '[ photo ]'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= MOBILE BOTTOM FLOAT ACTION BAR ================= */}
      <div className="sugu-detail-page__mobile-bar">
        <div style={{ minWidth: 0, flexShrink: 0 }}>
          <div className="sugu-detail-page__mobile-price-lbl">{listing.isEmploi ? "Salaire" : "Prix"}</div>
          <div className="sugu-detail-page__mobile-price-val">{formatPrix(listing.prix)}</div>
        </div>
        <button
          type="button"
          className="sugu-detail-page__mobile-fav-btn"
          onClick={handleToggleFav}
          style={{ color: faved ? 'var(--sugu-primary)' : 'var(--sugu-ink-soft)' }}
        >
          {faved ? '♥' : '♡'}
        </button>
        <button type="button" className="sugu-detail-page__mobile-share-btn" onClick={() => { setShareOpen(true); setCopied(false); }}>
          ↗
        </button>
        {isOwner ? (
          <Button className="sugu-detail-page__mobile-contact-btn" onClick={() => navigate('/tableau-de-bord?tab=listings')} style={{ backgroundColor: 'var(--sugu-secondary)' }}>
            ⚙️ Gérer
          </Button>
        ) : (
          <Button
            className="sugu-detail-page__mobile-contact-btn"
            onClick={handleContacterClick}
            style={{ backgroundColor: listing.isEmploi ? 'var(--sugu-primary)' : undefined }}
          >
            {listing.isEmploi ? "💼 Postuler" : "💬 Contacter"}
          </Button>
        )}
      </div>

      {/* ================= CONTACT SELLER MODAL ================= */}
      {chatOpen && (
        <div className="sugu-modal-backdrop" onClick={() => setChatOpen(false)}>
          <div className="sugu-modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="sugu-modal-header">
              <div className="sugu-modal-avatar" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {listing.seller.avatar_url ? (
                  <img src={listing.seller.avatar_url} alt={listing.seller.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  listing.seller.initials
                )}
                <span style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  width: '17px',
                  height: '17px',
                  borderRadius: '50%',
                  background: 'var(--sugu-secondary)',
                  border: '2px solid var(--sugu-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  zIndex: 2
                }}>✓</span>
              </div>
              <div className="sugu-modal-identity">
                <div className="sugu-modal-name">{listing.seller.nom}</div>
                <div className="sugu-modal-status">● En ligne · répond en {listing.seller.delai_reponse}</div>
              </div>
              <button type="button" className="sugu-modal-close" onClick={() => setChatOpen(false)}>
                ✕
              </button>
            </div>

            <div className="sugu-modal-body">
              {sent ? (
                <div className="sugu-modal-success">
                  <div className="sugu-modal-success-icon">✓</div>
                  <div className="sugu-modal-success-title">{listing.isEmploi ? "Candidature envoyée !" : "Message envoyé !"}</div>
                  <p className="sugu-modal-success-desc">
                    {listing.isEmploi
                      ? "Votre candidature a été transmise avec succès à l'employeur. Retrouvez le suivi dans votre messagerie."
                      : `${listing.seller.nom} vous répondra très vite. Retrouvez la conversation dans votre messagerie.`}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendCustomMessage}>
                  <div className="sugu-modal-label">{listing.isEmploi ? "Candidature rapide" : "Messages rapides"}</div>
                  <div className="sugu-modal-quick-messages">
                    {quickMsgs.map(msg => (
                      <button key={msg} type="button" className="sugu-modal-quick-btn" onClick={() => handleSendQuickMessage(msg)}>
                        {msg}
                      </button>
                    ))}
                  </div>
                  
                  <textarea
                    placeholder={listing.isEmploi ? "Présentez brièvement votre profil, vos expériences et motivations pour ce poste…" : "Écrivez votre message…"}
                    className="sugu-modal-textarea"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  
                  <Button
                    fullWidth
                    type="submit"
                    size="lg"
                    variant="secondary"
                    style={{ marginTop: '12px', backgroundColor: listing.isEmploi ? 'var(--sugu-primary)' : undefined }}
                  >
                    {listing.isEmploi ? "Soumettre ma candidature" : "Envoyer le message"}
                  </Button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= SHARE MODAL ================= */}
      {shareOpen && (
        <div className="sugu-modal-backdrop" onClick={() => setShareOpen(false)}>
          <div className="sugu-modal-content" style={{ maxWidth: '380px', padding: '22px' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <span style={{ fontFamily: 'var(--sugu-font-heading)', fontWeight: 700, fontSize: '19px', color: 'var(--sugu-ink)' }}>
                Partager l'annonce
              </span>
              <button type="button" className="sugu-modal-close" style={{ width: '32px', height: '32px', fontSize: '16px' }} onClick={() => setShareOpen(false)}>
                ✕
              </button>
            </div>

            <div className="sugu-share-options">
              <button type="button" className="sugu-share-opt" onClick={() => {}}>
                <span className="sugu-share-icon" style={{ background: '#EAF7F4', color: '#106C62' }}>🟢</span>
                <span className="sugu-share-label">WhatsApp</span>
              </button>
              <button type="button" className="sugu-share-opt" onClick={() => {}}>
                <span className="sugu-share-icon" style={{ background: '#EAF3F1', color: '#106C62' }}>f</span>
                <span className="sugu-share-label">Facebook</span>
              </button>
              <button type="button" className="sugu-share-opt" onClick={() => {}}>
                <span className="sugu-share-icon" style={{ background: '#EAF3F1', color: '#106C62' }}>✈️</span>
                <span className="sugu-share-label">Telegram</span>
              </button>
              <button type="button" className="sugu-share-opt" onClick={() => {}}>
                <span className="sugu-share-icon" style={{ background: '#FAF0D9', color: '#B0791C' }}>✉️</span>
                <span className="sugu-share-label">E-mail</span>
              </button>
            </div>

            <div className="sugu-share-link-copy">
              <span className="sugu-share-url-text">sugu.ci/a/{listing.id}</span>
              <button type="button" className="sugu-share-copy-btn" onClick={handleCopyLink}>
                {copied ? 'Copié ✓' : 'Copier'}
              </button>
            </div>

          </div>
        </div>
      )}

      <PopupCompleterProfil
        isOpen={profilIncompletOpen}
        onClose={() => setProfilIncompletOpen(false)}
        onSuccess={() => {
          setProfilIncompletOpen(false);
          if (onSuccessCallback) onSuccessCallback();
        }}
      />

    </div>
  );
}
