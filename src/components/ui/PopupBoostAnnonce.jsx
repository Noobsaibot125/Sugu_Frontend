import { useState } from 'react';
import { createPortal } from 'react-dom';
import waveLogo from '../../assets/Wave.png';
import mtnLogo from '../../assets/MTN.png';
import orangeLogo from '../../assets/Orange.png';

const BOOST_OPTIONS = [
  {
    id: 'a_la_une',
    icon: '👑',
    title: 'À la une',
    description: 'Votre annonce apparaît en première position des résultats de recherche',
    color: '#D4A017',
    bgLight: '#FFFBF0',
    border: '#F5D87A',
    plans: [
      { days: 7,  price: 7000,  label: '7 jours' },
      { days: 30, price: 11000, label: '30 jours', badge: 'Populaire 🔥' }
    ]
  },
  {
    id: 'remontee',
    icon: '⬆️',
    title: 'Remontée automatique',
    description: 'Votre annonce est automatiquement remontée en tête de liste chaque jour',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    border: '#BFDBFE',
    plans: [
      { days: 7,  price: 4000,  label: '7 jours' },
      { days: 30, price: 9000,  label: '30 jours', badge: 'Recommandé ⭐' },
      { days: 56, price: 6000,  label: '8 semaines' }
    ]
  },
  {
    id: 'urgente',
    icon: '🔴',
    title: 'Annonce urgente',
    description: 'Badge "Urgent" visible sur votre annonce pour attirer plus de clics',
    color: '#DC2626',
    bgLight: '#FFF5F5',
    border: '#FCA5A5',
    plans: [
      { days: 7,  price: 2000,  label: '7 jours' },
      { days: 30, price: 5000,  label: '30 jours' }
    ]
  }
];

const OPERATORS = [
  { id: 'wave',   label: 'Wave',   logo: waveLogo,   color: '#1B98E0' },
  { id: 'mtn',    label: 'MTN',    logo: mtnLogo,    color: '#FFC107' },
  { id: 'orange', label: 'Orange', logo: orangeLogo, color: '#FF6600' }
];

/**
 * PopupBoostAnnonce — modal to boost a specific listing from the dashboard.
 * Props:
 *   annonce     { id, title }
 *   isOpen      boolean
 *   onClose     () => void
 *   onSuccess   (boostResult) => void
 *   onBoost     (id, boost_type, duration_days, operator, phone) => Promise
 */
