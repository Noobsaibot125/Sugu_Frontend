import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

/**
 * PopupLimiteAnnonces — modal displayed when user reaches their active ad quota.
 * Props:
 *   isOpen   {boolean}
 *   onClose  {() => void}
 *   count    {number}  — current active ads count
 *   quota    {number}  — max allowed
 *   subName  {string}  — subscription name
 */
export default function PopupLimiteAnnonces({ isOpen, onClose, count = 5, quota = 5, subName = 'Particulier Gratuit' }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handlePasser = () => {
    onClose();
    navigate('/passer-pro');
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(15, 12, 10, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999999, padding: '20px', boxSizing: 'border-box'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FAF9F6',
          maxWidth: '460px', width: '100%',
          borderRadius: '24px',
          boxShadow: '0 24px 56px rgba(0,0,0,0.22)',
          overflow: 'hidden',
          fontFamily: 'var(--sugu-font-body, Inter, sans-serif)'
        }}
      >
        {/* Header gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #1F1A15 0%, #3A2E24 100%)',
          padding: '32px 32px 24px 32px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.12)', border: 'none',
              color: '#fff', width: '32px', height: '32px',
              borderRadius: '50%', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >×</button>

          {/* Icon */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(224, 86, 36, 0.18)',
            border: '2px solid rgba(224, 86, 36, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '32px'
          }}>
            🔒
          </div>

          <h2 style={{
            color: '#FFFFFF', fontSize: '21px', fontWeight: 800,
            margin: '0 0 8px 0',
            fontFamily: 'var(--sugu-font-heading, Inter, sans-serif)'
          }}>
            Limite d'annonces atteinte
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
            Vous avez atteint le maximum d'annonces actives autorisées avec votre offre <b style={{ color: '#E29E3E' }}>{subName}</b>.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px 32px 32px' }}>
          {/* Progress bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sugu-ink, #211D18)' }}>Annonces actives</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#E25A38' }}>{count} / {quota}</span>
            </div>
            <div style={{
              height: '10px', borderRadius: '999px',
              background: '#EDE8E0', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((count / quota) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #E25A38, #E29E3E)',
                borderRadius: '999px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>

          {/* Info note */}
          <div style={{
            background: '#FFF7E6',
            border: '1px solid #FFE4B5',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '24px',
            display: 'flex', gap: '10px', alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: '13px', color: '#7A5500', margin: 0, lineHeight: 1.5 }}>
              Pour publier de nouvelles annonces, <b>supprimez une annonce active</b> depuis votre tableau de bord, ou <b>passez à une offre supérieure</b> pour bénéficier de plus d'annonces simultanées.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePasser}
              style={{
                width: '100%', padding: '14px',
                background: 'var(--sugu-primary, #E05624)', border: 'none',
                color: '#fff', borderRadius: '12px', fontWeight: 700,
                fontSize: '15px', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(224, 86, 36, 0.3)',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.target.style.opacity = '0.9'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              🚀 Passer à l'offre Pro
            </button>
            <button
              type="button"
              onClick={() => { onClose(); navigate('/tableau-de-bord?tab=listings'); }}
              style={{
                width: '100%', padding: '13px',
                background: '#FFFFFF', border: '1px solid #E0D9CE',
                color: 'var(--sugu-ink, #211D18)', borderRadius: '12px', fontWeight: 600,
                fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = '#F5F0E8'}
              onMouseLeave={e => e.target.style.background = '#FFFFFF'}
            >
              Gérer mes annonces
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
