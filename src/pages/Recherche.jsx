import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ListingCard from '../components/listings/ListingCard';
import { COMMUNES } from '../data/mock';
import client from '../api/client';
import './Recherche.css';

// Initial data from Sugu Recherche template
const INITIAL_DATA = [
  { id: "201", titre: "iPhone 13 Pro 256 Go", prix: 385000, cat: "Électronique", commune: "Cocody", cond: "Neuf", delivery: ["livraison", "main"], hours: 2, tint: "#EADFCE", imgLabel: "[ photo produit ]" },
  { id: "202", titre: "Toyota Corolla 2016", prix: 6800000, cat: "Véhicules", commune: "Yopougon", cond: "Occasion", delivery: ["main"], hours: 4, tint: "#E6DDD0", imgLabel: "[ photo véhicule ]" },
  { id: "203", titre: "Canapé d'angle 5 places", prix: 220000, cat: "Maison", commune: "Marcory", cond: "Occasion", delivery: ["livraison"], hours: 6, tint: "#E9E1D2", imgLabel: "[ photo meuble ]" },
  { id: "204", titre: "Villa 4 pièces à louer", prix: 450000, cat: "Immobilier", commune: "Cocody", cond: "Neuf", delivery: ["main"], hours: 7, tint: "#E4DDCC", imgLabel: "[ photo immobilier ]", suffix: "/mois" },
  { id: "205", titre: "MacBook Air M2 8/256", prix: 720000, cat: "Électronique", commune: "Plateau", cond: "Neuf", delivery: ["livraison", "main"], hours: 9, tint: "#E9E0D0", imgLabel: "[ photo produit ]" },
  { id: "206", titre: "Robe wax sur mesure", prix: 25000, cat: "Mode", commune: "Treichville", cond: "Neuf", delivery: ["livraison"], hours: 11, tint: "#EDE2CF", imgLabel: "[ photo mode ]" },
  { id: "207", titre: "Réfrigérateur Samsung 2 portes", prix: 180000, cat: "Maison", commune: "Adjamé", cond: "Occasion", delivery: ["main"], hours: 13, tint: "#E6DDCE", imgLabel: "[ photo électro ]" },
  { id: "208", titre: "Groupe électrogène 3,5 kVA", prix: 320000, cat: "Maison", commune: "Abobo", cond: "Neuf", delivery: ["livraison", "main"], hours: 20, tint: "#E8E0D1", imgLabel: "[ photo produit ]" },
  { id: "209", titre: "Samsung Galaxy S23 Ultra", prix: 520000, cat: "Électronique", commune: "Plateau", cond: "Neuf", delivery: ["livraison"], hours: 30, tint: "#E9E1D2", imgLabel: "[ photo produit ]" },
  { id: "210", titre: "Mercedes Classe C 2019", prix: 18500000, cat: "Véhicules", commune: "Marcory", cond: "Occasion", delivery: ["main"], hours: 26, tint: "#E6DDD0", imgLabel: "[ photo véhicule ]" },
  { id: "211", titre: "Terrain 500 m² titré (ACD)", prix: 15000000, cat: "Immobilier", commune: "Bingerville", cond: "Neuf", delivery: ["main"], hours: 8, tint: "#E4DDCC", imgLabel: "[ photo terrain ]" },
  { id: "212", titre: "Chaussures Nike Air Max", prix: 35000, cat: "Mode", commune: "Yopougon", cond: "Occasion", delivery: ["livraison", "main"], hours: 72, tint: "#EDE2CF", imgLabel: "[ photo mode ]" },
  { id: "213", titre: "Climatiseur LG 1,5 CV", prix: 240000, cat: "Maison", commune: "Cocody", cond: "Neuf", delivery: ["livraison"], hours: 50, tint: "#E8E0D1", imgLabel: "[ photo produit ]" },
  { id: "214", titre: "Cours de maths à domicile", prix: 5000, cat: "Services", commune: "Cocody", cond: "Neuf", delivery: ["main"], hours: 5, tint: "#E9E0D0", imgLabel: "[ prestation ]", suffix: "/h" },
  { id: "215", titre: "Toyota RAV4 2018", prix: 12500000, cat: "Véhicules", commune: "Cocody", cond: "Occasion", delivery: ["main"], hours: 15, tint: "#E6DDD0", imgLabel: "[ photo véhicule ]" },
  { id: "216", titre: "iPhone 15 Pro Max 512 Go", prix: 950000, cat: "Électronique", commune: "Plateau", cond: "Neuf", delivery: ["livraison", "main"], hours: 1, tint: "#EADFCE", imgLabel: "[ photo produit ]" }
];

