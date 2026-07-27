import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, chargement } = useAuth();
  const navigate = useNavigate();

  // Active tab inside sidebar
  const [activeTab, setActiveTab] = useState('overview');

  // Loading states
  const [loading, setLoading] = useState(true);

  // States for stats & attention items
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAds: 0,
    pendingAds: 0,
    pendingReports: 0,
    monthlyRevenue: 0,
    escrowVolume: 0
  });
  const [attention, setAttention] = useState({ ads: [], reports: [] });
  const [charts, setCharts] = useState({ users: [], ads: [], communes: [], categories: [] });

  // Management arrays
  const [usersList, setUsersList] = useState([]);
  const [annoncesList, setAnnoncesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [signalementsList, setSignalementsList] = useState([]);
  const [paiementsList, setPaiementsList] = useState([]);
  const [publicitesList, setPublicitesList] = useState([]);
  const [demandesProList, setDemandesProList] = useState([]);
  const [commissionParams, setCommissionParams] = useState([]);
  const [commissionTransactions, setCommissionTransactions] = useState([]);
  const [liensAchatList, setLiensAchatList] = useState([]);
  const [lienModeFilter, setLienModeFilter] = useState('');
  const [lienStatutFilter, setLienStatutFilter] = useState('');
  const [liensCurrentPage, setLiensCurrentPage] = useState(1);
  const [selectedLienDetail, setSelectedLienDetail] = useState(null);

  // Settings form states
  const [settings, setSettings] = useState({
    commission_rate: 5,
    escrow_validation_delay: 3,
    auto_ship_delay: 24,
    legal_terms: "",
    privacy_policy: ""
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [adStatusFilter, setAdStatusFilter] = useState('');

  // Drawer Panels
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);

  // Pro Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewModalData, setReviewModalData] = useState(null);
  const [reviewModalLoading, setReviewModalLoading] = useState(false);
  const [reviewModalDemandeId, setReviewModalDemandeId] = useState(null);

  // Batch selection states (listings)
  const [selectedAdIds, setSelectedAdIds] = useState([]);

  // Create form inputs states
  const [newCatNom, setNewCatNom] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [newCatIcone, setNewCatIcone] = useState('');

  const [newPubTitre, setNewPubTitre] = useState('');
  const [newPubImage, setNewPubImage] = useState('');
  const [newPubLien, setNewPubLien] = useState('');
  const [newPubStatut, setNewPubStatut] = useState('actif');

  // Notification Toast state
  const [toast, setToast] = useState('');

  const getFullUrl = (path) => {
    if (!path) return '';
    let cleanPath = path;
    if (cleanPath.startsWith('http://localhost:4000')) {
      cleanPath = cleanPath.replace('http://localhost:4000', '');
    }
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:4000${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  // 1. Guard check : Only allow admins
  useEffect(() => {
    if (!chargement) {
      if (!user) {
        // Rediriger vers la page de connexion admin dédiée si non connecté
        navigate('/admin/login');
      } else if (user.role !== 'admin') {
        // Rediriger vers l'accueil si connecté mais pas admin
        navigate('/');
      }
    }
  }, [user, chargement, navigate]);

  // Load all dashboard sections
  const loadStats = () => {
    client.get('/admin/stats')
      .then(res => {
        setStats(res.data.stats);
        setAttention(res.data.attention);
        setCharts(res.data.charts);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading admin stats:", err);
        setLoading(false);
      });
  };

  const loadUsers = () => {
    client.get(`/admin/users?q=${searchQuery}`)
      .then(res => setUsersList(res.data))
      .catch(err => console.error(err));
  };

  const loadAnnonces = () => {
    client.get(`/admin/annonces?statut=${adStatusFilter}`)
      .then(res => setAnnoncesList(res.data))
      .catch(err => console.error(err));
  };

  const loadCategories = () => {
    client.get('/admin/categories')
      .then(res => setCategoriesList(res.data))
      .catch(err => console.error(err));
  };

  const loadSignalements = () => {
    client.get('/admin/signalements')
      .then(res => setSignalementsList(res.data))
      .catch(err => console.error(err));
  };

  const loadPaiements = () => {
    client.get('/admin/paiements')
      .then(res => setPaiementsList(res.data))
      .catch(err => console.error(err));
  };

  const loadPublicites = () => {
    client.get('/admin/publicites')
      .then(res => setPublicitesList(res.data))
      .catch(err => console.error(err));
  };

  const loadSettings = () => {
    client.get('/admin/settings')
      .then(res => setSettings(res.data))
      .catch(err => console.error(err));
  };

  const loadDemandesPro = () => {
    client.get('/admin/demandes-pro')
      .then(res => setDemandesProList(res.data))
      .catch(err => console.error("Error loading demandes pro:", err));
  };

  const loadCommissionParams = () => {
    client.get('/admin/commission/parametres')
      .then(res => setCommissionParams(res.data))
      .catch(err => console.error("Error loading commission params:", err));
  };

  const loadCommissionTransactions = () => {
    client.get('/admin/commission/transactions')
      .then(res => setCommissionTransactions(res.data))
      .catch(err => console.error("Error loading commission transactions:", err));
  };

  const loadLiensAchat = () => {
    client.get(`/admin/liens-achat?mode=${lienModeFilter}&statut=${lienStatutFilter}`)
      .then(res => setLiensAchatList(res.data))
      .catch(err => console.error("Error loading liens-achat list:", err));
  };

  // Initial load
  useEffect(() => {
    if (!chargement) {
      if (user && user.role === 'admin') {
        loadStats();
      } else {
        setLoading(false);
      }
    }
  }, [user, chargement]);

  // Reload data depending on tab active state
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab === 'overview' || activeTab === 'stats') loadStats();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'annonces') loadAnnonces();
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'signalements') loadSignalements();
    if (activeTab === 'paiements') loadPaiements();
    if (activeTab === 'publicites') loadPublicites();
    if (activeTab === 'settings') loadSettings();
    if (activeTab === 'demandes-pro') loadDemandesPro();
    if (activeTab === 'commissions') {
      loadCommissionParams();
      loadCommissionTransactions();
    }
    if (activeTab === 'liens-achat') {
      loadLiensAchat();
    }
  }, [activeTab, lienModeFilter, lienStatutFilter, user]);

  const handleApprouverDemandePro = async (demandeId) => {
    try {
      await client.put(`/admin/demandes-pro/${demandeId}/statut`, { statut: 'approuve' });
      triggerToast("Demande de compte Pro approuvée !");
      setReviewModalOpen(false);
      setReviewModalData(null);
      loadDemandesPro();
      loadStats();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur d'approbation.");
    }
  };

  const handleOuvrirModalRevue = async (demandeId) => {
    setReviewModalDemandeId(demandeId);
    setReviewModalOpen(true);
    setReviewModalLoading(true);
    setReviewModalData(null);
    try {
      const res = await client.get(`/admin/demandes-pro/${demandeId}/details`);
      setReviewModalData(res.data);
    } catch (err) {
      triggerToast("Erreur lors du chargement des détails.");
      setReviewModalOpen(false);
    } finally {
      setReviewModalLoading(false);
    }
  };

  const handleRejeterDemandePro = async (demandeId) => {
    const notes = window.prompt("Motif du rejet de la demande Pro :");
    if (notes === null) return;
    try {
      await client.put(`/admin/demandes-pro/${demandeId}/statut`, { statut: 'rejete', notes });
      triggerToast("Demande de compte Pro rejetée.");
      loadDemandesPro();
      loadStats();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur de rejet.");
    }
  };

  const handleUpdateCommissionParam = async (paramId, tauxStandard, tauxPro) => {
    try {
      await client.put(`/admin/commission/parametres/${paramId}`, {
        taux_commission: Number(tauxStandard),
        taux_commission_pro: Number(tauxPro)
      });
      triggerToast("Taux de commission mis à jour !");
      loadCommissionParams();
    } catch (err) {
      triggerToast("Erreur lors de la mise à jour.");
    }
  };

  const handleArbitrerLitige = async (transactionId, resolution) => {
    try {
      await client.post(`/admin/litiges/${transactionId}/arbitrer`, { resolution });
      triggerToast("Litige résolu avec succès !");
      loadCommissionTransactions();
      loadStats();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Erreur d'arbitrage.");
    }
  };

  // Handle Toast Notifications
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ---------------- ACTION HANDLERS ----------------

  // User Actions
  const handleToggleUserBan = async (u) => {
    try {
      const newStatus = u.est_banni === 1 ? 0 : 1;
      await client.put(`/admin/users/${u.id}/ban`, { est_banni: newStatus });
      triggerToast(newStatus ? "Utilisateur banni 🚫" : "Utilisateur réactivé ✅");
      loadUsers();
      if (selectedUser && selectedUser.id === u.id) {
        setSelectedUser({ ...selectedUser, est_banni: newStatus });
      }
    } catch (err) {
      triggerToast("Erreur lors de la modification.");
    }
  };

  const handleToggleUserRole = async (u) => {
    try {
      const newRole = u.role === 'admin' ? 'user' : 'admin';
      await client.put(`/admin/users/${u.id}/role`, { role: newRole });
      triggerToast(`Rôle changé : ${newRole.toUpperCase()}`);
      loadUsers();
      if (selectedUser && selectedUser.id === u.id) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (err) {
      triggerToast("Erreur lors du changement de rôle.");
    }
  };

  const handleToggleUserVerification = async (u) => {
    try {
      const newStatus = u.est_verifie === 1 ? 0 : 1;
      await client.put(`/admin/users/${u.id}/verifier`, { est_verifie: newStatus });
      triggerToast(newStatus ? "Identité certifiée" : "Certification retirée");
      loadUsers();
      if (selectedUser && selectedUser.id === u.id) {
        setSelectedUser({ ...selectedUser, est_verifie: newStatus });
      }
    } catch (err) {
      triggerToast("Erreur de modification.");
    }
  };

  // Annonces Actions
  const handleUpdateAdStatut = async (adId, newStatut) => {
    try {
      await client.put(`/admin/annonces/${adId}/statut`, { statut: newStatut });
      triggerToast(`Annonce marquée comme ${newStatut}`);
      loadAnnonces();
      loadStats();
      if (selectedAnnonce && selectedAnnonce.id === adId) {
        setSelectedAnnonce({ ...selectedAnnonce, statut: newStatut });
      }
    } catch (err) {
      triggerToast("Erreur de modification statut.");
    }
  };

  // Batch actions on selected listings
  const handleBatchUpdateStatut = async (newStatut) => {
    if (selectedAdIds.length === 0) return;
    try {
      await client.put(`/admin/annonces/batch`, { ids: selectedAdIds, statut: newStatut });
      triggerToast(`${selectedAdIds.length} annonces mises en statut: ${newStatut}`);
      setSelectedAdIds([]);
      loadAnnonces();
      loadStats();
    } catch (err) {
      triggerToast("Erreur action groupée.");
    }
  };

  // Categories management
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatNom.trim()) return;
    try {
      await client.post('/admin/categories', {
        nom: newCatNom.trim(),
        parent_id: newCatParent || null,
        icone: newCatIcone.trim() || null
      });
      triggerToast("Catégorie créée !");
      setNewCatNom('');
      setNewCatParent('');
      setNewCatIcone('');
      loadCategories();
    } catch (err) {
      triggerToast("Erreur création catégorie.");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette catégorie ?")) return;
    try {
      await client.delete(`/admin/categories/${id}`);
      triggerToast("Catégorie supprimée.");
      loadCategories();
    } catch (err) {
      triggerToast("Erreur suppression catégorie.");
    }
  };

  // Signalements actions
  const handleResolveSignalement = async (id, status) => {
    try {
      await client.put(`/admin/signalements/${id}/statut`, { statut: status });
      triggerToast(`Signalement marqué comme ${status}`);
      loadSignalements();
      loadStats();
    } catch (err) {
      triggerToast("Erreur modification signalement.");
    }
  };

  // Banners actions
  const handleBannerFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPubImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (!newPubTitre.trim() || !newPubImage.trim()) return;
    try {
      await client.post('/admin/publicites', {
        titre: newPubTitre.trim(),
        image_url: newPubImage.trim(),
        lien: newPubLien.trim() || '#',
        statut: newPubStatut
      });
      triggerToast("Bannière publicitaire ajoutée !");
      setNewPubTitre('');
      setNewPubImage('');
      setNewPubLien('');
      setNewPubStatut('actif');
      loadPublicites();
    } catch (err) {
      triggerToast("Erreur création bannière.");
    }
  };

  const handleToggleBannerStatus = async (pub) => {
    try {
      const nextStatus = pub.statut === 'actif' ? 'inactif' : 'actif';
      await client.put(`/admin/publicites/${pub.id}`, {
        titre: pub.titre,
        image_url: pub.image_url,
        lien: pub.lien,
        statut: nextStatus
      });
      triggerToast(`Bannière passée en ${nextStatus}`);
      loadPublicites();
    } catch (err) {
      triggerToast("Erreur modification bannière.");
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette publicité ?")) return;
    try {
      await client.delete(`/admin/publicites/${id}`);
      triggerToast("Bannière supprimée.");
      loadPublicites();
    } catch (err) {
      console.error("Error deleting banner:", err);
      triggerToast(err.response?.data?.message || "Erreur suppression bannière.");
    }
  };

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await client.put('/admin/settings', settings);
      triggerToast("Configuration enregistrée avec succès ! 💾");
    } catch (err) {
      triggerToast("Erreur d'enregistrement.");
    }
  };

  // Filter listings list dynamically in UI
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return usersList;
    return usersList.filter(u =>
      u.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.telephone?.includes(searchQuery)
    );
  }, [usersList, searchQuery]);

  // Categories parent-child structure builder helper
  const parsedCategories = useMemo(() => {
    const parents = categoriesList.filter(c => c.parent_id === null);
    return parents.map(p => ({
      ...p,
      children: categoriesList.filter(c => c.parent_id === p.id)
    }));
  }, [categoriesList]);

  if (chargement || loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F5F0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px', animation: 'spin 2s linear infinite' }}>🛡️</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#8A8277' }}>Chargement de l'espace Admin Sugu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sugu-admin">
      <style>{`
        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 140, 22, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(250, 140, 22, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 140, 22, 0); }
        }
      `}</style>

      {/* 1. LEFT NAVIGATION SIDEBAR */}
      <aside className="sugu-admin__sidebar">
        <a href="/" className="sugu-admin__logo">
          <span className="sugu-admin__logo-badge">🛡️ ADMIN</span>
          <span className="sugu-admin__logo-text">TrouveTout</span>
        </a>

        <div className="sugu-admin__nav-group">
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>◱</span> Vue d'ensemble
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span>👥</span> Utilisateurs
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'annonces' ? 'active' : ''}`}
            onClick={() => setActiveTab('annonces')}
          >
            <span>🏷️</span> Annonces
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <span>📁</span> Catégories
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'signalements' ? 'active' : ''}`}
            onClick={() => setActiveTab('signalements')}
          >
            <span>🚨</span> Signalements
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'paiements' ? 'active' : ''}`}
            onClick={() => setActiveTab('paiements')}
          >
            <span>💳</span> Paiements & Abonnements
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'publicites' ? 'active' : ''}`}
            onClick={() => setActiveTab('publicites')}
          >
            <span>📢</span> Publicités
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span>📈</span> Statistiques
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'demandes-pro' ? 'active' : ''}`}
            onClick={() => setActiveTab('demandes-pro')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              border: stats?.pendingDemandesPro > 0 ? '1px solid #FA8C16' : 'none',
              background: stats?.pendingDemandesPro > 0 ? 'rgba(250, 140, 22, 0.08)' : ''
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💼</span> Demandes Pro
            </div>
            {stats?.pendingDemandesPro > 0 && (
              <span style={{
                background: '#FA8C16',
                color: '#fff',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                animation: 'pulse-glow 1.5s infinite'
              }}>
                {stats.pendingDemandesPro}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'commissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('commissions')}
          >
            <span>💰</span> Commissions & Litiges
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'liens-achat' ? 'active' : ''}`}
            onClick={() => setActiveTab('liens-achat')}
          >
            <span>🤝</span> Commandes & Rendez-vous
          </button>
          <button
            type="button"
            className={`sugu-admin__nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span>⚙</span> Paramètres
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT VIEW */}
      <main className="sugu-admin__main">

        {/* Header toolbar */}
        <header className="sugu-admin__header">
          <div className="sugu-admin__header-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Recherche rapide d'utilisateurs ou annonces..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab === 'users') loadUsers();
              }}
            />
          </div>

          <div className="sugu-admin__header-profile">
            <a href="/" className="sugu-admin__header-btn-site">
              Retour au site ↩
            </a>
            <div className="sugu-admin__header-userinfo">
              <div className="sugu-admin__header-username">{user?.nom || 'Administrateur'}</div>
              <div className="sugu-admin__header-userrole">Super Admin</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sugu-primary, #106C62)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              SA
            </div>
          </div>
        </header>

        {/* Content body wrapper */}
        <div className="sugu-admin__content">

          {/* Toast Notification element */}
          {toast && (
            <div style={{
              position: 'fixed',
              top: '80px',
              right: '24px',
              background: '#2A2724',
              color: '#FFF',
              padding: '12px 24px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '13px',
              fontWeight: 'bold',
              zIndex: 9999,
              animation: 'slideInRight 0.2s ease'
            }}>
              {toast}
            </div>
          )}

          {/* ==================== TAB 1: OVERVIEW ==================== */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="sugu-admin__page-title">Tableau de bord de la plateforme</h2>
              <p className="sugu-admin__page-subtitle">Aperçu en temps réel des transactions, de la modération et de l'activité.</p>

              {/* Stats KPIs Cards */}
              <div className="sugu-admin__kpi-grid">
                <div className="sugu-admin__kpi-card">
                  <div className="sugu-admin__kpi-icon" style={{ background: '#EAF4F2', color: '#106C62' }}>👥</div>
                  <div>
                    <div className="sugu-admin__kpi-val">{stats.totalUsers}</div>
                    <div className="sugu-admin__kpi-lbl">Utilisateurs inscrits</div>
                  </div>
                </div>
                <div className="sugu-admin__kpi-card">
                  <div className="sugu-admin__kpi-icon" style={{ background: '#FFF7E6', color: '#FA8C16' }}>🏷️</div>
                  <div>
                    <div className="sugu-admin__kpi-val">{stats.activeAds}</div>
                    <div className="sugu-admin__kpi-lbl">Annonces actives</div>
                  </div>
                </div>
                <div className="sugu-admin__kpi-card">
                  <div className="sugu-admin__kpi-icon" style={{ background: '#E6F7FF', color: '#1890FF' }}>⏳</div>
                  <div>
                    <div className="sugu-admin__kpi-val">{stats.pendingAds}</div>
                    <div className="sugu-admin__kpi-lbl">En attente modération</div>
                  </div>
                </div>
                <div className="sugu-admin__kpi-card">
                  <div className="sugu-admin__kpi-icon" style={{ background: '#FFF1F0', color: '#F5222D' }}>🚨</div>
                  <div>
                    <div className="sugu-admin__kpi-val">{stats.pendingReports}</div>
                    <div className="sugu-admin__kpi-lbl">Signalements actifs</div>
                  </div>
                </div>
                <div className="sugu-admin__kpi-card">
                  <div className="sugu-admin__kpi-icon" style={{ background: '#F9F0FF', color: '#722ED1' }}>🔒</div>
                  <div>
                    <div className="sugu-admin__kpi-val">{(stats.escrowVolume || 0).toLocaleString('fr-FR')} F</div>
                    <div className="sugu-admin__kpi-lbl">Fonds sécurisés</div>
                  </div>
                </div>
                <div className="sugu-admin__kpi-card">
                  <div className="sugu-admin__kpi-icon" style={{ background: '#F6FFED', color: '#52C41A' }}>💵</div>
                  <div>
                    <div className="sugu-admin__kpi-val">{(stats.monthlyRevenue || 0).toLocaleString('fr-FR')} F</div>
                    <div className="sugu-admin__kpi-lbl">Revenus mensuels</div>
                  </div>
                </div>
                <div className="sugu-admin__kpi-card" style={{ borderLeft: '3px solid #E2A038' }}>
                  <div className="sugu-admin__kpi-icon" style={{ background: '#FFF9E6', color: '#E2A038' }}>💼</div>
                  <div>
                    <div className="sugu-admin__kpi-val">{(stats.totalCommissionsAcquises || 0).toLocaleString('fr-FR')} F</div>
                    <div className="sugu-admin__kpi-lbl">Portefeuille Admin (Commissions)</div>
                  </div>
                </div>
                <div className="sugu-admin__kpi-card">
                  <div className="sugu-admin__kpi-icon" style={{ background: '#EAF6F2', color: '#0F9D58' }}>⌛</div>
                  <div>
                    <div className="sugu-admin__kpi-val">{(stats.totalCommissionsEnAttente || 0).toLocaleString('fr-FR')} F</div>
                    <div className="sugu-admin__kpi-lbl">Commissions en séquestre</div>
                  </div>
                </div>
              </div>

              {/* Simple HTML bar charts for evolution data */}
              <div className="sugu-admin__dashboard-charts">
                <div className="sugu-admin__chart-card">
                  <div className="sugu-admin__chart-title">Nouveaux utilisateurs (30 derniers jours)</div>
                  {charts.users.length > 0 ? (
                    <div className="sugu-admin__mock-chart">
                      {charts.users.slice(-10).map((u, i) => {
                        const maxCount = Math.max(...charts.users.map(d => d.count), 1);
                        const pct = (u.count / maxCount) * 100;
                        return (
                          <div key={i} className="sugu-admin__mock-chart-bar-wrap">
                            <div className="sugu-admin__mock-chart-bar" style={{ height: `${Math.max(pct, 5)}%`, backgroundColor: '#106C62' }} title={`${u.count} inscriptions`} />
                            <div className="sugu-admin__mock-chart-label">{u.date.slice(5)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#999', fontSize: '12px' }}>Aucune inscription enregistrée récemment.</div>
                  )}
                </div>

                <div className="sugu-admin__chart-card">
                  <div className="sugu-admin__chart-title">Nouvelles annonces (30 derniers jours)</div>
                  {charts.ads.length > 0 ? (
                    <div className="sugu-admin__mock-chart">
                      {charts.ads.slice(-10).map((a, i) => {
                        const maxCount = Math.max(...charts.ads.map(d => d.count), 1);
                        const pct = (a.count / maxCount) * 100;
                        return (
                          <div key={i} className="sugu-admin__mock-chart-bar-wrap">
                            <div className="sugu-admin__mock-chart-bar" style={{ height: `${Math.max(pct, 5)}%`, backgroundColor: '#8F3A1C' }} title={`${a.count} annonces`} />
                            <div className="sugu-admin__mock-chart-label">{a.date.slice(5)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#999', fontSize: '12px' }}>Aucune annonce publiée récemment.</div>
                  )}
                </div>
              </div>

              {/* Alert items requiring attention split view */}
              <div className="sugu-admin__alerts-split">
                <div className="sugu-admin__alerts-panel">
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '8px' }}>
                    ⌛ Annonces en attente de modération ({attention.ads.length})
                  </div>
                  {attention.ads.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attention.ads.map(ad => (
                        <div key={ad.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #EAE5DD', borderRadius: '8px', background: '#FAFAF9' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '12px' }}>{ad.titre}</div>
                            <div style={{ fontSize: '10px', color: '#888' }}>Par {ad.vendeur_om || ad.vendeur_nom} • {ad.prix.toLocaleString('fr-FR')} FCFA</div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button type="button" className="sugu-admin__btn success" onClick={() => handleUpdateAdStatut(ad.id, 'active')}>Valider</button>
                            <button type="button" className="sugu-admin__btn danger" onClick={() => handleUpdateAdStatut(ad.id, 'suspendue')}>Rejeter</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '12px' }}>Aucune annonce en attente de modération.</div>
                  )}
                </div>

                <div className="sugu-admin__alerts-panel">
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '8px' }}>
                    🚨 Signalements récents non résolus ({attention.reports.length})
                  </div>
                  {attention.reports.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attention.reports.map(rep => (
                        <div key={rep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #EAE5DD', borderRadius: '8px', background: '#FFF1F0' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#C0512E' }}>{rep.motif}</div>
                            <div style={{ fontSize: '10px', color: '#666' }}>Cible ID : {rep.cible_id} ({rep.type_cible}) • Par user #{rep.signale_par_id}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button type="button" className="sugu-admin__btn success" onClick={() => handleResolveSignalement(rep.id, 'resolu')}>Résoudre</button>
                            <button type="button" className="sugu-admin__btn danger" onClick={() => handleResolveSignalement(rep.id, 'ignore')}>Ignorer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '12px' }}>Aucun signalement actif.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: UTILISATEURS ==================== */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="sugu-admin__page-title">Gestion des Utilisateurs</h2>
                  <p className="sugu-admin__page-subtitle">Modérez les comptes, vérifiez l'identité, ou suspendez des profils.</p>
                </div>
              </div>

              <div className="sugu-admin__table-card">
                <div className="sugu-admin__table-toolbar">
                  <div className="sugu-admin__table-filters">
                    <input
                      type="text"
                      placeholder="Filtrer par nom/email/téléphone..."
                      className="sugu-admin__form-input"
                      style={{ width: '240px', padding: '6px 12px' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {filteredUsers.length} utilisateurs trouvés
                  </div>
                </div>

                <table className="sugu-admin__table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Inscription</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--sugu-ink)', cursor: 'pointer' }} onClick={() => setSelectedUser(u)}>
                          {u.nom}
                        </td>
                        <td>{u.email || <span style={{ color: '#aaa', fontSize: '11px' }}>Aucun</span>}</td>
                        <td>{u.telephone || <span style={{ color: '#aaa', fontSize: '11px' }}>Aucun</span>}</td>
                        <td>
                          <span className="sugu-admin__badge" style={{
                            backgroundColor: u.role === 'admin' ? '#E6F7FF' : '#F5F5F5',
                            color: u.role === 'admin' ? '#1890FF' : '#666'
                          }}>{u.role}</span>
                        </td>
                        <td>
                          {u.est_banni === 1 ? (
                            <span className="sugu-admin__badge banned">Banni</span>
                          ) : (
                            <span className="sugu-admin__badge active">Actif</span>
                          )}
                        </td>
                        <td style={{ fontSize: '11px', color: '#888' }}>
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <div className="sugu-admin__action-row">
                            <button type="button" className={`sugu-admin__btn ${u.est_banni === 1 ? 'success' : 'danger'}`} onClick={() => handleToggleUserBan(u)}>
                              {u.est_banni === 1 ? 'Réactiver' : 'Bannir'}
                            </button>
                            <button type="button" className="sugu-admin__btn" onClick={() => handleToggleUserRole(u)}>
                              Rôle
                            </button>
                            <button type="button" className={`sugu-admin__btn ${u.est_verifie === 1 ? 'success' : 'primary'}`} onClick={() => handleToggleUserVerification(u)}>
                              {u.est_verifie === 1 ? 'Certifié ✓' : 'Certifier'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: ANNONCES ==================== */}
          {activeTab === 'annonces' && (
            <div>
              <h2 className="sugu-admin__page-title">Modération des Annonces</h2>
              <p className="sugu-admin__page-subtitle">Modérez les annonces en ligne, validez les brouillons ou effectuez des actions groupées.</p>

              {/* Batch Actions panel */}
              {selectedAdIds.length > 0 && (
                <div className="sugu-admin__bulk-bar">
                  <span className="sugu-admin__bulk-info">
                    {selectedAdIds.length} annonces sélectionnées pour modification groupée
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="sugu-admin__btn success" onClick={() => handleBatchUpdateStatut('active')}>
                      Valider la sélection ✓
                    </button>
                    <button type="button" className="sugu-admin__btn danger" onClick={() => handleBatchUpdateStatut('suspendue')}>
                      Suspendre la sélection 🚫
                    </button>
                    <button type="button" className="sugu-admin__btn" onClick={() => setSelectedAdIds([])}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="sugu-admin__table-card">
                <div className="sugu-admin__table-toolbar">
                  <div className="sugu-admin__table-filters">
                    <select
                      className="sugu-admin__filter-select"
                      value={adStatusFilter}
                      onChange={(e) => {
                        setAdStatusFilter(e.target.value);
                      }}
                    >
                      <option value="">Tous les statuts</option>
                      <option value="active">Active</option>
                      <option value="brouillon">En attente (Brouillon)</option>
                      <option value="suspendue">Suspendue</option>
                      <option value="vendue">Vendue</option>
                    </select>
                    <button type="button" className="sugu-admin__btn primary" onClick={loadAnnonces}>Filtrer</button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {annoncesList.length} annonces listées
                  </div>
                </div>

                <table className="sugu-admin__table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAdIds(annoncesList.map(a => a.id));
                            } else {
                              setSelectedAdIds([]);
                            }
                          }}
                          checked={selectedAdIds.length === annoncesList.length && annoncesList.length > 0}
                        />
                      </th>
                      <th>Annonce</th>
                      <th>Vendeur</th>
                      <th>Prix</th>
                      <th>Ville / Commune</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annoncesList.map(ad => (
                      <tr key={ad.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedAdIds.includes(ad.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAdIds(prev => [...prev, ad.id]);
                              } else {
                                setSelectedAdIds(prev => prev.filter(id => id !== ad.id));
                              }
                            }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {ad.cover_url && (
                              <img src={ad.cover_url} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                            )}
                            <div>
                              <div
                                style={{ fontWeight: 'bold', color: 'var(--sugu-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => setSelectedAnnonce(ad)}
                              >
                                {ad.titre}
                              </div>
                              <div style={{ fontSize: '10px', color: '#888' }}>Catégorie ID: {ad.categorie_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{ad.vendeur_nom}</td>
                        <td style={{ fontWeight: 'bold' }}>{ad.prix.toLocaleString('fr-FR')} F</td>
                        <td>{ad.ville || 'Abidjan'} / {ad.commune}</td>
                        <td>
                          {ad.statut === 'active' && <span className="sugu-admin__badge active">En ligne</span>}
                          {ad.statut === 'brouillon' && <span className="sugu-admin__badge pending">Modération</span>}
                          {ad.statut === 'suspendue' && <span className="sugu-admin__badge banned">Suspendue</span>}
                          {ad.statut === 'vendue' && <span className="sugu-admin__badge inactive">Vendue</span>}
                        </td>
                        <td style={{ fontSize: '11px', color: '#888' }}>
                          {new Date(ad.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <div className="sugu-admin__action-row">
                            {ad.statut !== 'active' && (
                              <button type="button" className="sugu-admin__btn success" onClick={() => handleUpdateAdStatut(ad.id, 'active')}>
                                Valider
                              </button>
                            )}
                            {ad.statut !== 'suspendue' && (
                              <button type="button" className="sugu-admin__btn danger" onClick={() => handleUpdateAdStatut(ad.id, 'suspendue')}>
                                Suspendre
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: CATÉGORIES ==================== */}
          {activeTab === 'categories' && (
            <div>
              <h2 className="sugu-admin__page-title">Gestion des Catégories</h2>
              <p className="sugu-admin__page-subtitle">Configurez et réorganisez l'arbre des catégories de produits.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
                {/* List tree panel */}
                <div className="sugu-admin__cat-tree">
                  {parsedCategories.map(cat => (
                    <div key={cat.id} className="sugu-admin__cat-node">
                      <div className="sugu-admin__cat-header">
                        <div style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{cat.icone || '📁'}</span>
                          <span>{cat.nom}</span>
                          <span style={{ fontSize: '10px', color: '#888', fontWeight: 'normal' }}>(Slug: {cat.slug})</span>
                        </div>
                        <button type="button" className="sugu-admin__btn danger" style={{ padding: '3px 8px' }} onClick={() => handleDeleteCategory(cat.id)}>
                          Supprimer
                        </button>
                      </div>

                      <div className="sugu-admin__cat-children">
                        {cat.children.length > 0 ? (
                          cat.children.map(child => (
                            <div key={child.id} className="sugu-admin__cat-child">
                              <span>{child.nom} <span style={{ fontSize: '10px', color: '#aaa' }}>(Slug: {child.slug})</span></span>
                              <button type="button" className="sugu-admin__btn danger" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => handleDeleteCategory(child.id)}>
                                Supprimer
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#aaa', padding: '4px 0' }}>Aucune sous-catégorie.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add category form */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #EAE5DD', height: 'fit-content' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '10px' }}>
                    ＋ Ajouter une catégorie / sous-catégorie
                  </div>
                  <form onSubmit={handleCreateCategory}>
                    <div className="sugu-admin__form-group" style={{ marginBottom: '12px' }}>
                      <label>Nom de la catégorie</label>
                      <input
                        type="text"
                        className="sugu-admin__form-input"
                        placeholder="Ex: Électronique, Chaussures Homme..."
                        value={newCatNom}
                        onChange={(e) => setNewCatNom(e.target.value)}
                        required
                      />
                    </div>
                    <div className="sugu-admin__form-group" style={{ marginBottom: '12px' }}>
                      <label>Catégorie Parente (Optionnel pour les sous-catégories)</label>
                      <select
                        className="sugu-admin__filter-select"
                        value={newCatParent}
                        onChange={(e) => setNewCatParent(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">Aucune (Catégorie principale)</option>
                        {categoriesList.filter(c => c.parent_id === null).map(c => (
                          <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sugu-admin__form-group" style={{ marginBottom: '18px' }}>
                      <label>Icône / Emoji</label>
                      <input
                        type="text"
                        className="sugu-admin__form-input"
                        placeholder="Ex: 📱, 👟, 🚗..."
                        value={newCatIcone}
                        onChange={(e) => setNewCatIcone(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="sugu-admin__btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Enregistrer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 5: SIGNALEMENTS ==================== */}
          {activeTab === 'signalements' && (
            <div>
              <h2 className="sugu-admin__page-title">Signalements & Abus</h2>
              <p className="sugu-admin__page-subtitle">Consultez les requêtes de modération soumises par les utilisateurs.</p>

              <div className="sugu-admin__table-card">
                <table className="sugu-admin__table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cible</th>
                      <th>Motif</th>
                      <th>Description</th>
                      <th>Signalé par</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signalementsList.map(rep => (
                      <tr key={rep.id}>
                        <td>#{rep.id}</td>
                        <td>
                          <span style={{ fontWeight: 'bold' }}>{rep.type_cible === 'annonce' ? '📦 Annonce' : '👥 Utilisateur'}</span>
                          <div style={{ fontSize: '11px', color: '#777' }}>ID Cible: {rep.cible_id} • {rep.cible_titre || 'Objet inconnu'}</div>
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#D4380D' }}>{rep.motif}</td>
                        <td style={{ maxWidth: '240px', fontSize: '12px' }}>{rep.description || <span style={{ color: '#ccc' }}>Aucun commentaire</span>}</td>
                        <td>User #{rep.signale_par_id} ({rep.signaleur_nom})</td>
                        <td>
                          {rep.statut === 'en_attente' && <span className="sugu-admin__badge pending">Non traité</span>}
                          {rep.statut === 'resolu' && <span className="sugu-admin__badge active">Résolu</span>}
                          {rep.statut === 'ignore' && <span className="sugu-admin__badge inactive">Ignoré</span>}
                        </td>
                        <td style={{ fontSize: '11px', color: '#888' }}>
                          {new Date(rep.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <div className="sugu-admin__action-row">
                            {rep.statut === 'en_attente' && (
                              <>
                                <button type="button" className="sugu-admin__btn success" onClick={() => handleResolveSignalement(rep.id, 'resolu')}>
                                  Résoudre
                                </button>
                                <button type="button" className="sugu-admin__btn danger" onClick={() => handleResolveSignalement(rep.id, 'ignore')}>
                                  Ignorer
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 6: PAIEMENTS ==================== */}
          {activeTab === 'paiements' && (
            <div>
              <h2 className="sugu-admin__page-title">Paiements & Abonnements</h2>
              <p className="sugu-admin__page-subtitle">Suivi du chiffre d'affaires et de l'historique d'achats d'options premium.</p>

              <div className="sugu-admin__table-card">
                <table className="sugu-admin__table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Utilisateur</th>
                      <th>Description</th>
                      <th>Montant</th>
                      <th>Référence</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiementsList.map(pay => (
                      <tr key={pay.id}>
                        <td>#{pay.id}</td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{pay.user_nom}</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>{pay.user_email}</div>
                        </td>
                        <td style={{ fontWeight: '600' }}>{pay.description}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--sugu-primary)' }}>{pay.montant.toLocaleString('fr-FR')} FCFA</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{pay.reference}</td>
                        <td>{new Date(pay.created_at).toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 7: PUBLICITÉS ==================== */}
          {activeTab === 'publicites' && (
            <div>
              <h2 className="sugu-admin__page-title">Gestion des Publicités</h2>
              <p className="sugu-admin__page-subtitle">Configurez des bannières promotionnelles sur le site public.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
                <div className="sugu-admin__table-card" style={{ margin: 0 }}>
                  <table className="sugu-admin__table">
                    <thead>
                      <tr>
                        <th>Bannière</th>
                        <th>Lien cible</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publicitesList.map(pub => (
                        <tr key={pub.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={getFullUrl(pub.image_url)} alt="" style={{ width: '60px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #EAE5DD' }} />
                              <div style={{ fontWeight: 'bold' }}>{pub.titre}</div>
                            </div>
                          </td>
                          <td style={{ fontSize: '12px', color: '#666' }}>{pub.lien}</td>
                          <td>
                            {pub.statut === 'actif' ? (
                              <span className="sugu-admin__badge active">Active</span>
                            ) : (
                              <span className="sugu-admin__badge inactive">Inactive</span>
                            )}
                          </td>
                          <td>
                            <div className="sugu-admin__action-row">
                              <button type="button" className="sugu-admin__btn" onClick={() => handleToggleBannerStatus(pub)}>
                                Activer/Pause
                              </button>
                              <button type="button" className="sugu-admin__btn danger" onClick={() => handleDeleteBanner(pub.id)}>
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #EAE5DD', height: 'fit-content' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '10px' }}>
                    ＋ Créer une bannière publicitaire
                  </div>
                  <form onSubmit={handleCreateBanner}>
                    <div className="sugu-admin__form-group" style={{ marginBottom: '12px' }}>
                      <label>Titre de la campagne</label>
                      <input
                        type="text"
                        className="sugu-admin__form-input"
                        placeholder="Ex: Ventes Flash, Soldes Noel..."
                        value={newPubTitre}
                        onChange={(e) => setNewPubTitre(e.target.value)}
                        required
                      />
                    </div>
                    <div className="sugu-admin__form-group" style={{ marginBottom: '12px' }}>
                      <label>Sélectionner l'image (Bannière)</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="sugu-admin__form-input"
                        onChange={handleBannerFileChange}
                        required
                      />
                      {newPubImage && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>Aperçu :</span>
                          <img
                            src={getFullUrl(newPubImage)}
                            alt="Aperçu"
                            style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #EAE5DD' }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="sugu-admin__form-group" style={{ marginBottom: '12px' }}>
                      <label>Lien de redirection</label>
                      <input
                        type="text"
                        className="sugu-admin__form-input"
                        placeholder="Ex: /recherche?commune=Plateau"
                        value={newPubLien}
                        onChange={(e) => setNewPubLien(e.target.value)}
                      />
                    </div>
                    <div className="sugu-admin__form-group" style={{ marginBottom: '18px' }}>
                      <label>Statut Initial</label>
                      <select
                        className="sugu-admin__filter-select"
                        value={newPubStatut}
                        onChange={(e) => setNewPubStatut(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="actif">Activée immédiatement</option>
                        <option value="inactif">En attente / Désactivée</option>
                      </select>
                    </div>
                    <button type="submit" className="sugu-admin__btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Publier la campagne
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 8: STATISTIQUES ==================== */}
          {activeTab === 'stats' && (
            <div>
              <h2 className="sugu-admin__page-title">Analyses & Statistiques Détaillées</h2>
              <p className="sugu-admin__page-subtitle">Statistiques d'utilisation et taux de conversion de la plateforme.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #EAE5DD' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '8px' }}>
                    📍 Communes les plus actives (Ventes)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(charts?.communes && charts.communes.length > 0 ? charts.communes : [
                      { name: 'Cocody', count: 142 },
                      { name: 'Plateau', count: 110 },
                      { name: 'Marcory', count: 95 },
                      { name: 'Yopougon', count: 70 },
                      { name: 'Treichville', count: 42 }
                    ]).map((city, idx, arr) => {
                      const maxCount = Math.max(...arr.map(c => c.count)) || 1;
                      const pct = Math.round((city.count / maxCount) * 100);
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold' }}>{city.name}</span>
                            <span style={{ color: '#666' }}>{city.count} annonces</span>
                          </div>
                          <div style={{ background: '#F1ECE3', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--sugu-primary)', width: `${pct}%`, height: '100%' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #EAE5DD' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '8px' }}>
                    📂 Répartition par Catégories
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(charts?.categories && charts.categories.length > 0 ? charts.categories : [
                      { name: 'Téléphones & Tablettes', count: 215 },
                      { name: 'Véhicules', count: 180 },
                      { name: 'Immobilier', count: 120 },
                      { name: 'Mode & Beauté', count: 90 },
                      { name: 'Maison & Jardin', count: 50 }
                    ]).map((cat, idx, arr) => {
                      const maxCount = Math.max(...arr.map(c => c.count)) || 1;
                      const pct = Math.round((cat.count / maxCount) * 100);
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                            <span style={{ color: '#666' }}>{cat.count} annonces</span>
                          </div>
                          <div style={{ background: '#F1ECE3', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--sugu-secondary)', width: `${pct}%`, height: '100%' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 9: PARAMÈTRES ==================== */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '700px' }}>
              <h2 className="sugu-admin__page-title">Paramètres Généraux</h2>
              <p className="sugu-admin__page-subtitle">Configurez les frais, les délais d'escrow et la modération du site.</p>

              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #EAE5DD' }}>
                <form onSubmit={handleSaveSettings}>
                  <div className="sugu-admin__form-grid">
                    <div className="sugu-admin__form-group">
                      <label>Frais de Service Commission (%)</label>
                      <input
                        type="number"
                        className="sugu-admin__form-input"
                        min="0"
                        max="100"
                        value={settings.commission_rate}
                        onChange={(e) => setSettings({ ...settings, commission_rate: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="sugu-admin__form-group">
                      <label>Délai de validation Escrow automatique (jours)</label>
                      <input
                        type="number"
                        className="sugu-admin__form-input"
                        min="1"
                        value={settings.escrow_validation_delay}
                        onChange={(e) => setSettings({ ...settings, escrow_validation_delay: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="sugu-admin__form-grid" style={{ marginTop: '12px' }}>
                    <div className="sugu-admin__form-group">
                      <label>Délai d'expédition automatique (heures)</label>
                      <input
                        type="number"
                        className="sugu-admin__form-input"
                        min="1"
                        value={settings.auto_ship_delay}
                        onChange={(e) => setSettings({ ...settings, auto_ship_delay: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="sugu-admin__form-group" style={{ marginTop: '16px' }}>
                    <label>Conditions Générales de Vente (Texte Légal)</label>
                    <textarea
                      className="sugu-admin__form-textarea"
                      value={settings.legal_terms}
                      onChange={(e) => setSettings({ ...settings, legal_terms: e.target.value })}
                    />
                  </div>

                  <div className="sugu-admin__form-group" style={{ marginTop: '16px', marginBottom: '24px' }}>
                    <label>Politique de Confidentialité</label>
                    <textarea
                      className="sugu-admin__form-textarea"
                      value={settings.privacy_policy}
                      onChange={(e) => setSettings({ ...settings, privacy_policy: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="sugu-admin__btn primary" style={{ padding: '8px 24px', fontSize: '13px' }}>
                    Sauvegarder la configuration
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================== TAB 10: DEMANDES PRO ==================== */}
          {activeTab === 'demandes-pro' && (
            <div>
              <h2 className="sugu-admin__page-title">Validation des demandes Professionnelles</h2>
              <p className="sugu-admin__page-subtitle">Modérez et validez les documents d'immatriculation d'entreprise (RCCM, justificatifs) pour les nouveaux vendeurs Pros.</p>

              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #EAE5DD', padding: '24px' }}>
                {demandesProList.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                    Aucune demande d'inscription Pro en attente.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #EAE5DD', color: '#888' }}>
                          <th style={{ padding: '12px 8px' }}>Vendeur</th>
                          <th style={{ padding: '12px 8px' }}>Entreprise</th>
                          <th style={{ padding: '12px 8px' }}>Date demande</th>
                          <th style={{ padding: '12px 8px' }}>Statut</th>
                          <th style={{ padding: '12px 8px' }}>Justificatif</th>
                          <th style={{ padding: '12px 8px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demandesProList.map((d) => (
                          <tr key={d.id} style={{ borderBottom: '1px solid #EAE5DD' }}>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ fontWeight: 'bold' }}>{d.user_nom}</div>
                              <div style={{ fontSize: '11px', color: '#888' }}>{d.user_email || d.user_tel}</div>
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--sugu-primary)' }}>{d.nom_entreprise}</td>
                            <td style={{ padding: '12px 8px' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                background: d.statut === 'en_attente' ? '#FFF7E6' : d.statut === 'approuve' ? '#E6F7F0' : '#FFF1F0',
                                color: d.statut === 'en_attente' ? '#FA8C16' : d.statut === 'approuve' ? '#389E0D' : '#F5222D'
                              }}>
                                {d.statut === 'en_attente' ? 'En attente' : d.statut === 'approuve' ? 'Approuvé' : 'Rejeté'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {d.justificatif ? (
                                <a
                                  href={getFullUrl(d.justificatif)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--sugu-primary)', fontWeight: 'bold', textDecoration: 'none' }}
                                >
                                  📄 Voir document
                                </a>
                              ) : (
                                <span style={{ color: '#888' }}>Aucun fichier</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {d.statut === 'en_attente' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="sugu-admin__btn success"
                                    onClick={() => handleOuvrirModalRevue(d.id)}
                                  >
                                    Approuver ✓
                                  </button>
                                  <button
                                    type="button"
                                    className="sugu-admin__btn danger"
                                    onClick={() => handleRejeterDemandePro(d.id)}
                                  >
                                    Rejeter ✕
                                  </button>
                                </div>
                              )}
                              {d.notes && (
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                                  Note: {d.notes}
                                </div>
                              )}
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

          {/* ==================== TAB 11: COMMISSIONS & LITIGES ==================== */}
          {activeTab === 'commissions' && (
            <div>
              <h2 className="sugu-admin__page-title">Frais de Commission & Arbitrage de Litiges</h2>
              <p className="sugu-admin__page-subtitle">Gérez les taux de commissionnement par catégorie et intervenez pour débloquer les fonds en cas de litige.</p>

              {/* Commission rates by category */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #EAE5DD', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '8px' }}>
                  ⚙️ Configuration des Commissions par Catégorie
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #EAE5DD', color: '#888' }}>
                        <th style={{ padding: '8px' }}>Catégorie</th>
                        <th style={{ padding: '8px' }}>Taux Standard (%)</th>
                        <th style={{ padding: '8px' }}>Taux Pro Premium / Sur-mesure (%)</th>
                        <th style={{ padding: '8px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionParams.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #F1ECE3' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.categorie_nom}</td>
                          <td style={{ padding: '8px' }}>{p.taux_commission}%</td>
                          <td style={{ padding: '8px', color: '#389E0D', fontWeight: 'bold' }}>{p.taux_commission_pro}%</td>
                          <td style={{ padding: '8px' }}>
                            <button
                              type="button"
                              className="sugu-admin__btn primary"
                              onClick={() => {
                                const tStd = window.prompt("Nouveau taux Standard (%) :", p.taux_commission);
                                if (tStd === null) return;
                                const tPro = window.prompt("Nouveau taux Pro réduit (%) :", p.taux_commission_pro);
                                if (tPro === null) return;
                                handleUpdateCommissionParam(p.id, tStd, tPro);
                              }}
                            >
                              Modifier ✏️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Litiges (Arbitration) */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #EAE5DD', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '8px', color: '#D4380D' }}>
                  ⚖️ Litiges en cours (Arbitrage Plateforme)
                </h3>
                {commissionTransactions.filter(t => t.statut === 'litige').length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                    Aucun litige actif nécessitant un arbitrage.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #EAE5DD', color: '#888' }}>
                          <th style={{ padding: '8px' }}>ID Transaction</th>
                          <th style={{ padding: '8px' }}>Annonce / Vendeur</th>
                          <th style={{ padding: '8px' }}>Acheteur</th>
                          <th style={{ padding: '8px' }}>Montant Total</th>
                          <th style={{ padding: '8px' }}>Arbitrage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissionTransactions.filter(t => t.statut === 'litige').map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #F1ECE3' }}>
                            <td style={{ padding: '8px' }}>#{t.id}</td>
                            <td style={{ padding: '8px' }}>
                              <div style={{ fontWeight: 'bold' }}>{t.ad_title}</div>
                              <div style={{ fontSize: '11px', color: '#777' }}>Vendeur: {t.ven_nom}</div>
                            </td>
                            <td style={{ padding: '8px' }}>{t.ach_nom}</td>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{Number(t.montant_total).toLocaleString('fr-FR')} FCFA</td>
                            <td style={{ padding: '8px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className="sugu-admin__btn success"
                                  onClick={() => {
                                    if (window.confirm("Débloquer les fonds et payer le vendeur ?")) {
                                      handleArbitrerLitige(t.id, 'payer_vendeur');
                                    }
                                  }}
                                >
                                  Payer Vendeur ✓
                                </button>
                                <button
                                  type="button"
                                  className="sugu-admin__btn danger"
                                  onClick={() => {
                                    if (window.confirm("Annuler l'achat et rembourser intégralement l'acheteur ?")) {
                                      handleArbitrerLitige(t.id, 'rembourser_acheteur');
                                    }
                                  }}
                                >
                                  Rembourser Acheteur ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Transactions History */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #EAE5DD', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '14px', borderBottom: '1px solid #F1ECE3', paddingBottom: '8px' }}>
                  📊 Historique des Paiements Sécurisés & Commissions
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #EAE5DD', color: '#888' }}>
                        <th style={{ padding: '8px' }}>Date</th>
                        <th style={{ padding: '8px' }}>ID</th>
                        <th style={{ padding: '8px' }}>Article</th>
                        <th style={{ padding: '8px' }}>Vendeur</th>
                        <th style={{ padding: '8px' }}>Montant Total</th>
                        <th style={{ padding: '8px' }}>Commission</th>
                        <th style={{ padding: '8px' }}>Net Vendeur</th>
                        <th style={{ padding: '8px' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionTransactions.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #F1ECE3' }}>
                          <td style={{ padding: '8px' }}>{new Date(t.date_creation).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '8px' }}>#{t.id}</td>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{t.ad_title}</td>
                          <td style={{ padding: '8px' }}>{t.ven_nom}</td>
                          <td style={{ padding: '8px' }}>{Number(t.montant_total).toLocaleString('fr-FR')} F</td>
                          <td style={{ padding: '8px', color: '#C04322', fontWeight: 'bold' }}>-{Number(t.commission_montant).toLocaleString('fr-FR')} F</td>
                          <td style={{ padding: '8px', color: '#389E0D', fontWeight: 'bold' }}>{Number(t.montant_vendeur).toLocaleString('fr-FR')} F</td>
                          <td style={{ padding: '8px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              background: t.statut === 'paye' ? '#E6F7F0' : t.statut === 'litige' ? '#FFF1F0' : t.statut === 'rembourse' ? '#F5F5F5' : '#E6F7F0',
                              color: t.statut === 'paye' ? '#389E0D' : t.statut === 'litige' ? '#F5222D' : t.statut === 'rembourse' ? '#999' : '#389E0D'
                            }}>
                              {t.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== TAB 12: SUIVI COMMANDES & RENDEZ-VOUS ===== */}
          {activeTab === 'liens-achat' && (
            <div className="sugu-admin__section">
              <div className="sugu-admin__section-header">
                <div>
                  <h2 className="sugu-admin__section-title">🤝 Suivi des Commandes & Rendez-vous</h2>
                  <p className="sugu-admin__section-subtitle">
                    Supervision complète des transactions entre acheteurs et vendeurs (Remises en main propre & Livraisons à domicile).
                  </p>
                </div>
              </div>

              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #EAE5DD' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>Total Commandes / RDV</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--sugu-ink)', marginTop: '4px' }}>{liensAchatList.length}</div>
                </div>
                <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #EAE5DD' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>🤝 Remise en Main Propre</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#106C62', marginTop: '4px' }}>
                    {liensAchatList.filter(l => l.mode_reception === 'retrait').length}
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #EAE5DD' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>📦 Livraison à Domicile</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#D4380D', marginTop: '4px' }}>
                    {liensAchatList.filter(l => l.mode_reception === 'livraison').length}
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #EAE5DD' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>🛡️ Séquestres & Payés</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#389E0D', marginTop: '4px' }}>
                    {liensAchatList.filter(l => ['paye', 'expedie', 'livre', 'valide'].includes(l.statut)).length}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #EAE5DD', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginRight: '8px' }}>Mode de Réception :</label>
                  <select
                    value={lienModeFilter}
                    onChange={(e) => { setLienModeFilter(e.target.value); setLiensCurrentPage(1); }}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '12px' }}
                  >
                    <option value="">Tous les modes</option>
                    <option value="retrait">🤝 Remise en main propre</option>
                    <option value="livraison">📦 Livraison à domicile</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginRight: '8px' }}>Statut :</label>
                  <select
                    value={lienStatutFilter}
                    onChange={(e) => { setLienStatutFilter(e.target.value); setLiensCurrentPage(1); }}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '12px' }}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="cree">⚡ Créé (Proposition)</option>
                    <option value="attente_vendeur">⏳ En attente Vendeur</option>
                    <option value="attente_acheteur">🔄 En attente Acheteur</option>
                    <option value="paye">📅 RDV Planifié / Payé</option>
                    <option value="expedie">🚚 Expédié</option>
                    <option value="livre">📦 Livré / Remis (Vérification 48h)</option>
                    <option value="valide">🎉 Finalisé</option>
                    <option value="inconforme">⚠️ Litige en cours</option>
                    <option value="annule">❌ Annulé</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #EAE5DD', padding: '24px' }}>
                {liensAchatList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: '13.5px' }}>
                    Aucune commande ou rendez-vous correspondant aux filtres.
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #EAE5DD', color: '#666', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                            <th style={{ padding: '10px' }}>ID / Date</th>
                            <th style={{ padding: '10px' }}>Article & Prix</th>
                            <th style={{ padding: '10px' }}>Vendeur</th>
                            <th style={{ padding: '10px' }}>Acheteur</th>
                            <th style={{ padding: '10px' }}>Mode</th>
                            <th style={{ padding: '10px' }}>Paiement</th>
                            <th style={{ padding: '10px' }}>Détails RDV / Adresse</th>
                            <th style={{ padding: '10px' }}>Statut</th>
                            <th style={{ padding: '10px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {liensAchatList.slice((liensCurrentPage - 1) * 20, liensCurrentPage * 20).map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #F1ECE3' }}>
                              <td style={{ padding: '10px' }}>
                                <div style={{ fontWeight: 800, color: 'var(--sugu-primary)' }}>#LA-{item.id}</div>
                                <div style={{ fontSize: '10.5px', color: '#999' }}>
                                  {new Date(item.created_at).toLocaleDateString('fr-FR')} {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td style={{ padding: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {item.cover_url && (
                                    <img src={getFullUrl(item.cover_url)} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#333' }}>{item.ad_title}</div>
                                    <div style={{ fontWeight: 800, color: 'var(--sugu-primary)', fontSize: '11.5px' }}>{item.prix_convenu?.toLocaleString('fr-FR')} FCFA</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '10px' }}>
                                <div style={{ fontWeight: 600 }}>{item.ven_nom}</div>
                                <div style={{ fontSize: '10.5px', color: '#888' }}>{item.ven_tel || item.ven_email}</div>
                              </td>
                              <td style={{ padding: '10px' }}>
                                <div style={{ fontWeight: 600 }}>{item.ach_nom}</div>
                                <div style={{ fontSize: '10.5px', color: '#888' }}>{item.ach_tel || item.ach_email}</div>
                              </td>
                              <td style={{ padding: '10px' }}>
                                {item.mode_reception === 'retrait' ? (
                                  <span style={{ background: '#E6F4F2', color: '#106C62', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                                    🤝 Main propre
                                  </span>
                                ) : (
                                  <span style={{ background: '#FFF0F6', color: '#C41D7F', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                                    📦 Livraison
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px' }}>
                                {item.moyen_paiement === 'portefeuille' ? (
                                  <span style={{ background: '#E6F7F0', color: '#389E0D', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                                    🛡️ Portefeuille
                                  </span>
                                ) : (
                                  <span style={{ background: '#FFF7E6', color: '#D4380D', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                                    💵 Espèces
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px', maxWidth: '200px' }}>
                                {item.mode_reception === 'retrait' ? (
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#106C62' }}>🗓️ {item.retrait_date || 'Date non fixée'}</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div style={{ fontWeight: 600 }}>📍 {item.livraison_commune}</div>
                                    <div style={{ fontSize: '10.5px', color: '#777' }}>{item.livraison_adresse}</div>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '10px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  background:
                                    item.statut === 'valide' || item.statut === 'retourne' ? '#E6F7F0' :
                                      item.statut === 'inconforme' ? '#FFF1F0' :
                                        item.statut === 'paye' ? '#E6F4F2' :
                                          item.statut === 'annule' ? '#F5F5F5' : '#FFF7E6',
                                  color:
                                    item.statut === 'valide' || item.statut === 'retourne' ? '#389E0D' :
                                      item.statut === 'inconforme' ? '#F5222D' :
                                        item.statut === 'paye' ? '#106C62' :
                                          item.statut === 'annule' ? '#888' : '#D4380D'
                                }}>
                                  {item.statut === 'cree' && '⚡ Créé'}
                                  {item.statut === 'attente_vendeur' && '⏳ Attente Vendeur'}
                                  {item.statut === 'attente_acheteur' && '🔄 Attente Acheteur'}
                                  {item.statut === 'paye' && '📅 RDV Planifié / Payé'}
                                  {item.statut === 'expedie' && '🚚 Expédié'}
                                  {item.statut === 'livre' && '📦 Livré (Vérification)'}
                                  {item.statut === 'valide' && '🎉 Finalisé'}
                                  {item.statut === 'retourne' && '📦 Retourné & Remboursé'}
                                  {item.statut === 'annule' && '❌ Annulé'}
                                  {item.statut === 'inconforme' && '⚠️ Litige'}
                                </span>
                              </td>
                              <td style={{ padding: '10px' }}>
                                <button
                                  type="button"
                                  className="sugu-admin__btn primary"
                                  onClick={() => setSelectedLienDetail(item)}
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                >
                                  👁️ Détails
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {liensAchatList.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #EAE5DD', paddingTop: '16px', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Affichage de <strong>{((liensCurrentPage - 1) * 20) + 1}</strong> à <strong>{Math.min(liensCurrentPage * 20, liensAchatList.length)}</strong> sur <strong>{liensAchatList.length}</strong> commandes
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={liensCurrentPage === 1}
                            onClick={() => setLiensCurrentPage(prev => Math.max(1, prev - 1))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #CCC',
                              background: liensCurrentPage === 1 ? '#F5F5F5' : '#FFF',
                              color: liensCurrentPage === 1 ? '#AAA' : '#333',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: liensCurrentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            ◄ Précédent
                          </button>

                          {Array.from({ length: Math.ceil(liensAchatList.length / 20) || 1 }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setLiensCurrentPage(p)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: liensCurrentPage === p ? 'var(--sugu-primary)' : '#CCC',
                                background: liensCurrentPage === p ? 'var(--sugu-primary)' : '#FFF',
                                color: liensCurrentPage === p ? '#FFF' : '#333',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {p}
                            </button>
                          ))}

                          <button
                            type="button"
                            disabled={liensCurrentPage === (Math.ceil(liensAchatList.length / 20) || 1)}
                            onClick={() => setLiensCurrentPage(prev => Math.min(Math.ceil(liensAchatList.length / 20) || 1, prev + 1))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #CCC',
                              background: liensCurrentPage === (Math.ceil(liensAchatList.length / 20) || 1) ? '#F5F5F5' : '#FFF',
                              color: liensCurrentPage === (Math.ceil(liensAchatList.length / 20) || 1) ? '#AAA' : '#333',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: liensCurrentPage === (Math.ceil(liensAchatList.length / 20) || 1) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Suivant ►
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ==================== USER DETAILS DRAWER ==================== */}
      {selectedUser && (
        <div className="sugu-admin__drawer">
          <div className="sugu-admin__drawer-header">
            <h3 className="sugu-admin__drawer-title">Profil Détaillé Utilisateur</h3>
            <button type="button" className="sugu-admin__drawer-close" onClick={() => setSelectedUser(null)}>×</button>
          </div>
          <div className="sugu-admin__drawer-content">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #F1ECE3', paddingBottom: '16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: selectedUser.role === 'admin' ? '#E6F7FF' : '#F4EDE4', color: selectedUser.role === 'admin' ? '#1890FF' : '#8F3A1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px' }}>
                {selectedUser.nom?.slice(0, 2).toUpperCase()}
              </div>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{selectedUser.nom}</h4>
              <span className="sugu-admin__badge" style={{ backgroundColor: selectedUser.est_banni === 1 ? '#FFF1F0' : '#E6F7F0', color: selectedUser.est_banni === 1 ? '#F5222D' : '#389E0D' }}>
                {selectedUser.est_banni === 1 ? 'Banni' : 'Actif'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ fontWeight: 'bold', color: '#888' }}>ID Utilisateur : </span>
                <span>#{selectedUser.id}</span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', color: '#888' }}>Adresse e-mail : </span>
                <span>{selectedUser.email || 'Aucune'}</span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', color: '#888' }}>Numéro Téléphone : </span>
                <span>{selectedUser.telephone || 'Aucun'}</span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', color: '#888' }}>Date d'inscription : </span>
                <span>{new Date(selectedUser.created_at).toLocaleString('fr-FR')}</span>
              </div>
              <div>
                <span style={{ fontWeight: 'bold', color: '#888' }}>Rôle Système : </span>
                <span style={{ fontWeight: 'bold', color: 'var(--sugu-primary)' }}>{selectedUser.role?.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className={`sugu-admin__btn ${selectedUser.est_banni === 1 ? 'success' : 'danger'}`}
                style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
                onClick={() => handleToggleUserBan(selectedUser)}
              >
                {selectedUser.est_banni === 1 ? 'Débannir le compte' : 'Bannir le compte 🚫'}
              </button>
              <button
                type="button"
                className="sugu-admin__btn primary"
                style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
                onClick={() => handleToggleUserRole(selectedUser)}
              >
                {selectedUser.role === 'admin' ? "Rendre simple utilisateur" : "Promouvoir Administrateur 🛡️"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ANNONCE QUICK PREVIEW DRAWER ==================== */}
      {selectedAnnonce && (
        <div className="sugu-admin__drawer" style={{ width: '480px' }}>
          <div className="sugu-admin__drawer-header">
            <h3 className="sugu-admin__drawer-title">Aperçu rapide de l'annonce</h3>
            <button type="button" className="sugu-admin__drawer-close" onClick={() => setSelectedAnnonce(null)}>×</button>
          </div>
          <div className="sugu-admin__drawer-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedAnnonce.cover_url ? (
                <img src={selectedAnnonce.cover_url} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #EAE5DD' }} />
              ) : (
                <div style={{ width: '100%', height: '180px', background: '#F1ECE3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Aucune Image</div>
              )}

              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>{selectedAnnonce.titre}</h4>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--sugu-primary)' }}>{selectedAnnonce.prix.toLocaleString('fr-FR')} FCFA</div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
                <span style={{ background: '#FAF9F6', border: '1px solid #EAE5DD', padding: '4px 8px', borderRadius: '4px' }}>État: {selectedAnnonce.etat}</span>
                <span style={{ background: '#FAF9F6', border: '1px solid #EAE5DD', padding: '4px 8px', borderRadius: '4px' }}>Commune: {selectedAnnonce.commune}</span>
                <span style={{ background: '#FAF9F6', border: '1px solid #EAE5DD', padding: '4px 8px', borderRadius: '4px' }}>Vendeur: {selectedAnnonce.vendeur_nom}</span>
              </div>

              <div>
                <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Description du produit :</span>
                <p style={{ fontSize: '12px', color: '#444', background: '#F9F9F8', padding: '12px', borderRadius: '8px', border: '1px dashed #EAE5DD', margin: 0, lineHeight: 1.5 }}>
                  {selectedAnnonce.description || 'Aucune description fournie.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #F1ECE3', paddingTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="sugu-admin__btn success"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 0', fontWeight: 'bold' }}
                  onClick={() => handleUpdateAdStatut(selectedAnnonce.id, 'active')}
                >
                  Valider l'annonce ✓
                </button>
                <button
                  type="button"
                  className="sugu-admin__btn danger"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 0', fontWeight: 'bold' }}
                  onClick={() => handleUpdateAdStatut(selectedAnnonce.id, 'suspendue')}
                >
                  Suspendre 🚫
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRO REVIEW MODAL ==================== */}
      {reviewModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '780px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #EAE5DD',
              position: 'sticky', top: 0, background: '#fff', zIndex: 2, borderRadius: '16px 16px 0 0'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>🔍 Vérification avant approbation</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                  Vérifiez les informations du demandeur avant d'approuver son compte Pro
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#999', lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Modal Body */}
            {reviewModalLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
                <p>Chargement des données du vendeur…</p>
              </div>
            ) : reviewModalData ? (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* ---- Seller Identity ---- */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--sugu-primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '28px', color: '#fff', fontWeight: 'bold',
                    overflow: 'hidden', border: '3px solid #EAE5DD'
                  }}>
                    {reviewModalData.demande.photo_profil
                      ? <img src={getFullUrl(reviewModalData.demande.photo_profil)} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (reviewModalData.demande.user_nom || '?')[0].toUpperCase()
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{reviewModalData.demande.user_nom}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                      📧 {reviewModalData.demande.user_email || '—'} &nbsp;|&nbsp;
                      📞 {reviewModalData.demande.user_tel || '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      Membre depuis le {new Date(reviewModalData.demande.user_created_at).toLocaleDateString('fr-FR')} &nbsp;·&nbsp;
                      Compte : <strong>{reviewModalData.demande.type_compte || 'particulier'}</strong>
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                        fontWeight: 'bold', textTransform: 'uppercase',
                        background: reviewModalData.demande.statut === 'en_attente' ? '#FFF7E6' : '#E6F7F0',
                        color: reviewModalData.demande.statut === 'en_attente' ? '#FA8C16' : '#389E0D'
                      }}>
                        {reviewModalData.demande.statut === 'en_attente' ? '⏳ En attente' : '✅ Approuvé'}
                      </span>
                      &nbsp;
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        Entreprise demandée : <strong style={{ color: 'var(--sugu-primary)' }}>{reviewModalData.demande.nom_entreprise}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ---- Justificatif Document ---- */}
                <div style={{ background: '#FAF9F6', border: '1px solid #EAE5DD', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>📄 Document Justificatif (RCCM / Immatriculation)</h4>
                  {reviewModalData.demande.justificatif ? (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* If it looks like an image, render it inline */}
                      {/\.(jpg|jpeg|png|gif|webp)$/i.test(reviewModalData.demande.justificatif) ? (
                        <img
                          src={getFullUrl(reviewModalData.demande.justificatif)}
                          alt="Justificatif"
                          style={{ maxWidth: '360px', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #D4B896', cursor: 'pointer' }}
                          onClick={() => window.open(getFullUrl(reviewModalData.demande.justificatif), '_blank')}
                        />
                      ) : null}
                      <div>
                        <a
                          href={getFullUrl(reviewModalData.demande.justificatif)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', background: 'var(--sugu-primary)', color: '#fff',
                            borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold'
                          }}
                        >
                          🔗 Ouvrir dans un nouvel onglet
                        </a>
                        <p style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                          Cliquez sur l'image ou le lien pour agrandir / télécharger
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#999', background: '#F1ECE3', borderRadius: '8px' }}>
                      ⚠️ Aucun justificatif fourni par le demandeur
                    </div>
                  )}
                </div>

                {/* ---- Stats Cards ---- */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>📊 Statistiques du vendeur</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {[
                      { label: 'Annonces actives', value: reviewModalData.stats.annonces_actives, icon: '📋', color: '#1a91e8' },
                      { label: 'Annonces totales', value: reviewModalData.stats.annonces_total, icon: '📦', color: '#7c4dff' },
                      { label: 'Ventes complétées', value: reviewModalData.stats.ventes_completees, icon: '✅', color: '#27ae60' },
                      { label: 'Note moyenne', value: `${reviewModalData.stats.note_moyenne} / 5`, icon: '⭐', color: '#f39c12' },
                      { label: 'Avis reçus', value: reviewModalData.stats.nb_avis, icon: '💬', color: '#16a085' },
                      { label: 'Signalements reçus', value: reviewModalData.stats.signalements_recus, icon: '🚩', color: reviewModalData.stats.signalements_recus > 0 ? '#e74c3c' : '#27ae60' },
                    ].map((stat, i) => (
                      <div key={i} style={{
                        background: '#fff', border: '1px solid #EAE5DD', borderRadius: '10px',
                        padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px'
                      }}>
                        <div style={{ fontSize: '20px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ---- Recent Listings ---- */}
                {reviewModalData.annonces_recentes && reviewModalData.annonces_recentes.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>🛒 Dernières annonces publiées</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {reviewModalData.annonces_recentes.map((a, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          background: '#FAF9F6', border: '1px solid #EAE5DD', borderRadius: '8px', padding: '10px 14px'
                        }}>
                          <div style={{
                            width: '48px', height: '48px', flexShrink: 0, borderRadius: '6px',
                            background: '#EAE5DD', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {a.cover_url ? (
                              <img src={a.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '20px' }}>🖼️</span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titre}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {a.prix ? `${Number(a.prix).toLocaleString('fr-FR')} FCFA` : 'Prix non spécifié'} &nbsp;·&nbsp;
                              {new Date(a.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', flexShrink: 0,
                            background: a.statut === 'active' ? '#E6F7F0' : '#FFF1F0',
                            color: a.statut === 'active' ? '#389E0D' : '#F5222D'
                          }}>{a.statut}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Recent Reviews ---- */}
                {reviewModalData.avis && reviewModalData.avis.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>⭐ Avis clients récents</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {reviewModalData.avis.map((avis, i) => (
                        <div key={i} style={{
                          background: '#FFFDF9', border: '1px solid #F0EBE1', borderRadius: '8px', padding: '12px 14px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#333' }}>{avis.auteur}</div>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[1, 2, 3, 4, 5].map(s => (
                                <span key={s} style={{ fontSize: '13px', color: s <= avis.note ? '#F5A623' : '#DDD' }}>★</span>
                              ))}
                            </div>
                          </div>
                          {avis.commentaire && (
                            <p style={{ margin: 0, fontSize: '12px', color: '#555', fontStyle: 'italic', lineHeight: 1.5 }}>
                              "{avis.commentaire}"
                            </p>
                          )}
                          <div style={{ fontSize: '11px', color: '#AAA', marginTop: '6px' }}>
                            {new Date(avis.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reviewModalData.avis && reviewModalData.avis.length === 0 && (
                  <div style={{ padding: '14px', background: '#F9F9F8', borderRadius: '8px', textAlign: 'center', color: '#AAA', fontSize: '12px' }}>
                    Aucun avis client pour ce vendeur
                  </div>
                )}

              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                Données indisponibles.
              </div>
            )}

            {/* Modal Footer Actions */}
            <div style={{
              position: 'sticky', bottom: 0, background: '#fff', zIndex: 2,
              padding: '16px 24px', borderTop: '1px solid #EAE5DD',
              display: 'flex', gap: '12px', justifyContent: 'flex-end',
              borderRadius: '0 0 16px 16px'
            }}>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                style={{
                  padding: '10px 20px', background: '#F1ECE3', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#555'
                }}
              >
                ✕ Fermer
              </button>
              {reviewModalData && reviewModalData.demande.statut === 'en_attente' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRejeterDemandePro(reviewModalDemandeId)}
                    style={{
                      padding: '10px 20px', background: '#FFF1F0', border: '1px solid #FFADB0',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#F5222D'
                    }}
                  >
                    ✕ Rejeter
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprouverDemandePro(reviewModalDemandeId)}
                    style={{
                      padding: '10px 24px', background: 'var(--sugu-primary)', border: 'none',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    ✓ Confirmer l'approbation Pro
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== COMMAND / RDV DETAILS DRAWER ==================== */}
      {selectedLienDetail && (
        <div className="sugu-admin__drawer" style={{ width: '520px' }}>
          <div className="sugu-admin__drawer-header">
            <h3 className="sugu-admin__drawer-title">Suivi Détaillé #LA-{selectedLienDetail.id}</h3>
            <button type="button" className="sugu-admin__drawer-close" onClick={() => setSelectedLienDetail(null)}>×</button>
          </div>
          <div className="sugu-admin__drawer-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#FBF9F5', padding: '12px', borderRadius: '10px', border: '1px solid #EAE5DD' }}>
                {selectedLienDetail.cover_url && (
                  <img src={getFullUrl(selectedLienDetail.cover_url)} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                )}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--sugu-ink)' }}>{selectedLienDetail.ad_title}</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--sugu-primary)' }}>{selectedLienDetail.prix_convenu?.toLocaleString('fr-FR')} FCFA</div>
                </div>
              </div>

              {/* Status Banner */}
              <div style={{ background: '#E6F4F2', padding: '12px', borderRadius: '8px', border: '1px solid #BEE2DC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#106C62' }}>Statut Actuel de la Transaction</span>
                <span style={{ background: '#106C62', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                  {selectedLienDetail.statut}
                </span>
              </div>

              {/* Actors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#FFF', border: '1px solid #EAE5DD', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>👤 Vendeur</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{selectedLienDetail.ven_nom}</div>
                  <div style={{ fontSize: '11.5px', color: '#666', marginTop: '2px' }}>{selectedLienDetail.ven_tel}</div>
                  <div style={{ fontSize: '11.5px', color: '#888' }}>{selectedLienDetail.ven_email}</div>
                </div>
                <div style={{ background: '#FFF', border: '1px solid #EAE5DD', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>🛍️ Acheteur</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{selectedLienDetail.ach_nom}</div>
                  <div style={{ fontSize: '11.5px', color: '#666', marginTop: '2px' }}>{selectedLienDetail.ach_tel}</div>
                  <div style={{ fontSize: '11.5px', color: '#888' }}>{selectedLienDetail.ach_email}</div>
                </div>
              </div>

              {/* Mode & Details */}
              <div style={{ background: '#FFF', border: '1px solid #EAE5DD', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #F1ECE3', paddingBottom: '6px' }}>
                  {selectedLienDetail.mode_reception === 'retrait' ? '🤝 Remise en Main Propre' : '📦 Livraison à Domicile'}
                </div>

                {selectedLienDetail.mode_reception === 'retrait' ? (
                  <div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                      <strong>Date & Heure proposées/convenues :</strong> {selectedLienDetail.retrait_date || 'Non renseigné'}
                    </div>
                    {selectedLienDetail.retrait_rendezvous_datetime && (
                      <div style={{ fontSize: '11.5px', color: '#888', marginTop: '2px' }}>
                        Horodatage ISO: {new Date(selectedLienDetail.retrait_rendezvous_datetime).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#555', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>Destinataire :</strong> {selectedLienDetail.livraison_nom || selectedLienDetail.ach_nom} ({selectedLienDetail.livraison_telephone || selectedLienDetail.ach_tel})</div>
                    <div><strong>Adresse :</strong> {selectedLienDetail.livraison_adresse || 'Non renseignée'}, {selectedLienDetail.livraison_commune}</div>
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                  <strong>Mode de Paiement :</strong> {selectedLienDetail.moyen_paiement === 'portefeuille' ? '🛡️ Portefeuille Électronique Sugu (Séquestre)' : '💵 Espèces sur place'}
                </div>
              </div>

              {/* Financials if Portefeuille */}
              {selectedLienDetail.montant_total && (
                <div style={{ background: '#FFF7E6', border: '1px solid #FFE7BA', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#D4380D', marginBottom: '6px' }}>💰 Détails Financiers (Sugu Escrow)</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Montant total payé :</span>
                    <strong>{Number(selectedLienDetail.montant_total).toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#106C62' }}>
                    <span>Commission Sugu :</span>
                    <strong>+{Number(selectedLienDetail.commission_montant).toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #FFE7BA', paddingTop: '4px', marginTop: '4px' }}>
                    <span>Net à reverser au Vendeur :</span>
                    <strong>{Number(selectedLienDetail.montant_vendeur).toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
