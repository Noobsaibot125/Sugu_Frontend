import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import imgWave from '../assets/Wave.png';

export default function PaiementSucces() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { rafraichirUser } = useAuth();

  const type = searchParams.get('type');
  const ref = searchParams.get('ref');
  const sessionId = searchParams.get('session_id');

  const [statut, setStatut] = useState('verification'); // 'verification', 'succes', 'erreur'
  const [message, setMessage] = useState('Vérification du paiement Wave en cours...');

  useEffect(() => {
    async function verifier() {
      try {
        await client.get(`/wave/verifier/${sessionId || 'check'}?type=${type || ''}&ref=${ref || ''}`);

        // Rafraîchir les infos utilisateur (au cas où c'est un abonnement Pro)
        if (rafraichirUser) {
          await rafraichirUser();
        }

        setStatut('succes');
        setMessage('Votre paiement via Wave a été traité et validé avec succès ! 🌊');

        // Redirection automatique après 3 secondes
        setTimeout(() => {
          if (type === 'abonnement') {
            navigate('/tableau-de-bord?tab=abonnement');
          } else if (type === 'recharge') {
            navigate('/tableau-de-bord?tab=portefeuille');
          } else if (type === 'lien_achat' && ref) {
            navigate(`/achat/${ref}`);
          } else {
            navigate('/tableau-de-bord');
          }
        }, 3000);

      } catch (err) {
        console.error('Erreur lors de la vérification du paiement :', err);
        setStatut('erreur');
        setMessage('Paiement en cours de finalisation ou webhook en attente. Vous pouvez consulter l\'état dans votre espace.');
      }
    }

    verifier();
  }, [type, ref, sessionId, navigate, rafraichirUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--sugu-bg-soft)' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
        <div style={{
          background: '#FFF',
          padding: '40px 30px',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          border: '1.5px solid var(--sugu-border)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#1DC4FF15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(29, 196, 255, 0.2)'
            }}>
              <img src={imgWave} alt="Wave" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--sugu-ink)', marginBottom: '12px' }}>
            {statut === 'verification' && 'Vérification du Paiement...'}
            {statut === 'succes' && 'Paiement Wave Confirmé ! 🎉'}
            {statut === 'erreur' && 'Finalisation en cours'}
          </h2>

          <p style={{ color: 'var(--sugu-ink-soft)', fontSize: '15px', lineHeight: 1.6, marginBottom: '30px' }}>
            {message}
          </p>

          {statut === 'verification' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '20px 0' }}>
              <div className="sugu-spinner" style={{ borderTopColor: '#1DC4FF' }}></div>
            </div>
          )}

          <button
            onClick={() => {
              if (type === 'abonnement') navigate('/tableau-de-bord?tab=abonnement');
              else if (type === 'recharge') navigate('/tableau-de-bord?tab=portefeuille');
              else if (type === 'lien_achat' && ref) navigate(`/achat/${ref}`);
              else navigate('/tableau-de-bord');
            }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: '#1DC4FF',
              color: '#FFF',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(29, 196, 255, 0.3)'
            }}
          >
            Accéder à mon espace ➔
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