export default function PopupBoostAnnonce({ annonce, isOpen, onClose, onBoost }) {
  const [selectedBoostId, setSelectedBoostId] = useState(null);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(null);
  const [step, setStep] = useState('boost'); // 'boost' | 'payment' | 'success'
  const [operator, setOperator] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedBoost = BOOST_OPTIONS.find(b => b.id === selectedBoostId);
  const selectedPlan = selectedBoost && selectedPlanIdx !== null ? selectedBoost.plans[selectedPlanIdx] : null;
  const totalPrice = selectedPlan?.price || 0;

  const handleClose = () => {
    setStep('boost');
    setSelectedBoostId(null);
    setSelectedPlanIdx(null);
    setOperator(null);
    setPhone('');
    setError('');
    onClose();
  };

  const handleProceedToPayment = () => {
    if (!selectedBoost || selectedPlan === null) {
      setError('Veuillez choisir une option et une durée.');
      return;
    }
    setError('');
    setStep('payment');
  };

  const handlePay = async () => {
    if (!operator) { setError('Sélectionnez votre opérateur.'); return; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) { setError('Entrez un numéro valide.'); return; }
    setError('');
    setLoading(true);
    try {
      await onBoost(annonce.id, selectedBoost.id, selectedPlan.days, operator, phone.trim());
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du paiement. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !annonce) return null;

  return createPortal(
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(15,12,10,0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999999, padding: '20px', boxSizing: 'border-box'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FAF9F6',
          width: '100%', maxWidth: step === 'success' ? '420px' : '640px',
          maxHeight: '90vh', overflowY: 'auto',
          borderRadius: '24px',
          boxShadow: '0 24px 56px rgba(0,0,0,0.22)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'var(--sugu-font-body, Inter, sans-serif)'
        }}
      >
        {/* ========== SUCCESS ========== */}
        {step === 'success' && (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 12px', color: 'var(--sugu-ink, #211D18)' }}>
              Annonce boostée !
            </h2>
            <p style={{ color: 'var(--sugu-ink-soft, #6B5F52)', fontSize: '14px', margin: '0 0 8px', lineHeight: 1.6 }}>
              <b>« {annonce.title} »</b> est désormais boostée avec l'option{' '}
              <span style={{ color: selectedBoost?.color, fontWeight: 700 }}>
                {selectedBoost?.icon} {selectedBoost?.title}
              </span>
              {' '}pendant <b>{selectedPlan?.days} jours</b>.
            </p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '28px' }}>
              Votre annonce bénéficiera d'une visibilité accrue dès maintenant.
            </p>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '13px 32px', borderRadius: '12px',
                background: 'var(--sugu-primary, #E05624)', border: 'none',
                color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer'
              }}
            >
              Fermer
            </button>
          </div>
        )}

        {/* ========== PAYMENT ========== */}
        {step === 'payment' && (
          <>
            {/* Header */}
            <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #EADFCE', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" onClick={() => setStep('boost')} style={{ background: '#F0EBE1', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--sugu-ink, #211D18)' }}>Paiement Mobile Money</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--sugu-ink-soft, #6B5F52)' }}>
                  {selectedBoost?.icon} {selectedBoost?.title} · {selectedPlan?.days} jours · <b style={{ color: 'var(--sugu-primary, #E05624)' }}>{totalPrice.toLocaleString('fr-FR')} FCFA</b>
                </p>
              </div>
              <button type="button" onClick={handleClose} style={{ background: '#F0EBE1', border: 'none', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#666' }}>×</button>
            </div>

            <div style={{ padding: '24px 28px 28px' }}>
              {/* Operator selection */}
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '12px', marginTop: 0 }}>Choisissez votre opérateur</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                {OPERATORS.map(op => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperator(op.id)}
                    style={{
                      padding: '14px 8px',
                      borderRadius: '14px',
                      border: `2px solid ${operator === op.id ? op.color : '#E0D9CE'}`,
                      background: operator === op.id ? op.color + '15' : '#FFF',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: operator === op.id ? `0 0 0 3px ${op.color}22` : 'none'
                    }}
                  >
                    <img src={op.logo} alt={op.label} style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: operator === op.id ? op.color : '#444' }}>{op.label}</span>
                  </button>
                ))}
              </div>

              {/* Phone input */}
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px', marginTop: 0 }}>Numéro de téléphone</p>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#999', fontWeight: 600 }}>🇨🇮 +225</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="XX XX XX XX XX"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 14px 14px 90px',
                    borderRadius: '12px', border: '1.5px solid #D5CCBF',
                    fontSize: '16px', fontWeight: 600, letterSpacing: '0.5px',
                    outline: 'none', background: '#FFFFFF',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: '#FFF1F0', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#C53030', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                style={{
                  width: '100%', padding: '15px',
                  background: loading ? '#ccc' : 'var(--sugu-primary, #E05624)',
                  border: 'none', color: '#fff', borderRadius: '12px',
                  fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(224, 86, 36, 0.3)'
                }}
              >
                {loading ? (
                  <><span style={{ width: '16px', height: '16px', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'sugu-spin 0.8s linear infinite', display: 'inline-block' }} /> Traitement...</>
                ) : (
                  <>💳 Payer {totalPrice.toLocaleString('fr-FR')} FCFA et Booster</>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: '11px', color: '#999', marginTop: '12px', marginBottom: 0 }}>
                🔒 Paiement sécurisé — Aucun remboursement après activation
              </p>
            </div>
          </>
        )}

        {/* ========== BOOST SELECTION ========== */}
        {step === 'boost' && (
          <>
            {/* Header */}
            <div style={{ position: 'sticky', top: 0, background: '#FAF9F6', zIndex: 10, padding: '22px 28px 16px', borderBottom: '1px solid #EADFCE', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--sugu-ink, #211D18)', fontFamily: 'var(--sugu-font-heading, Inter)' }}>
                  ⚡ Booster l'annonce
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--sugu-ink-soft, #6B5F52)', maxWidth: '360px' }}>
                  <b style={{ color: 'var(--sugu-ink, #211D18)' }}>« {annonce.title} »</b> — Choisissez comment augmenter sa visibilité
                </p>
              </div>
              <button type="button" onClick={handleClose} style={{ background: '#F0EBE1', border: 'none', width: '34px', height: '34px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '12px' }}>×</button>
            </div>

            {/* Boost cards */}
            <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {BOOST_OPTIONS.map(boost => {
                const isSelected = selectedBoostId === boost.id;
                return (
                  <div
                    key={boost.id}
                    style={{
                      borderRadius: '16px',
                      border: `2px solid ${isSelected ? boost.color : '#E8E0D4'}`,
                      background: isSelected ? boost.bgLight : '#FFFFFF',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? `0 4px 16px ${boost.color}22` : 'none'
                    }}
                  >
                    {/* Card header */}
                    <button
                      type="button"
                      onClick={() => { setSelectedBoostId(boost.id); setSelectedPlanIdx(null); }}
                      style={{
                        width: '100%', padding: '16px 18px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: boost.bgLight, border: `1.5px solid ${boost.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', flexShrink: 0
                      }}>{boost.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: isSelected ? boost.color : 'var(--sugu-ink, #211D18)', marginBottom: '2px' }}>{boost.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--sugu-ink-soft, #6B5F52)', lineHeight: 1.4 }}>{boost.description}</div>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: `2px solid ${isSelected ? boost.color : '#D5CCBF'}`,
                        background: isSelected ? boost.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </button>

                    {/* Plan options (shown when selected) */}
                    {isSelected && (
                      <div style={{ padding: '0 18px 18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {boost.plans.map((plan, idx) => {
                          const isPlanSelected = selectedPlanIdx === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPlanIdx(idx)}
                              style={{
                                position: 'relative',
                                flex: '1', minWidth: '120px',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: `2px solid ${isPlanSelected ? boost.color : '#D5CCBF'}`,
                                background: isPlanSelected ? boost.color : '#F8F5F0',
                                color: isPlanSelected ? '#fff' : 'var(--sugu-ink, #211D18)',
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all 0.2s'
                              }}
                            >
                              {plan.badge && (
                                <div style={{
                                  position: 'absolute', top: '-10px', right: '10px',
                                  background: '#E25A38', color: '#fff',
                                  fontSize: '10px', fontWeight: 800,
                                  padding: '2px 8px', borderRadius: '99px'
                                }}>{plan.badge}</div>
                              )}
                              <div style={{ fontSize: '14px', fontWeight: 800 }}>{plan.price.toLocaleString('fr-FR')} FCFA</div>
                              <div style={{ fontSize: '12px', opacity: 0.85 }}>{plan.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {error && (
                <div style={{ padding: '10px 14px', background: '#FFF1F0', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#C53030', fontSize: '13px' }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #EADFCE', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                {selectedPlan ? (
                  <div>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--sugu-primary, #E05624)' }}>{totalPrice.toLocaleString('fr-FR')} FCFA</span>
                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>· {selectedPlan.days} jours</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: '#aaa' }}>Sélectionnez une option</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={!selectedPlan}
                style={{
                  padding: '13px 24px', borderRadius: '12px',
                  background: selectedPlan ? 'var(--sugu-primary, #E05624)' : '#D5CCBF',
                  border: 'none', color: '#fff', fontWeight: 700,
                  fontSize: '14px', cursor: selectedPlan ? 'pointer' : 'not-allowed',
                  boxShadow: selectedPlan ? '0 4px 12px rgba(224, 86, 36, 0.25)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Continuer →
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes sugu-spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}