const CATEGORIES = [
  "Toutes",
  "Téléphones & Tablettes",
  "Électronique",
  "Véhicules",
  "Immobilier",
  "Mode & Beauté",
  "Maison & Jardin",
  "Emploi & Services",
  "Agriculture & Alimentation",
  "Sports & Loisirs",
  "Autres"
];

const CATEGORY_SLUG_TO_NAME = {
  'telephones-tablettes': 'Téléphones & Tablettes',
  'electronique': 'Électronique',
  'vehicules': 'Véhicules',
  'immobilier': 'Immobilier',
  'mode-beaute': 'Mode & Beauté',
  'maison-jardin': 'Maison & Jardin',
  'emploi-services': 'Emploi & Services',
  'agriculture-alimentation': 'Agriculture & Alimentation',
  'sports-loisirs': 'Sports & Loisirs',
  'autres': 'Autres',
  // legacy mapping
  'mode': 'Mode & Beauté',
  'maison': 'Maison & Jardin',
  'services': 'Emploi & Services',
  'emploi': 'Emploi & Services'
};

const COMMUNES_LIST = ["Cocody", "Yopougon", "Plateau", "Marcory", "Treichville", "Adjamé", "Abobo", "Bingerville", "Port-Bouët", "Koumassi", "Attécoubé"];

const CONDITIONS = [
  { label: "Neuf", value: "neuf" },
  { label: "Très bon état", value: "tres_bon" },
  { label: "Bon état", value: "bon" },
  { label: "État correct", value: "correct" }
];

const LIVRAISONS = [
  { label: "Avec livraison", value: "livraison" },
  { label: "Remise en main propre", value: "main" }
];
const DATE_OPTIONS = [
  { label: "N'importe quand", value: "Toutes" },
  { label: "Dernières 24h", value: "24" },
  { label: "7 derniers jours", value: "168" },
  { label: "30 derniers jours", value: "720" }
];

