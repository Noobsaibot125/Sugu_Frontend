import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AuthLayout from './AuthLayout';
import GoogleAuthFlowModal from '../../components/ui/GoogleAuthFlowModal';

export default function Connexion() {
  const [methode, setMethode] = useState('email'); // email | phone
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [afficherMdp, setAfficherMdp] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [googleFlowOpen, setGoogleFlowOpen] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpType, setOtpType] = useState('email');
  const [otpDestination, setOtpDestination] = useState('');
  const { ouvrirSession } = useAuth();
  const navigate = useNavigate();

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    const identifiant = methode === 'phone' ? `+225${telephone}` : email;
    
    let fingerprint = localStorage.getItem('sugu_device_fingerprint');
    if (!fingerprint) {
      fingerprint = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sugu_device_fingerprint', fingerprint);
    }

    try {
      const res = await client.post('/auth/connexion', {
        identifiant,
        mot_de_passe: motDePasse,
        deviceFingerprint: fingerprint
      });

      if (res.data?.otpRequired) {
        setOtpRequired(true);
        setTempToken(res.data.tempToken);
        setOtpType(res.data.type);
        setOtpDestination(res.data.destination);
      } else {
        ouvrirSession(res.data);
        if (res.data?.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.verificationRequise) {
        navigate('/verification', {
          state: {
            userId: data.userId,
            typeInscription: data.typeInscription,
            destination: data.destination
          }
        });
        return;
      }
      setErreur(data?.message || 'Connexion impossible, réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function soumettreOtp(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const res = await client.post('/auth/verifier-otp-appareil', {
        tempToken,
        code: otpCode
      });
      ouvrirSession(res.data);
      if (res.data?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErreur(err.response?.data?.message || 'Code incorrect ou expiré.');
    } finally {
      setEnvoi(false);
    }
  }

  if (otpRequired) {
    return (
      <AuthLayout>
        <div className="sugu-auth-screen">
          <h1>Vérification de sécurité 🛡️</h1>
          <p className="sugu-auth-screen__sous-titre" style={{ lineHeight: 1.5, margin: '10px 0 20px 0' }}>
            Un nouvel appareil a été détecté. Pour valider votre connexion, veuillez renseigner le code OTP de confirmation envoyé par {otpType === 'email' ? 'e-mail' : 'SMS'} à :<br/>
            <span style={{ color: 'var(--sugu-primary)', fontWeight: 'bold' }}>{otpDestination}</span>
          </p>

          {erreur && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale">{erreur}</p>}

          <form className="sugu-auth-screen__form" onSubmit={soumettreOtp}>
            <Input
              id="otp_code"
              label="Code OTP reçu"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
              required
              autoFocus
            />

            <Button type="submit" size="lg" fullWidth disabled={envoi}>
              {envoi ? 'Vérification…' : 'Confirmer la connexion'}
            </Button>

            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#C0512E',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                marginTop: '16px',
                textAlign: 'center',
                alignSelf: 'center'
              }}
              onClick={() => {
                setOtpRequired(false);
                setOtpCode('');
                setErreur('');
              }}
            >
              Retourner à l'écran de connexion
            </button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="sugu-auth-screen">
        <h1>Bon retour 👋</h1>
        <p className="sugu-auth-screen__sous-titre">Connectez-vous pour accéder à votre espace.</p>

        <div className="sugu-auth-onglets" role="tablist">
          <button type="button" role="tab" aria-selected={methode === 'email'} className={`sugu-auth-onglet${methode === 'email' ? ' actif' : ''}`} onClick={() => setMethode('email')}>
            ✉ E-mail
          </button>
          <button type="button" role="tab" aria-selected={methode === 'phone'} className={`sugu-auth-onglet${methode === 'phone' ? ' actif' : ''}`} onClick={() => setMethode('phone')}>
            📱 Téléphone
          </button>
        </div>

        {erreur && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale">{erreur}</p>}

        <form className="sugu-auth-screen__form" onSubmit={soumettre}>
          {methode === 'phone' ? (
            <div>
              <span className="sugu-auth-champ-label">Numéro de téléphone</span>
              <div className="sugu-auth-champ-compose">
                <span className="sugu-auth-champ-compose__prefixe">🇨🇮 +225</span>
                <input
                  inputMode="tel"
                  placeholder="07 00 00 00 00"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <Input
              id="email"
              label="Adresse e-mail"
              type="email"
              placeholder="vous@email.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          <div>
            <div className="sugu-auth-champ-ligne">
              <label htmlFor="mot_de_passe">Mot de passe</label>
              <Link to="/mot-de-passe-oublie" className="sugu-link sugu-auth-mdp-oublie">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="sugu-auth-champ-compose">
              <input
                id="mot_de_passe"
                type={afficherMdp ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
              />
              <button type="button" className="sugu-auth-champ-compose__oeil" onClick={() => setAfficherMdp((v) => !v)} aria-label={afficherMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {afficherMdp ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth disabled={envoi}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </Button>

          <div className="sugu-auth-separateur">
            <span>ou</span>
          </div>

          <button
            type="button"
            className="sugu-auth-google-btn"
            onClick={() => setGoogleFlowOpen(true)}
          >
            <span className="sugu-auth-google-btn__g">G</span> Continuer avec Google
          </button>
        </form>

        <p className="sugu-auth-screen__lien-bas">
          Pas encore de compte ? <Link to="/inscription" className="sugu-link">Créer un compte</Link>
        </p>

        <GoogleAuthFlowModal isOpen={googleFlowOpen} onClose={() => setGoogleFlowOpen(false)} />
      </div>
    </AuthLayout>
  );
}
