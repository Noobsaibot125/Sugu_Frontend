import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function BoutiqueDetail() {
  const { id } = useParams();
  const [boutique, setBoutique] = useState(null);
  const [listings, setListings] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function chargerBoutique() {
      try {
        const res = await client.get(`/boutiques/${id}`);
        setBoutique(res.data.boutique);
        setListings(res.data.listings);
      } catch (err) {
        setErreur('Boutique introuvable ou erreur de chargement.');
      } finally {
        setChargement(false);
      }
    }
    chargerBoutique();
  }, [id]);

  const formatPrix = (n) => (n || 0).toLocaleString("fr-FR") + " FCFA";

  if (chargement) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: 'var(--sugu-ink-soft)', fontWeight: 600 }}>Chargement de la vitrine...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (erreur || !boutique) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🏪</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sugu-ink)', marginBottom: '8px' }}>Vitrine introuvable</h3>
            <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', marginBottom: '16px' }}>{erreur || 'Cette boutique n\'existe pas ou a désactivé sa vitrine.'}</p>
            <Link to="/" style={{ color: 'var(--sugu-primary)', fontWeight: 'bold', textDecoration: 'none' }}>← Retourner à l'accueil</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--sugu-bg-soft)' }}>
      <Header />
      <main style={{ flex: 1, padding: '40px 20px' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Vitrine Header Card */}
          <div style={{ background: '#FFF', borderRadius: '16px', padding: '36px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'var(--sugu-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1.5px solid var(--sugu-border)', flexShrink: 0 }}>
              {boutique.logo ? (
                <img src={boutique.logo} alt={boutique.nom_boutique} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '32px' }}>🏪</span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontFamily: 'var(--sugu-font-heading)', fontSize: '26px', fontWeight: 800, color: 'var(--sugu-ink)', margin: 0 }}>
                  {boutique.nom_boutique}
                </h1>
                <span style={{ background: 'color-mix(in srgb, var(--sugu-primary) 10%, transparent)', color: 'var(--sugu-primary)', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '30px', textTransform: 'uppercase' }}>
                  ★ Boutique Pro
                </span>
              </div>

              <p style={{ color: 'var(--sugu-ink-soft)', fontSize: '14px', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                {boutique.description || 'Aucune description disponible pour cette boutique.'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--sugu-ink-soft)' }}>
                {boutique.horaires && <span>🕒 Horaires : <strong>{boutique.horaires}</strong></span>}
                {boutique.lien_externe && (
                  <span>🌐 Site Web : <a href={boutique.lien_externe.startsWith('http') ? boutique.lien_externe : `https://${boutique.lien_externe}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sugu-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                    {boutique.lien_externe}
                  </a></span>
                )}
                <span>📞 Contact : <strong>{boutique.vendeur_tel || 'Non précisé'}</strong></span>
              </div>
            </div>
          </div>

          {/* Listings List */}
          <h2 style={{ fontFamily: 'var(--sugu-font-heading)', fontSize: '20px', fontWeight: 800, color: 'var(--sugu-ink)', marginBottom: '20px' }}>
            Annonces de la boutique ({listings.length})
          </h2>

          {listings.length === 0 ? (
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '40px', textCenter: 'center', color: 'var(--sugu-ink-soft)', border: '1.5px solid var(--sugu-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
              Aucune annonce active en ligne pour le moment.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {listings.map((item) => (
                <Link key={item.id} to={`/annonce/${item.id}`} className="sugu-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="sugu-card__visual" style={{ background: '#EADFCE' }}>
                    <div className="sugu-card__pattern" />
                    {item.cover_url ? (
                      <img src={item.cover_url} alt={item.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                    ) : (
                      <span className="sugu-card__image-label">[ photo ]</span>
                    )}
                    <div className="sugu-card__badges">
                      <span className="sugu-card__badge sugu-card__badge--pro">★ Pro</span>
                    </div>
                  </div>
                  <div className="sugu-card__content">
                    <div className="sugu-card__title" style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.titre}</div>
                    <div className="sugu-card__price" style={{ color: 'var(--sugu-primary)', fontWeight: 'bold' }}>{formatPrix(item.prix)}</div>
                    <div className="sugu-card__meta" style={{ fontSize: '12px', color: 'var(--sugu-ink-soft)', marginTop: '6px' }}>📍 {item.commune || 'Abidjan'}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
