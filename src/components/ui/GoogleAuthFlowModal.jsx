import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Button from './Button';
import Input from './Input';

/**
 * Flux multi-étapes pour s'inscrire / se connecter avec Google :
 *
 *  1. L'utilisateur clique → vrai popup Google (useGoogleLogin)
 *  2. On reçoit un access_token → on récupère le profil Google → on appelle /check-google
 *     a. Si compte existant → connexion directe → dashboard
 *     b. Si nouvel utilisateur → étape 1 (téléphone)
 *  3. (Étape 1) Saisie du numéro ivoirien → OTP envoyé par SMS
 *  4. (Étape 2) Saisie du code OTP
 *  5. (Étape 3) Choix du type de compte (Particulier / Professionnel)
 *  6. (Étape 4) Si Professionnel → saisie RCCM → création du compte → dashboard
 */
export default function GoogleAuthFlowModal({ isOpen, onClose }) {
  const { ouvrirSession } = useAuth();
  const navigate = useNavigate();

  // step : null = non démarré, 1 = téléphone, 2 = OTP, 3 = type, 4 = rccm
  const [step, setStep] = useState(null);

  // Données Google récupérées
  const [googleData, setGoogleData] = useState(null); // { email, nom, avatar_url }

  // Données de formulaire
  const [telephone, setTelephone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState(null);
  const [typeCompte, setTypeCompte] = useState('particulier');
  const [rccm, setRccm] = useState('');

  // UI
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const rccmRegex = /^CI-[A-Z0-9]{3}-\d{4}-[A-Z0-9]{1}-\d{5}$/i;

  /** Fetch le profil Google avec l'access_token puis appelle le backend */
  async function handleGoogleSuccess(tokenResponse) {
    setErreur('');
    setEnvoi(true);
    try {
      // Récupérer les infos du profil via l'API Google
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      if (!profileRes.ok) throw new Error('Impossible de récupérer le profil Google.');
      const profile = await profileRes.json();

      // Appeler notre backend avec les infos récupérées
      const backRes = await client.post('/auth/check-google', {
        email: profile.email,
        nom: `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || profile.name || 'Utilisateur',
        avatar_url: profile.picture || null,
      });

      if (backRes.data.action === 'login') {
        // Compte existant → connexion directe
        ouvrirSession({ token: backRes.data.token, user: backRes.data.user });
        onClose();
        navigate('/tableau-de-bord');
      } else {
        // Nouvel utilisateur → sauvegarder ses données Google (y compris l'ID unique) et passer à l'étape 1
        setGoogleData({
          ...backRes.data,
          google_id: profile.sub, // ID unique Google (stable)
        });
        setStep(1);
      }
    } catch (err) {
      setErreur(err.response?.data?.message || err.message || 'Erreur lors de la connexion Google.');
    } finally {
      setEnvoi(false);
    }
  }

  /** Déclenche le vrai popup Google */
  const ouvrirPopupGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setErreur('La connexion Google a échoué ou a été annulée.'),
  });

  /** Étape 1 : Envoi du code OTP par SMS */
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!telephone.trim()) { setErreur('Téléphone requis.'); return; }
    setErreur(''); setEnvoi(true);
    try {
      const res = await client.post('/auth/otp-google', {
        email: googleData.email,
        nom: googleData.nom,
        avatar_url: googleData.avatar_url,
        telephone: telephone.trim(),
        google_id: googleData.google_id || null, // ID unique Google → stocké en BDD
      });
      setUserId(res.data.userId);
      setStep(2);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur d\'envoi du code OTP.');
    } finally {
      setEnvoi(false);
    }
  }

  /** Étape 2 : Vérification du code OTP */
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otpCode.trim()) { setErreur('Code OTP requis.'); return; }
    setErreur(''); setEnvoi(true);
    try {
      await client.post('/auth/verifier-otp-google', { userId, code: otpCode });
      setStep(3);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Code OTP invalide.');
    } finally {
      setEnvoi(false);
    }
  }

  /** Étape 3 : Choix du type de compte */
  async function handleChooseType(e) {
    e.preventDefault();
    if (typeCompte === 'pro') { setStep(4); return; }
    setErreur(''); setEnvoi(true);
    try {
      const res = await client.post('/auth/inscription-google', { userId, est_boutique: 0 });
      ouvrirSession({ token: res.data.token, user: res.data.user });
      onClose();
      navigate('/tableau-de-bord');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de finalisation.');
    } finally {
      setEnvoi(false);
    }
  }

  /** Étape 4 : Validation du RCCM et création du compte pro */
  async function handleRccmSubmit(e) {
    e.preventDefault();
    if (!rccmRegex.test(rccm)) { setErreur('Format RCCM invalide. (Ex: CI-ABJ-2026-B-01234)'); return; }
    setErreur(''); setEnvoi(true);
    try {
      const res = await client.post('/auth/inscription-google', { userId, est_boutique: 1, rccm });
      ouvrirSession({ token: res.data.token, user: res.data.user });
      onClose();
      navigate('/tableau-de-bord');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de finalisation.');
    } finally {
      setEnvoi(false);
    }
  }

  // Bouton déclencheur — rendu SANS overlay modal
  if (!isOpen) return null;

  // S'il n'y a pas encore d'étape active, déclencher le popup Google immédiatement
  // (le composant est rendu mais transparent tant que step est null)
  if (step === null) {
    return (
      <div className="sugu-modal-backdrop" style={{ zIndex: 1100 }} onClick={onClose}>
        <div
          className="sugu-modal-content"
          style={{ maxWidth: '400px', padding: '32px', textAlign: 'center' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
          <h3 style={{ fontFamily: 'var(--sugu-font-heading)', fontSize: '20px', marginBottom: '12px', color: 'var(--sugu-ink)' }}>
            Connexion avec Google
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', marginBottom: '24px', lineHeight: 1.5 }}>
            Cliquez sur le bouton ci-dessous pour ouvrir la fenêtre de sélection de compte Google.
          </p>
          {erreur && (
            <p style={{ color: '#dc2626', fontSize: '13px', background: '#fef2f2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              {erreur}
            </p>
          )}
          <button
            type="button"
            className="sugu-auth-google-btn"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
            onClick={() => { setErreur(''); ouvrirPopupGoogle(); }}
            disabled={envoi}
          >
            <span className="sugu-auth-google-btn__g">G</span>
            {envoi ? 'Connexion en cours…' : 'Continuer avec Google'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--sugu-ink-faint)', cursor: 'pointer', fontSize: '13px' }}
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  const titres = {
    1: '📱 Votre numéro de téléphone',
    2: '🔑 Code de confirmation',
    3: '🙋 Type de compte',
    4: '🏪 Immatriculation RCCM',
  };

  return (
    <div className="sugu-modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="sugu-modal-content"
        style={{ maxWidth: '440px', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--sugu-ink-soft)', padding: '0' }}
            >
              ←
            </button>
          )}
          <span style={{ fontFamily: 'var(--sugu-font-heading)', fontWeight: 700, fontSize: '18px', color: 'var(--sugu-ink)', flex: 1, textAlign: step > 1 ? 'center' : 'left' }}>
            {titres[step]}
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--sugu-ink-soft)' }}>
            ✕
          </button>
        </div>

        {/* Barre de progression */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? 'var(--sugu-primary)' : 'var(--sugu-border)' }} />
          ))}
        </div>

        {/* Profil Google affiché si disponible */}
        {googleData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--sugu-surface)', border: '1px solid var(--sugu-border)', borderRadius: '12px', marginBottom: '20px' }}>
            {googleData.avatar_url && (
              <img src={googleData.avatar_url} alt={googleData.nom} style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--sugu-ink)' }}>{googleData.nom}</div>
              <div style={{ fontSize: '12px', color: 'var(--sugu-ink-faint)' }}>{googleData.email}</div>
            </div>
          </div>
        )}

        {erreur && (
          <p style={{ color: '#dc2626', fontSize: '13px', background: '#fef2f2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
            {erreur}
          </p>
        )}

        {/* ÉTAPE 1 : Téléphone */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5 }}>
              Bienvenue ! Avant de continuer, nous avons besoin de votre numéro de téléphone ivoirien pour sécuriser votre compte. Vous recevrez un code par SMS.
            </p>
            <div>
              <span className="sugu-auth-champ-label">Numéro de téléphone *</span>
              <div className="sugu-auth-champ-compose">
                <span className="sugu-auth-champ-compose__prefixe">🇨🇮 +225</span>
                <input
                  required
                  inputMode="tel"
                  placeholder="07 00 00 00 00"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" fullWidth disabled={envoi || !telephone.trim()}>
              {envoi ? 'Envoi du code…' : 'Recevoir le code SMS'}
            </Button>
          </form>
        )}

        {/* ÉTAPE 2 : Code OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5 }}>
              Saisissez le code à 6 chiffres envoyé par SMS au <strong>+225 {telephone}</strong>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              style={{
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '10px',
                padding: '14px',
                border: '2px solid var(--sugu-border)',
                borderRadius: '12px',
                outline: 'none',
                color: 'var(--sugu-ink)',
                background: 'var(--sugu-surface)',
              }}
              required
            />
            <Button type="submit" fullWidth disabled={envoi || otpCode.length < 6}>
              {envoi ? 'Vérification…' : 'Confirmer le code'}
            </Button>
            <button
              type="button"
              onClick={() => { setOtpCode(''); setStep(1); }}
              style={{ background: 'none', border: 'none', color: 'var(--sugu-primary)', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
            >
              Changer le numéro
            </button>
          </form>
        )}

        {/* ÉTAPE 3 : Type de compte */}
        {step === 3 && (
          <form onSubmit={handleChooseType} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5 }}>
              Comment allez-vous utiliser TrouveTout ?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { cle: 'particulier', icone: '🙋', label: 'Particulier', desc: 'Je vends mes objets personnels' },
                { cle: 'pro', icone: '🏪', label: 'Professionnel', desc: 'Boutique / Commerce officiel' },
              ].map(t => (
                <button
                  key={t.cle}
                  type="button"
                  onClick={() => setTypeCompte(t.cle)}
                  style={{
                    padding: '18px 12px',
                    border: `2px solid ${typeCompte === t.cle ? 'var(--sugu-primary)' : 'var(--sugu-border)'}`,
                    borderRadius: '14px',
                    background: typeCompte === t.cle ? 'color-mix(in srgb, var(--sugu-primary) 8%, transparent)' : 'var(--sugu-surface)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{t.icone}</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--sugu-ink)', marginBottom: '4px' }}>{t.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--sugu-ink-soft)', lineHeight: 1.3 }}>{t.desc}</div>
                </button>
              ))}
            </div>
            <Button type="submit" fullWidth disabled={envoi}>
              {envoi ? 'Création du compte…' : 'Continuer →'}
            </Button>
          </form>
        )}

        {/* ÉTAPE 4 : RCCM */}
        {step === 4 && (
          <form onSubmit={handleRccmSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5 }}>
              Pour valider votre inscription en tant que boutique professionnelle, entrez votre numéro RCCM (Registre du Commerce et du Crédit Mobilier) au format requis.
            </p>
            <div
              style={{
                background: 'color-mix(in srgb, #f59e0b 8%, transparent)',
                border: '1px solid #f59e0b',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#92400e',
                lineHeight: 1.4,
              }}
            >
              📋 Format requis : <strong>CI-XXX-AAAA-X-NNNNN</strong><br />
              Exemple : <code>CI-ABJ-2026-B-01234</code>
            </div>
            <Input
              id="rccm_google"
              label="Numéro RCCM *"
              placeholder="CI-ABJ-2026-B-01234"
              value={rccm}
              onChange={e => setRccm(e.target.value.toUpperCase())}
              error={rccm && !rccmRegex.test(rccm) ? 'Format invalide. Exemple : CI-ABJ-2026-B-01234' : ''}
              required
            />
            <Button type="submit" fullWidth disabled={envoi || !rccmRegex.test(rccm)}>
              {envoi ? 'Création de la boutique…' : '🏪 Créer ma boutique Pro'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
