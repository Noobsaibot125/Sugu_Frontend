import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import imgWave from '../assets/Wave.png';
import imgOrange from '../assets/Orange.png';
import imgMTN from '../assets/MTN.png';

export default function Abonnements() {
  const { user, mettreAJourUser } = useAuth();
  const navigate = useNavigate();

  const [abonnements, setAbonnements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [moyenPaiement, setMoyenPaiement] = useState('Wave');
  const [telephonePaiement, setTelephonePaiement] = useState(user?.telephone?.replace(/^\+225/, '') || '');
  const [payant, setPayant] = useState(false);
  const [erreur, setErreur] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeSub, setActiveSub] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/connexion');
      return;
    }

    async function chargerOffres() {
      try {
        const res = await client.get('/abonnements');
        setAbonnements(res.data);

        const activeRes = await client.get('/abonnements/actif');
        setActiveSub(activeRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setChargement(false);
      }
    }
    chargerOffres();
  }, [user, navigate]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setPayant(true);

    try {
      const res = await client.post('/abonnements/souscrire', {
        abonnementId: selectedPlan.id,
        moyenPaiement: moyenPaiement
      });
      
      mettreAJourUser(res.data.user);
      setSuccess(true);
      setTimeout(() => {
        navigate('/tableau-de-bord?tab=abonnement');
      }, 2000);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors du traitement du paiement.');
    } finally {
      setPayant(false);
    }
  };

  if (chargement) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: 'var(--sugu-ink-soft)', fontWeight: 600 }}>Chargement des offres en cours...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const plansDetails = {
    'Basique': {
      color: 'var(--sugu-ink)',
      bg: '#FFF',
      badge: null,
      features: [
        '📈 20 annonces actives simultanées',
        '🚀 2 mises en avant incluses par mois',
        '🏪 Page vitrine simple pour votre boutique',
        '📊 Statistiques de vues basiques',
        '🎥 5 Vlogs tendances par jour'
      ]
    },
    'Premium': {
      color: 'var(--sugu-primary)',
      bg: 'color-mix(in srgb, var(--sugu-primary) 5%, #FFF)',
      badge: 'Recommandé 🔥',
      border: '2px solid var(--sugu-primary)',
      features: [
        '📈 50 annonces actives simultanées',
        '🚀 8 mises en avant incluses par mois',
        '🏪 E-Vitrine entièrement personnalisable',
        '📊 Statistiques avancées (conversion, contacts)',
        '🛠️ Outils de gestion en masse des annonces',
        '🎥 10 Vlogs tendances par jour'
      ]
    },
    'Sur-mesure': {
      color: '#B0791C',
      bg: '#211D18',
      textColor: '#FFF',
      badge: 'Ultra-Visibilité 👑',
      features: [
        '📈 Annonces actives illimitées',
        '🚀 Mises en avant illimitées',
        '🏪 Vitrine VIP avec badge pro prioritaire',
        '📊 Statistiques complètes + export CSV',
        '📞 Support technique prioritaire 24/7',
        '🔄 Importation automatique par flux',
        '🎥 30 Vlogs tendances par jour'
      ]
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--sugu-bg-soft)' }}>
      <Header />
      <main style={{ flex: 1, padding: '60px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          
          <h1 style={{ fontFamily: 'var(--sugu-font-heading)', fontSize: '32px', fontWeight: 900, color: 'var(--sugu-ink)', marginBottom: '12px' }}>
            Tarifs simples et transparents pour les Pros 🚀
          </h1>
          <p style={{ color: 'var(--sugu-ink-soft)', fontSize: '16px', maxWidth: '600px', margin: '0 auto 48px auto', lineHeight: 1.6 }}>
            Choisissez le forfait qui correspond aux besoins de votre activité. Boostez vos ventes en un clic.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'stretch', marginBottom: '40px' }}>
            {abonnements.map((plan) => {
              const details = plansDetails[plan.nom] || { bg: '#FFF', features: [plan.description] };
              return (
                <div 
                  key={plan.id}
                  style={{
                    background: details.bg,
                    color: details.textColor || 'var(--sugu-ink)',
                    borderRadius: '20px',
                    padding: '40px 30px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
                    border: details.border || '1.5px solid var(--sugu-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    textAlign: 'left',
                    transition: 'transform 0.2s',
                  }}
                  className="sugu-pricing-card"
                >
                  {details.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      background: plan.nom === 'Sur-mesure' ? '#E8A93B' : 'var(--sugu-primary)',
                      color: plan.nom === 'Sur-mesure' ? '#4A3208' : '#FFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '30px',
                      textTransform: 'uppercase'
                    }}>
                      {details.badge}
                    </span>
                  )}

                  <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>{plan.nom}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '24px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 900, color: details.textColor ? '#FFF' : 'var(--sugu-ink)' }}>
                      {parseFloat(plan.prix).toLocaleString('fr-FR')}
                    </span>
                    <span style={{ fontSize: '14px', color: details.textColor ? 'rgba(255,255,255,0.7)' : 'var(--sugu-ink-soft)', marginLeft: '6px' }}>
                      FCFA / mois
                    </span>
                  </div>

                  <hr style={{ border: 0, borderTop: '1px solid var(--sugu-border)', margin: '0 0 24px 0', opacity: details.textColor ? 0.1 : 0.6 }} />

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {details.features.map((feat, idx) => (
                      <li key={idx} style={{ fontSize: '14px', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {(() => {
                    const isActive = activeSub && activeSub.abonnement_id === plan.id;
                    return (
                      <Button 
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isActive}
                        style={{
                          width: '100%',
                          background: isActive ? '#A09D99' : plan.nom === 'Sur-mesure' ? '#E8A93B' : plan.nom === 'Premium' ? 'var(--sugu-primary)' : 'var(--sugu-ink)',
                          color: isActive ? '#FFF' : plan.nom === 'Sur-mesure' ? '#4A3208' : '#FFF',
                          border: 'none',
                          fontWeight: 'bold',
                          cursor: isActive ? 'not-allowed' : 'pointer',
                          opacity: isActive ? 0.75 : 1
                        }}
                        size="lg"
                      >
                        {isActive ? 'Forfait actuel ✓' : 'Sélectionner'}
                      </Button>
                    );
                  })()}
                </div>
              );
            })}
          </div>

        </div>

        {/* Payment / Simulated Checkout Modal */}
        {checkoutOpen && selectedPlan && (
          <div className="sugu-modal-backdrop" onClick={() => setCheckoutOpen(false)} style={{ zIndex: 1000 }}>
            <div className="sugu-modal-content" style={{ maxWidth: '460px', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontFamily: 'var(--sugu-font-heading)', fontWeight: 800, fontSize: '20px', color: 'var(--sugu-ink)' }}>
                  💳 Finaliser votre abonnement
                </span>
                <button type="button" className="sugu-modal-close" style={{ width: '32px', height: '32px', fontSize: '16px' }} onClick={() => setCheckoutOpen(false)}>
                  ✕
                </button>
              </div>

              {success ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎉</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sugu-primary)', marginBottom: '8px' }}>Abonnement activé !</h3>
                  <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)' }}>
                    Félicitations, vous êtes maintenant membre Pro. Redirection vers votre tableau de bord...
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {erreur && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale">{erreur}</p>}

                  <div style={{ background: 'var(--sugu-bg-soft)', padding: '16px', borderRadius: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', marginBottom: '4px' }}>Offre sélectionnée</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--sugu-ink)' }}>
                      Pro {selectedPlan.nom} — {parseFloat(selectedPlan.prix).toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>

                  <div>
                    <label className="sugu-auth-champ-label" style={{ display: 'block', marginBottom: '8px' }}>Moyen de paiement mobile</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {['Wave', 'Orange Money', 'MTN'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setMoyenPaiement(method)}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '12px',
                            border: moyenPaiement === method ? '2px solid var(--sugu-primary)' : '1.5px solid var(--sugu-border)',
                            background: moyenPaiement === method ? 'color-mix(in srgb, var(--sugu-primary) 8%, #FFF)' : '#FFF',
                            fontWeight: moyenPaiement === method ? 'bold' : 'normal',
                            color: moyenPaiement === method ? 'var(--sugu-primary)' : 'var(--sugu-ink)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <img 
                            src={method === 'Wave' ? imgWave : method === 'Orange Money' ? imgOrange : imgMTN} 
                            alt={method} 
                            style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '4px' }} 
                          />
                          <span>{method === 'Wave' ? 'Wave' : method === 'Orange Money' ? 'Orange' : 'MTN'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="sugu-auth-champ-label">Numéro de téléphone mobile *</span>
                    <div className="sugu-auth-champ-compose">
                      <span className="sugu-auth-champ-compose__prefixe">🇨🇮 +225</span>
                      <input
                        required
                        inputMode="tel"
                        placeholder="07 00 00 00 00"
                        value={telephonePaiement}
                        onChange={(e) => setTelephonePaiement(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" size="lg" disabled={payant} style={{ marginTop: '10px' }}>
                    {payant ? 'Paiement en cours...' : `Payer ${parseFloat(selectedPlan.prix).toLocaleString('fr-FR')} FCFA`}
                  </Button>
                </form>
              )}

            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