export default function Recherche() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL parameters
  const queryParam = searchParams.get('q') || '';
  const rawCatParam = searchParams.get('categorie') || 'Toutes';
  const catParam = CATEGORY_SLUG_TO_NAME[rawCatParam.toLowerCase()] || rawCatParam;
  const communeParam = searchParams.get('commune') || '';

  // Local state for filters
  const [category, setCategory] = useState(catParam);
  const [communes, setCommunes] = useState(communeParam ? [communeParam] : []);
  const [conds, setConds] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [dateLimit, setDateLimit] = useState('Toutes');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('pertinence');
  const [proOnly, setProOnly] = useState(false);
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Loaded database listings
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Synchronize category state when searchParams changes
  useEffect(() => {
    if (catParam) setCategory(catParam);
  }, [catParam]);

  // Scroll to top when searchParams changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [searchParams]);

  // Load active listings from Backend
  useEffect(() => {
    setLoading(true);
    const categoryMapping = {
      "Toutes": "",
      "Téléphones & Tablettes": "telephones-tablettes",
      "Électronique": "electronique",
      "Véhicules": "vehicules",
      "Immobilier": "immobilier",
      "Mode & Beauté": "mode-beaute",
      "Maison & Jardin": "maison-jardin",
      "Emploi & Services": "emploi-services",
      "Agriculture & Alimentation": "agriculture-alimentation",
      "Sports & Loisirs": "sports-loisirs",
      "Autres": "autres"
    };

    const params = {};
    if (queryParam) params.query = queryParam;
    if (category && category !== 'Toutes') {
      params.category = categoryMapping[category] || category.toLowerCase();
    }
    if (communes.length === 1) {
      params.commune = communes[0];
    }
    if (priceMin) params.minPrice = priceMin;
    if (priceMax) params.maxPrice = priceMax;
    if (proOnly) params.pro = 'true';

    const sortMapping = {
      "pertinence": "date_desc",
      "prix-asc": "prix_asc",
      "prix-desc": "prix_desc",
      "recent": "date_desc"
    };
    params.sort = sortMapping[sort] || "date_desc";

    client.get('/annonces', { params })
      .then(res => {
        const mapped = res.data.map(item => {
          let displayCat = "Autres";
          if (item.categorie_nom) {
            displayCat = item.categorie_nom;
          }
          return {
            id: item.id,
            titre: item.titre,
            prix: item.prix,
            price: item.prix,
            cat: displayCat,
            commune: item.commune,
            ville: item.ville || "Abidjan",
            cond: item.etat || "neuf",
            delivery: item.delivery === 'both' ? ['livraison', 'main'] : (item.delivery === 'livraison' ? ['livraison'] : ['main']),
            created_at: item.created_at,
            hours: Math.floor((Date.now() - new Date(item.created_at).getTime()) / 3600000),
            cover_url: item.cover_url,
            statut: item.statut,
            vendeur_est_pro: item.vendeur_est_pro,
            prix_negociable: item.prix_negociable
          };
        });
        setListings(mapped);
      })
      .catch(err => console.error("Erreur chargement annonces :", err))
      .finally(() => setLoading(false));
  }, [queryParam, category, communes, priceMin, priceMax, sort, proOnly]);

  // Synchronize query when it changes, reset pagination
  useEffect(() => {
    setVisibleCount(9);
  }, [queryParam, category, communes, conds, deliveries, dateLimit, priceMin, priceMax, proOnly]);

  // Helpers
  const formatPrix = (n) => n.toLocaleString("fr-FR").replace(/\u202f|,/g, " ") + " FCFA";

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

  const passesFilters = (item, skipField = null) => {
    // Search text query
    if (queryParam) {
      const q = queryParam.toLowerCase();
      const inTitle = item.titre.toLowerCase().includes(q);
      const inCat = item.cat.toLowerCase().includes(q);
      const inCommune = item.commune.toLowerCase().includes(q);
      if (!inTitle && !inCat && !inCommune) return false;
    }

    // Category
    if (skipField !== 'category' && category !== 'Toutes') {
      const catNorm = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const itemCatNorm = item.cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!itemCatNorm.includes(catNorm) && !catNorm.includes(itemCatNorm)) return false;
    }

    // Commune
    if (skipField !== 'commune' && communes.length > 0 && !communes.includes(item.commune)) {
      return false;
    }

    // Condition
    if (skipField !== 'condition' && conds.length > 0 && !conds.includes(item.cond)) {
      return false;
    }

    // Delivery mode
    if (skipField !== 'delivery' && deliveries.length > 0 && !deliveries.some(d => item.delivery.includes(d))) {
      return false;
    }

    // Price range
    if (skipField !== 'price') {
      const min = parseInt(priceMin, 10);
      const max = parseInt(priceMax, 10);
      if (!isNaN(min) && item.prix < min) return false;
      if (!isNaN(max) && item.prix > max) return false;
    }

    // Date
    if (skipField !== 'date' && dateLimit !== 'Toutes' && item.hours > parseInt(dateLimit, 10)) {
      return false;
    }

    // Pro filter
    if (skipField !== 'pro' && proOnly && !item.vendeur_est_pro) {
      return false;
    }

    // Negotiable filter
    if (skipField !== 'negotiable' && negotiableOnly && !item.prix_negociable) {
      return false;
    }

    return true;
  };

  // Compute counts for options using loaded listings
  const countFor = (pred, skipField) => {
    return listings.filter(it => passesFilters(it, skipField) && pred(it)).length;
  };

  // Dynamic values
  const filteredSortedItems = useMemo(() => {
    let result = listings.filter(it => passesFilters(it, null));
    
    // Sort client-side filter
    if (sort === "prix-asc") {
      result.sort((a, b) => a.prix - b.prix);
    } else if (sort === "prix-desc") {
      result.sort((a, b) => b.prix - a.prix);
    } else if (sort === "recent") {
      result.sort((a, b) => a.hours - b.hours);
    }
    
    return result;
  }, [listings, sort, queryParam, category, communes, conds, deliveries, dateLimit, priceMin, priceMax, proOnly, negotiableOnly]);

  const visibleItems = useMemo(() => {
    return filteredSortedItems.slice(0, visibleCount);
  }, [filteredSortedItems, visibleCount]);

  // Toggle helpers
  const toggleCommune = (c) => {
    setCommunes(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleCond = (c) => {
    setConds(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleDelivery = (d) => {
    setDeliveries(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  // Active filter chips
  const activeChips = useMemo(() => {
    const list = [];
    if (category !== "Toutes") {
      list.push({ type: 'category', label: category, onRemove: () => setCategory('Toutes') });
    }
    communes.forEach(c => {
      list.push({ type: 'commune', label: c, onRemove: () => toggleCommune(c) });
    });
    conds.forEach(c => {
      const opt = CONDITIONS.find(x => x.value === c);
      list.push({ type: 'cond', label: opt?.label || c, onRemove: () => toggleCond(c) });
    });
    deliveries.forEach(d => {
      const label = d === 'livraison' ? 'Avec livraison' : 'Main propre';
      list.push({ type: 'delivery', label, onRemove: () => toggleDelivery(d) });
    });
    if (priceMin) {
      list.push({ type: 'priceMin', label: `≥ ${parseInt(priceMin, 10).toLocaleString()} FCFA`, onRemove: () => setPriceMin('') });
    }
    if (priceMax) {
      list.push({ type: 'priceMax', label: `≤ ${parseInt(priceMax, 10).toLocaleString()} FCFA`, onRemove: () => setPriceMax('') });
    }
    if (dateLimit !== "Toutes") {
      const opt = DATE_OPTIONS.find(x => x.value === dateLimit);
      list.push({ type: 'date', label: opt?.label || dateLimit, onRemove: () => setDateLimit('Toutes') });
    }
    if (proOnly) {
      list.push({ type: 'pro', label: 'Pros uniquement', onRemove: () => setProOnly(false) });
    }
    if (negotiableOnly) {
      list.push({ type: 'negotiable', label: 'Prix négociable', onRemove: () => setNegotiableOnly(false) });
    }
    return list;
  }, [category, communes, conds, deliveries, priceMin, priceMax, dateLimit, proOnly, negotiableOnly]);

  const resetAllFilters = () => {
    setCategory('Toutes');
    setCommunes([]);
    setConds([]);
    setDeliveries([]);
    setDateLimit('Toutes');
    setPriceMin('');
    setPriceMax('');
    setProOnly(false);
    setNegotiableOnly(false);
    setVisibleCount(9);
    setSearchParams({});
  };

  return (
    <div className="sugu-search-page">
      <div className="container" style={{ paddingTop: '20px' }}>
        
        {/* Breadcrumb */}
        <div className="sugu-search-page__breadcrumb">
          <Link to="/" className="sugu-link">Accueil</Link>
          <span>›</span>
          <span className="sugu-link">Recherche</span>
          {queryParam && (
            <>
              <span>›</span>
              <span style={{ color: 'var(--sugu-ink-soft)', fontWeight: 600 }}>« {queryParam} »</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="sugu-search-page__title">
          {queryParam ? `Résultats pour « ${queryParam} »` : 'Toutes les annonces'}
        </h1>

        <div className="sugu-search-page__layout">

          {/* ================= FILTERS PANEL ================= */}
          <aside className={`sugu-search-page__filters ${drawerOpen ? 'open' : ''}`}>
            <div className="sugu-search-page__filters-inner">
              
              <div className="sugu-search-page__filters-header">
                <span className="sugu-search-page__filters-title">Filtres</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" className="sugu-search-page__filters-reset" onClick={resetAllFilters}>
                    Réinitialiser
                  </button>
                  <button type="button" className="sugu-search-page__filters-close" onClick={() => setDrawerOpen(false)}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="sugu-search-page__filter-section">
                <div className="sugu-search-page__filter-label">Catégorie</div>
                <div className="sugu-search-page__filter-list" style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {CATEGORIES.map(c => {
                    const isSelected = category === c;
                    const count = c === "Toutes" 
                      ? countFor(() => true, "category")
                      : countFor(it => it.cat === c, "category");
                    
                    return (
                      <div key={c} className="sugu-search-page__option" onClick={() => setCategory(c)}>
                        <span className="sugu-search-page__radio" style={{ borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)' }}>
                          <span className="sugu-search-page__radio-inner" style={{ backgroundColor: isSelected ? 'var(--sugu-primary)' : 'transparent' }} />
                        </span>
                        <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--sugu-ink)' : 'inherit' }}>{c}</span>
                        <span style={{ fontFamily: 'var(--sugu-font-mono)', fontSize: '11px', color: 'var(--sugu-ink-faint)' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pro Filter */}
              <div className="sugu-search-page__filter-section">
                <div className="sugu-search-page__filter-label">Type de vendeur</div>
                <div className="sugu-search-page__filter-list">
                  <div className="sugu-search-page__option" onClick={() => setProOnly(!proOnly)}>
                    <span className="sugu-search-page__checkbox" style={{
                      borderColor: proOnly ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                      backgroundColor: proOnly ? 'var(--sugu-primary)' : 'transparent'
                    }}>{proOnly ? '✓' : ''}</span>
                    <span style={{ flex: 1, fontWeight: proOnly ? 600 : 400, color: proOnly ? 'var(--sugu-ink)' : 'inherit' }}>Professionnels abonnés (Pro)</span>
                  </div>
                </div>
              </div>

              {/* Négociabilité */}
              <div className="sugu-search-page__filter-section">
                <div className="sugu-search-page__filter-label">Options de prix</div>
                <div className="sugu-search-page__filter-list">
                  <div className="sugu-search-page__option" onClick={() => setNegotiableOnly(prev => !prev)}>
                    <span className="sugu-search-page__checkbox" style={{
                      borderColor: negotiableOnly ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                      backgroundColor: negotiableOnly ? 'var(--sugu-primary)' : 'transparent'
                    }}>{negotiableOnly ? '✓' : ''}</span>
                    <span style={{ flex: 1, fontWeight: negotiableOnly ? 600 : 400, color: negotiableOnly ? 'var(--sugu-ink)' : 'inherit' }}>Prix négociable</span>
                    <span style={{ fontFamily: 'var(--sugu-font-mono)', fontSize: '11px', color: 'var(--sugu-ink-faint)' }}>
                      {countFor(it => it.prix_negociable === 1 || it.prix_negociable === true, "negotiable")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commune */}
              <div className="sugu-search-page__filter-section">
                <div className="sugu-search-page__filter-label">Ville / Commune</div>
                <div className="sugu-search-page__filter-list" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {COMMUNES_LIST.map(c => {
                    const isSelected = communes.includes(c);
                    const count = countFor(it => it.commune === c, "commune");
                    
                    return (
                      <div key={c} className="sugu-search-page__option" onClick={() => toggleCommune(c)}>
                        <span className="sugu-search-page__checkbox" style={{
                          borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                          backgroundColor: isSelected ? 'var(--sugu-primary)' : 'transparent'
                        }}>{isSelected ? '✓' : ''}</span>
                        <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--sugu-ink)' : 'inherit' }}>{c}</span>
                        <span style={{ fontFamily: 'var(--sugu-font-mono)', fontSize: '11px', color: 'var(--sugu-ink-faint)' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price range */}
              <div className="sugu-search-page__filter-section">
                <div className="sugu-search-page__filter-label">Prix (FCFA)</div>
                <div className="sugu-search-page__price-range">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sugu-search-page__price-input"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <span style={{ color: 'var(--sugu-ink-faint)' }}>—</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sugu-search-page__price-input"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
              </div>

              {/* Condition */}
              <div className="sugu-search-page__filter-section">
                <div className="sugu-search-page__filter-label">État</div>
                <div className="sugu-search-page__filter-list">
                  {CONDITIONS.map(c => {
                    const isSelected = conds.includes(c.value);
                    return (
                      <div key={c.value} className="sugu-search-page__option" onClick={() => toggleCond(c.value)}>
                        <span className="sugu-search-page__checkbox" style={{
                          borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                          backgroundColor: isSelected ? 'var(--sugu-primary)' : 'transparent'
                        }}>{isSelected ? '✓' : ''}</span>
                        <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--sugu-ink)' : 'inherit' }}>{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery */}
              <div className="sugu-search-page__filter-section">
                <div className="sugu-search-page__filter-label">Mode de livraison</div>
                <div className="sugu-search-page__filter-list">
                  {LIVRAISONS.map(d => {
                    const isSelected = deliveries.includes(d.value);
                    return (
                      <div key={d.value} className="sugu-search-page__option" onClick={() => toggleDelivery(d.value)}>
                        <span className="sugu-search-page__checkbox" style={{
                          borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)',
                          backgroundColor: isSelected ? 'var(--sugu-primary)' : 'transparent'
                        }}>{isSelected ? '✓' : ''}</span>
                        <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--sugu-ink)' : 'inherit' }}>{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date limit */}
              <div className="sugu-search-page__filter-section">
                <div className="sugu-search-page__filter-label">Date de publication</div>
                <div className="sugu-search-page__filter-list">
                  {DATE_OPTIONS.map(d => {
                    const isSelected = dateLimit === d.value;
                    return (
                      <div key={d.value} className="sugu-search-page__option" onClick={() => setDateLimit(d.value)}>
                        <span className="sugu-search-page__radio" style={{ borderColor: isSelected ? 'var(--sugu-primary)' : 'var(--sugu-border)' }}>
                          <span className="sugu-search-page__radio-inner" style={{ backgroundColor: isSelected ? 'var(--sugu-primary)' : 'transparent' }} />
                        </span>
                        <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--sugu-ink)' : 'inherit' }}>{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="button" className="sugu-search-page__filters-apply" onClick={() => setDrawerOpen(false)}>
                Voir {filteredSortedItems.length} résultats
              </button>

            </div>
          </aside>

          {/* ================= RESULTS PANEL ================= */}
          <div className="sugu-search-page__content">
            
            {/* Toolbar */}
            <div className="sugu-search-page__toolbar">
              <div className="sugu-search-page__results-count">
                <b>{filteredSortedItems.length}</b> annonce{filteredSortedItems.length > 1 ? 's' : ''} trouvée{filteredSortedItems.length > 1 ? 's' : ''}
              </div>
              <div className="sugu-search-page__sorting">
                <span className="sugu-search-page__sorting-label hide-mobile">Trier par</span>
                <div className="sugu-search-page__sort-select-wrapper">
                  <select className="sugu-search-page__sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="pertinence">Pertinence</option>
                    <option value="prix-asc">Prix croissant</option>
                    <option value="prix-desc">Prix décroissant</option>
                    <option value="recent">Plus récent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Chips */}
            {activeChips.length > 0 && (
              <div className="sugu-search-page__chips">
                {activeChips.map(chip => (
                  <button key={chip.type + chip.label} type="button" className="sugu-search-page__chip" onClick={chip.onRemove}>
                    {chip.label} <span>✕</span>
                  </button>
                ))}
              </div>
            )}

            {/* Results Grid */}
            {filteredSortedItems.length > 0 ? (
              <>
                <div className="sugu-search-page__grid">
                  {visibleItems.map(item => {
                    let parsedSpecs = {};
                    if (item.caracteristiques) {
                      try {
                        parsedSpecs = typeof item.caracteristiques === 'string' ? JSON.parse(item.caracteristiques) : item.caracteristiques;
                      } catch (e) {}
                    }
                    const isJob = !!parsedSpecs.type_contrat;

                    return (
                      <ListingCard
                        key={item.id}
                        sponsorise={item.vendeur_est_pro === 1}
                        annonce={{
                          id: item.id,
                          titre: item.titre,
                          prix: item.prix,
                          image: item.cover_url,
                          image_label: item.cover_url ? undefined : '[ photo ]',
                          commune: item.commune,
                          ville: item.ville || "Abidjan",
                          etat: item.cond,
                          badge: isJob ? { label: parsedSpecs.type_contrat, tone: 'neuf' } : undefined,
                          statut: item.statut || "active",
                          publie_depuis: formatTime(item.created_at),
                          isEmploi: isJob,
                          type_contrat: parsedSpecs.type_contrat,
                          prix_negociable: item.prix_negociable
                        }}
                      />
                    );
                  })}
                </div>

                {filteredSortedItems.length > visibleCount && (
                  <div className="sugu-search-page__load-more">
                    <button type="button" className="sugu-search-page__load-more-btn" onClick={() => setVisibleCount(v => v + 6)}>
                      Voir plus d'annonces ({filteredSortedItems.length - visibleCount})
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="sugu-search-page__empty">
                <div className="sugu-search-page__empty-icon">🔎</div>
                <div className="sugu-search-page__empty-title">Aucune annonce ne correspond</div>
                <div className="sugu-search-page__empty-desc">
                  Essayez d'élargir votre recherche : retirez un filtre, augmentez la fourchette de prix ou ajoutez d'autres communes.
                </div>
                <button type="button" className="sugu-search-page__empty-btn" onClick={resetAllFilters}>
                  Élargir la recherche
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Mobile FAB and Drawer Backdrop */}
      <div className={`sugu-search-page__backdrop ${drawerOpen ? 'show' : ''}`} onClick={() => setDrawerOpen(false)} />
      <button type="button" className="sugu-search-page__fab" onClick={() => setDrawerOpen(true)}>
        <span>⚙</span> Filtres
        {activeChips.length > 0 && (
          <span className="sugu-search-page__fab-badge">{activeChips.length}</span>
        )}
      </button>

    </div>
  );
}
