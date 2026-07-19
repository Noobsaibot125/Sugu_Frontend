import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import ListingCard from '../components/listings/ListingCard';
import PopupLimiteAnnonces from '../components/ui/PopupLimiteAnnonces';
import PopupBoostAnnonce from '../components/ui/PopupBoostAnnonce';
import './TableauDeBord.css';
import { COMMUNES } from '../data/mock';
import imgWave from '../assets/Wave.png';
import imgOrange from '../assets/Orange.png';
import imgMTN from '../assets/MTN.png';
// Predefined mock datasets matching Sugu Espace template
const INITIAL_LISTINGS = [
  { id: "l1", title: "iPhone 13 Pro 256 Go", price: 385000, views: 342, contacts: 12, status: "Actives", tint: "#EADFCE" },
  { id: "l2", title: "MacBook Air M2 8/256", price: 720000, views: 501, contacts: 18, status: "Actives", tint: "#E9E0D0" },
  { id: "l3", title: "Casque Sony WH-1000XM4", price: 145000, views: 88, contacts: 3, status: "En attente", tint: "#E9E1D2" },
  { id: "l4", title: "Toyota Corolla 2016", price: 6800000, views: 1204, contacts: 41, status: "En pause", tint: "#E6DDD0" },
  { id: "l5", title: "Réfrigérateur Samsung", price: 180000, views: 320, contacts: 22, status: "Vendues", tint: "#E6DDCE" },
  { id: "l6", title: "Canapé d'angle 5 places", price: 220000, views: 210, contacts: 9, status: "Vendues", tint: "#E9E1D2" }
];

const FAVORITES_DATA = [
  { id: "g1", title: "Samsung Galaxy S23 Ultra", price: 480000, oldPrice: "520 000 FCFA", delta: "40 000", city: "Plateau", cond: "Neuf", tint: "#E9E1D2", imgLabel: "[ photo ]" },
  { id: "g2", title: "Toyota RAV4 2018", price: 12500000, city: "Cocody", cond: "Occasion", tint: "#E6DDD0", imgLabel: "[ photo ]" },
  { id: "g3", title: "Terrain 500 m² titré", price: 14000000, oldPrice: "15 000 000 FCFA", delta: "1 M", city: "Bingerville", cond: "Neuf", tint: "#E4DDCC", imgLabel: "[ photo ]" },
  { id: "g4", title: "AirPods Pro 2 (USB-C)", price: 95000, city: "Marcory", cond: "Neuf", tint: "#E8E0D1", imgLabel: "[ photo ]" },
  { id: "g5", title: "Villa 4 pièces à louer", price: 450000, city: "Cocody Angré", cond: "Neuf", tint: "#EADFCE", imgLabel: "[ photo ]" },
  { id: "g6", title: "Robe wax sur mesure", price: 25000, city: "Treichville", cond: "Neuf", tint: "#EDE2CF", imgLabel: "[ photo ]" }
];

const CONVO_DEFS = [
  { id: "c1", name: "Jean-Marc K.", initials: "JM", avatarBg: "#C0512E", time: "09:18", preview: "C'est possible de voir aujourd'hui ?", listing: "iPhone 13 Pro 256 Go", listingPrice: "385 000 FCFA" },
  { id: "c2", name: "Fatou D.", initials: "FD", avatarBg: "#106C62", time: "Hier", preview: "Le prix est négociable ?", listing: "MacBook Air M2 8/256", listingPrice: "720 000 FCFA" },
  { id: "c3", name: "Ibrahim S.", initials: "IS", avatarBg: "#B0791C", time: "Lun", preview: "Merci à vous 🙏", listing: "Réfrigérateur Samsung", listingPrice: "180 000 FCFA" },
  { id: "c4", name: "Aminata T.", initials: "AT", avatarBg: "#8F3A1C", time: "10:02", preview: "Vous livrez à Yopougon ?", listing: "Toyota Corolla 2016", listingPrice: "6 800 000 FCFA" }
];

const INITIAL_MESSAGES = {
  c1: [
    { fromMe: false, text: "Bonjour, l'iPhone est-il toujours disponible ?", time: "09:12" },
    { fromMe: true, text: "Bonjour ! Oui il est disponible, neuf sous blister.", time: "09:15" },
    { fromMe: false, text: "Super. C'est possible de voir aujourd'hui à Cocody ?", time: "09:18" }
  ],
  c2: [
    { fromMe: false, text: "Le prix est négociable ?", time: "Hier" }
  ],
  c3: [
    { fromMe: true, text: "Merci pour votre achat, à bientôt !", time: "Lun" },
    { fromMe: false, text: "Merci à vous 🙏", time: "Lun" }
  ],
  c4: [
    { fromMe: false, text: "Bonjour, vous livrez à Yopougon ?", time: "10:02" }
  ]
};

const mapBackendListing = (l) => {
  const backendToFrontendStatus = {
    active: "Actives",
    suspendue: "En pause",
    vendue: "Vendues",
    brouillon: "En attente"
  };
  return {
    id: l.id,
    title: l.titre,
    price: l.prix,
    views: l.vues || 0,
    contacts: l.contacts_count || l.contacts || 0,
    status: backendToFrontendStatus[l.statut] || "Actives",
    cover_url: l.cover_url,
    etat: l.etat,
    commune: l.commune,
    is_boosted: l.is_boosted || 0,
    boost_type: l.boost_type || null,
    boost_expires_at: l.boost_expires_at || null,
    negotiable: l.prix_negociable === 1,
    condition: l.etat === 'neuf' ? 'Neuf' : l.etat === 'tres_bon' ? 'Très bon état' : l.etat === 'bon' ? 'Bon état' : 'État correct',
    description: l.description,
    delivery: l.delivery
  };
};

