import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import logoImg from '../assets/TrouveTout_Logo.png';
import waveIcon from '../assets/wave.png';
import orangeIcon from '../assets/Orange.png';
import './AchatLien.css';

const COMMUNES = ["Cocody", "Yopougon", "Plateau", "Marcory", "Treichville", "Adjamé", "Abobo", "Bingerville", "Port-Bouët", "Koumassi"];

export default function AchatLien() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lien, setLien] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Checkout Form States
  const [modeReception, setModeReception] = useState(""); // 'livraison' | 'retrait'
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [commune, setCommune] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [retraitDate, setRetraitDate] = useState("");
  const [retraitJour, setRetraitJour] = useState("");
  const [retraitHeure, setRetraitHeure] = useState("");
  const [retraitAdresse, setRetraitAdresse] = useState("");
  const [moyenPaiement, setMoyenPaiement] = useState(""); // 'wave' | 'orange_money' | 'carte' | 'portefeuille'
  const [soldePortefeuille, setSoldePortefeuille] = useState(0);

  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const setInputRef = (el) => {
    inputRef.current = el;
    if (el) {
      initAutocomplete();
    }
  };

  const initAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'ci' }
    });
    
    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      let streetAddress = place.formatted_address || place.name || "";
      setRetraitAdresse(streetAddress);
    });
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          let key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (!key) {
            const res = await client.get('/config/google-maps-key').catch(() => null);
            if (res?.data?.key) {
              key = res.data.key;
            }
          }
          if (!key) {
            alert("Clé Google Maps introuvable pour la géolocalisation.");
            return;
          }

          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`);
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const place = data.results[0];
            setRetraitAdresse(place.formatted_address || place.name || "");
          } else {
            alert("Aucune adresse trouvée pour ces coordonnées.");
          }
        } catch (err) {
          console.error(err);
          alert("Erreur lors de la géolocalisation.");
        }
      },
      (err) => {
        console.error(err);
        alert("Accès à la géolocalisation refusé ou indisponible.");
      }
    );
  };

  // Payment states
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchLien() {
      try {
        setLoading(true);
        const res = await client.get(`/liens-achat/${id}`);
        setLien(res.data);
        const sellerLoc = res.data.vendeur_adresse_precise || res.data.ad_location_text || res.data.ad_commune || 'Lieu du vendeur';
        setRetraitAdresse(sellerLoc);

        // Pre-fill user data if authenticated
        if (user) {
          const parts = (user.nom || "").split(" ");
          setNom(parts[0] || "");
          setPrenom(parts.slice(1).join(" ") || "");
          setTelephone(user.telephone?.replace(/^\+225/, "") || "");
          setCommune(user.adresse?.commune || "");
          setAdresse(user.adresse?.adresse_detail || "");

          try {
            const walletRes = await client.get('/vendeur/portefeuille');
            setSoldePortefeuille(walletRes.data.solde_disponible || 0);
          } catch (wErr) {
            console.error("Failed to load wallet details:", wErr);
          }
        }
        // Auto-select mode if only one is available
        const deliv = res.data.ad_delivery;
        if (deliv === "main") {
          setModeReception("retrait");
        } else if (deliv === "livraison") {
          setModeReception("livraison");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Erreur de chargement du lien de paiement.");
      } finally {
        setLoading(false);
      }
    }
    fetchLien();
  }, [id, user]);

  useEffect(() => {
    const loadGoogleMapsScript = async () => {
      if (window.google?.maps?.places) {
        return;
      }
      try {
        let key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!key) {
          const res = await client.get('/config/google-maps-key').catch(() => null);
          if (res?.data?.key) {
            key = res.data.key;
          }
        }
        if (!key) {
          console.warn("Google Maps API Key introuvable.");
          return;
        }
        const scriptId = 'google-maps-places-script';
        let script = document.getElementById(scriptId);
        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if (inputRef.current) {
              initAutocomplete();
            }
          };
          document.head.appendChild(script);
        } else {
          script.addEventListener('load', () => {
            if (inputRef.current) {
              initAutocomplete();
            }
          });
        }
      } catch (err) {
        console.error("Erreur lors du chargement de Google Maps Script", err);
      }
    };

    loadGoogleMapsScript();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modeReception) {
      alert("Veuillez sélectionner un mode de réception.");
      return;
    }

    if (modeReception === 'livraison') {
      if (!nom || !prenom || !commune || !adresse || !telephone) {
        alert("Veuillez remplir toutes les informations de livraison.");
        return;
      }
      if (!moyenPaiement) {
        alert("Veuillez sélectionner un moyen de paiement.");
        return;
      }
      if (moyenPaiement === 'portefeuille') {
        if (Number(soldePortefeuille) < Number(lien.prix_convenu)) {
          alert("Solde insuffisant dans votre portefeuille. Veuillez recharger votre portefeuille ou choisir un autre moyen de paiement.");
          return;
        }
      }
      if ((moyenPaiement === 'wave' || moyenPaiement === 'orange_money') && !mobileMoneyNumber) {
        alert("Veuillez saisir votre numéro Mobile Money de paiement.");
        return;
      }
      if (moyenPaiement === 'carte') {
        setCardModalOpen(true);
        return;
      }
    } else {
      if (!retraitJour || !retraitHeure) {
        alert("Veuillez renseigner le jour et l'heure du rendez-vous.");
        return;
      }
      if (!retraitAdresse) {
        alert("Veuillez renseigner l'adresse ou lieu de rendez-vous.");
        return;
      }
      if (!moyenPaiement) {
        alert("Veuillez choisir un moyen de paiement (Espèces sur place ou Portefeuille).");
        return;
      }
      if (moyenPaiement === 'portefeuille') {
        if (Number(soldePortefeuille) < Number(lien.prix_convenu)) {
          alert(`Solde insuffisant sur votre portefeuille (${Number(soldePortefeuille).toLocaleString('fr-FR')} FCFA). Veuillez recharger votre portefeuille ou choisir le paiement en espèces.`);
          return;
        }
      }
    }

    setPaying(true);
    try {
      let compiledRetraitDate = "";
      if (modeReception === 'retrait') {
        const dateFormatted = new Date(retraitJour).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        compiledRetraitDate = `Le ${dateFormatted} à ${retraitHeure} (Lieu: ${retraitAdresse})`;
        setRetraitDate(compiledRetraitDate);
      }

      await client.post(`/liens-achat/${id}/payer`, {
        modeReception,
        livraisonNom: nom,
        livraisonPrenom: prenom,
        livraisonCommune: commune,
        livraisonAdresse: adresse,
        livraisonTelephone: telephone ? `+225${telephone.replace(/\s/g, "")}` : "",
        retraitDate: modeReception === 'retrait' ? compiledRetraitDate : retraitDate,
        retraitRendezvousDatetime: modeReception === 'retrait' ? `${retraitJour} ${retraitHeure}:00` : null,
        retraitJour,
        retraitHeure,
        retraitAdresse,
        moyenPaiement
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la validation du paiement.");
    } finally {
      setPaying(false);
    }
  };

  const handleCardSubmit = async () => {
    setPaying(true);
    setCardModalOpen(false);
    try {
      await client.post(`/liens-achat/${id}/payer`, {
        modeReception,
        livraisonNom: nom,
        livraisonPrenom: prenom,
        livraisonCommune: commune,
        livraisonAdresse: adresse,
        livraisonTelephone: telephone ? `+225${telephone.replace(/\s/g, "")}` : "",
        retraitDate,
        moyenPaiement
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la validation du paiement par carte.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="sugu-checkout-page__loading">
        <div className="sugu-checkout-page__spinner" />
        <p>Chargement des détails de la commande...</p>
      </div>
    );
  }

  if (error || !lien) {
    return (
      <div className="sugu-checkout-page__error-container">
        <div className="sugu-checkout-page__error-card">
          <div className="sugu-checkout-page__error-icon">⚠️</div>
          <h2>Une erreur est survenue</h2>
          <p>{error || "Ce lien d'achat est invalide ou expiré."}</p>
          <button type="button" className="sugu-btn" onClick={() => navigate("/")}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="sugu-checkout-page__success-container">
        <div className="sugu-checkout-page__success-card">
          <div className="sugu-checkout-page__success-icon">✓</div>
          <h2>Commande validée ! 🎉</h2>
          <p>
            Votre achat pour <b>« {lien.ad_title} »</b> a été validé.
            {modeReception === 'livraison'
              ? " Le vendeur a été notifié par e-mail et va procéder à l'envoi de votre colis."
              : ` La remise en main propre est planifiée pour le : ${retraitDate}.`}
          </p>
          <button type="button" className="sugu-checkout-page__success-btn" onClick={() => navigate("/tableau-de-bord?tab=messages")}>
            Voir mes messages
          </button>
        </div>
      </div>
    );
  }

  const isPaid = lien.statut === 'paye';
  const isCancelled = lien.statut === 'annule';

  if (isPaid || isCancelled) {
    return (
      <div className="sugu-checkout-page__error-container">
        <div className="sugu-checkout-page__error-card">
          <div className="sugu-checkout-page__error-icon">ℹ️</div>
          <h2>Lien indisponible</h2>
          <p>
            {isPaid
              ? "Cet article a déjà été vendu et payé."
              : "Ce lien d'achat a été annulé par le vendeur."}
          </p>
          <button type="button" className="sugu-btn" onClick={() => navigate("/")}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const hasLivraison = lien.ad_delivery === 'livraison' || lien.ad_delivery === 'both';
  const hasRetrait = lien.ad_delivery === 'main' || lien.ad_delivery === 'both';

  return (
    <div className="sugu-checkout-page">
      <header className="sugu-checkout-page__header">
        <Link to="/" className="sugu-checkout-page__header-logo">
          <img src={logoImg} alt="TrouveTout" style={{ height: '36px' }} />
        </Link>
        <div className="sugu-checkout-page__header-divider" />
        <span className="sugu-checkout-page__header-title">Finaliser votre commande</span>
      </header>

      <main className="sugu-checkout-page__main">
        <div className="sugu-checkout-page__grid">

          {/* Form Side */}
          <form className="sugu-checkout-page__form-section" onSubmit={handleSubmit}>

            {/* Étape 1 : Mode de remise (Horizontal) */}
            <div className="sugu-checkout-page__card">
              <h3 className="sugu-checkout-page__card-title">📦 Mode de remise</h3>
              <div className="sugu-checkout-page__delivery-options">
                {hasRetrait && (
                  <div
                    className={`sugu-checkout-page__delivery-tile ${modeReception === 'retrait' ? 'selected' : ''}`}
                    onClick={() => {
                      setModeReception('retrait');
                      if (moyenPaiement !== 'especes' && moyenPaiement !== 'portefeuille') {
                        setMoyenPaiement('portefeuille');
                      }
                    }}
                  >
                    <span className="sugu-checkout-page__tile-icon">🤝</span>
                    <div>
                      <div className="sugu-checkout-page__tile-name">Remise en main propre</div>
                      <div className="sugu-checkout-page__tile-desc">Direct avec le vendeur (gratuit)</div>
                    </div>
                  </div>
                )}
                {hasLivraison && (
                  <div
                    className={`sugu-checkout-page__delivery-tile ${modeReception === 'livraison' ? 'selected' : ''}`}
                    onClick={() => {
                      setModeReception('livraison');
                      if (moyenPaiement === 'especes') {
                        setMoyenPaiement('wave');
                      }
                    }}
                  >
                    <span className="sugu-checkout-page__tile-icon">🚚</span>
                    <div>
                      <div className="sugu-checkout-page__tile-name">Livraison possible</div>
                      <div className="sugu-checkout-page__tile-desc">Expédition rapide à domicile</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Étape 2 & 3 : Formulaire Unique et Compact */}
            {modeReception && (
              <div className="sugu-checkout-page__card animate-fade-in" style={{ paddingBottom: '24px' }}>

                {/* Partie A : Adresse ou Date de RDV */}
                {modeReception === 'livraison' ? (
                  <div className="sugu-checkout-page__section">
                    <h3 className="sugu-checkout-page__card-title">📍 Adresse de livraison</h3>

                    <div className="sugu-checkout-page__form-grid">
                      <div className="sugu-checkout-page__field">
                        <label>Prénom *</label>
                        <input
                          type="text"
                          placeholder="Ex: Loydb"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          required
                        />
                      </div>
                      <div className="sugu-checkout-page__field">
                        <label>Nom *</label>
                        <input
                          type="text"
                          placeholder="Ex: Hdjdbd"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="sugu-checkout-page__form-grid">
                      <div className="sugu-checkout-page__field">
                        <label>Commune *</label>
                        <select
                          value={commune}
                          onChange={(e) => setCommune(e.target.value)}
                          required
                        >
                          <option value="">Sélectionnez…</option>
                          {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="sugu-checkout-page__field">
                        <label>Téléphone *</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="sugu-checkout-page__phone-prefix">+225</span>
                          <input
                            type="tel"
                            placeholder="05050505"
                            value={telephone}
                            onChange={(e) => setTelephone(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="sugu-checkout-page__field">
                      <label>Adresse précise (Rue, Quartier) *</label>
                      <input
                        type="text"
                        placeholder="Ex: Boulevard de Marseille, Zone 4"
                        value={adresse}
                        onChange={(e) => setAdresse(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="sugu-checkout-page__section">
                    <h3 className="sugu-checkout-page__card-title">📅 Rendez-vous</h3>
                    <p className="sugu-checkout-page__card-subtitle">Fixez un rendez-vous pour récupérer l'article</p>

                    <div className="sugu-checkout-page__form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="sugu-checkout-page__field">
                        <label>Date souhaitée *</label>
                        <input
                          type="date"
                          value={retraitJour}
                          onChange={(e) => setRetraitJour(e.target.value)}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="sugu-input"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--sugu-border)' }}
                        />
                      </div>
                      <div className="sugu-checkout-page__field">
                        <label>Heure souhaitée *</label>
                        <input
                          type="time"
                          value={retraitHeure}
                          onChange={(e) => setRetraitHeure(e.target.value)}
                          required
                          className="sugu-input"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--sugu-border)' }}
                        />
                      </div>
                    </div>

                    <div className="sugu-checkout-page__field" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--sugu-ink)' }}>
                        📍 Lieu de rendez-vous (Adresse du vendeur)
                      </label>
                      <div style={{
                        background: '#F7ECE0',
                        border: '1px solid var(--sugu-primary)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        fontSize: '13.5px',
                        fontWeight: 'bold',
                        color: 'var(--sugu-ink)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>🏬</span>
                        <span>{lien?.vendeur_adresse_precise || retraitAdresse || 'Lieu défini par le vendeur'}</span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: 'var(--sugu-ink-soft)', marginTop: '4px', display: 'block' }}>
                        Adresse enregistrée par le vendeur pour la remise en main propre.
                      </span>
                    </div>
                  </div>
                )}

                {/* Séparateur élégant */}
                <div className="sugu-checkout-page__section-divider" />

                {/* Partie B : Mode de paiement */}
                {modeReception === 'livraison' ? (
                  <div className="sugu-checkout-page__section">
                    <h3 className="sugu-checkout-page__card-title">💳 Mode de paiement</h3>
                    <div className="sugu-checkout-page__payment-methods">
                      {[
                        { id: 'wave', name: 'Wave', image: waveIcon },
                        { id: 'orange_money', name: 'Orange Money', image: orangeIcon },
                        { id: 'portefeuille', name: 'Portefeuille Sugu', subtitle: `${soldePortefeuille.toLocaleString('fr-FR')} FCFA`, emoji: '👛' },
                        { id: 'carte', name: 'Carte bancaire', emoji: '💳' }
                      ].map(m => (
                        <label
                          key={m.id}
                          className={`sugu-checkout-page__payment-label ${moyenPaiement === m.id ? 'selected' : ''}`}
                          style={{ minHeight: '62px' }}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            value={m.id}
                            checked={moyenPaiement === m.id}
                            onChange={() => setMoyenPaiement(m.id)}
                            style={{ display: 'none' }}
                          />
                          <div className="sugu-checkout-page__payment-icon">
                            {m.image ? (
                              <img src={m.image} alt={m.name} style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: '20px' }}>{m.emoji}</span>
                            )}
                          </div>
                          <span className="sugu-checkout-page__payment-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 'bold' }}>{m.name}</span>
                            {m.subtitle && (
                              <span style={{ fontSize: '11px', color: '#389E0D', fontWeight: 600, marginTop: '2px' }}>
                                {m.subtitle}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                    {(moyenPaiement === 'wave' || moyenPaiement === 'orange_money') && (
                      <div className="sugu-checkout-page__field animate-fade-in" style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--sugu-ink-soft)' }}>
                          Numéro {moyenPaiement === 'wave' ? 'Wave' : 'Orange Money'} de facturation *
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                          <span className="sugu-checkout-page__phone-prefix">+225</span>
                          <input
                            type="tel"
                            placeholder="07 00 00 00 00"
                            value={mobileMoneyNumber}
                            onChange={(e) => setMobileMoneyNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                            required
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="sugu-checkout-page__section">
                    <h3 className="sugu-checkout-page__card-title">🤝 Mode de paiement à la remise</h3>
                    <p style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                      Choisissez comment régler cet achat pour votre rendez-vous :
                    </p>

                    <div className="sugu-checkout-page__payment-methods" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Option 1: Espèces */}
                      <label
                        className={`sugu-checkout-page__payment-label ${moyenPaiement === 'especes' ? 'selected' : ''}`}
                        style={{ minHeight: '76px', padding: '12px 14px', cursor: 'pointer' }}
                        onClick={() => setMoyenPaiement('especes')}
                      >
                        <input
                          type="radio"
                          name="payment_method_retrait"
                          value="especes"
                          checked={moyenPaiement === 'especes'}
                          onChange={() => setMoyenPaiement('especes')}
                          style={{ display: 'none' }}
                        />
                        <div className="sugu-checkout-page__payment-icon">
                          <span style={{ fontSize: '22px' }}>💵</span>
                        </div>
                        <span className="sugu-checkout-page__payment-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '13.5px' }}>Espèces sur place</span>
                          <span style={{ fontSize: '11px', color: 'var(--sugu-ink-soft)', marginTop: '2px' }}>
                            Paiement en liquide lors du retrait
                          </span>
                        </span>
                      </label>

                      {/* Option 2: Portefeuille */}
                      <label
                        className={`sugu-checkout-page__payment-label ${moyenPaiement === 'portefeuille' ? 'selected' : ''}`}
                        style={{ minHeight: '76px', padding: '12px 14px', cursor: 'pointer' }}
                        onClick={() => setMoyenPaiement('portefeuille')}
                      >
                        <input
                          type="radio"
                          name="payment_method_retrait"
                          value="portefeuille"
                          checked={moyenPaiement === 'portefeuille'}
                          onChange={() => setMoyenPaiement('portefeuille')}
                          style={{ display: 'none' }}
                        />
                        <div className="sugu-checkout-page__payment-icon">
                          <span style={{ fontSize: '22px' }}>👛</span>
                        </div>
                        <span className="sugu-checkout-page__payment-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '13.5px' }}>Portefeuille Sugu</span>
                          <span style={{ fontSize: '11px', color: '#389E0D', fontWeight: 600, marginTop: '2px' }}>
                            Solde: {soldePortefeuille.toLocaleString('fr-FR')} FCFA
                          </span>
                        </span>
                      </label>
                    </div>

                    {moyenPaiement === 'portefeuille' ? (
                      <div style={{ marginTop: '14px', padding: '12px 14px', background: '#E6F4F2', border: '1px solid #106C62', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px' }}>🛡️</span>
                        <p style={{ fontSize: '12.5px', color: '#106C62', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                          <strong>Séquestre Sécurisé Sugu :</strong> Les {lien?.prix_convenu?.toLocaleString('fr-FR')} FCFA seront prélevés de votre portefeuille et bloqués en séquestre. Le vendeur ne recevra les fonds que lorsque vous aurez validé l'article en main propre !
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginTop: '14px', padding: '12px 14px', background: '#FAF6F0', border: '1px solid var(--sugu-border)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px' }}>🤝</span>
                        <p style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                          <strong>Paiement liquide sur place :</strong> Aucun prélèvement sur la plateforme. Vous réglerez la somme de {lien?.prix_convenu?.toLocaleString('fr-FR')} FCFA directement au vendeur en espèces lors du rendez-vous.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Partie C : Bouton de confirmation intégré à la carte */}
                <div className="sugu-checkout-page__submit-container">
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    disabled={paying}
                    style={{
                      backgroundColor: 'var(--sugu-primary)',
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      padding: '14px',
                      borderRadius: '10px'
                    }}
                  >
                    {paying ? "Traitement..." : modeReception === 'livraison' ? "Confirmer et payer" : moyenPaiement === 'portefeuille' ? "Payer & Confirmer le rendez-vous" : "Confirmer le rendez-vous"}
                  </Button>
                </div>

              </div>
            )}

          </form>

          {/* Recap Sidebar */}
          <aside className="sugu-checkout-page__recap-section">
            <div className="sugu-checkout-page__card sugu-checkout-page__recap-card">
              <h3 className="sugu-checkout-page__recap-title">Récapitulatif</h3>

              <div className="sugu-checkout-page__product-row">
                <div className="sugu-checkout-page__product-media">
                  {lien.cover_url ? (
                    <img src={lien.cover_url} alt={lien.ad_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '18px' }}>📦</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sugu-checkout-page__product-title">{lien.ad_title}</div>
                  <div className="sugu-checkout-page__product-seller">Vendeur: {lien.ven_nom}</div>
                </div>
              </div>

              <div className="sugu-checkout-page__recap-row" style={{ marginTop: '18px' }}>
                <span>Prix convenu</span>
                <span className="sugu-checkout-page__recap-price">{lien.prix_convenu.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="sugu-checkout-page__recap-row">
                <span>Frais de service</span>
                <span style={{ color: 'var(--sugu-secondary)', fontWeight: 600 }}>Gratuit</span>
              </div>
              <div className="sugu-checkout-page__recap-divider" />
              <div className="sugu-checkout-page__recap-row total">
                <span>Total</span>
                <span>{lien.prix_convenu.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
          </aside>

        </div>
      </main>

      {cardModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '30px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            <button 
              type="button" 
              onClick={() => setCardModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ✕
            </button>

            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--sugu-ink)' }}>
              💳 Paiement par Carte Bancaire
            </h3>

            {/* Visual Card Preview */}
            <div style={{
              background: 'linear-gradient(135deg, #1f1f2e 0%, #3d3d5c 100%)',
              color: '#fff',
              borderRadius: '16px',
              padding: '20px',
              height: '160px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              fontFamily: 'monospace'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', fontStyle: 'italic' }}>VISA / MasterCard</span>
                <span style={{ fontSize: '24px' }}>📟</span>
              </div>
              <div style={{ fontSize: '18px', letterSpacing: '2px', margin: '20px 0 10px 0' }}>
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <div>
                  <div style={{ fontSize: '8px', color: '#aaa', textTransform: 'uppercase' }}>Titulaire</div>
                  <div style={{ fontWeight: 'bold' }}>{cardHolder.toUpperCase() || 'NOM DU TITULAIRE'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: '#aaa', textTransform: 'uppercase' }}>Expire</div>
                  <div style={{ fontWeight: 'bold' }}>{cardExpiry || 'MM/AA'}</div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="sugu-checkout-page__field" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Nom sur la carte *</label>
                <input 
                  type="text" 
                  placeholder="Ex: LOYDB HDJDBD" 
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  required
                />
              </div>

              <div className="sugu-checkout-page__field" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Numéro de carte *</label>
                <input 
                  type="text" 
                  placeholder="Ex: 4000 1234 5678 9010" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="sugu-checkout-page__field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Expiration *</label>
                  <input 
                    type="text" 
                    placeholder="MM/AA" 
                    value={cardExpiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9]/g, '');
                      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                      setCardExpiry(v.slice(0, 5));
                    }}
                    required
                  />
                </div>
                <div className="sugu-checkout-page__field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>CVV *</label>
                  <input 
                    type="password" 
                    placeholder="Ex: 123" 
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={handleCardSubmit}
              disabled={paying || !cardHolder || cardNumber.length < 19 || cardExpiry.length < 5 || cardCvv.length < 3}
              style={{
                backgroundColor: 'var(--sugu-primary)',
                color: '#fff',
                fontWeight: 'bold',
                marginTop: '10px'
              }}
            >
              {paying ? "Validation..." : `Payer ${(lien.prix_convenu).toLocaleString("fr-FR")} FCFA`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}