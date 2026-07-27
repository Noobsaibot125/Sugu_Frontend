import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Button from './Button';
import Input from './Input';
import { COMMUNES } from '../../data/mock';

export default function PopupCompleterProfil({ isOpen, onClose, onSuccess }) {
  const { user, mettreAJourUser } = useAuth();
  const [telephone, setTelephone] = useState(user?.telephone?.replace(/^\+225/, '') || '');
  const [ville, setVille] = useState(user?.adresse?.ville || 'Abidjan');
  const [commune, setCommune] = useState(user?.adresse?.commune || '');
  const [adresseDetail, setAdresseDetail] = useState(user?.adresse?.adresse_detail || '');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const inputRef = useRef(null);

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
            if (res?.data?.key) key = res.data.key;
          }
          if (!key) {
            alert("Clé Google Maps introuvable pour la géolocalisation.");
            return;
          }

          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`);
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const place = data.results.find(r => 
              r.types.includes("street_address") || 
              r.types.includes("premise") || 
              r.types.includes("establishment") || 
              r.types.includes("route") || 
              r.types.includes("neighborhood")
            ) || data.results[0];

            let streetAddress = place.formatted_address || place.name || "";
            setAdresseDetail(streetAddress);

            for (const component of place.address_components || []) {
              if (component.types.includes("sublocality_level_1") || component.types.includes("neighborhood") || component.types.includes("sublocality")) {
                if (COMMUNES.includes(component.long_name)) {
                  setCommune(component.long_name);
                }
              }
            }
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

  const setInputRef = (element) => {
    inputRef.current = element;
    if (element && window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(element, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'ci' }
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;
        const streetAddress = place.formatted_address || place.name || "";
        setAdresseDetail(streetAddress);
        for (const component of place.address_components) {
          if (component.types.includes("sublocality_level_1") || component.types.includes("neighborhood") || component.types.includes("sublocality")) {
            if (COMMUNES.includes(component.long_name)) {
              setCommune(component.long_name);
            }
          }
        }
      });
    }
  };

  if (!isOpen) return null;

  async function soumettre(e) {
    e.preventDefault();
    if (!telephone || !ville || !commune) {
      setErreur('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setErreur('');
    setEnvoi(true);
    try {
      const formattedPhone = `+225${telephone.replace(/\s/g, '')}`;
      const res = await client.put('/auth/profil', {
        nom: user?.nom || 'Utilisateur',
        telephone: formattedPhone,
        ville,
        commune,
        adresse_detail: adresseDetail,
      });

      mettreAJourUser(res.data.user);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="sugu-modal-backdrop" style={{ zIndex: 1000 }}>
      <div className="sugu-modal-content" style={{ maxWidth: '440px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <span style={{ fontFamily: 'var(--sugu-font-heading)', fontWeight: 700, fontSize: '20px', color: 'var(--sugu-ink)' }}>
            Compléter votre profil ⚙️
          </span>
          <button type="button" className="sugu-modal-close" style={{ width: '32px', height: '32px', fontSize: '16px' }} onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5, marginBottom: '20px' }}>
          Pour effectuer cette action (déposer une annonce ou contacter un vendeur), veuillez compléter votre numéro de téléphone et votre adresse.
        </p>

        {erreur && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale" style={{ marginBottom: '16px' }}>{erreur}</p>}

        <form onSubmit={soumettre} className="sugu-auth-screen__form">
          <div>
            <span className="sugu-auth-champ-label">Numéro de téléphone *</span>
            <div className="sugu-auth-champ-compose">
              <span className="sugu-auth-champ-compose__prefixe">🇨🇮 +225</span>
              <input
                required
                inputMode="tel"
                placeholder="07 00 00 00 00"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </div>
          </div>

          <Input
            id="ville"
            label="Ville *"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            required
          />

          <div style={{ marginBottom: '14px' }}>
            <label className="sugu-auth-champ-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Commune *</label>
            <select
              className="sugu-search-page__price-input"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '14px',
                borderRadius: '12px',
                border: '1.5px solid var(--sugu-border)',
                background: 'var(--sugu-surface)',
                outline: 'none'
              }}
              required
            >
              <option value="">Sélectionner une commune</option>
              {COMMUNES.filter(c => c !== "Toute la Côte d'Ivoire").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: 'var(--sugu-ink)', marginBottom: '6px' }}>
              Adresse précise / détaillée (Optionnel)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                ref={setInputRef}
                className="sugu-search-page__price-input"
                placeholder="Ex : Angré 8e Tranche, à côté de la pharmacie"
                value={adresseDetail}
                onChange={(e) => setAdresseDetail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--sugu-border)',
                  background: 'var(--sugu-surface)',
                  outline: 'none',
                  flex: 1
                }}
              />
              <button
                type="button"
                onClick={handleGeolocate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 14px',
                  background: 'var(--sugu-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap'
                }}
              >
                📍 Me localiser
              </button>
            </div>
          </div>

          <Button fullWidth type="submit" size="lg" disabled={envoi} style={{ marginTop: '12px' }}>
            {envoi ? 'Enregistrement...' : 'Enregistrer et continuer'}
          </Button>
        </form>
      </div>
    </div>
  );
}
