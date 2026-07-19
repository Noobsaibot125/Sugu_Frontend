import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PopupCompleterProfil from '../components/ui/PopupCompleterProfil';
import client from '../api/client';
import './Publier.css';
import logoImg from '../assets/TrouveTout_Logo.png';
import orangeLogo from '../assets/Orange.png';
import mtnLogo from '../assets/MTN.png';
import waveLogo from '../assets/Wave.png';

const CATEGORIES = [
  { id: "electronique", icon: "📱", label: "Électronique & Informatique" },
  { id: "vehicules", icon: "🚗", label: "Véhicules" },
  { id: "immobilier", icon: "🏠", label: "Immobilier" },
  { id: "mode", icon: "👗", label: "Mode" },
  { id: "maison", icon: "🛋️", label: "Maison" },
  { id: "services", icon: "🛠️", label: "Services" },
  { id: "emploi", icon: "💼", label: "Emploi" }
];

const SUBCATEGORIES = {
  "Électronique & Informatique": ["Téléphones & Tablettes", "Ordinateurs", "TV & Son", "Consoles & Jeux", "Accessoires"],
  "Véhicules": ["Voitures", "Motos", "Camions & Engins", "Pièces & Accessoires"],
  "Immobilier": ["Vente", "Location", "Terrains", "Bureaux & Commerces"],
  "Mode": ["Vêtements", "Chaussures", "Sacs & Accessoires", "Montres & Bijoux"],
  "Maison": ["Meubles", "Électroménager", "Décoration", "Jardin & Bricolage"],
  "Services": ["Cours & Formation", "Événementiel", "Bâtiment", "Beauté & Bien-être", "Location de car"],
  "Emploi": ["Offres d'emploi et Stages", "Demandes d'emploi"]
};

const CONDITIONS = ["Neuf", "Très bon état", "Bon état", "À réparer"];
const COMMUNES = ["Cocody", "Yopougon", "Plateau", "Marcory", "Treichville", "Adjamé", "Abobo", "Bingerville", "Port-Bouët", "Koumassi"];