export default function TableauDeBord() {
  const { user, deconnexion, mettreAJourUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Profile edit states
  const [profileNom, setProfileNom] = useState('');
  const [profilePrenom, setProfilePrenom] = useState('');
  const [profileTelephone, setProfileTelephone] = useState('');
  const [profileVille, setProfileVille] = useState('Abidjan');
  const [profileCommune, setProfileCommune] = useState('');
  const [profileAdresseDetail, setProfileAdresseDetail] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  // Password change states
  const [passwordActuel, setPasswordActuel] = useState('');
  const [passwordNouveau, setPasswordNouveau] = useState('');
  const [passwordConfirmer, setPasswordConfirmer] = useState('');
  const [otpModifOpen, setOtpModifOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [envoiMdp, setEnvoiMdp] = useState(false);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');

  // Edit listing states
  const [editListingModalOpen, setEditListingModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCommune, setEditCommune] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editNegotiable, setEditNegotiable] = useState(false);
  const [editDelivery, setEditDelivery] = useState('both');
  const [editPhotos, setEditPhotos] = useState([]);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Quota limite annonces
  const [limiteOpen, setLimiteOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({ count: 0, quota: 5, subName: 'Particulier Gratuit' });

  // Boost popup
  const [boostPopupOpen, setBoostPopupOpen] = useState(false);
  const [boostTarget, setBoostTarget] = useState(null); // { id, title }

  const handleOpenBoost = (listing) => {
    setBoostTarget({ id: listing.id, title: listing.title });
    setBoostPopupOpen(true);
  };

  const handleBoost = async (annonceId, boost_type, duration_days, operator, phone) => {
    await client.post(`/annonces/${annonceId}/boost`, { boost_type, duration_days, operator, phone });
    // Refresh listings to show updated boost status
    const res = await client.get('/annonces/mes/annonces');
    const mapped = res.data.map(mapBackendListing);
    setListings(mapped);
    triggerToast('Annonce boostée avec succès ! ⚡');
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



  useEffect(() => {
    if (user) {
      const parts = (user.nom || '').trim().split(/\s+/);
      const lastName = parts[0] || '';
      const firstName = parts.slice(1).join(' ') || '';
      setProfileNom(lastName);
      setProfilePrenom(firstName);
      setProfileTelephone(user.telephone?.replace(/^\+225/, '') || '');
      setProfileVille(user.adresse?.ville || 'Abidjan');
      setProfileCommune(user.adresse?.commune || '');
      setProfileAdresseDetail(user.adresse?.adresse_detail || '');
      setProfileAvatarUrl(user.avatar_url || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  const handleGenerateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}`;
    setProfileAvatarUrl(newAvatar);
    triggerToast("Nouvel avatar généré ! Enregistrez pour l'appliquer.");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        triggerToast("Téléversement de l'image...");
        const res = await client.post('/auth/televerser', { imageBase64: base64Data });
        setProfileAvatarUrl(res.data.url);
        triggerToast("Avatar importé ! N'oubliez pas d'enregistrer.");
      } catch (err) {
        triggerToast(err.response?.data?.message || "Erreur de téléversement.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profileNom.trim() || !profilePrenom.trim()) {
      triggerToast("Le nom et le prénom sont obligatoires.");
      return;
    }
    try {
      const fullNom = `${profileNom.trim()} ${profilePrenom.trim()}`;
      const formattedPhone = profileTelephone ? `+225${profileTelephone.replace(/\s/g, '')}` : '';
      const res = await client.put('/auth/profil', {
        nom: fullNom,
        email: profileEmail.trim() || null,
        telephone: formattedPhone,
        ville: profileVille,
        commune: profileCommune,
        adresse_detail: profileAdresseDetail,
        avatar_url: profileAvatarUrl
      });
      mettreAJourUser(res.data.user);
      triggerToast("Profil sauvegardé !");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur de sauvegarde.");
    }
  };

  const handleRequestPasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordActuel || !passwordNouveau || !passwordConfirmer) {
      triggerToast("Veuillez remplir tous les champs du mot de passe.");
      return;
    }
    if (passwordNouveau !== passwordConfirmer) {
      triggerToast("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (passwordNouveau.length < 8) {
      triggerToast("Le nouveau mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setEnvoiMdp(true);
    try {
      await client.post('/auth/demande-modifier-mdp', {
        motDePasseActuel: passwordActuel,
        nouveauMotDePasse: passwordNouveau
      });
      triggerToast("Code OTP envoyé !");
      setOtpModifOpen(true);
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur de demande.");
    } finally {
      setEnvoiMdp(false);
    }
  };

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      triggerToast("Veuillez saisir le code OTP.");
      return;
    }
    try {
      await client.post('/auth/confirmer-modifier-mdp', {
        code: otpCode,
        nouveauMotDePasse: passwordNouveau
      });
      triggerToast("Mot de passe modifié avec succès !");
      setOtpModifOpen(false);
      setPasswordActuel('');
      setPasswordNouveau('');
      setPasswordConfirmer('');
      setOtpCode('');
    } catch (err) {
      triggerToast(err.response?.data?.message || "Code invalide.");
    }
  };

  // Selected sidebar section/tab
  const tabParam = searchParams.get('tab') || 'overview';
  const [section, setSection] = useState(tabParam);

  // Listing statuses & messages state
  const [listingFilter, setListingFilter] = useState('Actives');
  const [listings, setListings] = useState([]);
  const [favoritesList, setFavoritesList] = useState([]);
  const [stats, setStats] = useState({
    annoncesActives: 0,
    annoncesVendues: 0,
    vuesTotales: 0,
    contactsRecus: 0
  });

  // Pro Subscription and Boutique states
  const [activeAbonnement, setActiveAbonnement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [demandePro, setDemandePro] = useState(null);
  const [boutiqueInfo, setBoutiqueInfo] = useState(null);

  const [boutiqueNom, setBoutiqueNom] = useState('');
  const [boutiqueDescription, setBoutiqueDescription] = useState('');
  const [boutiqueLogo, setBoutiqueLogo] = useState('');
  const [boutiqueHoraires, setBoutiqueHoraires] = useState('');
  const [boutiqueLienExterne, setBoutiqueLienExterne] = useState('');

  const [selectedListingIds, setSelectedListingIds] = useState([]);

  // Wallet states
  const [soldeDisponible, setSoldeDisponible] = useState(0);
  const [soldeEnAttente, setSoldeEnAttente] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletRetraits, setWalletRetraits] = useState([]);
  const [walletRecharges, setWalletRecharges] = useState([]);

  // Vlog states
  const [userVlogs, setUserVlogs] = useState([]);
  const [vlogQuota, setVlogQuota] = useState({ subscription: 'Particulier', hasSubscription: false, quotaUsed: 0, quotaMax: 0, quotaRemaining: 0 });
  const [vlogModalOpen, setVlogModalOpen] = useState(false);
  const [vlogAnnonceId, setVlogAnnonceId] = useState('');
  const [vlogType, setVlogType] = useState('upload');
  const [vlogFile, setVlogFile] = useState(null);
  const [vlogFileBase64, setVlogFileBase64] = useState('');
  const [vlogLink, setVlogLink] = useState('');
  const [vlogMoyenPaiement, setVlogMoyenPaiement] = useState('Wave');
  const [vlogPhonePaiement, setVlogPhonePaiement] = useState(user?.telephone?.replace(/^\+225/, '') || '');
  const [vlogPublishing, setVlogPublishing] = useState(false);
  const [vlogError, setVlogError] = useState('');
  const [vlogSuccess, setVlogSuccess] = useState(false);

  const loadVlogDetails = async () => {
    try {
      const vRes = await client.get('/vlogs/mes-vlogs');
      setUserVlogs(vRes.data);
      const qRes = await client.get('/vlogs/quota');
      setVlogQuota(qRes.data);
    } catch (err) {
      console.error("Error loading vlog details:", err);
    }
  };

  const handleVlogFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'video/mp4') {
      triggerToast("Seul le format MP4 (video/mp4) est supporté.");
      e.target.value = '';
      return;
    }

    // Validation de durée côté client
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.src = URL.createObjectURL(file);
    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(videoEl.src);
      if (videoEl.duration > 62) { // 60s + marge de 2s
        triggerToast("La vidéo ne doit pas dépasser 1 minute (60 secondes).");
        e.target.value = '';
        setVlogFile(null);
        setVlogFileBase64('');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setVlogFile(file);
        setVlogFileBase64(reader.result);
      };
      reader.readAsDataURL(file);
    };
  };

  const handlePublishVlog = async (e) => {
    e.preventDefault();
    setVlogError('');
    setVlogSuccess(false);
    setVlogPublishing(true);

    try {
      if (!vlogAnnonceId) {
        throw new Error("Veuillez sélectionner une annonce associée.");
      }
      if (vlogType === 'upload' && !vlogFileBase64) {
        throw new Error("Veuillez sélectionner un fichier vidéo MP4.");
      }
      if (vlogType === 'lien' && !vlogLink) {
        throw new Error("Veuillez saisir le lien de votre vidéo.");
      }

      await client.post('/vlogs', {
        annonceId: vlogAnnonceId,
        typeVideo: vlogType,
        videoData: vlogType === 'upload' ? vlogFileBase64 : null,
        externalLink: vlogType === 'lien' ? vlogLink : null,
        moyenPaiement: !vlogQuota.hasSubscription ? vlogMoyenPaiement : null
      });

      setVlogSuccess(true);
      triggerToast("Votre Vlog a été publié avec succès !");
      loadVlogDetails();
      setTimeout(() => {
        setVlogModalOpen(false);
        // Reset
        setVlogAnnonceId('');
        setVlogFile(null);
        setVlogFileBase64('');
        setVlogLink('');
        setVlogSuccess(false);
      }, 2000);
    } catch (err) {
      setVlogError(err.response?.data?.message || err.message || "Erreur lors de la publication.");
    } finally {
      setVlogPublishing(false);
    }
  };

  const loadWalletDetails = async () => {
    try {
      const res = await client.get('/vendeur/portefeuille');
      setSoldeDisponible(res.data.solde_disponible);
      setSoldeEnAttente(res.data.solde_en_attente);
      setWalletTransactions(res.data.transactions || []);
      setWalletRetraits(res.data.retraits || []);
      setWalletRecharges(res.data.recharges || []);
    } catch (err) {
      console.error("Error loading wallet details:", err);
    }
  };

  const handleRequestRetrait = async (montant, moyenPaiement, telephone) => {
    try {
      await client.post('/vendeur/portefeuille/retrait', {
        montant: Number(montant),
        moyenPaiement,
        telephone
      });
      triggerToast("Demande de retrait envoyée !");
      loadWalletDetails();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur lors du retrait.");
    }
  };

  const handleRequestRecharge = async (montant, moyenPaiement, telephone) => {
    try {
      await client.post('/vendeur/portefeuille/recharge', {
        montant: Number(montant),
        moyenPaiement,
        telephone
      });
      triggerToast("Recharge effectuée avec succès !");
      loadWalletDetails();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur lors de la recharge.");
    }
  };

  useEffect(() => {
    if (!user) return;

    async function loadProDetails() {
      try {
        const subRes = await client.get('/abonnements/actif');
        setActiveAbonnement(subRes.data);

        const transRes = await client.get('/abonnements/transactions');
        setTransactions(transRes.data);

        try {
          const reqRes = await client.get('/demandes-pro/moi');
          setDemandePro(reqRes.data);
        } catch (err) {
          console.error("Error loading pro request:", err);
        }

        if (user.est_boutique) {
          const boutiqueRes = await client.get('/boutiques/moi');
          if (boutiqueRes.data) {
            setBoutiqueInfo(boutiqueRes.data);
            setBoutiqueNom(boutiqueRes.data.nom_boutique || '');
            setBoutiqueDescription(boutiqueRes.data.description || '');
            setBoutiqueLogo(boutiqueRes.data.logo || '');
            setBoutiqueHoraires(boutiqueRes.data.horaires || '');
            setBoutiqueLienExterne(boutiqueRes.data.lien_externe || '');
          }
        }

        loadWalletDetails();
      } catch (err) {
        console.error("Error loading pro details:", err);
      }
    }

    loadProDetails();
  }, [user]);

  const handleSaveBoutique = async (e) => {
    e.preventDefault();
    if (!boutiqueNom) {
      triggerToast("Le nom de la boutique est obligatoire.");
      return;
    }
    try {
      const res = await client.post('/boutiques/configurer', {
        nom_boutique: boutiqueNom,
        description: boutiqueDescription,
        logo: boutiqueLogo,
        horaires: boutiqueHoraires,
        lien_externe: boutiqueLienExterne
      });
      setBoutiqueInfo(res.data.boutique);
      triggerToast("Boutique configurée avec succès !");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur de configuration.");
    }
  };

  const handleBoutiqueLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBoutiqueLogo(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelRenewal = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir désactiver le renouvellement automatique ?")) return;
    try {
      await client.post('/abonnements/annuler-renouvellement');
      setActiveAbonnement(prev => prev ? { ...prev, renouvellement_auto: 0 } : null);
      triggerToast("Renouvellement automatique désactivé.");
    } catch (err) {
      triggerToast("Erreur d'annulation.");
    }
  };

  const handleToggleSelectListing = (id) => {
    setSelectedListingIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllListings = () => {
    const activeIds = filteredListings.map(l => l.id);
    const allSelected = activeIds.every(id => selectedListingIds.includes(id));
    if (allSelected) {
      setSelectedListingIds(prev => prev.filter(id => !activeIds.includes(id)));
    } else {
      setSelectedListingIds(prev => [...new Set([...prev, ...activeIds])]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedListingIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Supprimer les ${selectedListingIds.length} annonces sélectionnées ?`)) return;

    try {
      if (action === 'pause') {
        await Promise.all(
          selectedListingIds.map(id => client.put(`/annonces/${id}/statut`, { statut: 'suspendue' }))
        );
        triggerToast(`${selectedListingIds.length} annonces suspendues.`);
      } else if (action === 'delete') {
        await Promise.all(
          selectedListingIds.map(id => client.delete(`/annonces/${id}`))
        );
        triggerToast(`${selectedListingIds.length} annonces supprimées.`);
      }
      setSelectedListingIds([]);
      
      const res = await client.get('/annonces/mes/annonces');
      const mapped = res.data.map(mapBackendListing);
      setListings(mapped);
    } catch (err) {
      triggerToast("Erreur lors de l'action groupée.");
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Titre', 'Prix (FCFA)', 'Statut', 'Vues', 'Contacts'];
    const rows = filteredListings.map(l => [l.id, l.title, l.price, l.status, l.views, l.contacts]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sugu_mes_annonces_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Export CSV démarré !");
  };
  
  const [convoOpenMobile, setConvoOpenMobile] = useState(false);
  const [draft, setDraft] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterDate, setCounterDate] = useState('');
  const [counterHeure, setCounterHeure] = useState('');
  const [counterLieu, setCounterLieu] = useState('');

  // Google Maps Autocomplete & Geolocation for Counter-proposal Location
  const counterInputRef = useRef(null);
  const counterAutocompleteRef = useRef(null);

  const setCounterInputRef = (el) => {
    counterInputRef.current = el;
    if (el) {
      initCounterAutocomplete();
    }
  };

  const initCounterAutocomplete = () => {
    if (!counterInputRef.current || !window.google?.maps?.places) return;
    if (counterAutocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(counterInputRef.current, {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'ci' }
    });
    
    counterAutocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      let streetAddress = place.formatted_address || place.name || "";
      setCounterLieu(streetAddress);
    });
  };

  const handleCounterGeolocate = () => {
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
            setCounterLieu(place.formatted_address || place.name || "");
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

  useEffect(() => {
    const loadGoogleMapsScript = async () => {
      if (window.google && window.google.maps && window.google.maps.places) {
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
        if (!key) return;

        const existingScript = document.getElementById('google-maps-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'google-maps-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if (counterInputRef.current) {
              initCounterAutocomplete();
            }
          };
          document.head.appendChild(script);
        }
      } catch (err) {
        console.error("Google Maps load error:", err);
      }
    };

    loadGoogleMapsScript();
  }, []);
  
  const [dbConversations, setDbConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [dbMessages, setDbMessages] = useState([]);

  // Auto-scroll chat feed to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [dbMessages]);
  const [dbActivities, setDbActivities] = useState([]);
  const [activitiesModalOpen, setActivitiesModalOpen] = useState(false);

  // Colis & secure payment tracking states
  const [activeLienDetails, setActiveLienDetails] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingPanelCollapsed, setTrackingPanelCollapsed] = useState(false);

  // Settings preferences switches
  const [prefs, setPrefs] = useState({ push: true, email: false, phone: true });
  
  // General feedback toast notice
  const [toast, setToast] = useState('');
  const toastTimeoutRef = useRef(null);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' });
  };
  const getOnlineStatusLabel = (dateStr) => {
    if (!dateStr) return "Hors ligne";
    const lastActive = new Date(dateStr).getTime();
    const diffMins = (Date.now() - lastActive) / 60000;
    if (diffMins <= 5) {
      return "● En ligne";
    }
    const mins = Math.floor(diffMins);
    if (mins < 60) return `En ligne il y a ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `En ligne il y a ${hours}h`;
    return `Connexion le ${new Date(dateStr).toLocaleDateString("fr-FR")}`;
  };

  // Helper declarations for the active purchase link of this conversation
  const activeLienMsg = useMemo(() => {
    return [...dbMessages].reverse().find(m => m.text.startsWith('[LIEN_ACHAT:'));
  }, [dbMessages]);

  const { activeLienId, activeLienStatut, activeLienPrice, hasActiveLien } = useMemo(() => {
    if (!activeLienMsg) return { activeLienId: null, activeLienStatut: null, activeLienPrice: 0, hasActiveLien: false };
    const parts = activeLienMsg.text.replace('[', '').replace(']', '').split(':');
    const id = parts[1];
    const price = parseInt(parts[2], 10) || 0;
    const statut = activeLienMsg.lienStatut;
    const hasActive = statut === 'cree' || statut === 'attente_vendeur' || statut === 'attente_acheteur' || statut === 'paye' || statut === 'expedie' || statut === 'livre';
    return { activeLienId: id, activeLienStatut: statut, activeLienPrice: price, hasActiveLien: hasActive };
  }, [activeLienMsg]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    client.get('/messages/conversations')
      .then(res => {
        const mapped = res.data.map(c => {
          const isVendeur = c.vendeur_id === user.id;
          const otherName = isVendeur ? c.acheteur_nom : c.vendeur_nom;
          const initials = otherName ? otherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "SU";
          return {
            id: c.id,
            name: otherName,
            initials,
            avatarBg: isVendeur ? '#8F3A1C' : '#106C62',
            time: c.dernier_message_date ? formatTime(c.dernier_message_date) : "Nouveau",
            preview: c.dernier_message || "Aucun message",
            listing: c.annonce_titre,
            listingPrice: (c.annonce_prix || 0).toLocaleString("fr-FR") + " FCFA",
            cover_url: c.cover_url,
            hasUnread: c.non_lus > 0,
            unread: c.non_lus,
            lien_statut: c.lien_statut,
            mode_reception: c.mode_reception,
            acheteur_id: c.acheteur_id,
            vendeur_id: c.vendeur_id,
            annonce_id: c.annonce_id,
            derniere_connexion: isVendeur ? c.acheteur_derniere_connexion : c.vendeur_derniere_connexion
          };
        });
        setDbConversations(mapped);
        if (mapped.length > 0 && !activeConvo) {
          setActiveConvo(mapped[0]);
        }
      })
      .catch(err => console.error("Erreur conversations :", err));
  }, [user, section]);

  // Load messages for selected active conversation (Callback to allow manual refresh)
  const loadActiveMessages = useCallback(() => {
    if (!user || !activeConvo) return;
    client.get(`/messages/conversations/${activeConvo.id}/messages`)
      .then(res => {
        const mapped = res.data.map(m => {
          const fromMe = m.expediteur_id === user.id;
          return {
            id: m.id,
            fromMe,
            text: m.contenu,
            time: formatTime(m.created_at),
            justify: fromMe ? "flex-end" : "flex-start",
            bg: fromMe ? "var(--sugu-secondary)" : "#FFFFFF",
            color: fromMe ? "var(--sugu-bg)" : "var(--sugu-ink)",
            radius: fromMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            lienStatut: m.lien_statut
          };
        });
        setDbMessages(mapped);
      })
      .catch(err => console.error("Erreur messages :", err));
  }, [user, activeConvo]);

  // Trigger load messages when activeConvo changes
  useEffect(() => {
    loadActiveMessages();
  }, [loadActiveMessages]);

  // Real-time polling effect for conversations, messages and transaction statuses (every 3 seconds)
  useEffect(() => {
    if (!user || section !== 'messages') return;

    const loadTrackingData = () => {
      if (activeLienId) {
        client.get(`/liens-achat/${activeLienId}`)
          .then(res => {
            setActiveLienDetails(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(res.data)) {
                return res.data;
              }
              return prev;
            });
          })
          .catch(err => console.error(err));
      }
    };

    const poll = setInterval(() => {
      // 1. Poll active messages
      if (activeConvo) {
        client.get(`/messages/conversations/${activeConvo.id}/messages`)
          .then(res => {
            const mapped = res.data.map(m => {
              const fromMe = m.expediteur_id === user.id;
              return {
                id: m.id,
                fromMe,
                text: m.contenu,
                time: formatTime(m.created_at),
                justify: fromMe ? "flex-end" : "flex-start",
                bg: fromMe ? "var(--sugu-secondary)" : "#FFFFFF",
                color: fromMe ? "var(--sugu-bg)" : "var(--sugu-ink)",
                radius: fromMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                lienStatut: m.lien_statut
              };
            });
            setDbMessages(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(mapped)) {
                return mapped;
              }
              return prev;
            });
          })
          .catch(err => console.error(err));
      }

      // 2. Poll conversations list
      client.get('/messages/conversations')
        .then(res => {
          const mapped = res.data.map(c => {
            const isVendeur = c.vendeur_id === user.id;
            const otherName = isVendeur ? c.acheteur_nom : c.vendeur_nom;
            const initials = otherName ? otherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "SU";
            return {
              id: c.id,
              name: otherName,
              initials,
              avatarBg: isVendeur ? '#8F3A1C' : '#106C62',
              time: c.dernier_message_date ? formatTime(c.dernier_message_date) : "Nouveau",
              preview: c.dernier_message || "Aucun message",
              listing: c.annonce_titre,
              listingPrice: (c.annonce_prix || 0).toLocaleString("fr-FR") + " FCFA",
              cover_url: c.cover_url,
              hasUnread: c.non_lus > 0,
              unread: c.non_lus,
              lien_statut: c.lien_statut,
              mode_reception: c.mode_reception,
              acheteur_id: c.acheteur_id,
              vendeur_id: c.vendeur_id,
              annonce_id: c.annonce_id,
              derniere_connexion: isVendeur ? c.acheteur_derniere_connexion : c.vendeur_derniere_connexion
            };
          });
          setDbConversations(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(mapped)) {
              return mapped;
            }
            return prev;
          });
        })
        .catch(err => console.error(err));

      // 3. Poll tracking details
      loadTrackingData();

    }, 3000);

    return () => clearInterval(poll);
  }, [user, activeConvo, section, activeLienId]);

  // Charger les données dynamiques du Tableau de bord
  useEffect(() => {
    if (!user) return;

    const backendToFrontendStatus = {
      active: "Actives",
      suspendue: "En pause",
      vendue: "Vendues",
      brouillon: "En attente"
    };

    // 1. Charger les statistiques
    client.get('/annonces/mon/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error("Erreur stats :", err));

    // 2. Charger les annonces
    client.get('/annonces/mes/annonces')
      .then(res => {
        const mapped = res.data.map(mapBackendListing);
        setListings(mapped);
      })
      .catch(err => console.error("Erreur listings :", err));

    // 3. Charger les favoris
    client.get('/favoris')
      .then(res => setFavoritesList(res.data))
      .catch(err => console.error("Erreur favoris :", err));

    // 4. Charger les activités récentes
    client.get('/annonces/mon/activites')
      .then(res => setDbActivities(res.data))
      .catch(err => console.error("Erreur activites :", err));

    // 5. Charger les vlogs et quotas
    loadVlogDetails();

  }, [user, section]);

  // Sync section state with searchParams
  useEffect(() => {
    if (tabParam) {
      setSection(tabParam);
    }
  }, [tabParam]);



  // Effect to load details of the active purchase link
  useEffect(() => {
    if (!activeLienId) {
      setActiveLienDetails(null);
      return;
    }
    client.get(`/liens-achat/${activeLienId}`)
      .then(res => {
        setActiveLienDetails(res.data);
      })
      .catch(err => console.error("Erreur chargement details lien:", err));
  }, [activeLienId]);

  // Countdown timer effect for 'livre' state
  useEffect(() => {
    if (activeLienStatut !== 'livre' || !activeLienDetails?.colis_livre_le) {
      setTimeRemaining('');
      return;
    }
    const timer = setInterval(() => {
      const livreLe = new Date(activeLienDetails.colis_livre_le).getTime();
      const expiration = livreLe + (5 * 60 * 1000); // 5 minutes for testing in local
      const diff = expiration - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Délai dépassé (Virement automatique)');
        clearInterval(timer);
        loadActiveMessages();
        client.get(`/liens-achat/${activeLienId}`)
          .then(res => setActiveLienDetails(res.data))
          .catch(err => console.error(err));
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeLienStatut, activeLienDetails, activeLienId, loadActiveMessages]);

  // Action handlers
  const handleShip = (lienId, suiviLien) => {
    if (!suiviLien.trim()) return;
    client.post(`/liens-achat/${lienId}/expedier`, { suiviLien })
      .then(() => {
        triggerToast("Colis marqué comme expédié !");
        setTrackingInput('');
        loadActiveMessages();
        client.get(`/liens-achat/${lienId}`).then(res => setActiveLienDetails(res.data));
      })
      .catch(err => alert(err.response?.data?.message || "Erreur lors de l'expédition."));
  };

  const handleDeliver = (lienId) => {
    client.post(`/liens-achat/${lienId}/livrer`)
      .then(() => {
        triggerToast("Colis marqué comme livré !");
        loadActiveMessages();
        client.get(`/liens-achat/${lienId}`).then(res => setActiveLienDetails(res.data));
      })
      .catch(err => alert(err.response?.data?.message || "Erreur de livraison."));
  };

  const handleValidate = (lienId) => {
    if (!window.confirm("Vous validez la reception et la conformité de l'article, souhaitez vous continuer ?")) return;
    client.post(`/liens-achat/${lienId}/valider`)
      .then(() => {
        triggerToast("Achat validé !");
        loadActiveMessages();
        client.get(`/liens-achat/${lienId}`).then(res => setActiveLienDetails(res.data));
      })
      .catch(err => alert(err.response?.data?.message || "Erreur de validation."));
  };

  const handleReportProblem = (lienId) => {
    const reason = window.prompt("Veuillez décrire le problème rencontré avec le colis (ex: article non conforme, cassé) :");
    if (reason === null) return;
    client.post(`/liens-achat/${lienId}/signaler-probleme`)
      .then(() => {
        triggerToast("Litige déclaré.");
        loadActiveMessages();
        client.get(`/liens-achat/${lienId}`).then(res => setActiveLienDetails(res.data));
      })
      .catch(err => alert(err.response?.data?.message || "Erreur de signalement."));
  };

  // Fallback demo user info if not logged in
  const profileUser = useMemo(() => {
    if (user) {
      return {
        nom: user.nom,
        email: user.email,
        telephone: user.telephone || "+225 07 00 00 00 00",
        commune: user.adresse ? `${user.adresse.ville}, ${user.adresse.commune}` : (user.ville || "Cocody, Abidjan"),
        initials: user.nom ? user.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "SU"
      };
    }
    return {
      nom: "Aya Koné",
      email: "aya.kone@email.ci",
      telephone: "+225 07 00 00 00 00",
      commune: "Cocody, Abidjan",
      initials: "AK"
    };
  }, [user]);

  const renderTrackingPanel = () => {
    if (!hasActiveLien || !activeLienDetails) return null;

    const isVendeur = activeConvo.vendeur_id === user?.id;
    const isRetrait = activeLienDetails.mode_reception === 'retrait';

    if (isRetrait) {
      if (trackingPanelCollapsed) {
        return (
          <div className="sugu-dash__chat-context" style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#E6F4F2',
            borderBottom: '1px solid var(--sugu-border)',
            padding: '10px 16px',
            cursor: 'pointer'
          }} onClick={() => setTrackingPanelCollapsed(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px', color: '#106C62' }}>
              🤝 Remise en main propre · 
              <span style={{ 
                color: activeLienStatut === 'valide' ? '#106C62' : (activeLienStatut === 'inconforme' ? '#C0512E' : 'var(--sugu-primary)'),
                textTransform: 'uppercase',
                fontSize: '11px',
                background: activeLienStatut === 'valide' ? '#EAF4F2' : '#FDF3F1',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {activeLienStatut === 'attente_vendeur' && 'En attente confirmation vendeur'}
                {activeLienStatut === 'attente_acheteur' && 'En attente confirmation acheteur'}
                {activeLienStatut === 'paye' && 'Rendez-vous planifié'}
                {activeLienStatut === 'livre' && 'Article remis'}
                {activeLienStatut === 'valide' && 'Transaction Finalisée'}
                {activeLienStatut === 'inconforme' && 'Litige ouvert'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setTrackingPanelCollapsed(false); }}
              style={{ background: '#FFFFFF', color: '#106C62', border: '1px solid #106C62', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ▼ Déplier le panneau
            </button>
          </div>
        );
      }

      const rdvPassed = activeLienDetails.retrait_rendezvous_datetime 
        ? new Date() > new Date(activeLienDetails.retrait_rendezvous_datetime) 
        : false;

      return (
        <div className="sugu-dash__chat-context" style={{
          flexDirection: 'column',
          alignItems: 'stretch',
          background: '#E6F4F2',
          borderBottom: '1px solid var(--sugu-border)',
          padding: '16px',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13.5px', color: '#106C62' }}>
              🤝 Remise en main propre · 
              <span style={{ 
                color: activeLienStatut === 'valide' ? '#106C62' : (activeLienStatut === 'inconforme' ? '#C0512E' : 'var(--sugu-primary)'),
                textTransform: 'uppercase',
                fontSize: '11px',
                background: activeLienStatut === 'valide' ? '#EAF4F2' : '#FDF3F1',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {activeLienStatut === 'attente_vendeur' && 'En attente confirmation vendeur'}
                {activeLienStatut === 'attente_acheteur' && 'En attente confirmation acheteur'}
                {activeLienStatut === 'paye' && 'Rendez-vous planifié'}
                {activeLienStatut === 'livre' && 'Article remis (Validation en cours)'}
                {activeLienStatut === 'valide' && 'Transaction Finalisée'}
                {activeLienStatut === 'inconforme' && 'Litige ouvert'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTrackingPanelCollapsed(true)}
              style={{ background: '#FFFFFF', color: '#106C62', border: '1px solid #106C62', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ▲ Plier le panneau
            </button>
          </div>
          
          <div style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', lineHeight: 1.4 }}>
            Date et lieu proposés : <strong>{activeLienDetails.retrait_date}</strong>.
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span>Paiement :</span>
            {activeLienDetails.moyen_paiement === 'portefeuille' ? (
              <span style={{ background: '#E6F4F2', color: '#106C62', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11.5px', border: '1px solid #106C62' }}>
                🛡️ Via Portefeuille électronique ({activeLienPrice.toLocaleString('fr-FR')} FCFA)
              </span>
            ) : (
              <span style={{ background: '#FFF7E6', color: '#D4380D', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11.5px', border: '1px solid #FFE7BA' }}>
                💵 Espèces sur place ({activeLienPrice.toLocaleString('fr-FR')} FCFA)
              </span>
            )}
          </div>

          {/* 0A. RENDEZ-VOUS EN ATTENTE DE CONFIRMATION PAR LE VENDEUR */}
          {activeLienStatut === 'attente_vendeur' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {isVendeur ? (
                <>
                  <div style={{ fontSize: '12.5px', color: '#D4380D', fontWeight: '600' }}>
                    ⚠️ L'acheteur vous propose ce rendez-vous. La date et l'heure vous conviennent-elles ?
                  </div>

                  {!showCounterForm ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await client.post(`/liens-achat/${activeLienId}/confirmer-rdv`);
                            triggerToast("Rendez-vous accepté avec succès !");
                            loadActiveMessages();
                            client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                          } catch (err) {
                            alert(err.response?.data?.message || "Erreur lors de la confirmation.");
                          }
                        }}
                        style={{
                          background: '#106C62',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ✅ Accepter le rendez-vous
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCounterForm(true)}
                        style={{
                          background: '#D4380D',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Proposer un autre horaire / lieu
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("Souhaitez-vous refuser cette proposition de rendez-vous ? L'acheteur pourra vous proposer un autre créneau.")) return;
                          try {
                            await client.post(`/liens-achat/${activeLienId}/refuser-rdv`);
                            triggerToast("Proposition de rendez-vous refusée.");
                            loadActiveMessages();
                            client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                          } catch (err) {
                            alert(err.response?.data?.message || "Erreur lors du refus.");
                          }
                        }}
                        style={{
                          background: '#888',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ❌ Refuser
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      background: '#FFF',
                      border: '1px solid var(--sugu-border)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginTop: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--sugu-ink)' }}>
                        ✏️ Proposer une nouvelle date / heure / lieu
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sugu-ink-soft)' }}>Nouvelle Date</label>
                          <input
                            type="date"
                            value={counterDate}
                            onChange={e => setCounterDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--sugu-border)' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sugu-ink-soft)' }}>Nouvelle Heure</label>
                          <input
                            type="time"
                            value={counterHeure}
                            onChange={e => setCounterHeure(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--sugu-border)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sugu-ink-soft)' }}>Nouveau Lieu (Optionnel)</label>
                          <button
                            type="button"
                            onClick={handleCounterGeolocate}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#106C62',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📍 Me localiser
                          </button>
                        </div>
                        <input
                          ref={setCounterInputRef}
                          type="text"
                          placeholder="Recherchez un lieu avec Google Maps ou géolocalisez-vous..."
                          value={counterLieu}
                          onChange={e => setCounterLieu(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--sugu-border)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setShowCounterForm(false)}
                          style={{ background: '#eee', color: '#333', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11.5px', cursor: 'pointer' }}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!counterDate || !counterHeure) {
                              alert("Veuillez remplir la date et l'heure.");
                              return;
                            }
                            try {
                              await client.post(`/liens-achat/${activeLienId}/proposer-autre-rdv`, {
                                nouvelleDate: counterDate,
                                nouvelleHeure: counterHeure,
                                nouveauLieu: counterLieu
                              });
                              triggerToast("Contre-proposition envoyée !");
                              setShowCounterForm(false);
                              loadActiveMessages();
                              client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                            } catch (err) {
                              alert(err.response?.data?.message || "Erreur lors de l'envoi.");
                            }
                          }}
                          style={{ background: 'var(--sugu-primary)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Envoyer la proposition
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '12.5px', color: '#106C62', fontStyle: 'italic', background: '#E6F4F2', padding: '8px 12px', borderRadius: '6px' }}>
                  ⏳ Votre proposition de rendez-vous a été transmise au vendeur. En attente de sa confirmation...
                </div>
              )}
            </div>
          )}

          {/* 0B. RENDEZ-VOUS EN ATTENTE DE CONFIRMATION PAR L'ACHETEUR (suite à une contre-proposition vendeur) */}
          {activeLienStatut === 'attente_acheteur' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {!isVendeur ? (
                <>
                  <div style={{ fontSize: '12.5px', color: '#D4380D', fontWeight: '600' }}>
                    🔄 Le vendeur vous propose un nouveau créneau : <strong>{activeLienDetails.retrait_date}</strong>. Acceptez-vous ce nouveau rendez-vous ?
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await client.post(`/liens-achat/${activeLienId}/confirmer-rdv`);
                          triggerToast("Créneau accepté avec succès !");
                          loadActiveMessages();
                          client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                        } catch (err) {
                          alert(err.response?.data?.message || "Erreur lors de la confirmation.");
                        }
                      }}
                      style={{
                        background: '#106C62',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Accepter ce rendez-vous
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Souhaitez-vous refuser ce créneau ?")) return;
                        try {
                          await client.post(`/liens-achat/${activeLienId}/refuser-rdv`);
                          triggerToast("Nouveau créneau refusé.");
                          loadActiveMessages();
                          client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                        } catch (err) {
                          alert(err.response?.data?.message || "Erreur lors du refus.");
                        }
                      }}
                      style={{
                        background: '#C0512E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '12.5px', color: '#106C62', fontStyle: 'italic', background: '#E6F4F2', padding: '8px 12px', borderRadius: '6px' }}>
                  ⏳ Votre contre-proposition d'horaire a été envoyée à l'acheteur. En attente de sa réponse...
                </div>
              )}
            </div>
          )}

          {activeLienStatut === 'livre' && (
            <div style={{ 
              background: '#FFF7E6', 
              border: '1px solid #FFE7BA', 
              borderRadius: '8px', 
              padding: '10px 12px', 
              fontSize: '12.5px', 
              color: '#D4380D',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px'
            }}>
              <span>⏱️ Temps restant pour vérification :</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px' }}>{timeRemaining || 'Calcul...'}</span>
            </div>
          )}

          {/* 1. RENDEZ-VOUS PLANIFIE (paye) */}
          {activeLienStatut === 'paye' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!rdvPassed ? (
                <div style={{ fontSize: '12.5px', color: '#888', fontStyle: 'italic' }}>
                  Le rendez-vous n'a pas encore eu lieu. Veuillez vous y rendre à la date et heure convenues.
                </div>
              ) : (
                <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)' }}>
                  L'heure du rendez-vous est passée. Veuillez confirmer la remise/réception de l'article :
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                {isVendeur ? (
                  <>
                    {!rdvPassed ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("Souhaitez-vous annuler ce rendez-vous ? L'acheteur sera intégralement remboursé.")) return;
                          try {
                            await client.post(`/liens-achat/${activeLienId}/refuser-rdv`);
                            triggerToast("Rendez-vous annulé et acheteur remboursé.");
                            loadActiveMessages();
                            client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                          } catch (err) {
                            alert(err.response?.data?.message || "Erreur lors de l'annulation.");
                          }
                        }}
                        style={{
                          background: '#C0512E',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ❌ Annuler le rendez-vous
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("Déclarez-vous avoir remis l'article à l'acheteur ? Cela lancera le délai de validation de 48h.")) return;
                          try {
                            await client.post(`/liens-achat/${activeLienId}/remettre`);
                            triggerToast("Déclaration de remise enregistrée !");
                            loadActiveMessages();
                            client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                          } catch (err) {
                            alert(err.response?.data?.message || "Erreur lors de la déclaration.");
                          }
                        }}
                        style={{
                          background: 'var(--sugu-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        🤝 J'ai remis l'article
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleValidate(activeLienId)}
                    style={{
                      background: '#106C62',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ✅ J'ai bien reçu l'article
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. ARTICLE REMIS (livre) */}
          {activeLienStatut === 'livre' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isVendeur ? (
                <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)' }}>
                  Vous avez déclaré avoir remis l'article. L'acheteur dispose de 48h (5 minutes en local) pour confirmer ou ouvrir un litige. Sans action de sa part, les fonds seront débloqués automatiquement.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)' }}>
                    Le vendeur signale vous avoir remis l'article. Veuillez confirmer la bonne réception ou signaler un litige s'il y a un problème (Délai de validation automatique de 48h en cours) :
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleValidate(activeLienId)}
                      style={{
                        background: '#106C62',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ J'ai bien reçu l'article
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReportProblem(activeLienId)}
                      style={{
                        background: '#C0512E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ⚠️ Je n'ai rien reçu / Litige
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. FINALISÉ (valide) */}
          {activeLienStatut === 'valide' && (
            <div style={{ fontSize: '12.5px', color: '#106C62', fontWeight: 'bold' }}>
              ✅ Achat finalisé avec succès ! L'article a été remis et les fonds ont été transférés au vendeur.
            </div>
          )}

          {/* 4. LITIGE (inconforme) */}
          {activeLienStatut === 'inconforme' && (
            <div style={{ fontSize: '12.5px', color: '#C0512E', fontWeight: '500' }}>
              ⚠️ Litige en cours. Les fonds restent bloqués de manière sécurisée en attendant l'avis d'un administrateur.
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="sugu-dash__chat-context" style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        background: '#FAF6F0',
        borderBottom: '1px solid var(--sugu-border)',
        padding: '16px',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13.5px', color: 'var(--sugu-ink)' }}>
          🛡️ Suivi Sécurisé Sugu · Statut : 
          <span style={{ 
            color: activeLienStatut === 'valide' ? '#106C62' : (activeLienStatut === 'inconforme' ? '#C0512E' : 'var(--sugu-primary)'),
            textTransform: 'uppercase',
            fontSize: '11px',
            background: activeLienStatut === 'valide' ? '#EAF4F2' : '#FDF3F1',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            {activeLienStatut === 'cree' && 'Créé (En attente de paiement)'}
            {activeLienStatut === 'paye' && 'Payé (Préparation)'}
            {activeLienStatut === 'expedie' && 'Expédié (En route)'}
            {activeLienStatut === 'livre' && 'Livré (Vérification)'}
            {activeLienStatut === 'valide' && 'Validé (Fonds libérés)'}
            {activeLienStatut === 'inconforme' && 'Litige (Non conforme)'}
          </span>
        </div>

        {/* 1. PAYE : Le vendeur doit expédier */}
        {activeLienStatut === 'paye' && (
          isVendeur ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)', lineHeight: 1.4 }}>
                L'acheteur a payé. Veuillez <b>emballer le colis dans un carton solide</b>, coller l'étiquette d'expédition reçue par e-mail/chat, le confier au livreur (Yango) et renseigner le lien de suivi ci-dessous :
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Lien de suivi Yango (ex: https://yango.yandex.com/...)" 
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--sugu-border)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleShip(activeLienId, trackingInput)}
                  style={{
                    background: 'var(--sugu-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Expédier le colis
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)' }}>
              Votre paiement est sécurisé par Sugu. Le vendeur prépare votre colis et va bientôt l'expédier.
            </div>
          )
        )}

        {/* 2. EXPEDIE : Colis en route */}
        {activeLienStatut === 'expedie' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)' }}>
              Le colis a été expédié par le vendeur. Vous pouvez suivre l'acheminement en temps réel :
            </div>
            {activeLienDetails.suivi_lien && (
              <a 
                href={activeLienDetails.suivi_lien} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#106C62',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  textDecoration: 'underline'
                }}
              >
                🔗 Suivre la livraison Yango en direct
              </a>
            )}
            {!isVendeur && (
              <button
                type="button"
                onClick={() => handleDeliver(activeLienId)}
                style={{
                  alignSelf: 'flex-start',
                  background: 'var(--sugu-secondary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Marquer comme reçu / livré
              </button>
            )}
            {isVendeur && (
              <div style={{ fontSize: '12px', color: 'var(--sugu-ink-faint)', fontStyle: 'italic' }}>
                En attente de réception et confirmation par l'acheteur.
              </div>
            )}
          </div>
        )}

        {/* 3. LIVRE : Phase de vérification */}
        {activeLienStatut === 'livre' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ 
              background: '#FFF7E6', 
              border: '1px solid #FFE7BA', 
              borderRadius: '8px', 
              padding: '10px 12px', 
              fontSize: '12.5px', 
              color: '#D4380D',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>⏱️ Temps restant pour vérification :</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px' }}>{timeRemaining || 'Calcul...'}</span>
            </div>
            
            {isVendeur ? (
              <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)', lineHeight: 1.4 }}>
                Le colis a été livré. L'acheteur a 3 jours (5 minutes en local) pour valider le contenu du carton. Passé ce délai, vos fonds seront transférés automatiquement sur votre Mobile Money.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--sugu-ink-soft)', lineHeight: 1.4 }}>
                  Vous avez reçu le colis. Veuillez l'ouvrir et vérifier la conformité de l'article avant la fin du décompte :
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleValidate(activeLienId)}
                    style={{
                      background: '#106C62',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Confirmer la conformité de votre article
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportProblem(activeLienId)}
                    style={{
                      background: '#C0512E',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Signaler un problème sur l'article
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. VALIDE : Succès final */}
        {activeLienStatut === 'valide' && (
          <div style={{ fontSize: '12.5px', color: '#106C62', fontWeight: '500' }}>
            🎉 La transaction a été validée avec succès. Les fonds ont été crédités sur le compte Mobile Money du vendeur. Merci de votre confiance !
          </div>
        )}

        {/* 5. INCONFORME : Litige déclaré */}
        {activeLienStatut === 'inconforme' && (
          <div style={{ fontSize: '12.5px', color: '#C0512E', fontWeight: '500', lineHeight: 1.4 }}>
            ⚠️ Un problème de conformité a été signalé sur cette commande. Le paiement est suspendu. Notre service client Sugu va examiner la situation pour procéder au remboursement ou déblocage.
          </div>
        )}
      </div>
    );
  };

  // Display toast helpers
  const triggerToast = (msg) => {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(''), 2000);
  };

  const handleTogglePref = (k) => {
    setPrefs(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const handleUnfav = async (id) => {
    try {
      await client.post(`/favoris/${id}`);
      setFavoritesList(prev => prev.filter(f => f.id !== id));
      triggerToast("Retiré des favoris");
    } catch (err) {
      console.error(err);
      triggerToast("Erreur lors de la modification des favoris");
    }
  };

  const handleLogout = () => {
    deconnexion();
    navigate('/');
  };

  // Listings operations
  const handleEditPhotosChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setEditPhotos(prev => [...prev, event.target.result].slice(0, 8));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveEditPhoto = (idx) => {
    setEditPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveEditListing = async () => {
    if (!editTitle.trim() || !editPrice || isNaN(parseInt(editPrice, 10)) || parseInt(editPrice, 10) <= 0) {
      triggerToast("Veuillez remplir correctement le titre et le prix.");
      return;
    }
    try {
      await client.put(`/annonces/${editingListing.id}`, {
        title: editTitle,
        description: editDescription,
        price: parseInt(editPrice, 10),
        negotiable: editNegotiable,
        condition: editCondition,
        commune: editCommune,
        delivery: editDelivery,
        photos: editPhotos
      });
      triggerToast("Annonce modifiée avec succès !");
      setEditListingModalOpen(false);
      
      // Reload listings
      const res = await client.get('/annonces/mes/annonces');
      const mapped = res.data.map(mapBackendListing);
      setListings(mapped);
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur de modification de l'annonce.");
    }
  };

  const handleListingAction = async (actionLabel, listingId) => {
    try {
      if (actionLabel === "Mettre en pause") {
        await client.put(`/annonces/${listingId}/statut`, { statut: 'suspendue' });
        setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "En pause" } : l));
        setListingFilter("En pause");
        triggerToast("Annonce suspendue");
      } else if (actionLabel === "Republier") {
        await client.put(`/annonces/${listingId}/statut`, { statut: 'active' });
        setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "Actives" } : l));
        setListingFilter("Actives");
        triggerToast("Annonce republiée");
      } else if (actionLabel === "Supprimer") {
        await client.delete(`/annonces/${listingId}`);
        setListings(prev => prev.filter(l => l.id !== listingId));
        triggerToast("Annonce supprimée");
      } else if (actionLabel === "Marquer vendue") {
        await client.put(`/annonces/${listingId}/statut`, { statut: 'vendue' });
        setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "Vendues" } : l));
        setListingFilter("Vendues");
        triggerToast("Annonce marquée comme vendue");
      } else if (actionLabel === "Modifier") {
        const res = await client.get(`/annonces/${listingId}`);
        const ad = res.data;
        setEditingListing(ad);
        setEditTitle(ad.titre);
        setEditDescription(ad.description || '');
        setEditPrice(ad.prix.toString());
        setEditCommune(ad.commune || '');
        setEditCondition(ad.etat === 'neuf' ? 'Neuf' : ad.etat === 'tres_bon' ? 'Très bon état' : ad.etat === 'bon' ? 'Bon état' : 'État correct');
        setEditNegotiable(ad.prix_negociable === 1);
        setEditDelivery(ad.delivery || 'both');
        setEditPhotos((ad.images || []).map(img => img.url));
        setEditListingModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Erreur lors de la modification de l'annonce");
    }
  };

  // Messaging operations
  const handleOpenConvo = (c) => {
    setActiveConvo(c);
    setConvoOpenMobile(true);
    setDbConversations(prev => prev.map(item => item.id === c.id ? { ...item, hasUnread: false, unread: 0 } : item));
  };

  const handleSendMsg = async () => {
    const text = draft.trim();
    if (!text || !activeConvo) return;
    try {
      const res = await client.post(`/messages/conversations/${activeConvo.id}/messages`, { contenu: text });
      const fromMe = res.data.expediteur_id === user.id;
      const newMsg = {
        fromMe,
        text: res.data.contenu,
        time: "À l'instant",
        justify: fromMe ? "flex-end" : "flex-start",
        bg: fromMe ? "var(--sugu-secondary)" : "#FFFFFF",
        color: fromMe ? "var(--sugu-bg)" : "var(--sugu-ink)",
        radius: fromMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px"
      };
      setDbMessages(prev => [...prev, newMsg]);
      setDraft('');

      // Refresh conversations list to update preview
      client.get('/messages/conversations')
        .then(resConvs => {
          const mapped = resConvs.data.map(c => {
            const isVendeur = c.vendeur_id === user.id;
            const otherName = isVendeur ? c.acheteur_nom : c.vendeur_nom;
            const initials = otherName ? otherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "SU";
            return {
              id: c.id,
              name: otherName,
              initials,
              avatarBg: isVendeur ? '#8F3A1C' : '#106C62',
              time: c.dernier_message_date ? formatTime(c.dernier_message_date) : "Nouveau",
              preview: c.dernier_message || "Aucun message",
              listing: c.annonce_titre,
              listingPrice: (c.annonce_prix || 0).toLocaleString("fr-FR") + " FCFA",
              cover_url: c.cover_url,
              hasUnread: c.non_lus > 0,
              unread: c.non_lus,
              lien_statut: c.lien_statut,
              mode_reception: c.mode_reception,
              acheteur_id: c.acheteur_id,
              vendeur_id: c.vendeur_id,
              annonce_id: c.annonce_id,
              derniere_connexion: isVendeur ? c.acheteur_derniere_connexion : c.vendeur_derniere_connexion
            };
          });
          setDbConversations(mapped);
        });
    } catch (err) {
      console.error(err);
      triggerToast("Erreur d'envoi");
    }
  };

  const handleCreatePurchaseLink = async () => {
    const priceVal = parseInt(proposedPrice, 10);
    if (isNaN(priceVal) || priceVal <= 0 || !activeConvo) {
      triggerToast("Veuillez saisir un prix valide.");
      return;
    }
    try {
      await client.post('/liens-achat/creer', {
        conversationId: activeConvo.id,
        prixConvenu: priceVal
      });
      setCreateLinkModalOpen(false);
      setProposedPrice('');
      triggerToast("Lien d'achat envoyé !");
      loadActiveMessages();
      client.get('/messages/conversations').then(res => {
        const mapped = res.data.map(c => {
          const isVendeur = c.vendeur_id === user.id;
          const otherName = isVendeur ? c.acheteur_nom : c.vendeur_nom;
          const initials = otherName ? otherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "SU";
          return {
            id: c.id,
            name: otherName,
            initials,
            avatarBg: isVendeur ? '#8F3A1C' : '#106C62',
            time: c.dernier_message_date ? formatTime(c.dernier_message_date) : "Nouveau",
            preview: c.dernier_message || "Aucun message",
            listing: c.annonce_titre,
            listingPrice: (c.annonce_prix || 0).toLocaleString("fr-FR") + " FCFA",
            cover_url: c.cover_url,
            hasUnread: c.non_lus > 0,
            unread: c.non_lus,
            lien_statut: c.lien_statut,
            mode_reception: c.mode_reception,
            acheteur_id: c.acheteur_id,
            vendeur_id: c.vendeur_id,
            annonce_id: c.annonce_id,
            derniere_connexion: isVendeur ? c.acheteur_derniere_connexion : c.vendeur_derniere_connexion
          };
        });
        setDbConversations(mapped);
      });
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur de création du lien d'achat.");
    }
  };

  const handleCancelPurchaseLink = async (lienId) => {
    try {
      await client.post(`/liens-achat/${lienId}/annuler`);
      triggerToast("Lien d'achat annulé.");
      setActiveLienDetails(null);
      loadActiveMessages();
      
      // Reload conversations list to update badge and active link status
      client.get('/messages/conversations').then(res => {
        const mapped = res.data.map(c => {
          const isVendeur = c.vendeur_id === user.id;
          const otherName = isVendeur ? c.acheteur_nom : c.vendeur_nom;
          const initials = otherName ? otherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "SU";
          return {
            id: c.id,
            name: otherName,
            initials,
            avatarBg: isVendeur ? '#8F3A1C' : '#106C62',
            time: c.dernier_message_date ? formatTime(c.dernier_message_date) : "Nouveau",
            preview: c.dernier_message || "Aucun message",
            listing: c.annonce_titre,
            listingPrice: (c.annonce_prix || 0).toLocaleString("fr-FR") + " FCFA",
            cover_url: c.cover_url,
            hasUnread: c.non_lus > 0,
            unread: c.non_lus,
            lien_statut: c.lien_statut,
            mode_reception: c.mode_reception,
            acheteur_id: c.acheteur_id,
            vendeur_id: c.vendeur_id,
            annonce_id: c.annonce_id,
            derniere_connexion: isVendeur ? c.acheteur_derniere_connexion : c.vendeur_derniere_connexion
          };
        });
        setDbConversations(mapped);
      });
    } catch (err) {
      triggerToast("Erreur d'annulation.");
    }
  };

  const handleAttachFile = (e) => {
    const file = e.target.files[0];
    if (file && activeConvo) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await client.post(`/messages/conversations/${activeConvo.id}/messages`, { contenu: "📷 Photo envoyée" });
          const fromMe = true;
          const newMsg = {
            fromMe,
            text: res.data.contenu,
            time: "À l'instant",
            justify: fromMe ? "flex-end" : "flex-start",
            bg: fromMe ? "var(--sugu-secondary)" : "#FFFFFF",
            color: fromMe ? "var(--sugu-bg)" : "var(--sugu-ink)",
            radius: fromMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px"
          };
          setDbMessages(prev => [...prev, newMsg]);
          triggerToast("Photo envoyée");
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const navDefs = [
    { id: "overview", icon: "◱", label: "Vue d'ensemble", short: "Accueil" },
    { id: "listings", icon: "🏷", label: "Mes annonces", short: "Annonces" },
    { id: "vlogs", icon: "🎥", label: "Mes Vlogs", short: "Vlogs" },
    { id: "favorites", icon: "♥", label: "Favoris", short: "Favoris" },
    { id: "messages", icon: "💬", label: "Messages", short: "Messages" },
    { id: "portefeuille", icon: "👛", label: "Mon Portefeuille", short: "Portefeuille" },
    { id: "aide", icon: "💡", label: "Politique & Aide", short: "Aide" },
    { id: "profile", icon: "⚙", label: "Profil / Paramètres", short: "Profil" },
    { id: "abonnement", icon: "💳", label: "Abonnement Pro", short: "Forfaits" },
    ...(user?.est_boutique ? [{ id: "boutique", icon: "🏪", label: "Ma Boutique Pro", short: "Boutique" }] : [])
  ];

  const totalUnread = useMemo(() => {
    return dbConversations.reduce((acc, c) => acc + (c.unread || 0), 0);
  }, [dbConversations]);

  const totalToShip = useMemo(() => {
    return dbConversations.reduce((acc, c) => {
      const isVendeur = c.vendeur_id === user?.id;
      if (isVendeur && c.lien_statut === 'paye') {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [dbConversations, user]);

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter(l => l.status === listingFilter);
  }, [listings, listingFilter]);

  const countByStatus = (statusName) => {
    return listings.filter(l => l.status === statusName).length;
  };

  // Favorites list
  const activeFavorites = favoritesList;

  // Actions for listing row
  const getActionsFor = (status) => {
    if (status === "Actives") return [{ lbl: "Modifier", pri: true }, { lbl: "Mettre en pause" }];
    if (status === "En attente") return [{ lbl: "Modifier", pri: true }, { lbl: "Supprimer" }];
    if (status === "En pause") return [{ lbl: "Republier", pri: true }, { lbl: "Supprimer" }];
    return [{ lbl: "Republier", pri: true }, { lbl: "Marquer vendue" }];
  };

  const statusStyle = {
    "Actives": { bg: "var(--sugu-secondary-soft)", color: "var(--sugu-secondary)", label: "Active" },
    "En attente": { bg: "var(--sugu-accent-soft)", color: "#B0791C", label: "En attente" },
    "En pause": { bg: "#F0E6DA", color: "#8A6A48", label: "En pause" },
    "Vendues": { bg: "var(--sugu-primary-soft)", color: "var(--sugu-primary)", label: "Vendue" }
  };

  const changeTab = (tabId) => {
    window.location.href = `/tableau-de-bord?tab=${tabId}`;
  };

  return (
    <div className="sugu-dash">
      <style>{`
        @keyframes pulse-orange {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(226, 90, 56, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(226, 90, 56, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(226, 90, 56, 0); }
        }
      `}</style>
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="sugu-dash__sidebar">
        <Link to="/" className="sugu-dash__logo-row" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div className="sugu-dash__logo-mark">
            S<span className="sugu-dash__logo-dot" />
          </div>
          <span className="sugu-dash__logo-name">TrouveTout</span>
        </Link>

        {navDefs.map(n => {
          const isSelected = section === n.id;
          const isMsg = n.id === "messages";
          return (
            <button
              key={n.id}
              type="button"
              className="sugu-dash__nav-item"
              onClick={() => changeTab(n.id)}
              style={{
                backgroundColor: isSelected ? 'var(--sugu-primary)' : 'transparent',
                color: isSelected ? 'var(--sugu-bg)' : '#C7BCAD'
              }}
            >
              <span className="sugu-dash__nav-icon">{n.icon}</span>
              <span className="sugu-dash__nav-label">{n.label}</span>
              {isMsg && totalUnread > 0 && (
                <span className="sugu-dash__nav-badge">{totalUnread}</span>
              )}
              {isMsg && totalToShip > 0 && (
                <span className="sugu-dash__nav-badge" style={{ backgroundColor: '#E25A38', animation: 'pulse-orange 2s infinite', marginLeft: totalUnread > 0 ? '6px' : '0px' }} title={`${totalToShip} colis à expédier`}>
                  📦 {totalToShip}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <button type="button" className="sugu-dash__btn-deposer" onClick={handleDeposer}>
          <span>＋</span> Déposer une annonce
        </button>

        <button
          type="button"
          className="sugu-dash__nav-item"
          onClick={handleLogout}
          style={{ color: '#9A8F80', padding: '12px 14px' }}
        >
          <span className="sugu-dash__nav-icon">↩</span>
          <span className="sugu-dash__nav-label">Déconnexion</span>
        </button>
      </aside>

      {/* ================= MAIN PANEL VIEW ================= */}
      <main className="sugu-dash__main">
        
        {/* ===== TAB 1: OVERVIEW ===== */}
        {section === 'overview' && (
          <div className="sugu-dash__overview-panel">
            
            {/* Welcome banner */}
            <div className="sugu-dash__welcome-banner">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="sugu-dash__welcome-avatar"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="sugu-dash__welcome-avatar">
                  {profileUser.initials}
                </div>
              )}
              <div className="sugu-dash__welcome-details">
                <div className="sugu-dash__welcome-hi">Bonjour,</div>
                <div className="sugu-dash__welcome-name">{profileUser.nom} 👋</div>
                <div className="sugu-dash__welcome-meta">
                  <span style={{ fontWeight: 600 }}>⭐ 4,8 <span style={{ opacity: 0.85, fontWeight: 400 }}>(126 avis)</span></span>
                  <span style={{ opacity: 0.6 }}>·</span>
                  <span>Membre depuis {user?.created_at ? new Date(user.created_at).getFullYear() : '2022'}</span>
                  {activeAbonnement ? (
                    <span className="sugu-dash__badge-pro" style={{ background: activeAbonnement.nom === 'Sur-mesure' ? '#E8A93B' : undefined, color: activeAbonnement.nom === 'Sur-mesure' ? '#4A3208' : undefined }}>
                      ★ PRO {activeAbonnement.nom.toUpperCase()}
                    </span>
                  ) : (
                    user?.type_compte === 'pro' ? (
                      <span className="sugu-dash__badge-pro" style={{ background: '#ddd', color: '#666' }}>
                        ★ PRO (Sans Forfait)
                      </span>
                    ) : (
                      <span className="sugu-dash__badge-pro" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                        PARTICULIER
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="sugu-dash__stats-grid">
              {[
                { icon: "👁", bg: "#F2E7DA", val: (stats.vuesTotales || 0).toLocaleString("fr-FR"), lbl: "Vues totales", trend: "+18%", trendCol: "var(--sugu-secondary)" },
                { icon: "💬", bg: "var(--sugu-secondary-soft)", val: (stats.contactsRecus || 0).toLocaleString("fr-FR"), lbl: "Contacts reçus", trend: "+9%", trendCol: "var(--sugu-secondary)" },
                { icon: "🏷", bg: "var(--sugu-accent-soft)", val: (stats.annoncesActives || 0).toLocaleString("fr-FR"), lbl: "Annonces actives", trend: "", trendCol: "var(--sugu-ink-faint)" },
                { icon: "✅", bg: "#F7ECE0", val: (stats.annoncesVendues || 0).toLocaleString("fr-FR"), lbl: "Annonces vendues", trend: "+3", trendCol: "var(--sugu-secondary)" }
              ].map(st => (
                <div key={st.lbl} className="sugu-dash__stat-card">
                  <div className="sugu-dash__stat-card-header">
                    <div className="sugu-dash__stat-icon-wrap" style={{ backgroundColor: st.bg }}>
                      {st.icon}
                    </div>
                    {st.trend && (
                      <span className="sugu-dash__stat-trend" style={{ color: st.trendCol }}>{st.trend}</span>
                    )}
                  </div>
                  <div className="sugu-dash__stat-value">{st.val}</div>
                  <div className="sugu-dash__stat-label">{st.lbl}</div>
                </div>
              ))}
            </div>

            {/* Recent activities */}
            <div className="sugu-dash__activity-card">
              <div className="sugu-dash__activity-header">
                <h2 className="sugu-dash__activity-title">Activité récente</h2>
                <span className="sugu-dash__activity-link" style={{ cursor: 'pointer' }} onClick={() => setActivitiesModalOpen(true)}>Tout voir</span>
              </div>
              
              {dbActivities.length > 0 ? (
                dbActivities.slice(0, 4).map((act, i) => (
                  <div key={i} className="sugu-dash__activity-row">
                    <div className="sugu-dash__activity-icon" style={{ backgroundColor: act.bg }}>
                      {act.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sugu-dash__activity-text">{act.text}</div>
                      <div className="sugu-dash__activity-time">{formatTime(act.time)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', color: 'var(--sugu-ink-faint)', textAlign: 'center' }}>
                  Aucune activité récente.
                </div>
              )}
            </div>

            {/* Advanced Stats / Conversions (Premium / Sur-mesure only) */}
            {activeAbonnement && activeAbonnement.nom !== 'Basique' && (
              <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', border: '1.5px solid var(--sugu-border)', marginTop: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sugu-ink)', marginTop: 0, marginBottom: '20px' }}>
                  📊 Analyse des Performances Avancée
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ background: 'var(--sugu-bg-soft)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', marginBottom: '8px' }}>Taux de Conversion (Vues &rarr; Contacts)</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--sugu-primary)' }}>
                      {(stats.vuesTotales > 0 ? (stats.contactsRecus / stats.vuesTotales * 100).toFixed(1) : '3.5')}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--sugu-bg-soft)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', marginBottom: '8px' }}>Temps Moyen de Visite</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--sugu-secondary)' }}>2m 14s</div>
                  </div>
                  <div style={{ background: 'var(--sugu-bg-soft)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', marginBottom: '8px' }}>Appels / Clics sur le numéro</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#B0791C' }}>
                      {Math.round(stats.contactsRecus * 0.4)} clics
                    </div>
                  </div>
                </div>
                {/* Simulated Chart */}
                <div style={{ border: '1px solid var(--sugu-border)', borderRadius: '12px', padding: '20px', background: 'var(--sugu-bg-soft)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700 }}>Évolution hebdomadaire des contacts reçus</h4>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', height: '140px', padding: '10px 0' }}>
                    {[12, 18, 15, 22, 28, 30, stats.contactsRecus].map((val, idx) => {
                      const maxVal = 40;
                      const heightPct = Math.min(100, (val / maxVal) * 100);
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{val}</span>
                          <div style={{ width: '100%', height: `${heightPct}%`, background: 'var(--sugu-primary)', borderRadius: '4px 4px 0 0', minHeight: '6px' }} />
                          <span style={{ fontSize: '11px', color: 'var(--sugu-ink-faint)' }}>J-{6-idx}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ===== TAB 2: USER LISTINGS ===== */}
        {section === 'listings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px' }}>Mes annonces</h1>

            {/* Filter Tabs */}
            <div className="sugu-dash__tab-filters">
              {["Actives", "En attente", "En pause", "Vendues"].map(st => {
                const isSelected = listingFilter === st;
                return (
                  <button
                    key={st}
                    type="button"
                    className={`sugu-dash__tab-btn ${isSelected ? 'actif' : ''}`}
                    onClick={() => setListingFilter(st)}
                  >
                    {st} <span className="sugu-dash__tab-count">{countByStatus(st)}</span>
                  </button>
                );
              })}
            </div>

            {/* Batch action / export bar (Premium/Sur-mesure only) */}
            {activeAbonnement && activeAbonnement.nom !== 'Basique' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF', padding: '12px 20px', borderRadius: '12px', border: '1.5px solid var(--sugu-border)', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={filteredListings.length > 0 && filteredListings.every(l => selectedListingIds.includes(l.id))}
                    onChange={handleSelectAllListings}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--sugu-primary)' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', fontWeight: 600 }}>
                    {selectedListingIds.length} sélectionné(s)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {selectedListingIds.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleBulkAction('pause')}
                        style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#4b5563' }}
                      >
                        ⏸️ Suspendre
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkAction('delete')}
                        style={{ background: '#F8E9E5', border: '1px solid #EAD5D0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#C0512E' }}
                      >
                        🗑️ Supprimer
                      </button>
                    </>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    style={{ background: 'color-mix(in srgb, var(--sugu-primary) 8%, #FFF)', border: '1px solid var(--sugu-primary)', color: 'var(--sugu-primary)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    📥 Exporter CSV
                  </button>
                </div>
              </div>
            )}

            {/* Listings items rows */}
            <div className="sugu-dash__listings-list">
              {filteredListings.length > 0 ? (
                filteredListings.map(l => {
                  const style = statusStyle[l.status];
                  const isBoosted = !!l.is_boosted;
                  const boostLabel = {
                    a_la_une: '👑 À la une',
                    remontee: '⬆️ Remontée',
                    urgente: '🔴 Urgente'
                  }[l.boost_type] || '⚡ Boosté';
                  const boostExpires = l.boost_expires_at
                    ? new Date(l.boost_expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : null;

                  return (
                    <div
                      key={l.id}
                      className="sugu-dash__listings-row"
                      style={{
                        border: isBoosted ? '1.5px solid #F5D87A' : undefined,
                        background: isBoosted ? 'linear-gradient(135deg, #FFFDF5 0%, #FFF8E1 100%)' : undefined,
                        position: 'relative'
                      }}
                    >
                      {/* Boost ribbon */}
                      {isBoosted && (
                        <div style={{
                          position: 'absolute', top: 0, right: 0,
                          background: 'linear-gradient(135deg, #F5C518 0%, #E8A200 100%)',
                          color: '#fff', fontSize: '10px', fontWeight: 800,
                          padding: '3px 10px 3px 8px',
                          borderRadius: '0 12px 0 10px',
                          letterSpacing: '0.3px', zIndex: 1
                        }}>
                          {boostLabel}
                        </div>
                      )}

                      {/* Checkbox for batch select */}
                      {activeAbonnement && activeAbonnement.nom !== 'Basique' && (
                        <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px' }}>
                          <input
                            type="checkbox"
                            checked={selectedListingIds.includes(l.id)}
                            onChange={() => handleToggleSelectListing(l.id)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--sugu-primary)' }}
                          />
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className="sugu-dash__listings-media" style={{ backgroundColor: l.tint || '#EADFCE', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                        {l.cover_url ? (
                          <img src={l.cover_url} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                        ) : (
                          <div className="sugu-dash__listings-media-pattern" />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="sugu-dash__listings-title-wrap">
                          <span className="sugu-dash__listings-title">{l.title}</span>
                          <span className="sugu-dash__listings-status" style={{ backgroundColor: style.bg, color: style.color }}>
                            {style.label}
                          </span>
                        </div>
                        <div className="sugu-dash__listings-price">{l.price.toLocaleString('fr-FR')} FCFA</div>
                        <div className="sugu-dash__listings-stats" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ fontSize: '13px' }}>👁</span>
                            <span>{l.views} vues</span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ fontSize: '13px' }}>💬</span>
                            <span>{l.contacts} contacts</span>
                          </span>
                          {isBoosted && boostExpires && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#D4A017', fontWeight: 600, fontSize: '11px' }}>
                              <span>⏳</span>
                              <span>Boost jusqu'au {boostExpires}</span>
                            </span>
                          )}
                        </div>

                        {/* Mini performance bar */}
                        {l.views > 0 && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flex: 1, height: '4px', borderRadius: '99px', background: '#EDE8E0', overflow: 'hidden', maxWidth: '120px' }}>
                              <div style={{ height: '100%', borderRadius: '99px', background: isBoosted ? 'linear-gradient(90deg,#F5C518,#E8A200)' : 'var(--sugu-primary, #E05624)', width: `${Math.min(100, (l.contacts / Math.max(l.views, 1)) * 100 * 10)}%` }} />
                            </div>
                            <span style={{ fontSize: '10px', color: '#aaa' }}>
                              {l.views > 0 ? ((l.contacts / l.views) * 100).toFixed(1) : 0}% conv.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="sugu-dash__listings-actions" style={{ flexShrink: 0 }}>
                        {l.status === 'Actives' && !isBoosted && (
                          <button
                            type="button"
                            onClick={() => handleOpenBoost(l)}
                            style={{
                              padding: '7px 12px', border: '1.5px solid #F5C518',
                              background: 'linear-gradient(135deg, #FFFDF5 0%, #FFF8E1 100%)',
                              color: '#B8860B', borderRadius: '8px',
                              fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s',
                              marginBottom: '4px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F5C518'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #FFFDF5 0%, #FFF8E1 100%)'; e.currentTarget.style.color = '#B8860B'; }}
                          >
                            ⚡ Booster
                          </button>
                        )}
                        {getActionsFor(l.status).map(act => (
                          <button
                            key={act.lbl}
                            type="button"
                            className={`sugu-dash__row-action-btn ${act.pri ? 'sugu-dash__row-action-btn--primary' : ''}`}
                            onClick={() => handleListingAction(act.lbl, l.id)}
                          >
                            {act.lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Empty state */
                <div className="sugu-dash__listings-empty">
                  <div className="sugu-dash__listings-empty-icon">📭</div>
                  <div className="sugu-dash__listings-empty-lbl">Aucune annonce dans cette catégorie</div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===== TAB 3: FAVORITES ===== */}
        {section === 'favorites' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px' }}>Mes favoris</h1>
            
            {activeFavorites.length > 0 ? (
              <div className="sugu-dash__favorites-grid">
                {activeFavorites.map(item => (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <ListingCard
                      annonce={{
                        id: item.id,
                        titre: item.titre,
                        prix: item.prix,
                        image: item.cover_url || null,
                        image_label: item.cover_url ? null : '[ photo ]',
                        ville: item.commune || 'Abidjan',
                        etat: item.etat || 'neuf',
                        statut: item.statut || 'active'
                      }}
                      avecFavori={false}
                    />
                    
                    {/* Unfav Button */}
                    <button
                      type="button"
                      onClick={() => handleUnfav(item.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.92)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: 'var(--sugu-primary)',
                        cursor: 'pointer',
                        zIndex: 10
                      }}
                    >
                      ♥
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sugu-dash__listings-empty" style={{ background: 'var(--sugu-surface)', border: '1px solid var(--sugu-border)', borderRadius: '20px' }}>
                <div className="sugu-dash__listings-empty-icon">♥</div>
                <div className="sugu-dash__listings-empty-lbl">Aucun favori enregistré</div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 4: MESSAGES & CHAT ===== */}
        {section === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px' }}>Messages</h1>

            <div className="sugu-dash__messages-layout-wrap">
              <div className="sugu-dash__messages-layout">
                
                {/* Convo list pane */}
                <div className={`sugu-dash__convos-col ${convoOpenMobile ? 'hide-m' : ''}`}>
                  <div className="sugu-dash__convos-header">Conversations</div>
                  {dbConversations.length > 0 ? (
                    dbConversations.map(c => (
                      <div
                        key={c.id}
                        className={`sugu-dash__convo-item ${activeConvo && activeConvo.id === c.id ? 'actif' : ''}`}
                        onClick={() => handleOpenConvo(c)}
                      >
                        <div className="sugu-dash__convo-avatar" style={{ backgroundColor: c.avatarBg }}>
                          {c.initials}
                        </div>
                        <div className="sugu-dash__convo-body">
                          <div className="sugu-dash__convo-row">
                            <span className="sugu-dash__convo-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {c.name}
                              {c.vendeur_id === user?.id && c.lien_statut === 'paye' && c.mode_reception === 'livraison' && (
                                <span style={{ background: '#E25A38', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', animation: 'pulse-orange 2s infinite' }} title="Colis à expédier">
                                  À expédier
                                </span>
                              )}
                              {c.mode_reception === 'retrait' && (c.lien_statut === 'paye' || c.lien_statut === 'attente_vendeur' || c.lien_statut === 'attente_acheteur') && (
                                <span style={{ background: '#106C62', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }} title="Rendez-vous planifié">
                                  Rendez-vous
                                </span>
                              )}
                            </span>
                            <span className="sugu-dash__convo-time">{c.time}</span>
                          </div>
                          <div className="sugu-dash__convo-row" style={{ marginTop: '2px' }}>
                            <span className="sugu-dash__convo-preview" style={{ color: c.hasUnread ? "var(--sugu-ink)" : "var(--sugu-ink-faint)", fontWeight: c.hasUnread ? '600' : '400' }}>{c.preview}</span>
                            {c.hasUnread && (
                              <span className="sugu-dash__convo-badge">{c.unread}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--sugu-ink-faint)' }}>
                      Aucune conversation.
                    </div>
                  )}
                </div>

                {/* Active chat pane */}
                {activeConvo ? (
                  <div className={`sugu-dash__chat-col ${!convoOpenMobile ? 'hide-m' : ''}`}>
                    
                    {/* Header */}
                    <div className="sugu-dash__chat-header">
                      <button type="button" className="sugu-dash__convo-back-btn" onClick={() => setConvoOpenMobile(false)}>
                        ‹
                      </button>
                      <div className="sugu-dash__convo-avatar" style={{ backgroundColor: activeConvo.avatarBg, width: '42px', height: '42px' }}>
                        {activeConvo.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="sugu-dash__chat-header-name">{activeConvo.name}</div>
                        <div 
                          className="sugu-dash__chat-header-status"
                          style={{
                            color: getOnlineStatusLabel(activeConvo.derniere_connexion) === '● En ligne' ? '#106C62' : 'var(--sugu-ink-faint)',
                            fontWeight: 600
                          }}
                        >
                          {getOnlineStatusLabel(activeConvo.derniere_connexion)}
                        </div>
                      </div>
                      <button type="button" className="sugu-dash__chat-header-btn" onClick={() => navigate(`/annonce/${activeConvo.annonce_id}`)}>
                        Voir l'annonce
                      </button>
                      {activeConvo.vendeur_id === user?.id && (
                        <button 
                          type="button" 
                          className="sugu-dash__chat-header-btn" 
                          disabled={hasActiveLien}
                          style={{ 
                            color: hasActiveLien ? '#9A8F80' : 'var(--sugu-primary)', 
                            fontWeight: 'bold', 
                            marginLeft: '12px',
                            cursor: hasActiveLien ? 'not-allowed' : 'pointer',
                            opacity: hasActiveLien ? 0.5 : 1
                          }}
                          onClick={() => {
                            if (hasActiveLien) return;
                            setProposedPrice(activeConvo.listingPrice ? activeConvo.listingPrice.replace(/[^0-9]/g, '') : '');
                            setCreateLinkModalOpen(true);
                          }}
                        >
                          ⚡ Generer le lien d'achat
                        </button>
                      )}
                    </div>
 
                    {/* Context listing banner */}
                    <div className="sugu-dash__chat-context">
                      {activeConvo.cover_url ? (
                        <img src={activeConvo.cover_url} alt="listing" className="sugu-dash__chat-context-media" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <div className="sugu-dash__chat-context-media" />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="sugu-dash__chat-context-title">{activeConvo.listing}</div>
                        <div className="sugu-dash__chat-context-price">{activeConvo.listingPrice}</div>
                      </div>
                    </div>
 
                    {/* Suivi de Livraison & Paiement Sécurisé */}
                    {renderTrackingPanel()}

                    {/* Bubbles Feed */}
                    <div className="sugu-dash__chat-feed">
                      {dbMessages.length > 0 ? (
                        dbMessages.map((m, idx) => {
                          const isSystemEtiquette = m.text.startsWith('[SYSTEM_ETIQUETTE:');
                          let systemLienId = null;
                          if (isSystemEtiquette) {
                            systemLienId = m.text.split(':')[1].replace(']', '');
                          }

                          if (isSystemEtiquette) {
                            const isVendeur = activeConvo.vendeur_id === user?.id;
                            if (!isVendeur) return null;
                            return (
                              <div key={idx} style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                                <div style={{
                                  background: '#FFF7E6',
                                  border: '1px solid #FFE7BA',
                                  borderRadius: '12px',
                                  padding: '16px',
                                  maxWidth: '450px',
                                  width: '100%',
                                  textAlign: 'center',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}>
                                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#D4380D', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    🛡️ Message de l'Administration Sugu
                                  </div>
                                  <p style={{ fontSize: '12px', color: 'var(--sugu-ink-soft)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                                    L'achat a été effectué ! En tant que vendeur, vous avez l'<b>obligation d'emballer le colis dans un carton</b> et d'y coller l'étiquette d'expédition contenant les informations de livraison.
                                  </p>
                                  <a 
                                    href={`http://localhost:4000/api/liens-achat/${systemLienId}/etiquette`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-block',
                                      background: '#D4380D',
                                      color: '#fff',
                                      padding: '8px 16px',
                                      borderRadius: '8px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      textDecoration: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🖨️ Télécharger l'étiquette d'envoi (PDF)
                                  </a>
                                </div>
                              </div>
                            );
                          }

                          const isLien = m.text.startsWith('[LIEN_ACHAT:');
                          let lienId = null;
                          let priceProposed = 0;
                          if (isLien) {
                            const parts = m.text.replace('[', '').replace(']', '').split(':');
                            lienId = parts[1];
                            priceProposed = parseInt(parts[2], 10) || 0;
                          }
 
                          return (
                            <div key={idx} className="sugu-dash__chat-bubble-row" style={{ justifyContent: m.justify }}>
                              {isLien ? (
                                <div style={{
                                  background: m.lienStatut === 'annule' ? '#F5F5F5' : (m.fromMe ? '#F4EDE4' : '#EAF4F2'),
                                  border: '1px solid',
                                  borderColor: m.lienStatut === 'annule' ? '#D9D9D9' : (m.fromMe ? '#DFD3C1' : '#BEE2DC'),
                                  borderRadius: '16px',
                                  padding: '16px',
                                  maxWidth: '300px',
                                  width: '100%',
                                  boxShadow: '0 4px 12px -8px rgba(0,0,0,0.15)',
                                  margin: '8px 0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  opacity: m.lienStatut === 'annule' ? 0.75 : 1
                                }}>
                                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--sugu-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {m.lienStatut === 'cree' && (m.fromMe ? '⚡ Lien d\'achat envoyé' : '💰 Proposition d\'achat')}
                                    {m.lienStatut === 'attente_vendeur' && '🤝 Rendez-vous proposé (En attente)'}
                                    {m.lienStatut === 'attente_acheteur' && '🔄 Contre-proposition de rendez-vous'}
                                    {m.lienStatut === 'paye' && '✅ Rendez-vous planifié / Achat effectué'}
                                    {m.lienStatut === 'annule' && '❌ Achat / Rendez-vous annulé'}
                                    {m.lienStatut === 'expedie' && '🚚 Colis expédié'}
                                    {m.lienStatut === 'livre' && '📦 Colis livré / Article remis'}
                                    {m.lienStatut === 'valide' && '🎉 Transaction finalisée'}
                                    {m.lienStatut === 'inconforme' && '⚠️ Colis non conforme'}
                                  </div>
                                  <p style={{ fontSize: '12px', color: 'var(--sugu-ink-soft)', margin: 0, lineHeight: 1.4 }}>
                                    {m.lienStatut === 'cree' && (m.fromMe ? 'En attente de confirmation et de paiement par l\'acheteur.' : 'Le vendeur vous propose de finaliser la commande au prix convenu.')}
                                    {m.lienStatut === 'attente_vendeur' && (activeConvo.vendeur_id === user?.id ? 'L\'acheteur vous propose un rendez-vous. Veuillez le confirmer ou proposer un autre créneau.' : 'Votre proposition de rendez-vous a été transmise au vendeur.')}
                                    {m.lienStatut === 'attente_acheteur' && (activeConvo.vendeur_id === user?.id ? 'Votre contre-proposition a été transmise à l\'acheteur.' : 'Le vendeur vous propose un nouveau créneau pour le rendez-vous.')}
                                    {m.lienStatut === 'paye' && 'Le paiement et le rendez-vous sont sécurisés par Sugu.'}
                                    {m.lienStatut === 'annule' && 'Ce lien de paiement / rendez-vous a été annulé.'}
                                    {m.lienStatut === 'expedie' && 'Le colis est en route avec le transporteur.'}
                                    {m.lienStatut === 'livre' && 'Phase de vérification de l\'article.'}
                                    {m.lienStatut === 'valide' && 'La transaction est terminée. Les fonds ont été transférés.'}
                                    {m.lienStatut === 'inconforme' && 'Un litige a été ouvert.'}
                                  </p>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div>
                                      <div style={{ fontSize: '9px', color: 'var(--sugu-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Prix convenu</div>
                                      <div style={{ fontWeight: 800, fontSize: '15px', color: m.lienStatut === 'annule' ? '#999' : 'var(--sugu-primary)' }}>{priceProposed.toLocaleString('fr-FR')} FCFA</div>
                                    </div>
                                    {m.lienStatut === 'cree' && (
                                      m.fromMe ? (
                                        <button 
                                          type="button" 
                                          onClick={() => handleCancelPurchaseLink(lienId)}
                                          style={{ background: '#F8E9E5', color: '#C0512E', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                          Annuler
                                        </button>
                                      ) : (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <button 
                                            type="button" 
                                            onClick={() => handleCancelPurchaseLink(lienId)}
                                            style={{ background: '#F8E9E5', color: '#C0512E', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                          >
                                            Refuser
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => navigate(`/achat/${lienId}`)}
                                            style={{ background: '#106C62', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                          >
                                            Acheter
                                          </button>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="sugu-dash__chat-bubble" style={{
                                  backgroundColor: m.bg,
                                  color: m.color,
                                  borderRadius: m.radius
                                }}>
                                  <div>{m.text}</div>
                                  {m.text.includes('Le vendeur propose un autre créneau') && activeConvo?.vendeur_id !== user?.id && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await client.post(`/liens-achat/${activeLienId}/confirmer-rdv`);
                                            triggerToast("Créneau accepté avec succès !");
                                            loadActiveMessages();
                                            client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                                          } catch (err) {
                                            alert(err.response?.data?.message || "Erreur lors de la confirmation.");
                                          }
                                        }}
                                        style={{
                                          background: '#106C62',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '8px',
                                          padding: '6px 14px',
                                          fontSize: '11.5px',
                                          fontWeight: 'bold',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ✅ Accepter ce rendez-vous
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!window.confirm("Refuser ce créneau ?")) return;
                                          try {
                                            await client.post(`/liens-achat/${activeLienId}/refuser-rdv`);
                                            triggerToast("Créneau refusé.");
                                            loadActiveMessages();
                                            client.get(`/liens-achat/${activeLienId}`).then(res => setActiveLienDetails(res.data));
                                          } catch (err) {
                                            alert(err.response?.data?.message || "Erreur lors du refus.");
                                          }
                                        }}
                                        style={{
                                          background: '#C0512E',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '8px',
                                          padding: '6px 12px',
                                          fontSize: '11.5px',
                                          fontWeight: 'bold',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ❌ Refuser
                                      </button>
                                    </div>
                                  )}
                                  <div className="sugu-dash__chat-bubble-time">{m.time}</div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--sugu-ink-faint)' }}>
                          Pas encore de messages. Envoyez un message pour démarrer la discussion.
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Composer */}
                    <div className="sugu-dash__chat-composer">
                      <label className="sugu-dash__chat-attach-btn">
                        📎
                        <input type="file" accept="image/*" onChange={handleAttachFile} style={{ display: 'none' }} />
                      </label>
                      <input
                        type="text"
                        className="sugu-dash__chat-input"
                        placeholder="Écrivez votre message…"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                      />
                      <button type="button" className="sugu-dash__chat-send-btn" onClick={handleSendMsg}>
                        ➤
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className={`sugu-dash__chat-col ${!convoOpenMobile ? 'hide-m' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sugu-ink-faint)', fontSize: '15px' }}>
                    Sélectionnez une discussion pour commencer à discuter.
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 4.25: MES VLOGS ===== */}
        {section === 'vlogs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px', margin: 0 }}>Mes Vlogs Boost 🎥</h1>
                <p className="sugu-publish-page__step-desc" style={{ margin: '4px 0 0 0', color: 'var(--sugu-ink-soft)', fontSize: '14px' }}>
                  Associez des vidéos courtes (max 1 min) style Reels/TikTok à vos annonces pour les propulser en tendance.
                </p>
              </div>
              <button 
                type="button" 
                className="sugu-btn" 
                style={{ padding: '12px 24px', borderRadius: '30px', fontWeight: 700 }}
                onClick={() => {
                  setVlogError('');
                  setVlogSuccess(false);
                  setVlogModalOpen(true);
                }}
              >
                + Créer un Vlog Boost
              </button>
            </div>

            {/* Quota details card */}
            <div style={{ 
              background: 'var(--sugu-surface)', 
              border: '1.5px solid var(--sugu-border)', 
              borderRadius: '20px', 
              padding: '24px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Formule Actuelle</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sugu-ink)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💼 {vlogQuota.subscription} 
                  {vlogQuota.hasSubscription && <span style={{ fontSize: '11px', background: 'var(--sugu-primary)', color: '#FFF', padding: '3px 8px', borderRadius: '10px' }}>PRO</span>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quotas Vlogs Journaliers</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sugu-primary)', marginTop: '4px' }}>
                  {vlogQuota.hasSubscription ? (
                    <span>{vlogQuota.quotaUsed} / {vlogQuota.quotaMax} publiés aujourd'hui ({vlogQuota.quotaRemaining} restants)</span>
                  ) : (
                    <span style={{ color: '#B0791C' }}>3 000 FCFA par vidéo (Tarif Particulier)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Vlogs List */}
            {userVlogs.length === 0 ? (
              <div style={{
                textAlign: 'center', 
                padding: '60px 24px',
                background: '#FAF9F6', 
                borderRadius: '20px',
                border: '2px dashed #D4C9B4'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎞️</div>
                <h3 style={{ margin: 0, fontWeight: 'bold', color: 'var(--sugu-ink)', fontSize: '17px' }}>Aucun vlog publié</h3>
                <p style={{ margin: '8px 0 0 0', color: 'var(--sugu-ink-soft)', fontSize: '14px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                  Mettez en scène vos produits en vidéo et touchez 10 fois plus d'acheteurs.
                </p>
                <button 
                  type="button" 
                  className="sugu-btn" 
                  style={{ marginTop: '20px', padding: '10px 24px', fontSize: '13px' }}
                  onClick={() => setVlogModalOpen(true)}
                >
                  Publier mon premier Vlog
                </button>
              </div>
            ) : (
              <div style={{ background: '#FFF', borderRadius: '20px', border: '1.5px solid var(--sugu-border)', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--sugu-bg-soft)', borderBottom: '1.5px solid var(--sugu-border)' }}>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--sugu-ink-soft)' }}>Aperçu</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--sugu-ink-soft)' }}>Annonce liée</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--sugu-ink-soft)' }}>Type</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--sugu-ink-soft)' }}>Date</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--sugu-ink-soft)' }}>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userVlogs.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--sugu-border)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          {v.type_video === 'upload' ? (
                            <video 
                              src={v.video_url} 
                              style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '8px', background: '#000' }} 
                              muted 
                              playsInline 
                            />
                          ) : (
                            <div style={{ width: '60px', height: '90px', borderRadius: '8px', background: 'var(--sugu-ink)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#FFF', fontSize: '10px', fontWeight: 'bold', padding: '4px', textAlign: 'center' }}>
                              🔗 Lien
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--sugu-ink)', fontSize: '14.5px' }}>{v.annonce_titre}</div>
                          <div style={{ color: 'var(--sugu-primary)', fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{v.annonce_prix?.toLocaleString('fr-FR')} FCFA</div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13.5px', color: 'var(--sugu-ink-soft)' }}>
                          {v.type_video === 'upload' ? '💻 Import local' : '🌐 Lien externe'}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13.5px', color: 'var(--sugu-ink-soft)' }}>
                          {new Date(v.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sugu-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            👁️ {v.vues?.toLocaleString('fr-FR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Vlog Creation Modal */}
            {vlogModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
                padding: '20px',
                backdropFilter: 'blur(5px)'
              }}>
                <div style={{
                  background: '#FFF',
                  borderRadius: '24px',
                  width: '100%',
                  maxWidth: '520px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '36px',
                  position: 'relative',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                }}>
                  {/* Close button */}
                  <button 
                    type="button" 
                    onClick={() => setVlogModalOpen(false)}
                    style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--sugu-ink-soft)' }}
                  >
                    ×
                  </button>

                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--sugu-ink)', margin: '0 0 8px 0' }}>Créer un Vlog Boost</h2>
                  <p style={{ margin: '0 0 24px 0', color: 'var(--sugu-ink-soft)', fontSize: '13.5px', lineHeight: 1.5 }}>
                    Associez une vidéo courte de présentation à votre annonce pour la booster auprès des acheteurs.
                  </p>

                  {vlogSuccess ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <span style={{ fontSize: '48px' }}>🎉</span>
                      <h3 style={{ margin: '16px 0 8px 0', color: 'var(--sugu-ink)', fontWeight: 800 }}>Vlog Publié !</h3>
                      <p style={{ color: 'var(--sugu-ink-soft)', margin: 0, fontSize: '14px' }}>Votre vidéo est désormais visible dans la section Tendances de Sugu.</p>
                    </div>
                  ) : (
                    <form onSubmit={handlePublishVlog} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* Step 1: Linked ad selection */}
                      <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                        <label className="sugu-publish-page__label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                          1. Associer à une annonce existante
                        </label>
                        <select 
                          value={vlogAnnonceId}
                          onChange={(e) => setVlogAnnonceId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: '1.5px solid var(--sugu-border)',
                            fontSize: '14px',
                            fontWeight: 600,
                            background: '#FFF'
                          }}
                          required
                        >
                          <option value="">-- Sélectionner une annonce --</option>
                          {listings.map(l => (
                            <option key={l.id} value={l.id}>{l.title} ({l.price?.toLocaleString('fr-FR')} FCFA)</option>
                          ))}
                        </select>
                      </div>

                      {/* Step 2: Choose Source Type */}
                      <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                        <label className="sugu-publish-page__label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                          2. Source de la vidéo
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            type="button"
                            onClick={() => { setVlogType('upload'); setVlogLink(''); }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              borderRadius: '12px',
                              border: vlogType === 'upload' ? '2px solid var(--sugu-primary)' : '1.5px solid var(--sugu-border)',
                              background: vlogType === 'upload' ? 'color-mix(in srgb, var(--sugu-primary) 5%, #FFF)' : '#FFF',
                              color: vlogType === 'upload' ? 'var(--sugu-primary)' : 'var(--sugu-ink-soft)',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            💻 Importer (MP4)
                          </button>
                          <button 
                            type="button"
                            onClick={() => { setVlogType('lien'); setVlogFile(null); setVlogFileBase64(''); }}
                            style={{
                              flex: 1,
                              padding: '12px',
                              borderRadius: '12px',
                              border: vlogType === 'lien' ? '2px solid var(--sugu-primary)' : '1.5px solid var(--sugu-border)',
                              background: vlogType === 'lien' ? 'color-mix(in srgb, var(--sugu-primary) 5%, #FFF)' : '#FFF',
                              color: vlogType === 'lien' ? 'var(--sugu-primary)' : 'var(--sugu-ink-soft)',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            🌐 Lien (TikTok / Insta / YT)
                          </button>
                        </div>
                      </div>

                      {/* Source inputs */}
                      {vlogType === 'upload' ? (
                        <div style={{ background: 'var(--sugu-bg-soft)', padding: '20px', borderRadius: '16px', border: '1px dashed var(--sugu-border)' }}>
                          <input 
                            type="file" 
                            accept="video/mp4" 
                            onChange={handleVlogFileChange}
                            style={{ display: 'block', width: '100%', fontSize: '13px' }}
                          />
                          <p style={{ margin: '8px 0 0 0', fontSize: '11.5px', color: 'var(--sugu-ink-soft)' }}>
                            Format supporté : <b>MP4 uniquement</b>. Durée maximale : <b>1 minute (60s)</b>.
                          </p>
                          {vlogFile && (
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '18px' }}>✅</span>
                              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--sugu-ink)' }}>{vlogFile.name} (Prêt)</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input 
                            type="url"
                            placeholder="https://www.tiktok.com/@user/video/..."
                            value={vlogLink}
                            onChange={(e) => setVlogLink(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              borderRadius: '12px',
                              border: '1.5px solid var(--sugu-border)',
                              fontSize: '14px'
                            }}
                          />
                          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--sugu-ink-soft)' }}>
                            Liens supportés : TikTok, Instagram (Reels), YouTube (Shorts).
                          </p>
                        </div>
                      )}

                      {/* Step 3: Simulated Payment if no subscription */}
                      {!vlogQuota.hasSubscription && (
                        <div style={{ background: '#FFFDF0', border: '1.5px solid #F6ECC4', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#8A6A48' }}>💰 Paiement Boost unitaire</span>
                            <span style={{ fontWeight: 900, color: '#B0791C', fontSize: '15px' }}>3 000 FCFA</span>
                          </div>
                          <hr style={{ border: 0, borderTop: '1px solid #F6ECC4', margin: 0 }} />
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            {['Wave', 'Orange Money', 'MTN'].map(op => (
                              <button
                                key={op}
                                type="button"
                                onClick={() => setVlogMoyenPaiement(op)}
                                style={{
                                  padding: '8px 4px',
                                  borderRadius: '10px',
                                  border: vlogMoyenPaiement === op ? '2px solid #B0791C' : '1px solid #F6ECC4',
                                  background: vlogMoyenPaiement === op ? '#FFFDF0' : '#FFF',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  color: vlogMoyenPaiement === op ? '#B0791C' : 'var(--sugu-ink-soft)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <img 
                                  src={op === 'Wave' ? imgWave : op === 'Orange Money' ? imgOrange : imgMTN} 
                                  alt={op} 
                                  style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '3px' }} 
                                />
                                <span>{op === 'Wave' ? 'Wave' : op === 'Orange Money' ? 'Orange' : 'MTN'}</span>
                              </button>
                            ))}
                          </div>

                          <div>
                            <label style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#8A6A48' }}>Numéro de paiement</label>
                            <input 
                              type="tel"
                              placeholder="07 00 00 00 00"
                              value={vlogPhonePaiement}
                              onChange={(e) => setVlogPhonePaiement(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #F6ECC4',
                                fontSize: '13px'
                              }}
                              required={!vlogQuota.hasSubscription}
                            />
                          </div>
                        </div>
                      )}

                      {vlogError && (
                        <div style={{ background: '#FFF5F2', border: '1px solid #FFDDD2', color: '#E03131', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                          ⚠️ {vlogError}
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={vlogPublishing}
                        className="sugu-btn"
                        style={{
                          width: '100%',
                          padding: '16px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '14.5px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {vlogPublishing ? (
                          <>
                            <span className="sugu-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', display: 'inline-block', animation: 'sugu-spin 0.8s linear infinite' }} />
                            Publication en cours...
                          </>
                        ) : (
                          vlogQuota.hasSubscription ? 'Publier le Vlog (Quota inclus)' : 'Payer 3 000 FCFA & Publier'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 4.5: POLITIQUE & AIDE ===== */}
        {section === 'aide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px', margin: 0 }}>Politique &amp; Guide d'Aide</h1>
            
            <div style={{ background: 'var(--sugu-surface)', border: '1px solid var(--sugu-border)', borderRadius: '20px', padding: '30px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--sugu-primary)', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📦 Fonctionnement des ventes et colisage obligatoire
              </h2>
              <p style={{ lineHeight: 1.6, color: 'var(--sugu-ink-soft)', fontSize: '14px' }}>
                Chez Sugu, nous garantissons la meilleure expérience d'achat et de livraison possible. C'est pourquoi nous avons mis en place une politique stricte pour l'envoi de colis.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '24px' }}>
                <div style={{ background: '#FFF5F2', borderLeft: '4px solid var(--sugu-primary)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--sugu-primary)', margin: '0 0 10px 0' }}>1. Emballage obligatoire en carton</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--sugu-ink-soft)', margin: 0, lineHeight: 1.5 }}>
                    Dès qu'un acheteur effectue un paiement pour une livraison à domicile, le vendeur a l'<b>obligation stricte d'emballer le produit dans un carton solide</b>. Les enveloppes en papier ou les produits non emballés seront refusés par le livreur.
                  </p>
                </div>

                <div style={{ background: 'var(--sugu-secondary-soft)', borderLeft: '4px solid var(--sugu-secondary)', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--sugu-secondary)', margin: '0 0 10px 0' }}>2. Impression et collage de l'étiquette</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--sugu-ink-soft)', margin: 0, lineHeight: 1.5 }}>
                    Une fois le paiement de l'acheteur validé, le système génère automatiquement une <b>étiquette d'expédition</b>. 
                    Vous recevrez cette étiquette par e-mail ainsi que dans vos messages Sugu. Vous devez obligatoirement l'imprimer et la <b>coller de manière visible sur le carton</b>.
                  </p>
                </div>

                <div style={{ background: '#F0E6DA', borderLeft: '4px solid #8A6A48', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', color: '#8A6A48', margin: '0 0 10px 0' }}>3. Expédition et suivi en temps réel</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--sugu-ink-soft)', margin: 0, lineHeight: 1.5 }}>
                    Une fois le colis emballé et étiqueté, contactez le livreur (Yango de préférence). Saisissez le lien de suivi Yango dans l'application afin que l'acheteur et le système puissent suivre l'acheminement en temps réel.
                  </p>
                </div>

                <div style={{ background: '#EBF5F3', borderLeft: '4px solid #106C62', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', color: '#106C62', margin: '0 0 10px 0' }}>4. Déblocage sécurisé des fonds</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--sugu-ink-soft)', margin: 0, lineHeight: 1.5 }}>
                    À la livraison du colis, l'acheteur dispose de <b>3 jours</b> (5 minutes pour les tests en local) pour vérifier le produit :
                    <br/>
                    • Si le produit est conforme, l'acheteur valide et vous recevez immédiatement vos fonds par Mobile Money.
                    <br/>
                    • Passé ce délai de 3 jours sans signalement, les fonds vous sont <b>automatiquement transférés</b> et vous recevez une notification par SMS et e-mail.
                    <br/>
                    • En cas de non-conformité, l'acheteur peut ouvrir un litige pour suspendre le paiement.
                  </p>
                </div>

                <div style={{ background: '#FFFDF0', borderLeft: '4px solid #B0791C', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', color: '#B0791C', margin: '0 0 10px 0' }}>💰 Système de commission sur paiement sécurisé</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--sugu-ink-soft)', margin: 0, lineHeight: 1.5 }}>
                    Pour soutenir le fonctionnement de la plateforme et sécuriser vos transactions, une commission s'applique <b>uniquement</b> sur les ventes réglées via paiement sécurisé en ligne (Mobile Money).
                    <br/><br/>
                    • <b>Gratuit par défaut</b> : Aucun frais ou commission ne s'applique pour les échanges directs de main à main payés en espèces.
                    <br/>
                    • <b>Comptes Particuliers</b> : <b>5%</b> de commission sur le montant total de la transaction.
                    <br/>
                    • <b>Comptes Professionnels</b> : <b>3%</b> de commission seulement sur le montant total.
                    <br/>
                    • <b>Seuils</b> : La commission est de minimum <b>100 FCFA</b> et plafonnée à un maximum de <b>50 000 FCFA</b> par transaction.
                    <br/>
                    • <b>Dépôt de fonds</b> : La commission est automatiquement déduite de votre solde lors du déblocage des fonds vers votre portefeuille.
                  </p>
                </div>

                <div style={{ background: '#E6F7FF', borderLeft: '4px solid #1890FF', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', color: '#1890FF', margin: '0 0 10px 0' }}>🚀 Avantages des Comptes Professionnels (Pro)</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--sugu-ink-soft)', margin: 0, lineHeight: 1.5 }}>
                    Passez au compte Pro pour débloquer de superbes outils et booster votre visibilité :
                    <br/><br/>
                    • <b>Badge "Pro vérifié"</b> : Rassurez instantanément vos acheteurs.
                    <br/>
                    • <b>E-Vitrine Pro</b> : Une page boutique dédiée avec vos horaires, votre logo et vos contacts.
                    <br/>
                    • <b>Quotas accrus</b> : Publiez jusqu'à 20, 50 ou en illimité selon votre forfait (contre 5 pour les particuliers).
                    <br/>
                    • <b>Mises en avant incluses</b> : Recevez des boosts automatiques chaque mois pour remonter vos annonces en tête de liste.
                    <br/>
                    • <b>Commission réduite</b> : Payez seulement 3% de commission sur vos ventes sécurisées (au lieu de 5% pour les particuliers).
                  </p>
                </div>

                <div style={{ background: '#E2F0D9', borderLeft: '4px solid #385723', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', color: '#385723', margin: '0 0 10px 0' }}>🎥 Boostez vos ventes avec les Vlogs Sugu</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--sugu-ink-soft)', margin: 0, lineHeight: 1.5 }}>
                    Publiez des vidéos courtes (max 1 minute) présentant vos produits pour les propulser en tendance sur la page d'accueil !
                    <br/><br/>
                    • <b>Liaison obligatoire</b> : Chaque vlog doit être obligatoirement lié à une annonce existante de votre choix.
                    <br/>
                    • <b>Modes d'importation</b> : Import de fichiers vidéo locaux (MP4 uniquement, 1 minute max) ou intégration de liens externes existants (TikTok, Instagram Reels, YouTube Shorts).
                    <br/>
                    • <b>Tarifs Particuliers (sans abonnement)</b> : <b>3 000 FCFA</b> par publication de vlog.
                    <br/>
                    • <b>Quota Basique / Standard</b> : <b>5 vlogs inclus par jour</b>.
                    <br/>
                    • <b>Quota Premium</b> : <b>10 vlogs inclus par jour</b>.
                    <br/>
                    • <b>Quota Sur-mesure</b> : <b>30 vlogs inclus par jour</b>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 5: PROFILE & SETTINGS ===== */}
        {section === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px', margin: 0 }}>Profil &amp; paramètres</h1>

            {/* Profile Brief header */}
            <div style={{ background: 'var(--sugu-surface)', border: '1px solid var(--sugu-border)', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  position: 'relative',
                  width: '76px',
                  height: '76px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid var(--sugu-border)',
                  background: '#f3ece3'
                }}
                title="Cliquer pour importer une photo"
                className="sugu-dash__profile-avatar-hover"
              >
                {profileAvatarUrl ? (
                  <img
                    src={profileAvatarUrl}
                    alt="Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, var(--sugu-primary), var(--sugu-primary-hover))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--sugu-bg)',
                    fontFamily: 'var(--sugu-font-heading)',
                    fontWeight: 800,
                    fontSize: '28px'
                  }}>
                    {profileUser.initials}
                  </div>
                )}
                <div className="sugu-dash__profile-avatar-overlay">
                  📷
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--sugu-font-heading)', fontWeight: 700, fontSize: '20px', color: 'var(--sugu-ink)' }}>
                  {profileNom} {profilePrenom}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--sugu-ink-faint)', marginTop: '2px' }}>
                  ⭐ 4,8 · Membre depuis 2022 · {profileUser.commune}
                </div>
              </div>
              <button
                type="button"
                className="sugu-dash__row-action-btn sugu-dash__row-action-btn--primary"
                style={{ padding: '9px 16px', borderRadius: '11px' }}
                onClick={handleGenerateAvatar}
              >
                Générer un avatar
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {/* Grid Container */}
            <div className="sugu-dash__profile-grid">
              
              {/* Left Column: Personal info */}
              <div className="sugu-dash__profile-card">
                <div className="sugu-publish-page__section-title" style={{ marginBottom: '18px' }}>Informations personnelles</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="sugu-publish-page__field">
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Nom *</label>
                    <input
                      type="text"
                      className="sugu-search-page__price-input"
                      value={profileNom}
                      onChange={(e) => setProfileNom(e.target.value)}
                      style={{ fontSize: '14px', padding: '12px 14px' }}
                      required
                    />
                  </div>
                  <div className="sugu-publish-page__field">
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Prénom *</label>
                    <input
                      type="text"
                      className="sugu-search-page__price-input"
                      value={profilePrenom}
                      onChange={(e) => setProfilePrenom(e.target.value)}
                      style={{ fontSize: '14px', padding: '12px 14px' }}
                      required
                    />
                  </div>
                </div>

                <div className="sugu-publish-page__field" style={{ marginBottom: '14px' }}>
                  <span className="sugu-auth-champ-label" style={{ fontSize: '13px', marginBottom: '6px' }}>Téléphone</span>
                  <div className="sugu-auth-champ-compose">
                    <span className="sugu-auth-champ-compose__prefixe">🇨🇮 +225</span>
                    <input
                      inputMode="tel"
                      placeholder="07 00 00 00 00"
                      value={profileTelephone}
                      onChange={(e) => setProfileTelephone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="sugu-publish-page__field" style={{ marginBottom: '14px' }}>
                  <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Adresse E-mail (Optionnel)</label>
                  <input
                    type="email"
                    placeholder="votre.email@domaine.com"
                    className="sugu-search-page__price-input"
                    value={profileEmail}
                    disabled={!!user?.google_id}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    style={{ 
                      fontSize: '14px', 
                      padding: '12px 14px',
                      backgroundColor: user?.google_id ? '#f2f2f2' : undefined,
                      cursor: user?.google_id ? 'not-allowed' : undefined
                    }}
                  />
                  {user?.google_id && (
                    <span style={{ fontSize: '11px', color: 'var(--sugu-ink-faint)', marginTop: '4px', display: 'block' }}>
                      Les comptes créés via Google ne peuvent pas modifier leur adresse e-mail.
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="sugu-publish-page__field">
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Ville</label>
                    <input
                      type="text"
                      className="sugu-search-page__price-input"
                      value={profileVille}
                      onChange={(e) => setProfileVille(e.target.value)}
                      style={{ fontSize: '14px', padding: '12px 14px' }}
                    />
                  </div>
                  <div className="sugu-publish-page__field">
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Commune</label>
                    <select
                      className="sugu-search-page__price-input"
                      value={profileCommune}
                      onChange={(e) => setProfileCommune(e.target.value)}
                      style={{
                        fontSize: '14px',
                        padding: '12px 14px',
                        width: '100%',
                        borderRadius: '12px',
                        border: '1.5px solid var(--sugu-border)',
                        background: 'var(--sugu-surface)',
                        outline: 'none'
                      }}
                    >
                      <option value="">Sélectionner une commune</option>
                      {COMMUNES.filter(c => c !== "Toute la Côte d'Ivoire").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sugu-publish-page__field" style={{ marginBottom: '20px' }}>
                  <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Adresse détaillée</label>
                  <input
                    type="text"
                    className="sugu-search-page__price-input"
                    value={profileAdresseDetail}
                    onChange={(e) => setProfileAdresseDetail(e.target.value)}
                    style={{ fontSize: '14px', padding: '12px 14px' }}
                    placeholder="Ex : Angré 8e Tranche, à côté de la pharmacie"
                  />
                </div>

                {/* Save personal info */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button size="lg" style={{ padding: '12px 24px' }} onClick={handleSaveProfile}>
                    Enregistrer les informations
                  </Button>
                </div>
              </div>

              {/* Right Column: Preferences & Security */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Notification preferences block */}
                <div className="sugu-dash__profile-pref-card" style={{ margin: 0 }}>
                  <div className="sugu-publish-page__section-title" style={{ marginBottom: '14px' }}>Préférences de notification</div>
                  
                  {[
                    { key: "push", label: "Notifications push", desc: "Nouveaux messages et vues sur vos annonces" },
                    { key: "email", label: "Alertes e-mail", desc: "Résumé hebdomadaire de votre activité" },
                    { key: "phone", label: "Afficher mon numéro", desc: "Visible sur vos annonces publiques" }
                  ].map(p => {
                    const isChecked = prefs[p.key];
                    return (
                      <div key={p.key} className="sugu-dash__pref-item" onClick={() => handleTogglePref(p.key)}>
                        <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                          <div className="sugu-dash__pref-title">{p.label}</div>
                          <div className="sugu-dash__pref-desc">{p.desc}</div>
                        </div>
                        
                        <div
                          className="sugu-dash__switch-track"
                          style={{ backgroundColor: isChecked ? 'var(--sugu-primary)' : '#D8CDBC' }}
                        >
                          <div
                            className="sugu-dash__switch-knob"
                            style={{ left: isChecked ? '23px' : '3px' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Password Change block — masqué pour les comptes Google */}
                {!user?.google_id ? (
                  <div className="sugu-dash__profile-pref-card" style={{ margin: 0 }}>
                    <div className="sugu-publish-page__section-title" style={{ marginBottom: '14px' }}>Sécurité &amp; Mot de passe</div>
                    
                    <form onSubmit={handleRequestPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="sugu-publish-page__field">
                        <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Mot de passe actuel</label>
                        <input
                          type="password"
                          className="sugu-search-page__price-input"
                          value={passwordActuel}
                          onChange={(e) => setPasswordActuel(e.target.value)}
                          style={{ fontSize: '14px', padding: '12px 14px' }}
                          required
                        />
                      </div>
                      
                      <div className="sugu-publish-page__field">
                        <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Nouveau mot de passe</label>
                        <input
                          type="password"
                          className="sugu-search-page__price-input"
                          value={passwordNouveau}
                          onChange={(e) => setPasswordNouveau(e.target.value)}
                          style={{ fontSize: '14px', padding: '12px 14px' }}
                          required
                        />
                      </div>

                      <div className="sugu-publish-page__field">
                        <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Confirmer le nouveau mot de passe</label>
                        <input
                          type="password"
                          className="sugu-search-page__price-input"
                          value={passwordConfirmer}
                          onChange={(e) => setPasswordConfirmer(e.target.value)}
                          style={{ fontSize: '14px', padding: '12px 14px' }}
                          required
                        />
                      </div>

                      <Button type="submit" size="lg" disabled={envoiMdp} style={{ padding: '12px 24px', marginTop: '6px' }}>
                        {envoiMdp ? 'Envoi...' : 'Modifier le mot de passe'}
                      </Button>
                    </form>
                  </div>
                ) : (
                  /* Utilisateur connecté via Google → pas de mot de passe */
                  <div className="sugu-dash__profile-pref-card" style={{ margin: 0 }}>
                    <div className="sugu-publish-page__section-title" style={{ marginBottom: '14px' }}>Sécurité</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      background: 'color-mix(in srgb, #4285F4 8%, transparent)',
                      border: '1px solid color-mix(in srgb, #4285F4 25%, transparent)',
                      borderRadius: '12px',
                    }}>
                      <span style={{ fontSize: '28px', flexShrink: 0 }}>🔒</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--sugu-ink)', marginBottom: '6px' }}>
                          Compte sécurisé par Google
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5, margin: 0 }}>
                          Votre compte est protégé directement par Google. La gestion de votre mot de passe s'effectue depuis votre compte Google.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Mobile & general logout button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '24px' }}>
              <button
                type="button"
                className="sugu-dash__row-action-btn"
                style={{
                  background: '#F8E9E5',
                  color: '#C0512E',
                  border: '1px solid #EAD5D0',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={handleSaveProfile}
              >
                💾 Enregistrer les informations
              </button>
              
              <button
                type="button"
                className="sugu-dash__row-action-btn"
                style={{
                  background: '#f3f4f6',
                  color: '#4b5563',
                  border: '1px solid #d1d5db',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: '12px'
                }}
                onClick={handleLogout}
              >
                ↩ Déconnexion
              </button>
            </div>

            {/* OTP password confirmation modal */}
            {otpModifOpen && (
              <div className="sugu-modal-backdrop" style={{ zIndex: 1050 }}>
                <div className="sugu-modal-content" style={{ maxWidth: '380px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontFamily: 'var(--sugu-font-heading)', fontWeight: 700, fontSize: '18px', color: 'var(--sugu-ink)' }}>
                      Confirmer la modification 🔑
                    </span>
                    <button type="button" className="sugu-modal-close" style={{ width: '32px', height: '32px', fontSize: '16px' }} onClick={() => setOtpModifOpen(false)}>
                      ✕
                    </button>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5, marginBottom: '18px' }}>
                    Un code de confirmation OTP vous a été envoyé par SMS / E-mail. Veuillez le renseigner ci-dessous.
                  </p>

                  <form onSubmit={handleConfirmPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="sugu-publish-page__field">
                      <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Code de confirmation (OTP)</label>
                      <input
                        type="text"
                        className="sugu-search-page__price-input"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        style={{ fontSize: '18px', textAlign: 'center', letterSpacing: '4px', padding: '10px' }}
                        placeholder="000000"
                        required
                      />
                    </div>

                    <Button type="submit" fullWidth size="lg">
                      Confirmer la modification
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Transactions History */}
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', border: '1.5px solid var(--sugu-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sugu-ink)', marginTop: 0, marginBottom: '20px' }}>Historique des factures</h3>
              {transactions.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', margin: 0 }}>Aucune transaction enregistrée.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid var(--sugu-border)' }}>
                        <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Date</th>
                        <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Description</th>
                        <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Moyen</th>
                        <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Montant</th>
                        <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Statut</th>
                        <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Facture</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--sugu-border)' }}>
                          <td style={{ padding: '12px 8px' }}>{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>Pro {t.abonnement_nom}</td>
                          <td style={{ padding: '12px 8px' }}>{t.moyen_paiement}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{parseFloat(t.montant).toLocaleString('fr-FR')} FCFA</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ color: '#106C62', fontWeight: 600 }}>Complété</span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <button 
                              type="button"
                              onClick={() => {
                                const printWindow = window.open('', '_blank');
                                printWindow.document.write(`
                                  <div style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 12px;">
                                    <h2>FACTURE SUGU TROUVETOUT</h2>
                                    <p>Facture N° FACT-${t.id}</p>
                                    <p>Date : ${new Date(t.date).toLocaleDateString('fr-FR')}</p>
                                    <hr/>
                                    <p>Client : <b>${user.nom}</b></p>
                                    <p>Désignation : <b>Abonnement Professionnel ${t.abonnement_nom}</b></p>
                                    <p>Mode de règlement : <b>${t.moyen_paiement}</b></p>
                                    <h3>Montant Total : ${parseFloat(t.montant).toLocaleString('fr-FR')} FCFA</h3>
                                    <hr/>
                                    <p style="text-align: center; color: #666; font-size: 12px;">Merci de votre confiance ! Sugu Côte d'Ivoire</p>
                                  </div>
                                `);
                                printWindow.document.close();
                                printWindow.print();
                              }}
                              style={{ border: 'none', background: 'none', color: 'var(--sugu-primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                            >
                              Télécharger 🖨️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB 6: ABONNEMENT PRO ===== */}
        {section === 'abonnement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px', margin: 0 }}>Mon Abonnement Pro</h1>

            {activeAbonnement ? (
              // Case: Subscribed
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Active Plan Card */}
                <div style={{
                  background: activeAbonnement.nom === 'Sur-mesure' ? '#211D18' : activeAbonnement.nom === 'Premium' ? 'color-mix(in srgb, var(--sugu-primary) 5%, #FFF)' : '#FFF',
                  color: activeAbonnement.nom === 'Sur-mesure' ? '#FFF' : 'var(--sugu-ink)',
                  border: activeAbonnement.nom === 'Premium' ? '2px solid var(--sugu-primary)' : '1.5px solid var(--sugu-border)',
                  borderRadius: '20px',
                  padding: '30px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <span style={{
                        background: activeAbonnement.nom === 'Sur-mesure' ? '#E8A93B' : 'var(--sugu-primary)',
                        color: activeAbonnement.nom === 'Sur-mesure' ? '#4A3208' : '#FFF',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '30px',
                        textTransform: 'uppercase',
                        display: 'inline-block',
                        marginBottom: '12px'
                      }}>
                        Abonnement Actif
                      </span>
                      <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>Sugu Pro — {activeAbonnement.nom}</h2>
                      <p style={{ color: activeAbonnement.nom === 'Sur-mesure' ? 'rgba(255,255,255,0.7)' : 'var(--sugu-ink-soft)', fontSize: '14px', margin: 0 }}>
                        {activeAbonnement.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '32px', fontWeight: 900 }}>
                        {parseFloat(activeAbonnement.prix).toLocaleString('fr-FR')} <span style={{ fontSize: '14px', fontWeight: 600 }}>FCFA / mois</span>
                      </div>
                      <p style={{ color: activeAbonnement.nom === 'Sur-mesure' ? 'rgba(255,255,255,0.6)' : 'var(--sugu-ink-faint)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Prochain prélèvement le {new Date(activeAbonnement.date_fin).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {/* Quota Card */}
                  <div style={{ background: '#FFF', border: '1.5px solid var(--sugu-border)', borderRadius: '16px', padding: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--sugu-ink)' }}>📊 Quota d'annonces</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                      <span>Annonces actives</span>
                      <span>{listings.filter(l => l.status === 'Actives').length} / {activeAbonnement.quota_annonces === 0 ? 'Illimité' : activeAbonnement.quota_annonces}</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ background: '#EADFCE', height: '8px', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        background: 'var(--sugu-primary)',
                        height: '100%',
                        width: `${activeAbonnement.quota_annonces === 0 ? 100 : Math.min(100, (listings.filter(l => l.status === 'Actives').length / activeAbonnement.quota_annonces) * 100)}%`
                      }} />
                    </div>
                  </div>

                  {/* Actions / Renewal Card */}
                  <div style={{ background: '#FFF', border: '1.5px solid var(--sugu-border)', borderRadius: '16px', padding: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--sugu-ink)' }}>⚙️ Gestion de l'abonnement</h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                      {activeAbonnement.renouvellement_auto === 1
                        ? "Le renouvellement automatique est activé. Votre carte ou compte Mobile Money sera débité le jour de l'échéance."
                        : "Le renouvellement automatique est désactivé. Votre forfait expirera à la fin de la période en cours."}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {activeAbonnement.renouvellement_auto === 1 && (
                        <button
                          type="button"
                          onClick={handleCancelRenewal}
                          className="sugu-dash__row-action-btn"
                          style={{ background: '#F8E9E5', color: '#C0512E', border: '1px solid #EAD5D0', padding: '10px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Désactiver le renouvellement
                        </button>
                      )}
                      <Link
                        to="/abonnements"
                        style={{ background: 'var(--sugu-ink)', color: '#FFF', textDecoration: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, textAlign: 'center' }}
                      >
                        Changer de forfait
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Transactions table (optional here, but nice to have in Abonnement context) */}
                <div style={{ background: '#FFF', borderRadius: '16px', padding: '24px', border: '1.5px solid var(--sugu-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', marginTop: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sugu-ink)', marginTop: 0, marginBottom: '20px' }}>Historique des paiements de l'abonnement</h3>
                  {transactions.length === 0 ? (
                    <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', margin: 0 }}>Aucune transaction enregistrée.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid var(--sugu-border)' }}>
                            <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Date</th>
                            <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Description</th>
                            <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Moyen</th>
                            <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Montant</th>
                            <th style={{ padding: '12px 8px', color: 'var(--sugu-ink-soft)' }}>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((t) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid var(--sugu-border)' }}>
                              <td style={{ padding: '12px 8px' }}>{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                              <td style={{ padding: '12px 8px', fontWeight: 600 }}>Pro {t.abonnement_nom}</td>
                              <td style={{ padding: '12px 8px' }}>{t.moyen_paiement}</td>
                              <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{parseFloat(t.montant).toLocaleString('fr-FR')} FCFA</td>
                              <td style={{ padding: '12px 8px' }}><span style={{ color: '#106C62', fontWeight: 600 }}>Complété</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Case: Not Subscribed
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Marketing Panel */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--sugu-primary) 0%, #a43e1d 100%)',
                  color: '#FFF',
                  borderRadius: '20px',
                  padding: '40px 30px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  textAlign: 'left'
                }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 12px 0' }}>Devenez Vendeur Professionnel 🚀</h2>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: '0 0 30px 0', maxWidth: '700px', lineHeight: 1.6 }}>
                    Débloquez des fonctionnalités exclusives pour accélérer votre activité commerciale sur Sugu et toucher des milliers de clients potentiels.
                  </p>
                  
                  {/* Grid of benefits */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏪</div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: 700 }}>E-Vitrine Pro</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Créez votre propre espace de vente personnalisé avec vos horaires, logo et liens.</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: 700 }}>Quota étendu</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Publiez plus d'annonces en simultané (jusqu'à 50 annonces ou illimité).</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚀</div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: 700 }}>Boost Automatique</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Bénéficiez de mises en avant offertes chaque mois pour positionner vos annonces en tête.</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: 700 }}>Statistiques de vente</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Suivez avec précision les performances et les taux de clics de vos annonces.</p>
                    </div>
                  </div>
                </div>

                {/* Status / CTA Box */}
                <div style={{
                  background: '#FFF',
                  border: '1.5px solid var(--sugu-border)',
                  borderRadius: '20px',
                  padding: '30px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '16px'
                }}>
                  {!demandePro ? (
                    <>
                      <div style={{ fontSize: '48px' }}>💼</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sugu-ink)', margin: 0 }}>Soumettre votre demande pro</h3>
                      <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', maxWidth: '480px', margin: 0, lineHeight: 1.5 }}>
                        Pour accéder aux forfaits Sugu Pro, vous devez d'abord faire valider vos informations professionnelles (registre de commerce, pièce d'identité) par notre équipe.
                      </p>
                      <Link
                        to="/passer-pro"
                        style={{
                          background: 'var(--sugu-primary)',
                          color: '#FFF',
                          textDecoration: 'none',
                          padding: '12px 30px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '15px',
                          boxShadow: '0 4px 15px rgba(192, 81, 46, 0.2)'
                        }}
                      >
                        Soumettre ma demande →
                      </Link>
                    </>
                  ) : demandePro.statut === 'en_attente' ? (
                    <>
                      <div style={{ fontSize: '48px' }}>⏳</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sugu-ink)', margin: 0 }}>Demande en cours de validation</h3>
                      <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', maxWidth: '480px', margin: 0, lineHeight: 1.5 }}>
                        Votre demande pour l'entreprise <strong>{demandePro.nom_entreprise}</strong> (soumise le {new Date(demandePro.created_at).toLocaleDateString('fr-FR')}) est en cours d'examen. Nos équipes vérifient vos informations d'immatriculation sous 24 heures ouvrées.
                      </p>
                      <div style={{ padding: '10px 20px', borderRadius: '30px', background: 'var(--sugu-bg-soft)', fontSize: '13px', fontWeight: 600, color: 'var(--sugu-ink-soft)' }}>
                        Statut : En cours d'analyse
                      </div>
                    </>
                  ) : demandePro.statut === 'approuve' ? (
                    <>
                      <div style={{ fontSize: '48px' }}>✅</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sugu-ink)', margin: 0 }}>Demande Approuvée !</h3>
                      <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', maxWidth: '480px', margin: 0, lineHeight: 1.5 }}>
                        Félicitations, votre demande de validation pro pour <strong>{demandePro.nom_entreprise}</strong> a été acceptée. Vous pouvez maintenant choisir votre forfait pro.
                      </p>
                      <Link
                        to="/abonnements"
                        style={{
                          background: 'var(--sugu-secondary)',
                          color: '#FFF',
                          textDecoration: 'none',
                          padding: '12px 30px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '15px'
                        }}
                      >
                        Choisir mon forfait Pro →
                      </Link>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '48px' }}>❌</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sugu-ink)', margin: 0 }}>Demande Rejetée</h3>
                      <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', maxWidth: '480px', margin: 0, lineHeight: 1.5 }}>
                        Votre demande pour l'entreprise <strong>{demandePro.nom_entreprise}</strong> a été refusée.
                      </p>
                      {demandePro.notes && (
                        <div style={{
                          background: '#F8E9E5',
                          borderLeft: '4px solid #C0512E',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          textAlign: 'left',
                          fontSize: '13.5px',
                          color: '#C0512E',
                          width: '100%',
                          maxWidth: '480px'
                        }}>
                          <strong>Raison du rejet :</strong> {demandePro.notes}
                        </div>
                      )}
                      <Link
                        to="/passer-pro"
                        style={{
                          background: 'var(--sugu-ink)',
                          color: '#FFF',
                          textDecoration: 'none',
                          padding: '12px 30px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '15px',
                          marginTop: '8px'
                        }}
                      >
                        Soumettre une nouvelle demande →
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 7: CONFIGURER VITRINE PRO ===== */}
        {section === 'boutique' && user?.est_boutique && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px', margin: 0 }}>Ma Boutique Pro</h1>
              <Link to={`/boutique/${user.id}`} target="_blank" style={{ color: 'var(--sugu-primary)', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>
                👁️ Voir ma vitrine publique
              </Link>
            </div>

            <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', border: '1.5px solid var(--sugu-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
              <form onSubmit={handleSaveBoutique} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '12px', background: 'var(--sugu-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1.5px solid var(--sugu-border)', cursor: 'pointer' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBoutiqueLogoChange}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    {boutiqueLogo ? (
                      <img src={boutiqueLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '28px' }}>🏪</span>
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700 }}>Logo de la boutique</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--sugu-ink-soft)' }}>Cliquez sur le cadre pour importer une image carrée.</p>
                  </div>
                </div>

                <Input
                  id="boutique_nom"
                  label="Nom commercial de la boutique *"
                  placeholder="Ex: Concessionnaire Riviera"
                  value={boutiqueNom}
                  onChange={(e) => setBoutiqueNom(e.target.value)}
                  required
                />

                <div>
                  <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Description de la boutique</label>
                  <textarea
                    className="sugu-textarea"
                    placeholder="Présentez votre entreprise et vos services aux acheteurs..."
                    value={boutiqueDescription}
                    onChange={(e) => setBoutiqueDescription(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical', width: '100%', minHeight: '80px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <Input
                    id="boutique_horaires"
                    label="Horaires d'ouverture"
                    placeholder="Ex: Lun - Ven : 8h - 18h"
                    value={boutiqueHoraires}
                    onChange={(e) => setBoutiqueHoraires(e.target.value)}
                  />
                  <Input
                    id="boutique_lien"
                    label="Lien externe (Site web ou page sociale)"
                    placeholder="Ex: www.mapage.com"
                    value={boutiqueLienExterne}
                    onChange={(e) => setBoutiqueLienExterne(e.target.value)}
                  />
                </div>

                <Button type="submit" size="lg" style={{ marginTop: '10px' }}>
                  Sauvegarder les configurations
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ===== TAB 8: MON PORTEFEUILLE ===== */}
        {section === 'portefeuille' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            <h1 className="sugu-publish-page__step-name" style={{ fontSize: '26px', margin: 0 }}>Mon Portefeuille Séquestre</h1>
            <p className="sugu-publish-page__step-desc" style={{ margin: 0, color: 'var(--sugu-ink-soft)', fontSize: '14.5px' }}>
              Suivez vos ventes sécurisées par mobile money, vos fonds en séquestre (en attente de livraison) et demandez des retraits.
            </p>

            {/* Balances widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {/* Solde disponible */}
              <div style={{ background: '#FFF', borderRadius: '16px', padding: '24px', border: '1.5px solid var(--sugu-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', fontWeight: 600 }}>Solde Retirable Disponible</span>
                  <span style={{ fontSize: '20px' }}>👛</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--sugu-primary)' }}>
                  {soldeDisponible.toLocaleString('fr-FR')} FCFA
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--sugu-ink-faint)' }}>
                  Fonds immédiatement transférables vers votre compte Mobile Money.
                </p>
              </div>

              {/* Solde en attente (séquestre) */}
              <div style={{ background: '#FFF', borderRadius: '16px', padding: '24px', border: '1.5px solid var(--sugu-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', fontWeight: 600 }}>En attente (Séquestre client)</span>
                  <span style={{ fontSize: '20px' }}>🔒</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#B0791C' }}>
                  {soldeEnAttente.toLocaleString('fr-FR')} FCFA
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--sugu-ink-faint)' }}>
                  Fonds bloqués temporairement jusqu'à validation de livraison ou fin de litige.
                </p>
              </div>
            </div>

            {/* Ask for payout / Request Withdrawal form */}
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', border: '1.5px solid var(--sugu-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                💸 Demander un transfert vers Mobile Money
              </h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const amt = form.montant.value;
                const tel = form.telephone.value;
                const moyen = form.moyen.value;
                if (!amt || Number(amt) <= 0 || !tel || !moyen) return;
                await handleRequestRetrait(amt, moyen, tel);
                form.reset();
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Montant du retrait (FCFA)</label>
                    <input
                      type="number"
                      name="montant"
                      className="sugu-input"
                      max={soldeDisponible}
                      min={100}
                      placeholder="Ex: 5000"
                      required
                    />
                  </div>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Numéro Mobile Money (ex: 07...)</label>
                    <input
                      type="text"
                      name="telephone"
                      className="sugu-input"
                      placeholder="Ex: 0707070707"
                      required
                    />
                  </div>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Moyen de paiement</label>
                    <select name="moyen" className="sugu-select" style={{ width: '100%' }} required>
                      <option value="wave">Wave</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="mtn">MTN Mobile Money</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="sugu-button" style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'var(--sugu-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Transférer les fonds ➔
                </button>
              </form>
            </div>

            {/* Recharge mon portefeuille form */}
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', border: '1.5px solid var(--sugu-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', marginTop: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                📥 Recharger mon portefeuille Sugu
              </h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const amt = form.montant.value;
                const tel = form.telephone.value;
                const moyen = form.moyen.value;
                if (!amt || Number(amt) <= 0 || !tel || !moyen) return;
                await handleRequestRecharge(amt, moyen, tel);
                form.reset();
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Montant de la recharge (FCFA)</label>
                    <input
                      type="number"
                      name="montant"
                      className="sugu-input"
                      min={100}
                      placeholder="Ex: 5000"
                      required
                    />
                  </div>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Numéro Mobile Money (ex: 07...)</label>
                    <input
                      type="text"
                      name="telephone"
                      className="sugu-input"
                      placeholder="Ex: 0707070707"
                      required
                    />
                  </div>
                  <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                    <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Moyen de paiement</label>
                    <select name="moyen" className="sugu-select" style={{ width: '100%' }} required>
                      <option value="wave">Wave</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="mtn">MTN Mobile Money</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="sugu-button" style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'var(--sugu-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Recharger mon solde ➔
                </button>
              </form>
            </div>

            {/* Withdrawals list */}
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', border: '1.5px solid var(--sugu-border)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                📋 Historique des Demandes de Retrait
              </h3>
              {walletRetraits.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--sugu-ink-faint)' }}>
                  Aucune demande de retrait effectuée.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--sugu-border)', color: 'var(--sugu-ink-soft)' }}>
                        <th style={{ padding: '10px 8px' }}>Date</th>
                        <th style={{ padding: '10px 8px' }}>Montant</th>
                        <th style={{ padding: '10px 8px' }}>Opérateur</th>
                        <th style={{ padding: '10px 8px' }}>Téléphone</th>
                        <th style={{ padding: '10px 8px' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletRetraits.map(w => (
                        <tr key={w.id} style={{ borderBottom: '1px solid var(--sugu-border)' }}>
                          <td style={{ padding: '10px 8px' }}>{new Date(w.created_at).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{Number(w.montant).toLocaleString('fr-FR')} FCFA</td>
                          <td style={{ padding: '10px 8px', textTransform: 'uppercase' }}>{w.moyen_paiement}</td>
                          <td style={{ padding: '10px 8px' }}>{w.telephone}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: w.statut === 'en_attente' ? '#FFF7E6' : w.statut === 'valide' ? '#E6F7F0' : '#FFF1F0',
                              color: w.statut === 'en_attente' ? '#FA8C16' : w.statut === 'valide' ? '#389E0D' : '#F5222D'
                            }}>
                              {w.statut === 'en_attente' ? 'En attente' : w.statut === 'valide' ? 'Confirmé' : 'Refusé'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recharges list */}
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', border: '1.5px solid var(--sugu-border)', marginTop: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                📥 Historique des Recharges
              </h3>
              {walletRecharges.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--sugu-ink-faint)' }}>
                  Aucune recharge effectuée.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--sugu-border)', color: 'var(--sugu-ink-soft)' }}>
                        <th style={{ padding: '10px 8px' }}>Date</th>
                        <th style={{ padding: '10px 8px' }}>Montant</th>
                        <th style={{ padding: '10px 8px' }}>Opérateur</th>
                        <th style={{ padding: '10px 8px' }}>Téléphone</th>
                        <th style={{ padding: '10px 8px' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletRecharges.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--sugu-border)' }}>
                          <td style={{ padding: '10px 8px' }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#389E0D' }}>+{Number(r.montant).toLocaleString('fr-FR')} FCFA</td>
                          <td style={{ padding: '10px 8px', textTransform: 'uppercase' }}>{r.moyen_paiement}</td>
                          <td style={{ padding: '10px 8px' }}>{r.telephone}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: '#E6F7F0',
                              color: '#389E0D'
                            }}>
                              Succès
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sales transactions list */}
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', border: '1.5px solid var(--sugu-border)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                🛍️ Historique des Transactions de Vente
              </h3>
              {walletTransactions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--sugu-ink-faint)' }}>
                  Aucune vente sécurisée enregistrée.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--sugu-border)', color: 'var(--sugu-ink-soft)' }}>
                        <th style={{ padding: '10px 8px' }}>Date</th>
                        <th style={{ padding: '10px 8px' }}>ID</th>
                        <th style={{ padding: '10px 8px' }}>Annonce</th>
                        <th style={{ padding: '10px 8px' }}>Total Client</th>
                        <th style={{ padding: '10px 8px' }}>Commission</th>
                        <th style={{ padding: '10px 8px' }}>Votre Part Net</th>
                        <th style={{ padding: '10px 8px' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletTransactions.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--sugu-border)' }}>
                          <td style={{ padding: '10px 8px' }}>{new Date(t.date_creation).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '10px 8px' }}>#{t.id}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{t.ad_title}</td>
                          <td style={{ padding: '10px 8px' }}>{Number(t.montant_total).toLocaleString('fr-FR')} F</td>
                          <td style={{ padding: '10px 8px', color: '#C0512E' }}>-{Number(t.commission_montant).toLocaleString('fr-FR')} F</td>
                          <td style={{ padding: '10px 8px', color: 'var(--sugu-primary)', fontWeight: 'bold' }}>{Number(t.montant_vendeur).toLocaleString('fr-FR')} F</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: t.statut === 'paye' ? '#FFF7E6' : t.statut === 'livre' ? '#E6F7F0' : '#FFF1F0',
                              color: t.statut === 'paye' ? '#FA8C16' : t.statut === 'livre' ? '#389E0D' : '#F5222D'
                            }}>
                              {t.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <div className="sugu-dash__bottom-nav">
        {navDefs.map(n => {
          const isSelected = section === n.id;
          const isMsg = n.id === "messages";
          return (
            <button
              key={n.id}
              type="button"
              className="sugu-dash__bottom-item"
              onClick={() => changeTab(n.id)}
            >
              <span
                className="sugu-dash__bottom-icon"
                style={{
                  opacity: isSelected ? 1 : 0.55,
                  color: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-ink-soft)'
                }}
              >
                {n.icon}
              </span>
              <span
                className="sugu-dash__bottom-label"
                style={{ color: isSelected ? 'var(--sugu-primary)' : '#8A8175' }}
              >
                {n.short}
              </span>
              {isMsg && totalUnread > 0 && (
                <span className="sugu-dash__bottom-badge">{totalUnread}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* General Toast Banner */}
      {toast && (
        <div className="sugu-publish-page__toast" style={{ bottom: '90px' }}>
          {toast}
        </div>
      )}

      {/* Activities modal */}
      {activitiesModalOpen && (
        <div className="sugu-modal-backdrop" style={{ zIndex: 1050 }} onClick={() => setActivitiesModalOpen(false)}>
          <div className="sugu-modal-content" style={{ maxWidth: '520px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--sugu-font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--sugu-ink)', margin: 0 }}>
                Toutes les activités récentes
              </h2>
              <button type="button" className="sugu-modal-close" onClick={() => setActivitiesModalOpen(false)}>✕</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {dbActivities.length > 0 ? dbActivities.map((act, i) => (
                <div key={i} className="sugu-dash__activity-row" style={{ borderBottom: '1px solid var(--sugu-border)', paddingBottom: '12px' }}>
                  <div className="sugu-dash__activity-icon" style={{ backgroundColor: act.bg }}>
                    {act.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sugu-dash__activity-text">{act.text}</div>
                    <div className="sugu-dash__activity-time">{formatTime(act.time)}</div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: 'var(--sugu-ink-faint)', padding: '20px' }}>
                  Aucune activité récente.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proposer Prix / Creation Lien Achat Modal */}
      {createLinkModalOpen && (
        <div className="sugu-modal-backdrop" style={{ zIndex: 1050 }} onClick={() => setCreateLinkModalOpen(false)}>
          <div className="sugu-modal-content" style={{ maxWidth: '400px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--sugu-font-heading)', fontWeight: 700, fontSize: '18px', color: 'var(--sugu-ink)' }}>
                Proposer un prix convenu 💰
              </span>
              <button type="button" className="sugu-modal-close" style={{ width: '32px', height: '32px', fontSize: '16px' }} onClick={() => setCreateLinkModalOpen(false)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5, marginBottom: '18px' }}>
              Fixez le nouveau prix négocié avec l'acheteur. Il pourra cliquer sur le lien pour finaliser la commande et faire son paiement.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '6px' }}>Prix convenu (FCFA)</label>
                <div className="sugu-input-wrapper" style={{ overflow: 'hidden' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sugu-publish-page__price-input"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    style={{ fontSize: '18px', fontWeight: 'bold' }}
                    required
                  />
                  <span className="sugu-publish-page__price-suffix">FCFA</span>
                </div>
              </div>

              <Button onClick={handleCreatePurchaseLink} fullWidth size="lg" style={{ background: 'var(--sugu-primary)' }}>
                Envoyer le lien d'achat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editListingModalOpen && editingListing && (
        <div className="sugu-modal-backdrop" style={{ zIndex: 1050 }} onClick={() => setEditListingModalOpen(false)}>
          <div className="sugu-modal-content" style={{ maxWidth: '650px', width: '90%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <span style={{ fontFamily: 'var(--sugu-font-heading)', fontWeight: 800, fontSize: '20px', color: 'var(--sugu-ink)' }}>
                Modifier l'annonce ✏️
              </span>
              <button type="button" className="sugu-modal-close" style={{ width: '32px', height: '32px', fontSize: '16px', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setEditListingModalOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Photos upload area */}
              <div>
                <label className="sugu-publish-page__label" style={{ fontSize: '13px', marginBottom: '8px', display: 'block', fontWeight: 600 }}>Photos de l'article ({editPhotos.length}/8)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', marginTop: '6px' }}>
                  {editPhotos.map((url, idx) => (
                    <div key={url + idx} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditPhoto(idx)}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {editPhotos.length < 8 && (
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current.click()}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ddd', borderRadius: '8px', aspectRatio: '1/1', background: '#fafafa', cursor: 'pointer', outline: 'none' }}
                    >
                      <span style={{ fontSize: '20px', color: '#888' }}>📷</span>
                      <span style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>Ajouter</span>
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleEditPhotosChange}
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              {/* Title input */}
              <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Titre de l'annonce</label>
                <input
                  type="text"
                  className="sugu-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ex : Chaussure Nike noire"
                  required
                />
              </div>

              {/* Description input */}
              <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Description</label>
                <textarea
                  className="sugu-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Décrivez l'état de l'article, ses caractéristiques..."
                  rows={3}
                  style={{ resize: 'vertical', width: '100%', minHeight: '80px' }}
                />
              </div>

              {/* Two Column: Price & Commune */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                  <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Prix (FCFA)</label>
                  <div className="sugu-input-wrapper" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="sugu-publish-page__price-input"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent' }}
                      required
                    />
                    <span className="sugu-publish-page__price-suffix">FCFA</span>
                  </div>
                </div>

                <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                  <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Commune</label>
                  <input
                    type="text"
                    className="sugu-input"
                    value={editCommune}
                    onChange={(e) => setEditCommune(e.target.value)}
                    placeholder="Ex : Cocody, Marcory"
                    required
                  />
                </div>
              </div>

              {/* Two Column: Condition & Delivery */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                  <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>État de l'article</label>
                  <select
                    className="sugu-select"
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value)}
                    style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', width: '100%' }}
                  >
                    <option value="Neuf">Neuf</option>
                    <option value="Très bon état">Très bon état</option>
                    <option value="Bon état">Bon état</option>
                    <option value="État correct">État correct</option>
                  </select>
                </div>

                <div className="sugu-publish-page__field" style={{ margin: 0 }}>
                  <label className="sugu-publish-page__label" style={{ fontSize: '13px', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Options de récupération</label>
                  <select
                    className="sugu-select"
                    value={editDelivery}
                    onChange={(e) => setEditDelivery(e.target.value)}
                    style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', width: '100%' }}
                  >
                    <option value="both">Livraison &amp; Remise en main propre</option>
                    <option value="livraison">Livraison uniquement</option>
                    <option value="main">Remise en main propre uniquement</option>
                  </select>
                </div>
              </div>

              {/* Negotiable checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="editNegotiable"
                  checked={editNegotiable}
                  onChange={(e) => setEditNegotiable(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--sugu-primary)' }}
                />
                <label htmlFor="editNegotiable" style={{ fontSize: '13px', color: 'var(--sugu-ink)', fontWeight: 600, cursor: 'pointer' }}>
                  Le prix est négociable
                </label>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <Button onClick={() => setEditListingModalOpen(false)} variant="secondary" fullWidth size="lg">
                  Annuler
                </Button>
                <Button onClick={handleSaveEditListing} fullWidth size="lg" style={{ background: 'var(--sugu-primary)' }}>
                  Enregistrer les modifications
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <PopupLimiteAnnonces
        isOpen={limiteOpen}
        onClose={() => setLimiteOpen(false)}
        count={quotaInfo.count}
        quota={quotaInfo.quota}
        subName={quotaInfo.subName}
      />

      <PopupBoostAnnonce
        annonce={boostTarget}
        isOpen={boostPopupOpen}
        onClose={() => { setBoostPopupOpen(false); setBoostTarget(null); }}
        onBoost={handleBoost}
      />

    </div>
  );
}