export default function Publier() {
  const navigate = useNavigate();
  const { user, chargement } = useAuth();
  const [profilIncompletOpen, setProfilIncompletOpen] = useState(false);

  // Auto-redirect if not logged in, and check if profile is incomplete
  useEffect(() => {
    if (!chargement) {
      if (!user) {
        navigate('/connexion');
      } else if (user.role !== 'admin' && (!user.telephone || !user.adresse || !user.adresse.ville || !user.adresse.commune)) {
        setProfilIncompletOpen(true);
      }
    }
  }, [user, chargement, navigate]);

  const handlePopupClose = () => {
    setProfilIncompletOpen(false);
    if (user?.role !== 'admin' && (!user?.telephone || !user?.adresse?.ville || !user?.adresse?.commune)) {
      navigate('/');
    }
  };

  // Wizard state
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [iaPrompt, setIaPrompt] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaSelected, setIaSelected] = useState(false);
  const [editingField, setEditingField] = useState(null);

  // Form states
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [photos, setPhotos] = useState([]);
  const [specs, setSpecs] = useState({});
  const [video, setVideo] = useState(null);
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [commune, setCommune] = useState("");
  const [addressMode, setAddressMode] = useState("approx"); // approx | precise
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState(""); // main | livraison | both
  const [ville, setVille] = useState("Abidjan");
  const [invoiceProvided, setInvoiceProvided] = useState(false);
  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [selectedBoosts, setSelectedBoosts] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("Orange");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Prefill default commune from user profile if not already set
  useEffect(() => {
    if (user?.adresse?.commune && !commune) {
      setCommune(user.adresse.commune);
    }
  }, [user, commune]);

  useEffect(() => {
    if (delivery === 'main' || delivery === 'both') {
      setAddressMode('precise');
    }
  }, [delivery]);

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
      let foundCity = "";
      let foundCommune = "";

      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes("sublocality_level_1") || types.includes("neighborhood") || types.includes("sublocality")) {
          foundCommune = component.long_name;
        }
        if (types.includes("locality") || types.includes("administrative_area_level_1")) {
          foundCity = component.long_name;
        }
      }

      if (!foundCommune && foundCity) {
        foundCommune = foundCity;
      }
      if (!foundCity && foundCommune) {
        foundCity = foundCommune;
      }
      if (!foundCity) {
        foundCity = "Abidjan";
      }
      if (!foundCommune) {
        foundCommune = "Cocody";
      }

      setAddress(streetAddress);
      setVille(foundCity);
      setCommune(foundCommune);
    });
  };

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

  // Utility states
  const [dragOver, setDragOver] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const fileInputRef = useRef(null);

  const showBrandModel = category === "Électronique & Informatique" || category === "Véhicules";

  // Trigger feedback toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  // Pre-fill precise address with connected user's profile address
  useEffect(() => {
    if (addressMode === "precise" && !address) {
      if (user?.adresse?.adresse_detail) {
        setAddress(user.adresse.adresse_detail);
      } else if (user?.adresse?.commune) {
        setAddress(`${user.adresse.commune}, ${user.adresse.ville || 'Abidjan'}`);
      }
    }
  }, [addressMode, user]);

  useEffect(() => {
    if (delivery === 'main' || delivery === 'both') {
      if (addressMode !== 'precise') {
        setAddressMode('precise');
      }
    }
  }, [delivery]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      triggerToast("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    triggerToast("Récupération de votre position précise...");
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
            triggerToast("Clé Google Maps introuvable pour la géolocalisation.");
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
              r.types.includes("sublocality_level_2") ||
              r.types.includes("neighborhood")
            ) || data.results[0];

            let foundCity = "";
            let foundCommune = "";

            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes("sublocality_level_1") || types.includes("neighborhood") || types.includes("sublocality")) {
                foundCommune = component.long_name;
              }
              if (types.includes("locality") || types.includes("administrative_area_level_1")) {
                foundCity = component.long_name;
              }
            }

            if (!foundCommune && foundCity) foundCommune = foundCity;
            if (!foundCity && foundCommune) foundCity = foundCommune;
            if (!foundCity) foundCity = "Abidjan";
            if (!foundCommune) foundCommune = "Cocody";

            setAddress(place.formatted_address || place.name || "");
            setVille(foundCity);
            setCommune(foundCommune);
            triggerToast("Adresse précise récupérée avec succès !");
          } else {
            triggerToast("Aucune adresse trouvée pour ces coordonnées.");
          }
        } catch (err) {
          console.error(err);
          triggerToast("Erreur lors de la géolocalisation.");
        }
      },
      (err) => {
        triggerToast("Accès à la géolocalisation refusé ou indisponible.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Files handler
  const handleFiles = (files) => {
    const remaining = 8 - photos.length;
    const filesArray = Array.from(files).slice(0, remaining);
    
    filesArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos(prev => [...prev, e.target.result].slice(0, 8));
        };
        reader.readAsDataURL(file);
      }
    });
    triggerToast("Photos ajoutées");
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemovePhoto = (index, e) => {
    e.stopPropagation();
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetCover = (index, e) => {
    e.stopPropagation();
    setPhotos(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const handleMovePhoto = (index, dir, e) => {
    e.stopPropagation();
    const target = index + dir;
    if (target >= 0 && target < photos.length) {
      setPhotos(prev => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[target];
        copy[target] = temp;
        return copy;
      });
    }
  };

  const handleVideoInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file.name);
      triggerToast("Vidéo ajoutée");
    }
  };

  const renderSpecFields = () => {
    if (category === "Électronique & Informatique" && subcategory === "Téléphones & Tablettes") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Stockage</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 256 Go, 128 Go"
                value={specs.stockage || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, stockage: e.target.value }))}
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Couleur</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : Graphite, Noir, Or"
                value={specs.couleur || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, couleur: e.target.value }))}
              />
            </div>
          </div>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Batterie (%)</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 100 %, 95 %"
                value={specs.batterie || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, batterie: e.target.value }))}
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Réseau</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : Débloqué"
                value={specs.reseau || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, reseau: e.target.value }))}
              />
            </div>
          </div>
        </div>
      );
    }

    if (category === "Électronique & Informatique" && subcategory === "Ordinateurs") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Processeur</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : Intel Core i7, AMD Ryzen 5, Apple M2"
                value={specs.processeur || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, processeur: e.target.value }))}
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Mémoire vive (RAM)</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 16 Go, 8 Go"
                value={specs.ram || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, ram: e.target.value }))}
              />
            </div>
          </div>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Stockage</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 512 Go SSD, 1 To HDD"
                value={specs.stockage || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, stockage: e.target.value }))}
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Carte Graphique</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : NVIDIA RTX 4060, Intel Iris Xe"
                value={specs.carte_graphique || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, carte_graphique: e.target.value }))}
              />
            </div>
          </div>
        </div>
      );
    }

    if (category === "Véhicules") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Marque</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : Toyota, Hyundai"
                value={specs.marque || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, marque: e.target.value }))}
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Modèle</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : Corolla, Tucson"
                value={specs.modele || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, modele: e.target.value }))}
              />
            </div>
          </div>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Année</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 2018"
                value={specs.annee || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, annee: e.target.value }))}
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Kilométrage (km)</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 90 000 km"
                value={specs.kilometrage || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, kilometrage: e.target.value }))}
              />
            </div>
          </div>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Boîte de vitesses</label>
              <select
                className="sugu-input"
                value={specs.transmission || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, transmission: e.target.value }))}
                style={{ padding: '12px' }}
              >
                <option value="">Sélectionnez</option>
                <option value="Automatique">Automatique</option>
                <option value="Manuelle">Manuelle</option>
              </select>
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Carburant</label>
              <select
                className="sugu-input"
                value={specs.carburant || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, carburant: e.target.value }))}
                style={{ padding: '12px' }}
              >
                <option value="">Sélectionnez</option>
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
                <option value="Électrique">Électrique</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (category === "Immobilier") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Type de transaction</label>
              <select
                className="sugu-input"
                value={specs.type_transaction || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, type_transaction: e.target.value }))}
                style={{ padding: '12px' }}
              >
                <option value="">Sélectionnez</option>
                <option value="Vente">Vente</option>
                <option value="Location">Location</option>
                <option value="Location Saisonnière">Location Saisonnière</option>
              </select>
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Type de bien</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : Appartement, Terrain, Villa, Bureau"
                value={specs.type_bien || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, type_bien: e.target.value }))}
              />
            </div>
          </div>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Superficie (m²)</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 250"
                value={specs.superficie || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, superficie: e.target.value }))}
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Nombre de pièces</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 4 pièces"
                value={specs.pieces || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, pieces: e.target.value }))}
              />
            </div>
          </div>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Nombre de chambres</label>
              <input
                type="number"
                className="sugu-input"
                placeholder="Ex : 3"
                value={specs.chambres || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, chambres: e.target.value }))}
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Nombre de salles de bain</label>
              <input
                type="number"
                className="sugu-input"
                placeholder="Ex : 2"
                value={specs.salles_de_bain || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, salles_de_bain: e.target.value }))}
              />
            </div>
          </div>
          <div className="sugu-publish-page__field" style={{ maxWidth: '320px' }}>
            <label className="sugu-publish-page__label">Meublé</label>
            <select
              className="sugu-input"
              value={specs.meuble || ""}
              onChange={(e) => setSpecs(prev => ({ ...prev, meuble: e.target.value }))}
              style={{ padding: '12px' }}
            >
              <option value="">Sélectionnez</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
        </div>
      );
    }

    if (category === "Emploi") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Nom de l'entreprise / Employeur <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : Sugu CI, Cabinet Conseil, Particulier"
                value={specs.entreprise || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, entreprise: e.target.value }))}
                required
              />
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Type de contrat <span style={{ color: 'red' }}>*</span></label>
              <select
                className="sugu-input"
                value={specs.type_contrat || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, type_contrat: e.target.value }))}
                style={{ padding: '12px' }}
                required
              >
                <option value="">Sélectionnez le type de contrat</option>
                <option value="Stage">Stage</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Bénévolat">Bénévolat</option>
                <option value="Autre">Autre (indépendant, apprentissage, intérim...)</option>
              </select>
            </div>
          </div>
          <div className="sugu-publish-page__two-col">
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Niveau d'études requis</label>
              <select
                className="sugu-input"
                value={specs.niveau_etudes || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, niveau_etudes: e.target.value }))}
                style={{ padding: '12px' }}
              >
                <option value="">Sélectionnez le niveau d'études</option>
                <option value="Aucun diplôme requis">Aucun diplôme requis</option>
                <option value="CEP / CAP">CEP / CAP</option>
                <option value="BEPC">BEPC</option>
                <option value="BAC">BAC</option>
                <option value="BAC+1">BAC+1</option>
                <option value="BAC+2 (BTS, DUT)">BAC+2 (BTS, DUT)</option>
                <option value="BAC+3 (Licence, Bachelor)">BAC+3 (Licence, Bachelor)</option>
                <option value="BAC+4 (Master 1)">BAC+4 (Master 1)</option>
                <option value="BAC+5 (Master 2, Ingénieur)">BAC+5 (Master 2, Ingénieur)</option>
                <option value="Doctorat (BAC+8)">Doctorat (BAC+8)</option>
              </select>
            </div>
            <div className="sugu-publish-page__field">
              <label className="sugu-publish-page__label">Expérience requise</label>
              <input
                type="text"
                className="sugu-input"
                placeholder="Ex : 2 ans d'expérience, Débutant accepté"
                value={specs.experience || ""}
                onChange={(e) => setSpecs(prev => ({ ...prev, experience: e.target.value }))}
              />
            </div>
          </div>
          {subcategory !== "Demandes d'emploi" && (
            <div className="sugu-publish-page__two-col">
              <div className="sugu-publish-page__field">
                <label className="sugu-publish-page__label">Date limite de l'offre</label>
                <input
                  type="date"
                  className="sugu-input"
                  min={(() => {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    return tom.toISOString().split('T')[0];
                  })()}
                  value={specs.date_limite || ""}
                  onChange={(e) => setSpecs(prev => ({ ...prev, date_limite: e.target.value }))}
                />
              </div>
              <div className="sugu-publish-page__field" />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleIAGeneration = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!iaPrompt || iaPrompt.trim() === "") return;
    setIaLoading(true);
    try {
      const res = await client.post('/ia/analyser-annonce', {
        texte: iaPrompt,
        image: photos.length > 0 ? photos[0] : null
      });
      const data = res.data;
      
      setTitle(data.title || "");
      setDescription(data.description || "");
      setPrice(data.price ? String(data.price) : "");
      setNegotiable(data.negotiable === true || negotiable);
      
      const cat = data.category || "";
      setCategory(cat);
      setSubcategory(data.subcategory || "");
      setCondition(data.condition || "neuf");
      setSpecs(data.specs || {});
      
      // Merge values returned from the AI, fall back to whatever is selected locally or defaults
      if (data.commune) {
        setCommune(data.commune);
      } else if (!commune && user?.adresse?.commune) {
        setCommune(user.adresse.commune);
      }
      
      if (cat === "Emploi" || cat === "Immobilier" || cat === "Services") {
        setDelivery("");
      } else if (data.delivery) {
        setDelivery(data.delivery);
      }
      
      if (data.addressMode) {
        setAddressMode(data.addressMode);
      }
      if (data.address) {
        setAddress(data.address);
      }
      
      triggerToast("Annonce analysée par l'IA avec succès !");
      setStep(5); // Go directly to recap
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur lors de la génération par l'IA.");
    } finally {
      setIaLoading(false);
    }
  };

  // Navigation helpers
  const canGoNext = () => {
    if (step === 1) return category !== "" && subcategory !== "";
    if (step === 2) {
      if (category === "Emploi") {
        return title.trim() !== "" && description.trim() !== "" && (specs.type_contrat || "").trim() !== "" && (specs.entreprise || "").trim() !== "";
      }
      if (category === "Immobilier" || category === "Services") {
        return title.trim() !== "" && description.trim() !== "";
      }
      return title.trim() !== "" && description.trim() !== "" && condition !== "";
    }
    if (step === 3) {
      if (category === "Emploi") {
        return true; // Photos and price/salary are optional for Job listings
      }
      return photos.length > 0 && price !== "";
    }
    if (step === 4) {
      if (category === "Emploi" || category === "Immobilier" || category === "Services") {
        return commune !== ""; // Delivery mode is not needed for Job, Real Estate or Services listings
      }
      return commune !== "" && delivery !== "";
    }
    return true;
  };

  const isPublishReady = () => {
    if (!commune) return false;
    if (category !== "Emploi") {
      if (photos.length === 0) return false;
      if (price === "") return false;
    }
    if (category !== "Emploi" && category !== "Immobilier" && category !== "Services") {
      if (!delivery) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (canGoNext()) {
      setStep(prev => Math.min(5, prev + 1));
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2200);
  };

  const handleToggleBoost = (type) => {
    setSelectedBoosts(prev => {
      let next = [...prev];
      if (next.includes(type)) {
        next = next.filter(t => t !== type);
      } else {
        // Exclusivity for A La Une
        if (type === 'a_la_une_7j') next = next.filter(t => t !== 'a_la_une_30j');
        if (type === 'a_la_une_30j') next = next.filter(t => t !== 'a_la_une_7j');
        
        // Exclusivity for Remontée
        if (type === 'remonte_7j') next = next.filter(t => !['remonte_30j', 'remonte_hebdo_8s'].includes(t));
        if (type === 'remonte_30j') next = next.filter(t => !['remonte_7j', 'remonte_hebdo_8s'].includes(t));
        if (type === 'remonte_hebdo_8s') next = next.filter(t => !['remonte_7j', 'remonte_30j'].includes(t));
        
        next.push(type);
      }
      return next;
    });
  };

  const calculateBoostTotal = () => {
    let total = 0;
    if (selectedBoosts.includes('a_la_une_7j')) total += 7000;
    if (selectedBoosts.includes('a_la_une_30j')) total += 11000;
    if (selectedBoosts.includes('remonte_7j')) total += 4000;
    if (selectedBoosts.includes('remonte_30j')) total += 9000;
    if (selectedBoosts.includes('remonte_hebdo_8s')) total += 6000;
    if (selectedBoosts.includes('urgente')) total += 2000;
    return total;
  };

  const handlePublish = () => {
    setBoostModalOpen(true);
  };

  const handleConfirmPublish = async (withBoosts) => {
    setBoostModalOpen(false);
    if (withBoosts && calculateBoostTotal() > 0) {
      setPaymentModalOpen(true);
    } else {
      await proceedToPublish(false);
    }
  };

  const proceedToPublish = async (withBoosts) => {
    setEnvoi(true);
    try {
      const isJob = category === "Emploi";
      const isImmo = category === "Immobilier";
      const isServ = category === "Services";
      const activeBoosts = withBoosts ? selectedBoosts : [];
      const payload = {
        title,
        description,
        price: isJob ? (price !== "" ? parseInt(price, 10) : 0) : price,
        negotiable: isJob ? (price === "" || negotiable) : negotiable,
        condition: (isJob || isImmo || isServ) ? "Neuf" : condition,
        category,
        subcategory,
        commune,
        ville,
        address,
        addressMode,
        delivery: (isJob || isImmo || isServ) ? ((isImmo || isServ) ? "main" : "both") : delivery,
        photos,
        caracteristiques: {
          ...(isJob ? { ...specs, type_annonce: subcategory } : specs),
          address: addressMode === "precise" ? address : undefined,
          address_mode: addressMode,
          facture_fournie: (isJob || isImmo || isServ) ? false : invoiceProvided,
          boosts: activeBoosts,
          boost_total: withBoosts ? calculateBoostTotal() : 0
        }
      };
      await client.post('/annonces', payload);
      setPublished(true);
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Erreur lors de la publication de l\'annonce.');
    } finally {
      setEnvoi(false);
    }
  };

  const handlePay = () => {
    if (!phoneNumber) {
      triggerToast("Veuillez saisir votre numéro de téléphone Mobile Money.");
      return;
    }
    setPaymentLoading(true);
    setTimeout(async () => {
      await proceedToPublish(true);
      setPaymentLoading(false);
      setPaymentModalOpen(false);
    }, 2500);
  };

  const handleRestart = () => {
    setStep(1);
    setPublished(false);
    setCategory("");
    setSubcategory("");
    setTitle("");
    setDescription("");
    setCondition("");
    setBrand("");
    setModel("");
    setPhotos([]);
    setSpecs({});
    setVideo(null);
    setPrice("");
    setNegotiable(false);
    setCommune("");
    setAddressMode("approx");
    setAddress("");
    setDelivery("");
    setInvoiceProvided(false);
  };

  const formatPrix = (n) => {
    const isJob = category === "Emploi";
    const v = parseInt(n, 10);
    if (isJob) {
      return isNaN(v) || v === 0 ? "Salaire à discuter" : `${v.toLocaleString("fr-FR").replace(/\u202f|,/g, " ")} FCFA / mois`;
    }
    return isNaN(v) ? "—" : v.toLocaleString("fr-FR").replace(/\u202f|,/g, " ") + " FCFA";
  };

  const deliveryLabel = () => {
    if (delivery === "main") return "Remise en main propre";
    if (delivery === "livraison") return "Livraison possible";
    if (delivery === "both") return "Remise ou livraison";
    return "—";
  };

  const locationLabel = () => {
    if (!commune) return "—";
    if (addressMode === "precise" && address) return `${commune} — ${address}`;
    return `${commune} (zone approximative)`;
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "Non spécifiée";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getCategorySpecsRows = () => {
    const rows = [];
    if (category === "Électronique & Informatique") {
      if (subcategory === "Téléphones & Tablettes") {
        rows.push(
          { label: "Stockage", value: specs.stockage || "—", field: 'details' },
          { label: "Couleur", value: specs.couleur || "—", field: 'details' },
          { label: "Batterie (%)", value: specs.batterie || "—", field: 'details' },
          { label: "Réseau", value: specs.reseau || "—", field: 'details' }
        );
      } else if (subcategory === "Ordinateurs") {
        rows.push(
          { label: "Processeur", value: specs.processeur || "—", field: 'details' },
          { label: "RAM", value: specs.ram || "—", field: 'details' },
          { label: "Stockage", value: specs.stockage || "—", field: 'details' },
          { label: "Carte Graphique", value: specs.carte_graphique || "—", field: 'details' }
        );
      }
    } else if (category === "Véhicules") {
      rows.push(
        { label: "Marque / Modèle", value: `${specs.marque || "—"} ${specs.modele || ""}`, field: 'details' },
        { label: "Année", value: specs.annee || "—", field: 'details' },
        { label: "Kilométrage", value: specs.kilometrage || "—", field: 'details' },
        { label: "Boîte / Carburant", value: `${specs.transmission || "—"} · ${specs.carburant || "—"}`, field: 'details' }
      );
    } else if (category === "Immobilier") {
      rows.push(
        { label: "Type de transaction", value: specs.type_transaction || "—", field: 'details' },
        { label: "Type de bien", value: specs.type_bien || "—", field: 'details' },
        { label: "Superficie", value: specs.superficie ? `${specs.superficie} m²` : "—", field: 'details' },
        { label: "Pièces / Chambres", value: `${specs.pieces || "—"} (${specs.chambres || "—"} ch, ${specs.salles_de_bain || "—"} sdb)`, field: 'details' },
        { label: "Meublé", value: specs.meuble || "—", field: 'details' }
      );
    } else if (category === "Emploi") {
      rows.push(
        { label: "Contrat / Employeur", value: `${specs.type_contrat || "—"} chez ${specs.entreprise || "—"}`, field: 'details' },
        { label: "Niveau d'études", value: specs.niveau_etudes || "—", field: 'details' },
        { label: "Expérience", value: specs.experience || "—", field: 'details' },
        { label: "Date limite", value: formatDateLabel(specs.date_limite), field: 'details' }
      );
    }
    return rows;
  };

  // Step names for indicators
  const STEP_NAMES = ["Catégorie", "Détails de l'annonce", "Photos & prix", "Localisation & livraison", "Récapitulatif"];

  return (
    <div className="sugu-publish-page">
      {/* ================= HEADER ================= */}
      <header className="sugu-publish-page__header">
        <div className="sugu-publish-page__header-inner">
          <div className="sugu-publish-page__header-brand">
            <Link to="/" className="sugu-publish-page__header-logo">
              <img src={logoImg} alt="TrouveTout" className="sugu-publish-page__header-logo-img" />
            </Link>
            <span className="sugu-publish-page__header-title">Déposer une annonce</span>
          </div>
          <div className="sugu-publish-page__header-actions">
            <span className="sugu-link sugu-publish-page__save-draft" onClick={handleSaveDraft}>
              💾 <span className="hide-mobile">Enregistrer en brouillon</span>
            </span>
            <div className="sugu-btn sugu-publish-page__close" onClick={() => navigate('/')}>✕</div>
          </div>
        </div>
      </header>
      
      {/* ================= STEP INDICATOR HEADER ================= */}
      {!published && step > 0 && (
        <div className="sugu-publish-page__progress">
          <div className="sugu-publish-page__progress-inner">
            <div className="sugu-publish-page__progress-title-row">
              <span className="sugu-publish-page__step-name">{STEP_NAMES[step - 1]}</span>
              <span className="sugu-publish-page__step-index">Étape {step} / 5</span>
            </div>
            <div className="sugu-publish-page__progress-bars">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  className="sugu-publish-page__progress-bar"
                  onClick={() => n <= step && setStep(n)}
                  style={{ backgroundColor: n <= step ? 'var(--sugu-primary)' : '#E6DDCE' }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className="sugu-publish-page__main">
        {!published ? (
          <>
            {/* STEP 0: CHOICE OF PUBLISHING METHOD */}
            {step === 0 && !iaSelected && (
              <div style={{ maxWidth: '800px', margin: '40px auto 0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <style>{`
                  @keyframes sugu-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @keyframes sugu-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                  }
                `}</style>
                <h2 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', color: 'var(--sugu-ink)', fontFamily: 'var(--sugu-font-heading)', margin: '0 0 10px 0' }}>
                  Comment souhaitez-vous créer votre annonce ?
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginTop: '20px' }}>
                  
                  {/* Option IA */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f7f0ff 0%, #edf2ff 100%)',
                    borderRadius: '20px',
                    padding: '35px',
                    border: '2px solid #dcd0ff',
                    boxShadow: '0 10px 30px rgba(110, 74, 50, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Tiny IA badge */}
                    <span style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'linear-gradient(90deg, #6200EE 0%, #8700FF 100%)',
                      color: '#FFF',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '4px 10px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Recommandé ⚡
                    </span>
                    
                    <div>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🪄</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#3A0088', margin: '0 0 8px 0', fontFamily: 'var(--sugu-font-heading)' }}>
                        Génération prédictive par IA
                      </h3>
                      <p style={{ fontSize: '14px', color: '#5C5870', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                        Entrez une phrase simple et importez des photos. Notre IA rédigera, catégorisera et configurera votre annonce instantanément.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="sugu-button"
                      onClick={() => setIaSelected(true)}
                      style={{
                        background: 'linear-gradient(90deg, #6200EE 0%, #8700FF 100%)',
                        color: '#FFF',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14.5px',
                        boxShadow: '0 4px 15px rgba(98, 0, 238, 0.2)'
                      }}
                    >
                      Utiliser l'IA ➔
                    </button>
                  </div>
                  
                  {/* Option Classique */}
                  <div style={{
                    background: '#FFF',
                    borderRadius: '20px',
                    padding: '35px',
                    border: '2px solid var(--sugu-border)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '340px'
                  }}>
                    <div>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>📝</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sugu-ink)', margin: '0 0 8px 0', fontFamily: 'var(--sugu-font-heading)' }}>
                        Saisie classique guidée
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                        Prenez le contrôle total de chaque détail en choisissant vous-même les catégories, en remplissant manuellement les formulaires et les options de livraison étape par étape.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      className="sugu-button"
                      onClick={() => setStep(1)}
                      style={{
                        background: '#FFF',
                        color: 'var(--sugu-ink)',
                        border: '2px solid var(--sugu-border)',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14.5px'
                      }}
                    >
                      Commencer manuellement ➔
                    </button>
                  </div>
                  
                </div>
              </div>
            )}

            {/* UNIFIED AI STUDIO */}
            {step === 0 && iaSelected && (
              <div className="sugu-ia-studio" style={{ maxWidth: '1000px', margin: '20px auto 0 auto' }}>
                <style>{`
                  @keyframes sugu-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @keyframes sugu-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                  }
                `}</style>
                <button
                  type="button"
                  className="sugu-ia-studio__back-btn"
                  onClick={() => setIaSelected(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--sugu-ink-soft)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '20px',
                    padding: 0
                  }}
                >
                  ◀ Retour aux choix de saisie
                </button>

                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--sugu-ink)', fontFamily: 'var(--sugu-font-heading)', margin: '0 0 6px 0' }}>
                  Création d'annonce assistée par IA 🪄
                </h2>
                <p style={{ fontSize: '14.5px', color: 'var(--sugu-ink-soft)', marginBottom: '32px' }}>
                  Ajoutez vos photos, spécifiez vos préférences de livraison et de localisation, puis décrivez brièvement votre article. Notre IA rédigera et configurera le reste pour vous.
                </p>

                <div className="sugu-ia-studio__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
                  
                  {/* Left Column: Photos & Settings */}
                  <div className="sugu-ia-studio__settings-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Photos upload */}
                    <div className="sugu-publish-page__field">
                      <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <label className="sugu-publish-page__label" style={{ marginBottom: 0 }}>
                          Photos <span style={{ color: 'var(--sugu-ink-faint)', fontWeight: 400 }}>(la 1ʳᵉ sera la couverture)</span>
                        </label>
                        <span style={{ fontFamily: 'var(--sugu-font-mono)', fontSize: '12px', color: 'var(--sugu-ink-faint)' }}>
                          {photos.length} / 8
                        </span>
                      </div>

                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        style={{
                          borderWidth: '2px',
                          borderStyle: 'dashed',
                          borderColor: dragOver ? 'var(--sugu-primary)' : '#DCCFBC',
                          backgroundColor: dragOver ? '#F7ECE0' : '#FFF',
                          borderRadius: '18px',
                          padding: '18px'
                        }}
                      >
                        {photos.length === 0 ? (
                          <label className="sugu-publish-page__dropzone-label">
                            <div className="sugu-publish-page__dropzone-icon">📷</div>
                            <div className="sugu-publish-page__dropzone-title">Glissez vos photos ici</div>
                            <div className="sugu-publish-page__dropzone-desc">ou cliquez pour parcourir · JPG, PNG · 8 max</div>
                            <span className="sugu-publish-page__dropzone-btn">Choisir des photos</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFiles(e.target.files)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        ) : (
                          <div className="sugu-publish-page__photo-grid">
                            {photos.map((src, i) => (
                              <div key={i} className="sugu-publish-page__photo-tile" style={{
                                borderColor: i === 0 ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                                borderWidth: '2px',
                                borderStyle: 'solid'
                              }}>
                                <img src={src} alt="Vignette" />
                                {i === 0 && <span className="sugu-publish-page__photo-cover-badge">★ Couverture</span>}
                                <button
                                  type="button"
                                  className="sugu-publish-page__photo-remove-btn"
                                  onClick={(e) => handleRemovePhoto(i, e)}
                                >
                                  ✕
                                </button>
                                <div className="sugu-publish-page__photo-controls">
                                  <button type="button" className="sugu-publish-page__photo-control-btn" onClick={(e) => handleMovePhoto(i, -1, e)}>
                                    ◀
                                  </button>
                                  {i !== 0 && (
                                    <button
                                      type="button"
                                      className="sugu-publish-page__photo-control-btn sugu-publish-page__photo-control-btn--cover"
                                      title="Définir comme couverture"
                                      onClick={(e) => handleSetCover(i, e)}
                                    >
                                      ★
                                    </button>
                                  )}
                                  <button type="button" className="sugu-publish-page__photo-control-btn" onClick={(e) => handleMovePhoto(i, 1, e)}>
                                    ▶
                                  </button>
                                </div>
                              </div>
                            ))}
                            {photos.length < 8 && (
                              <label className="sugu-publish-page__photo-add-more">
                                <span style={{ fontSize: '26px' }}>＋</span>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>Ajouter</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleFiles(e.target.files)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Commune dropdown */}
                    <div className="sugu-publish-page__field">
                      <label className="sugu-publish-page__label">Ville / Commune</label>
                      <div className="sugu-input-wrapper" style={{ padding: '0 14px', gap: '8px', background: '#FFF' }}>
                        <span style={{ color: 'var(--sugu-secondary)' }}>📍</span>
                        <select
                          value={commune}
                          onChange={(e) => setCommune(e.target.value)}
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: '15px',
                            color: 'var(--sugu-ink)',
                            padding: '13px 4px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">Choisir une commune…</option>
                          {(COMMUNES.includes(commune) || !commune ? COMMUNES : [...COMMUNES, commune]).map(c => (
                            <option key={c} value={c}>
                              {c === commune && ville && ville !== "Abidjan" && ville !== commune ? `${c} (${ville})` : c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Delivery Options */}
                    <div className="sugu-publish-page__field">
                      <label className="sugu-publish-page__label" style={{ marginBottom: '2px' }}>Mode de livraison</label>
                      <div style={{ fontSize: '12px', color: 'var(--sugu-ink-faint)', marginBottom: '10px' }}>
                        Optionnel · Ignoré pour l'immobilier, les services et l'emploi
                      </div>
                      <div className="sugu-publish-page__options-wrap">
                        {[
                          { v: "main", icon: "🤝", label: "En main propre" },
                          { v: "livraison", icon: "🚚", label: "Livraison" },
                          { v: "both", icon: "✨", label: "Les deux" }
                        ].map(d => {
                          const isSelected = delivery === d.v;
                          return (
                            <div
                              key={d.v}
                              className="sugu-publish-page__tile"
                              onClick={() => setDelivery(d.v)}
                              style={{
                                flex: 1,
                                backgroundColor: isSelected ? '#F7ECE0' : '#FFF',
                                borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                                borderWidth: '1.5px',
                                borderStyle: 'solid',
                                padding: '12px 6px',
                                minHeight: 'auto',
                                cursor: 'pointer'
                              }}
                            >
                              <span style={{ fontSize: '18px' }}>{d.icon}</span>
                              <span className="sugu-publish-page__tile-name" style={{ fontSize: '12px', marginTop: '4px' }}>{d.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Address Precision Selection for AI Studio */}
                    <div className="sugu-publish-page__field" style={{ marginTop: '16px' }}>
                      <label className="sugu-publish-page__label" style={{ marginBottom: '8px' }}>Précision de l'adresse</label>
                      <div className="sugu-publish-page__address-options">
                        
                        {/* Approx Mode */}
                        <div
                          className="sugu-publish-page__address-btn"
                          onClick={() => {
                            if (delivery === 'main' || delivery === 'both') return;
                            setAddressMode("approx");
                          }}
                          style={{
                            backgroundColor: addressMode === "approx" ? '#F7ECE0' : '#FFF',
                            borderColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                            opacity: (delivery === 'main' || delivery === 'both') ? 0.45 : 1,
                            cursor: (delivery === 'main' || delivery === 'both') ? 'not-allowed' : 'pointer',
                            pointerEvents: (delivery === 'main' || delivery === 'both') ? 'none' : 'auto',
                            padding: '10px 12px'
                          }}
                        >
                          <span className="sugu-publish-page__address-ring" style={{ borderColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'var(--sugu-border)' }}>
                            <span className="sugu-publish-page__address-dot" style={{ backgroundColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'transparent' }} />
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--sugu-ink)' }}>Zone approximative</div>
                          </div>
                        </div>

                        {/* Precise Mode */}
                        <div
                          className="sugu-publish-page__address-btn"
                          onClick={() => setAddressMode("precise")}
                          style={{
                            backgroundColor: addressMode === "precise" ? '#F7ECE0' : '#FFF',
                            borderColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                            padding: '10px 12px'
                          }}
                        >
                          <span className="sugu-publish-page__address-ring" style={{ borderColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'var(--sugu-border)' }}>
                            <span className="sugu-publish-page__address-dot" style={{ backgroundColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'transparent' }} />
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--sugu-ink)' }}>Adresse précise</div>
                          </div>
                        </div>

                      </div>

                      {(delivery === 'main' || delivery === 'both') && (
                        <div style={{ fontSize: '11.5px', color: '#D4380D', marginTop: '6px', fontWeight: 500 }}>
                          💡 L'adresse précise est requise pour la remise en main propre.
                        </div>
                      )}

                      {addressMode === "precise" && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <input
                            type="text"
                            ref={setInputRef}
                            className="sugu-input"
                            style={{ flex: 1, marginTop: 0, padding: '10px 12px', fontSize: '13px', background: '#FFF' }}
                            placeholder="Ex : Angré 8e Tranche, près de la pharmacie…"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={handleGeolocate}
                            title="Me géolocaliser"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '10px 14px',
                              background: 'var(--sugu-primary)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '13px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            📍 Me localiser
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Price Negotiable Option */}
                    <div className="sugu-publish-page__field" style={{ marginTop: '16px' }}>
                      <label className="sugu-publish-page__label" style={{ marginBottom: '8px' }}>Négociabilité</label>
                      <div 
                        className="sugu-publish-page__checkbox-row" 
                        onClick={() => setNegotiable(!negotiable)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          border: '1.5px solid var(--sugu-border)',
                          borderRadius: '12px',
                          background: '#FFF',
                          cursor: 'pointer'
                        }}
                      >
                        <span 
                          className="sugu-publish-page__checkbox" 
                          style={{
                            borderColor: negotiable ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                            backgroundColor: negotiable ? 'var(--sugu-primary)' : 'transparent',
                            margin: 0
                          }}
                        >
                          {negotiable ? '✓' : ''}
                        </span>
                        <span style={{ fontSize: '14px', color: 'var(--sugu-ink)', fontWeight: 600 }}>
                          Le prix est négociable
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: AI Prompt Textarea & Generation */}
                  <div className="sugu-ia-studio__prompt-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #f7f0ff 0%, #edf2ff 100%)',
                      border: '2px solid #dcd0ff',
                      borderRadius: '20px',
                      padding: '30px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignSelf: 'flex-start',
                      position: 'relative'
                    }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#3A0088', margin: '0 0 10px 0', fontFamily: 'var(--sugu-font-heading)' }}>
                          Décrivez votre article 🪄
                        </h3>
                        <p style={{ fontSize: '13.5px', color: '#5C5870', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                          Saisissez une description libre (ex: *"Vends iPhone 13 Pro Max 256 Go couleur or en très bon état avec boîte d'origine à 450 000 FCFA"*). L'IA en extraira automatiquement le titre, le prix, la catégorie et les spécifications techniques.
                        </p>

                        {iaLoading ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
                            <div className="sugu-spinner" style={{ border: '3px solid #E2D8FF', borderTop: '3px solid #6200EE', width: '32px', height: '32px', borderRadius: '50%', animation: 'sugu-spin 1s linear infinite' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6200EE', animation: 'sugu-pulse 1.5s ease-in-out infinite', textAlign: 'center' }}>
                              Analyse et génération en cours...
                            </span>
                          </div>
                        ) : (
                          <textarea
                            placeholder="Écrivez ici la description de votre annonce..."
                            value={iaPrompt}
                            onChange={(e) => setIaPrompt(e.target.value)}
                            style={{
                              width: '100%',
                              height: '140px',
                              border: '1.5px solid #dcd0ff',
                              borderRadius: '12px',
                              padding: '14px',
                              fontSize: '14px',
                              resize: 'none',
                              lineHeight: 1.5,
                              outline: 'none',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box',
                              background: '#FFF'
                            }}
                            required
                          />
                        )}
                      </div>

                      {!iaLoading && (
                        <button
                          type="button"
                          className="sugu-button"
                          onClick={handleIAGeneration}
                          style={{
                            background: 'linear-gradient(90deg, #6200EE 0%, #8700FF 100%)',
                            color: '#FFF',
                            border: 'none',
                            padding: '14px 24px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '15px',
                            boxShadow: '0 4px 15px rgba(98, 0, 238, 0.2)',
                            marginTop: '20px'
                          }}
                        >
                          Générer l'annonce ➔
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* STEP 1: CATEGORY */}
            {step === 1 && (
              <div>
                <p className="sugu-publish-page__sub-label">Dans quelle catégorie souhaitez-vous publier votre annonce ?</p>
                <div className="sugu-publish-page__categories-grid">
                  {CATEGORIES.map(cat => {
                    const isSelected = category === cat.label;
                    return (
                      <div
                        key={cat.id}
                        className="sugu-publish-page__tile"
                        onClick={() => { setCategory(cat.label); setSubcategory(""); }}
                        style={{
                          backgroundColor: isSelected ? '#F7ECE0' : 'var(--sugu-surface)',
                          borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                          borderWidth: '2px',
                          borderStyle: 'solid'
                        }}
                      >
                        <div
                          className="sugu-publish-page__tile-icon"
                          style={{ backgroundColor: isSelected ? '#EAD7C4' : '#F2E7DA' }}
                        >
                          {cat.icon}
                        </div>
                        <div className="sugu-publish-page__tile-name">{cat.label}</div>
                      </div>
                    );
                  })}
                </div>

                {category && (
                  <div className="sugu-publish-page__subcategories">
                    <div className="sugu-publish-page__section-title">Sous-catégorie · {category}</div>
                    <div className="sugu-publish-page__options-wrap">
                      {SUBCATEGORIES[category]?.map(sub => {
                        const isSelected = subcategory === sub;
                        return (
                          <div
                            key={sub}
                            className="sugu-publish-page__btn-option"
                            onClick={() => setSubcategory(sub)}
                            style={{
                              backgroundColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-surface)',
                              color: isSelected ? '#fff' : '#4A443D',
                              borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                              borderWidth: '1.5px',
                              borderStyle: 'solid'
                            }}
                          >
                            {sub}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
              <div className="sugu-publish-page__field-group">
                <div className="sugu-publish-page__field">
                  <label className="sugu-publish-page__label">Titre de l'annonce <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="sugu-input"
                    placeholder="Ex : iPhone 13 Pro 256 Go, neuf sous blister"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <div className="sugu-publish-page__input-hint">Un bon titre est court, précis et mentionne l'état.</div>
                </div>

                <div className="sugu-publish-page__field">
                  <label className="sugu-publish-page__label">Description <span style={{ color: 'red' }}>*</span></label>
                  <textarea
                    className="sugu-input"
                    style={{ height: '140px', resize: 'vertical', lineHeight: 1.5 }}
                    placeholder="Décrivez votre article : caractéristiques, état, accessoires inclus, raison de la vente…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {category !== "Emploi" && category !== "Immobilier" && category !== "Services" && (
                  <div className="sugu-publish-page__field">
                    <label className="sugu-publish-page__label">État <span style={{ color: 'red' }}>*</span></label>
                    <div className="sugu-publish-page__options-wrap">
                      {CONDITIONS.map(cond => {
                        const isSelected = condition === cond;
                        return (
                          <div
                            key={cond}
                            className="sugu-publish-page__btn-option"
                            onClick={() => setCondition(cond)}
                            style={{
                              backgroundColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-surface)',
                              color: isSelected ? '#fff' : '#4A443D',
                              borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                              borderWidth: '1.5px',
                              borderStyle: 'solid'
                            }}
                          >
                            {cond}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {renderSpecFields()}
              </div>
            )}

            {/* STEP 3: PHOTOS & PRICE */}
            {step === 3 && (
              <div className="sugu-publish-page__field-group">
                
                {/* Photos zone */}
                <div className="sugu-publish-page__field">
                  <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <label className="sugu-publish-page__label" style={{ marginBottom: 0 }}>
                      {category === "Emploi" ? "Logo de l'entreprise ou image de l'offre" : "Photos"}{" "}
                      <span style={{ color: 'var(--sugu-ink-faint)', fontWeight: 400 }}>
                        {category === "Emploi" ? "(Optionnel)" : "(la 1ʳᵉ sera la couverture)"}
                      </span>
                    </label>
                    <span style={{ fontFamily: 'var(--sugu-font-mono)', fontSize: '12px', color: 'var(--sugu-ink-faint)' }}>
                      {photos.length} / 8
                    </span>
                  </div>

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                      borderWidth: '2px',
                      borderStyle: 'dashed',
                      borderColor: dragOver ? 'var(--sugu-primary)' : '#DCCFBC',
                      backgroundColor: dragOver ? '#F7ECE0' : 'transparent',
                      borderRadius: '18px',
                      padding: '18px'
                    }}
                  >
                    {photos.length === 0 ? (
                      <label className="sugu-publish-page__dropzone-label">
                        <div className="sugu-publish-page__dropzone-icon">📷</div>
                        <div className="sugu-publish-page__dropzone-title">
                          {category === "Emploi" ? "Glissez le logo ou l'image ici" : "Glissez vos photos ici"}
                        </div>
                        <div className="sugu-publish-page__dropzone-desc">
                          {category === "Emploi" ? "ou cliquez pour parcourir · JPG, PNG" : "ou cliquez pour parcourir · JPG, PNG · 8 max"}
                        </div>
                        <span className="sugu-publish-page__dropzone-btn">
                          {category === "Emploi" ? "Choisir un logo / image" : "Choisir des photos"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple={category !== "Emploi"}
                          ref={fileInputRef}
                          onChange={(e) => handleFiles(e.target.files)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ) : (
                      <div className="sugu-publish-page__photo-grid">
                        {photos.map((src, i) => (
                          <div key={i} className="sugu-publish-page__photo-tile" style={{
                            borderColor: i === 0 ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                            borderWidth: '2px',
                            borderStyle: 'solid'
                          }}>
                            <img src={src} alt="Vignette" />
                            {i === 0 && <span className="sugu-publish-page__photo-cover-badge">★ Couverture</span>}
                            <button
                              type="button"
                              className="sugu-publish-page__photo-remove-btn"
                              onClick={(e) => handleRemovePhoto(i, e)}
                            >
                              ✕
                            </button>
                            <div className="sugu-publish-page__photo-controls">
                              <button type="button" className="sugu-publish-page__photo-control-btn" onClick={(e) => handleMovePhoto(i, -1, e)}>
                                ◀
                              </button>
                              {i !== 0 && (
                                <button
                                  type="button"
                                  className="sugu-publish-page__photo-control-btn sugu-publish-page__photo-control-btn--cover"
                                  title="Définir comme couverture"
                                  onClick={(e) => handleSetCover(i, e)}
                                >
                                  ★
                                </button>
                              )}
                              <button type="button" className="sugu-publish-page__photo-control-btn" onClick={(e) => handleMovePhoto(i, 1, e)}>
                                ▶
                              </button>
                            </div>
                          </div>
                        ))}
                        {photos.length < 8 && (
                          <label className="sugu-publish-page__photo-add-more">
                            <span style={{ fontSize: '26px' }}>＋</span>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Ajouter</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFiles(e.target.files)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Video upload */}
                {category !== "Emploi" && (
                  <div className="sugu-publish-page__field">
                    <label className="sugu-publish-page__label">Vidéo <span style={{ color: 'var(--sugu-ink-faint)', fontWeight: 400 }}>(optionnel)</span></label>
                    {!video ? (
                      <label className="sugu-publish-page__video-upload-bar">
                        <span className="sugu-publish-page__video-icon">🎬</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--sugu-ink)' }}>Ajouter une vidéo de présentation</div>
                          <div style={{ fontSize: '12px', color: 'var(--sugu-ink-faint)' }}>MP4, MOV · 30 s recommandé</div>
                        </div>
                        <span className="sugu-publish-page__dropzone-btn" style={{ background: '#F2E7DA', color: '#6E4A32', marginTop: 0 }}>Parcourir</span>
                        <input type="file" accept="video/*" onChange={handleVideoInput} style={{ display: 'none' }} />
                      </label>
                    ) : (
                      <div className="sugu-publish-page__video-added-bar">
                        <span className="sugu-publish-page__video-icon-active">🎬</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--sugu-secondary-hover)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {video}
                          </div>
                          <div style={{ fontSize: '12px', color: '#3E8378' }}>Vidéo ajoutée</div>
                        </div>
                        <button type="button" className="sugu-publish-page__video-remove-btn" onClick={() => setVideo(null)}>
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Price input */}
                <div className="sugu-publish-page__field">
                  <label className="sugu-publish-page__label">
                    {category === "Emploi" 
                      ? "Salaire mensuel proposé" 
                      : (subcategory === "Location de car"
                         ? "Tarif journalier (Location)"
                         : (category === "Immobilier" 
                            ? (specs.type_transaction === "Location" 
                               ? "Loyer mensuel" 
                               : (specs.type_transaction === "Location Saisonnière" 
                                  ? "Loyer par jour" 
                                  : "Prix de vente")) 
                            : "Prix"))}
                  </label>
                  <div className="sugu-input-wrapper" style={{ maxWidth: '320px', overflow: 'hidden' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="sugu-publish-page__price-input"
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <span className="sugu-publish-page__price-suffix">FCFA</span>
                  </div>
                  
                  <div className="sugu-publish-page__checkbox-row" onClick={() => setNegotiable(!negotiable)}>
                    <span
                      className="sugu-publish-page__checkbox-box"
                      style={{
                        borderColor: negotiable ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                        backgroundColor: negotiable ? 'var(--sugu-primary)' : 'transparent'
                      }}
                    >
                      {negotiable ? '✓' : ''}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#4A443D' }}>
                      {category === "Emploi" ? "Salaire à discuter / Non spécifié" : "Prix négociable"}
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 4: LOCATION & DELIVERY */}
            {step === 4 && (
              <div className="sugu-publish-page__field-group">
                
                {/* Commune dropdown */}
                <div className="sugu-publish-page__field">
                  <label className="sugu-publish-page__label">Ville / Commune</label>
                  <div className="sugu-input-wrapper" style={{ maxWidth: '360px', padding: '0 14px', gap: '8px' }}>
                    <span style={{ color: 'var(--sugu-secondary)' }}>📍</span>
                    <select
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '15px',
                        color: 'var(--sugu-ink)',
                        padding: '13px 4px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Choisir une commune…</option>
                      {(COMMUNES.includes(commune) || !commune ? COMMUNES : [...COMMUNES, commune]).map(c => (
                        <option key={c} value={c}>
                          {c === commune && ville && ville !== "Abidjan" && ville !== commune ? `${c} (${ville})` : c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Precision address selection */}
                <div className="sugu-publish-page__field">
                  <label className="sugu-publish-page__label">Précision de l'adresse</label>
                  <div className="sugu-publish-page__address-options">
                    
                    {/* Approx Mode */}
                    <div
                      className="sugu-publish-page__address-btn"
                      onClick={() => {
                        if (delivery === 'main' || delivery === 'both') return;
                        setAddressMode("approx");
                      }}
                      style={{
                        backgroundColor: addressMode === "approx" ? '#F7ECE0' : 'var(--sugu-surface)',
                        borderColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                        opacity: (delivery === 'main' || delivery === 'both') ? 0.45 : 1,
                        cursor: (delivery === 'main' || delivery === 'both') ? 'not-allowed' : 'pointer',
                        pointerEvents: (delivery === 'main' || delivery === 'both') ? 'none' : 'auto'
                      }}
                    >
                      <span className="sugu-publish-page__address-ring" style={{ borderColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'var(--sugu-border)' }}>
                        <span className="sugu-publish-page__address-dot" style={{ backgroundColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'transparent' }} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--sugu-ink)' }}>Zone approximative</div>
                        <div style={{ fontSize: '13px', color: 'var(--sugu-ink-faint)', marginTop: '2px' }}>
                          {(delivery === 'main' || delivery === 'both') 
                            ? "Désactivé : l'adresse précise du lieu de retrait est requise pour la remise en main propre." 
                            : "Seul le quartier/commune est affiché — recommandé pour votre sécurité."}
                        </div>
                      </div>
                    </div>

                    {/* Precise Mode */}
                    <div
                      className="sugu-publish-page__address-btn"
                      onClick={() => setAddressMode("precise")}
                      style={{
                        backgroundColor: addressMode === "precise" ? '#F7ECE0' : 'var(--sugu-surface)',
                        borderColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'var(--sugu-border)'
                      }}
                    >
                      <span className="sugu-publish-page__address-ring" style={{ borderColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'var(--sugu-border)' }}>
                        <span className="sugu-publish-page__address-dot" style={{ backgroundColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'transparent' }} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--sugu-ink)' }}>Adresse précise</div>
                        <div style={{ fontSize: '13px', color: 'var(--sugu-ink-faint)', marginTop: '2px' }}>
                          {(delivery === 'main' || delivery === 'both') 
                            ? "Utilisée comme lieu de rendez-vous lors de la remise en main propre." 
                            : "L'adresse complète est visible par les acheteurs intéressés."}
                        </div>
                      </div>
                    </div>

                  </div>

                  {addressMode === "precise" && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', maxWidth: '520px' }}>
                      <input
                        type="text"
                        ref={setInputRef}
                        className="sugu-input"
                        style={{ flex: 1, marginTop: 0 }}
                        placeholder="Ex : Angré 8e Tranche, près de la pharmacie…"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleGeolocate}
                        title="Me géolocaliser"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '12px 16px',
                          background: 'var(--sugu-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px',
                          whiteSpace: 'nowrap',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                      >
                        📍 Me localiser
                      </button>
                    </div>
                  )}
                </div>

                {/* Delivery checkboxes */}
                {category !== "Emploi" && category !== "Immobilier" && category !== "Services" && (
                  <div className="sugu-publish-page__field">
                    <label className="sugu-publish-page__label">Mode de livraison</label>
                    <div className="sugu-publish-page__options-wrap" style={{ maxWidth: '560px' }}>
                      {[
                        { v: "main", icon: "🤝", label: "Remise en main propre" },
                        { v: "livraison", icon: "🚚", label: "Livraison possible" },
                        { v: "both", icon: "✨", label: "Les deux" }
                      ].map(d => {
                        const isSelected = delivery === d.v;
                        return (
                          <div
                            key={d.v}
                            className="sugu-publish-page__tile"
                            onClick={() => setDelivery(d.v)}
                            style={{
                              flex: 1,
                              backgroundColor: isSelected ? '#F7ECE0' : 'var(--sugu-surface)',
                              borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                              borderWidth: '1.5px',
                              borderStyle: 'solid',
                              padding: '18px 12px'
                            }}
                          >
                            <span style={{ fontSize: '24px' }}>{d.icon}</span>
                            <span className="sugu-publish-page__tile-name" style={{ fontSize: '13px', color: 'var(--sugu-ink)' }}>{d.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {(delivery === "livraison" || delivery === "both") && (
                      <div style={{
                        background: '#FFF7E6',
                        border: '1px solid #FFE7BA',
                        borderRadius: '12px',
                        padding: '16px',
                        marginTop: '16px',
                        maxWidth: '560px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '20px' }}>🛡️</span>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '13.5px', color: '#D4380D', fontWeight: 'bold' }}>
                            Obligations de livraison sécurisée
                          </h4>
                          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--sugu-ink-soft)', lineHeight: 1.4 }}>
                            En activant la livraison à domicile, vous acceptez les règles du service Sugu :<br/>
                            1. Dès l'achat par un client, vous devez obligatoirement <b>emballer l'article dans un carton solide</b>.<br/>
                            2. Vous devez imprimer et <b>coller l'étiquette d'expédition officielle</b> générée par l'application sur le colis avant de le confier au livreur (Yango).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* STEP 5: RECAP */}
            {step === 5 && (
              <div>
                <p className="sugu-publish-page__sub-label">Vérifiez votre annonce avant publication. Elle apparaîtra ainsi pour les acheteurs.</p>
                <div className="sugu-publish-page__recap-grid">
                  
                  {/* Preview Card */}
                  <div className="sugu-publish-page__preview-card">
                    <div className="sugu-publish-page__preview-media">
                      {photos.length > 0 ? (
                        <img src={photos[0]} alt="Couverture" />
                      ) : (
                        <div className="sugu-publish-page__placeholder" style={{ background: '#EADFCE', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'var(--sugu-font-mono)', fontSize: '12px', color: 'rgba(60, 40, 20, 0.5)' }}>
                            {category === "Emploi" ? "[ offre d'emploi ]" : "[ aucune photo ]"}
                          </span>
                        </div>
                      )}
                      <div className="sugu-publish-page__preview-badges">
                        {(category === "Emploi" || category === "Immobilier" || category === "Services") ? (
                          <span className="sugu-publish-page__preview-badge" style={{ backgroundColor: 'var(--sugu-primary)' }}>
                            {category === "Emploi" 
                              ? (specs.type_contrat || "Emploi") 
                              : (category === "Immobilier" 
                                 ? (specs.type_transaction || "Immobilier") 
                                 : subcategory)}
                          </span>
                        ) : (
                          <span className="sugu-publish-page__preview-badge">
                            {condition || "État"}
                          </span>
                        )}
                        {photos.length > 1 && (
                          <span className="sugu-publish-page__preview-badge sugu-publish-page__preview-badge--count">📷 {photos.length}</span>
                        )}
                      </div>
                    </div>

                    <div className="sugu-publish-page__preview-body">
                      <div className="sugu-publish-page__preview-title">{title || "Titre de votre annonce"}</div>
                      <div className="sugu-publish-page__preview-price-row">
                        <span className="sugu-publish-page__preview-price">{formatPrix(price)}</span>
                        {category !== "Emploi" && negotiable && <span className="sugu-publish-page__preview-price-negotiable">Négociable</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--sugu-ink-faint)' }}>
                        📍 {locationLabel()}
                      </div>
                      <div className="sugu-publish-page__preview-desc">
                        {description || "Aucune description ajoutée."}
                      </div>
                      {category !== "Emploi" && category !== "Immobilier" && category !== "Services" && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '13px', color: 'var(--sugu-ink-soft)' }}>
                          🚚 {deliveryLabel()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary recap list */}
                  <div className="sugu-publish-page__recap-rows">
                    {!isPublishReady() && (
                      <div style={{
                        background: '#FFF2F0',
                        border: '1.5px solid #FFCCC7',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <h4 style={{ margin: 0, color: '#FF4D4F', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px' }}>
                          ⚠️ Éléments obligatoires manquants
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#5C5870', lineHeight: 1.4 }}>
                          Certains choix indispensables pour votre annonce n'ont pas encore été complétés :
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#5C5870', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {category !== "Emploi" && photos.length === 0 && (
                            <li>
                              <strong>Photos :</strong> Au moins une photo est requise.{" "}
                              <span onClick={() => setEditingField('photos')} style={{ color: 'var(--sugu-primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>
                                Ajouter des photos ➔
                              </span>
                            </li>
                          )}
                          {category !== "Emploi" && price === "" && (
                            <li>
                              <strong>Prix :</strong> Le tarif de vente ou location est requis.{" "}
                              <span onClick={() => setEditingField('price')} style={{ color: 'var(--sugu-primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>
                                Saisir le prix ➔
                              </span>
                            </li>
                          )}
                          {!commune && (
                            <li>
                              <strong>Localisation :</strong> La commune est requise.{" "}
                              <span onClick={() => setEditingField('location')} style={{ color: 'var(--sugu-primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>
                                Choisir la commune ➔
                              </span>
                            </li>
                          )}
                          {category !== "Emploi" && category !== "Immobilier" && category !== "Services" && !delivery && (
                            <li>
                              <strong>Mode de livraison :</strong> Le mode de remise est requis.{" "}
                              <span onClick={() => setEditingField('delivery')} style={{ color: 'var(--sugu-primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>
                                Sélectionner la livraison ➔
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
 
                    {(category === "Emploi" ? [
                      { label: "Catégorie", value: (category || "—") + (subcategory ? ` · ${subcategory}` : ""), field: 'category' },
                      ...getCategorySpecsRows(),
                      { label: "Salaire", value: formatPrix(price), field: 'price' },
                      { label: "Localisation", value: locationLabel(), field: 'location' }
                    ] : [
                      { label: "Catégorie", value: (category || "—") + (subcategory ? ` · ${subcategory}` : ""), field: 'category' },
                      { label: "Photos", value: photos.length > 0 ? `${photos.length} photo(s) ajoutée(s)` : "Aucune photo", field: 'photos' },
                      ...((category !== "Immobilier" && category !== "Services") ? [{ label: "État", value: condition || "—", field: 'details' }] : []),
                      ...getCategorySpecsRows(),
                      { label: "Prix", value: formatPrix(price) + (negotiable ? " · négociable" : ""), field: 'price' },
                      { label: "Localisation", value: locationLabel(), field: 'location' },
                      ...((category !== "Immobilier" && category !== "Services") ? [{ label: "Livraison", value: deliveryLabel(), field: 'delivery' }] : [])
                    ]).map(row => (
                      <div key={row.label} className="sugu-publish-page__recap-row">
                        <div className="sugu-publish-page__recap-info">
                          <div className="sugu-publish-page__recap-label">{row.label}</div>
                          <div className="sugu-publish-page__recap-value">{row.value}</div>
                        </div>
                        <button type="button" className="sugu-publish-page__recap-edit" onClick={() => setEditingField(row.field)}>
                          Modifier
                        </button>
                      </div>
                    ))}

                    {category !== "Emploi" && category !== "Immobilier" && category !== "Services" && (
                      <div style={{ marginTop: '24px', padding: '16px', background: 'var(--sugu-surface)', border: '1px solid var(--sugu-border)', borderRadius: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: 'var(--sugu-ink)' }}>
                          <input
                            type="checkbox"
                            checked={invoiceProvided}
                            onChange={(e) => setInvoiceProvided(e.target.checked)}
                            style={{
                              width: '18px',
                              height: '18px',
                              accentColor: 'var(--sugu-primary)',
                              cursor: 'pointer'
                            }}
                          />
                          <span>Facture fournie (Je possède la facture d'achat de cet article)</span>
                        </label>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </>
        ) : (
          /* SUCCESS SCREEN */
          selectedBoosts.length > 0 ? (
            <div className="sugu-publish-page__success">
              <div className="sugu-publish-page__success-icon" style={{ background: '#E6F7ED', color: '#2E7D32' }}>✓</div>
              <h1 className="sugu-publish-page__success-title">Annonce publiée et boostée !</h1>
              <p className="sugu-publish-page__success-desc">
                Votre annonce « <b>{title || "Titre de l'annonce"}</b> » est désormais en ligne. Vos boosts ont bien été activés suite à votre paiement de <b>{calculateBoostTotal().toLocaleString("fr-FR")} FCFA</b>.
              </p>
              
              <div style={{
                background: '#FAF9F6',
                border: '1px solid #EADFCE',
                borderRadius: '16px',
                padding: '20px',
                margin: '24px 0',
                textAlign: 'left',
                width: '100%',
                maxWidth: '520px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 'bold' }}>Boosts actifs sur cette annonce :</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  {selectedBoosts.map(b => {
                    const labels = {
                      a_la_une_7j: "En tête de liste (7 jours) — 7 000 FCFA",
                      a_la_une_30j: "En tête de liste (30 jours) — 11 000 FCFA",
                      remonte_7j: "Remontée quotidienne (7 jours) — 4 000 FCFA",
                      remonte_30j: "Remontée quotidienne (30 jours) — 9 000 FCFA",
                      remonte_hebdo_8s: "Remontée hebdomadaire (8 semaines) — 6 000 FCFA",
                      urgente: "Annonce Urgente (Badge & Filtres) — 2 000 FCFA"
                    };
                    return (
                      <li key={b} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>✓ {labels[b].split(' — ')[0]}</span>
                        <b>{labels[b].split(' — ')[1]}</b>
                      </li>
                    );
                  })}
                </ul>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid #EADFCE', paddingTop: '12px' }}>
                  <span>Montant Payé :</span>
                  <span style={{ color: 'var(--sugu-primary)' }}>{calculateBoostTotal().toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
              
              <div className="sugu-publish-page__success-actions">
                <button
                  type="button"
                  className="sugu-publish-page__success-btn-primary"
                  onClick={() => navigate('/tableau-de-bord?tab=listings')}
                >
                  Accéder à mon tableau de bord
                </button>
              </div>
            </div>
          ) : (
            <div className="sugu-publish-page__success">
              <div className="sugu-publish-page__success-icon">✓</div>
              <h1 className="sugu-publish-page__success-title">Annonce publiée !</h1>
              <p className="sugu-publish-page__success-desc">
                Votre annonce « {title || "Titre de l'annonce"} » est en ligne et visible par des milliers d'acheteurs à Abidjan.
              </p>
              <div className="sugu-publish-page__success-actions">
                <button
                  type="button"
                  className="sugu-publish-page__success-btn-primary"
                  onClick={() => navigate('/tableau-de-bord?tab=listings')}
                >
                  Voir mon annonce
                </button>
                <button
                  type="button"
                  className="sugu-publish-page__success-btn-outline"
                  onClick={handleRestart}
                >
                  Déposer une autre annonce
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* ================= STICKY ACTION NAV FOOTER ================= */}
      {!published && (
        <div className="sugu-publish-page__footer">
          <div className="sugu-publish-page__footer-inner">
            
            {step > 1 && (
              <button type="button" className="sugu-publish-page__footer-btn-back" onClick={handlePrev}>
                ‹ Précédent
              </button>
            )}

            <button
              type="button"
              className="sugu-link"
              onClick={handleSaveDraft}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--sugu-ink-faint)',
                border: 'none',
                background: 'none',
                cursor: 'pointer'
              }}
            >
              Enregistrer en brouillon
            </button>

            <div style={{ flex: 1 }} />

            {step < 5 ? (
              step > 0 ? (
                <button
                  type="button"
                  className="sugu-publish-page__footer-btn-next"
                  disabled={!canGoNext()}
                  onClick={handleNext}
                  style={{
                    backgroundColor: canGoNext() ? 'var(--sugu-primary)' : '#E6DDCE',
                    color: canGoNext() ? '#fff' : 'var(--sugu-ink-faint)',
                    opacity: canGoNext() ? 1 : 0.75
                  }}
                >
                  Suivant ›
                </button>
              ) : null
            ) : (
              <button
                type="button"
                className="sugu-publish-page__footer-btn-publish"
                onClick={handlePublish}
                disabled={envoi || !isPublishReady()}
                style={{
                  backgroundColor: isPublishReady() ? 'var(--sugu-primary)' : '#E6DDCE',
                  color: isPublishReady() ? '#fff' : 'var(--sugu-ink-faint)',
                  cursor: isPublishReady() ? 'pointer' : 'not-allowed',
                  opacity: isPublishReady() ? 1 : 0.75
                }}
              >
                {envoi ? 'Publication en cours...' : '✓ Publier l\'annonce'}
              </button>
            )}

          </div>
        </div>
      )}

      {/* Toasts */}
      {draftSaved && (
        <div className="sugu-publish-page__toast">
          <span>💾</span> Brouillon enregistré
        </div>
      )}

      {toastMessage && (
        <div className="sugu-publish-page__toast">
          <span>✔️</span> {toastMessage}
        </div>
      )}

      <PopupCompleterProfil
        isOpen={profilIncompletOpen}
        onClose={handlePopupClose}
        onSuccess={() => setProfilIncompletOpen(false)}
      />

      {boostModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 12, 10, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#FAF9F6',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            
            <div style={{ position: 'sticky', top: 0, background: '#FAF9F6', zIndex: 10, padding: '24px 32px 16px 32px', borderBottom: '1px solid #EADFCE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'var(--sugu-font-heading)', color: 'var(--sugu-ink)' }}>
                  ⚡ Booster la visibilité
                </h2>
                <p style={{ color: 'var(--sugu-ink-soft)', fontSize: '14px', margin: 0 }}>Vendez jusqu'à 5 fois plus vite en mettant votre annonce en avant.</p>
              </div>
              <button type="button" onClick={() => setBoostModalOpen(false)} style={{ background: '#F0EBE1', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>×</button>
            </div>

            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {/* Card 1: A la une */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>📌</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px 0', color: '#211D18', fontFamily: 'var(--sugu-font-heading)' }}>En Tête de Liste</h3>
                  <p style={{ fontSize: '13px', color: 'var(--sugu-ink-faint)', margin: '0 0 20px 0', lineHeight: 1.4 }}>Première ou deuxième position dans sa catégorie.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                    {[
                      { id: 'a_la_une_7j', label: "7 jours", price: "7 000" },
                      { id: 'a_la_une_30j', label: "30 jours", price: "11 000" }
                    ].map(opt => {
                      const active = selectedBoosts.includes(opt.id);
                      return (
                        <label key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: active ? '#FFF7E6' : '#FFFFFF', border: active ? '1px solid var(--sugu-primary)' : '1px solid #E6DDCE', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#211D18' }}>
                            <input type="checkbox" checked={active} onChange={() => handleToggleBoost(opt.id)} style={{ accentColor: 'var(--sugu-primary)' }} />
                            {opt.label}
                          </span>
                          <span style={{ fontWeight: 800, color: 'var(--sugu-primary)', fontSize: '14px' }}>{opt.price} F</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Card 2: Remonter */}
                <div style={{ background: '#FFFFFF', border: '2px solid var(--sugu-primary)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--sugu-primary)', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '16px', textTransform: 'uppercase' }}>Recommandé 🔥</div>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>⬆️</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px 0', color: '#211D18', fontFamily: 'var(--sugu-font-heading)' }}>Remontée Auto</h3>
                  <p style={{ fontSize: '13px', color: 'var(--sugu-ink-faint)', margin: '0 0 20px 0', lineHeight: 1.4 }}>Remonte en haut des résultats automatiquement.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                    {[
                      { id: 'remonte_7j', label: "Chaque jour (7j)", price: "4 000" },
                      { id: 'remonte_30j', label: "Chaque jour (30j)", price: "9 000" },
                      { id: 'remonte_hebdo_8s', label: "Hebdomadaire (8s)", price: "6 000" }
                    ].map(opt => {
                      const active = selectedBoosts.includes(opt.id);
                      return (
                        <label key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: active ? '#FFF7E6' : '#FFFFFF', border: active ? '1px solid var(--sugu-primary)' : '1px solid #E6DDCE', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#211D18' }}>
                            <input type="checkbox" checked={active} onChange={() => handleToggleBoost(opt.id)} style={{ accentColor: 'var(--sugu-primary)' }} />
                            {opt.label}
                          </span>
                          <span style={{ fontWeight: 800, color: 'var(--sugu-primary)', fontSize: '14px' }}>{opt.price} F</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Card 3: Urgente */}
                <div style={{ background: '#1F1A15', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#E29E3E', color: '#1F1A15', fontSize: '10px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '16px', textTransform: 'uppercase' }}>Ultra-Visibilité 👑</div>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>🚨</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px 0', color: '#FFFFFF', fontFamily: 'var(--sugu-font-heading)' }}>Annonce Urgente</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', margin: '0 0 20px 0', lineHeight: 1.4 }}>Badge Urgent et filtrage prioritaire instantané.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                    {[
                      { id: 'urgente', label: "Durée de l'annonce", price: "2 000" }
                    ].map(opt => {
                      const active = selectedBoosts.includes(opt.id);
                      return (
                        <label key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: active ? '#3A3129' : '#2C251F', border: active ? '1px solid #E29E3E' : '1px solid #4A3E34', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                            <input type="checkbox" checked={active} onChange={() => handleToggleBoost(opt.id)} style={{ accentColor: '#E29E3E' }} />
                            {opt.label}
                          </span>
                          <span style={{ fontWeight: 800, color: '#E29E3E', fontSize: '14px' }}>{opt.price} F</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seamless Payment Integration */}
              {calculateBoostTotal() > 0 && (
                <div style={{ background: '#FFFFFF', border: '1px solid #EADFCE', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--sugu-ink)', fontFamily: 'var(--sugu-font-heading)' }}>📱 Paiement Mobile Money</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
                    
                    <div style={{ flex: '1 1 250px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--sugu-ink-soft)', marginBottom: '8px' }}>Sélectionnez l'opérateur</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                          { name: 'Orange', logo: orangeLogo, bgSelected: '#FFF8F2', borderSelected: '#FF6600', color: '#D35400' },
                          { name: 'MTN', logo: mtnLogo, bgSelected: '#FFFDF2', borderSelected: '#F39C12', color: '#B7950B' },
                          { name: 'Wave', logo: waveLogo, bgSelected: '#F2FAFF', borderSelected: '#4A90E2', color: '#2980B9' }
                        ].map(op => {
                          const isSel = selectedOperator === op.name;
                          return (
                            <button key={op.name} type="button" onClick={() => setSelectedOperator(op.name)} style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', background: isSel ? op.bgSelected : '#F7F5F0', border: isSel ? `1px solid ${op.borderSelected}` : '1px solid transparent', fontWeight: 700, fontSize: '12px', color: isSel ? op.color : 'var(--sugu-ink-soft)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                              <img src={op.logo} alt={op.name} style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} />
                              {op.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ flex: '1 1 250px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--sugu-ink-soft)', marginBottom: '8px' }}>Numéro de téléphone</label>
                      <input type="tel" className="sugu-input" style={{ width: '100%', boxSizing: 'border-box', marginTop: 0 }} placeholder="Ex : 07 08 09 10 11" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={paymentLoading} />
                      <div style={{ fontSize: '11.5px', color: 'var(--sugu-ink-faint)', marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span>🔒</span> Paiement sécurisé. Une notification apparaîtra sur votre téléphone pour valider.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'sticky', bottom: 0, background: '#FAF9F6', padding: '20px 32px', borderTop: '1px solid #EADFCE', zIndex: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderRadius: '0 0 24px 24px' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--sugu-ink-faint)' }}>Total à payer :</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: calculateBoostTotal() > 0 ? 'var(--sugu-primary)' : 'var(--sugu-ink)' }}>
                  {calculateBoostTotal() > 0 ? `${calculateBoostTotal().toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => handleConfirmPublish(false)} style={{ padding: '12px 20px', border: '1px solid var(--sugu-border)', background: '#fff', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: 'var(--sugu-ink-soft)', fontSize: '14px' }}>
                  Publier (Gratuit)
                </button>
                
                <button type="button" onClick={calculateBoostTotal() > 0 ? handlePay : () => handleConfirmPublish(true)} disabled={paymentLoading} style={{ padding: '12px 24px', border: 'none', background: 'var(--sugu-primary)', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(224, 86, 36, 0.2)' }}>
                  {paymentLoading ? (
                    <><span style={{ width: '16px', height: '16px', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'sugu-spin 0.8s linear infinite', display: 'inline-block' }} /> Traitement...</>
                  ) : (
                    calculateBoostTotal() > 0 ? `Payer et Publier 🚀` : "Publier l'annonce"
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      , document.body)}

      {/* ================= EDIT FIELD MODAL (inline edit on Recap) ================= */}
      {editingField && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 12, 10, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#FAF9F6',
            width: '100%',
            maxWidth: editingField === 'photos' ? '680px' : '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            
            {/* Modal Header */}
            <div style={{ position: 'sticky', top: 0, background: '#FAF9F6', zIndex: 10, padding: '20px 24px', borderBottom: '1px solid #EADFCE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, fontFamily: 'var(--sugu-font-heading)', color: 'var(--sugu-ink)' }}>
                {editingField === 'photos' && "Modifier les photos"}
                {editingField === 'price' && "Modifier le prix"}
                {editingField === 'location' && "Modifier la localisation"}
                {editingField === 'delivery' && "Modifier le mode de livraison"}
                {editingField === 'category' && "Modifier la catégorie"}
                {editingField === 'details' && "Modifier les détails"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                style={{
                  background: '#F0EBE1',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', boxSizing: 'border-box' }}>
              
              {/* EDIT PHOTOS */}
              {editingField === 'photos' && (
                <div>
                  <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <label className="sugu-publish-page__label" style={{ marginBottom: 0 }}>
                      Photos <span style={{ color: 'var(--sugu-ink-faint)', fontWeight: 400 }}>(la 1ʳᵉ sera la couverture)</span>
                    </label>
                    <span style={{ fontFamily: 'var(--sugu-font-mono)', fontSize: '12px', color: 'var(--sugu-ink-faint)' }}>
                      {photos.length} / 8
                    </span>
                  </div>

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                      borderWidth: '2px',
                      borderStyle: 'dashed',
                      borderColor: dragOver ? 'var(--sugu-primary)' : '#DCCFBC',
                      backgroundColor: dragOver ? '#F7ECE0' : 'transparent',
                      borderRadius: '18px',
                      padding: '18px'
                    }}
                  >
                    {photos.length === 0 ? (
                      <label className="sugu-publish-page__dropzone-label">
                        <div className="sugu-publish-page__dropzone-icon">📷</div>
                        <div className="sugu-publish-page__dropzone-title">Glissez vos photos ici</div>
                        <div className="sugu-publish-page__dropzone-desc">ou cliquez pour parcourir · JPG, PNG · 8 max</div>
                        <span className="sugu-publish-page__dropzone-btn">Choisir des photos</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFiles(e.target.files)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ) : (
                      <div className="sugu-publish-page__photo-grid">
                        {photos.map((src, i) => (
                          <div key={i} className="sugu-publish-page__photo-tile" style={{
                            borderColor: i === 0 ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                            borderWidth: '2px',
                            borderStyle: 'solid'
                          }}>
                            <img src={src} alt="Vignette" />
                            {i === 0 && <span className="sugu-publish-page__photo-cover-badge">★ Couverture</span>}
                            <button
                              type="button"
                              className="sugu-publish-page__photo-remove-btn"
                              onClick={(e) => handleRemovePhoto(i, e)}
                            >
                              ✕
                            </button>
                            <div className="sugu-publish-page__photo-controls">
                              <button type="button" className="sugu-publish-page__photo-control-btn" onClick={(e) => handleMovePhoto(i, -1, e)}>
                                ◀
                              </button>
                              {i !== 0 && (
                                <button
                                  type="button"
                                  className="sugu-publish-page__photo-control-btn sugu-publish-page__photo-control-btn--cover"
                                  title="Définir comme couverture"
                                  onClick={(e) => handleSetCover(i, e)}
                                >
                                  ★
                                </button>
                              )}
                              <button type="button" className="sugu-publish-page__photo-control-btn" onClick={(e) => handleMovePhoto(i, 1, e)}>
                                ▶
                              </button>
                            </div>
                          </div>
                        ))}
                        {photos.length < 8 && (
                          <label className="sugu-publish-page__photo-add-more">
                            <span style={{ fontSize: '26px' }}>＋</span>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Ajouter</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFiles(e.target.files)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EDIT PRICE */}
              {editingField === 'price' && (
                <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                  <label className="sugu-publish-page__label">
                    {category === "Emploi" 
                      ? "Salaire mensuel proposé" 
                      : (subcategory === "Location de car"
                         ? "Tarif journalier (Location)"
                         : (category === "Immobilier" 
                            ? (specs.type_transaction === "Location" 
                               ? "Loyer mensuel" 
                               : (specs.type_transaction === "Location Saisonnière" 
                                  ? "Loyer par jour" 
                                  : "Prix de vente")) 
                            : "Prix"))}
                  </label>
                  <div className="sugu-input-wrapper" style={{ overflow: 'hidden' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="sugu-publish-page__price-input"
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <span className="sugu-publish-page__price-suffix">FCFA</span>
                  </div>
                  
                  <div className="sugu-publish-page__checkbox-row" onClick={() => setNegotiable(!negotiable)} style={{ marginTop: '16px' }}>
                    <span
                      className="sugu-publish-page__checkbox-box"
                      style={{
                        borderColor: negotiable ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                        backgroundColor: negotiable ? 'var(--sugu-primary)' : 'transparent'
                      }}
                    >
                      {negotiable ? '✓' : ''}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#4A443D' }}>
                      {category === "Emploi" ? "Salaire à discuter / Non spécifié" : "Prix négociable"}
                    </span>
                  </div>
                </div>
              )}

              {/* EDIT LOCATION */}
              {editingField === 'location' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label">Ville / Commune</label>
                    <div className="sugu-input-wrapper" style={{ padding: '0 14px', gap: '8px' }}>
                      <span style={{ color: 'var(--sugu-secondary)' }}>📍</span>
                      <select
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: '15px',
                          color: 'var(--sugu-ink)',
                          padding: '13px 4px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Choisir une commune…</option>
                        {(COMMUNES.includes(commune) || !commune ? COMMUNES : [...COMMUNES, commune]).map(c => (
                          <option key={c} value={c}>
                            {c === commune && ville && ville !== "Abidjan" && ville !== commune ? `${c} (${ville})` : c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label">Précision de l'adresse</label>
                    <div className="sugu-publish-page__address-options">
                      
                      <div
                        className="sugu-publish-page__address-btn"
                        onClick={() => setAddressMode("approx")}
                        style={{
                          backgroundColor: addressMode === "approx" ? '#F7ECE0' : 'var(--sugu-surface)',
                          borderColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'var(--sugu-border)'
                        }}
                      >
                        <span className="sugu-publish-page__address-ring" style={{ borderColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'var(--sugu-border)' }}>
                          <span className="sugu-publish-page__address-dot" style={{ backgroundColor: addressMode === "approx" ? 'var(--sugu-primary)' : 'transparent' }} />
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--sugu-ink)' }}>Zone approximative</div>
                        </div>
                      </div>

                      <div
                        className="sugu-publish-page__address-btn"
                        onClick={() => setAddressMode("precise")}
                        style={{
                          backgroundColor: addressMode === "precise" ? '#F7ECE0' : 'var(--sugu-surface)',
                          borderColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'var(--sugu-border)'
                        }}
                      >
                        <span className="sugu-publish-page__address-ring" style={{ borderColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'var(--sugu-border)' }}>
                          <span className="sugu-publish-page__address-dot" style={{ backgroundColor: addressMode === "precise" ? 'var(--sugu-primary)' : 'transparent' }} />
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--sugu-ink)' }}>Adresse précise</div>
                        </div>
                      </div>

                    </div>

                    {addressMode === "precise" && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input
                          type="text"
                          ref={setInputRef}
                          className="sugu-input"
                          style={{ flex: 1, marginTop: 0 }}
                          placeholder="Ex : Angré 8e Tranche, près de la pharmacie…"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleGeolocate}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px 16px',
                            background: 'var(--sugu-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          📍 Me localiser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EDIT DELIVERY */}
              {editingField === 'delivery' && (
                <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                  <label className="sugu-publish-page__label">Mode de livraison</label>
                  <div className="sugu-publish-page__options-wrap">
                    {[
                      { v: "main", icon: "🤝", label: "Remise en main propre" },
                      { v: "livraison", icon: "🚚", label: "Livraison possible" },
                      { v: "both", icon: "✨", label: "Les deux" }
                    ].map(d => {
                      const isSelected = delivery === d.v;
                      return (
                        <div
                          key={d.v}
                          className="sugu-publish-page__tile"
                          onClick={() => setDelivery(d.v)}
                          style={{
                            flex: 1,
                            backgroundColor: isSelected ? '#F7ECE0' : 'var(--sugu-surface)',
                            borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                            borderWidth: '1.5px',
                            borderStyle: 'solid',
                            padding: '18px 12px'
                          }}
                        >
                          <span style={{ fontSize: '24px' }}>{d.icon}</span>
                          <span className="sugu-publish-page__tile-name" style={{ fontSize: '13px', color: 'var(--sugu-ink)' }}>{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EDIT CATEGORY */}
              {editingField === 'category' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label">Catégorie</label>
                    <div className="sugu-publish-page__categories-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      {CATEGORIES.map(cat => {
                        const isSelected = category === cat.label;
                        return (
                          <div
                            key={cat.id}
                            className="sugu-publish-page__tile"
                            onClick={() => { setCategory(cat.label); setSubcategory(""); }}
                            style={{
                              backgroundColor: isSelected ? '#F7ECE0' : 'var(--sugu-surface)',
                              borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              padding: '10px',
                              minHeight: 'auto'
                            }}
                          >
                            <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                            <div className="sugu-publish-page__tile-name" style={{ fontSize: '11px', marginTop: '4px' }}>{cat.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {category && (
                    <div className="sugu-publish-page__subcategories" style={{ marginTop: 0 }}>
                      <label className="sugu-publish-page__label">Sous-catégorie (de {category})</label>
                      <div className="sugu-publish-page__options-wrap" style={{ gap: '8px' }}>
                        {SUBCATEGORIES[category]?.map(sub => {
                          const isSelected = subcategory === sub;
                          return (
                            <div
                              key={sub}
                              className="sugu-publish-page__btn-option"
                              onClick={() => setSubcategory(sub)}
                              style={{
                                backgroundColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-surface)',
                                color: isSelected ? '#fff' : '#4A443D',
                                borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                                borderWidth: '1.5px',
                                borderStyle: 'solid',
                                padding: '8px 14px',
                                fontSize: '13px'
                              }}
                            >
                              {sub}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EDIT DETAILS */}
              {editingField === 'details' && (
                <div className="sugu-publish-page__field-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label">Titre de l'annonce</label>
                    <input
                      type="text"
                      className="sugu-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label">Description</label>
                    <textarea
                      className="sugu-input"
                      style={{ height: '100px', resize: 'vertical' }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {category !== "Emploi" && category !== "Immobilier" && category !== "Services" && (
                    <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                      <label className="sugu-publish-page__label">État</label>
                      <div className="sugu-publish-page__options-wrap">
                        {CONDITIONS.map(cond => {
                          const isSelected = condition === cond;
                          return (
                            <div
                              key={cond}
                              className="sugu-publish-page__btn-option"
                              onClick={() => setCondition(cond)}
                              style={{
                                backgroundColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-surface)',
                                color: isSelected ? '#fff' : '#4A443D',
                                borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                                borderWidth: '1.5px',
                                borderStyle: 'solid'
                              }}
                            >
                              {cond}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {renderSpecFields()}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{ position: 'sticky', bottom: 0, background: '#FAF9F6', padding: '16px 24px', borderTop: '1px solid #EADFCE', zIndex: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="sugu-button"
                onClick={() => setEditingField(null)}
                style={{
                  background: 'var(--sugu-primary)',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Terminer
              </button>
            </div>

          </div>
        </div>
      , document.body)}

      {/* Spinner animation keyframes styles */}
      <style>{`
        @keyframes sugu-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
