import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import AuthLayout from './AuthLayout';

const LONGUEUR_CODE = 6;
const DELAI_RENVOI = 30;

export default function Verification() {
  const { state } = useLocation();
  const userId = state?.userId;
  const typeInscription = state?.typeInscription || 'email';
  const destination = state?.destination;
  const [chiffres, setChiffres] = useState(Array(LONGUEUR_CODE).fill(''));
  const [erreurCode, setErreurCode] = useState(false);
  const [verifie, setVerifie] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [decompte, setDecompte] = useState(0);
  const refs = useRef([]);
  const { ouvrirSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (decompte <= 0) return undefined;
    const id = setInterval(() => setDecompte((d) => Math.max(0, d - 1)), 1000);
    return () => clearInterval(id);
  }, [decompte]);

  if (!userId) return <Navigate to="/inscription" replace />;

  function changerChiffre(i, valeur) {
    if (!/^[0-9]?$/.test(valeur)) return;
    const suivants = [...chiffres];
    suivants[i] = valeur;
    setChiffres(suivants);
    setErreurCode(false);
    if (valeur && i < LONGUEUR_CODE - 1) refs.current[i + 1]?.focus();
  }

  function toucheArriere(i, e) {
    if (e.key === 'Backspace' && !chiffres[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function coller(e) {
    const texte = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LONGUEUR_CODE);
    if (!texte) return;
    e.preventDefault();
    setChiffres(texte.split('').concat(Array(LONGUEUR_CODE - texte.length).fill('')));
    refs.current[Math.min(texte.length, LONGUEUR_CODE - 1)]?.focus();
  }

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const res = await client.post('/auth/verification', {
        userId,
        code: chiffres.join(''),
      });
      ouvrirSession(res.data);
      setVerifie(true);
    } catch (err) {
      setErreurCode(true);
      setErreur(err.response?.data?.message || 'Vérification impossible, réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function renvoyer() {
    setErreur('');
    setInfo('');
    try {
      await client.post('/auth/renvoyer-code', { userId });
      setInfo('Un nouveau code vous a été envoyé.');
      setDecompte(DELAI_RENVOI);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de renvoyer le code.");
    }
  }

  const codeComplet = chiffres.every((c) => c !== '');

  if (verifie) {
    return (
      <AuthLayout>
        <div className="sugu-auth-succes">
          <div className="sugu-auth-succes__icone">✓</div>
          <h1>Compte vérifié !</h1>
          <p>Votre compte est prêt. Bienvenue sur Sugu, la marketplace des Ivoiriens.</p>
          <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
            Accéder à mon espace
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="sugu-auth-screen">
        <div className="sugu-auth-icone-tete">{typeInscription === 'telephone' ? '📱' : '📩'}</div>
        <h1>Vérification</h1>
        <p className="sugu-auth-screen__sous-titre">
          Entrez le code à 6 chiffres qui vous a été envoyé par{' '}
          {typeInscription === 'telephone' ? 'SMS' : 'e-mail'}
          {destination ? ` (${destination})` : ''}.
        </p>

        {erreur && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale">{erreur}</p>}
        {info && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale sugu-auth-screen__alerte--succes">{info}</p>}

        <form className="sugu-auth-screen__form" onSubmit={soumettre}>
          <div className="sugu-auth-otp" onPaste={coller}>
            {chiffres.map((chiffre, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                className={chiffre ? 'actif' : ''}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={chiffre}
                onChange={(e) => changerChiffre(i, e.target.value)}
                onKeyDown={(e) => toucheArriere(i, e)}
                aria-label={`Chiffre ${i + 1}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {erreurCode && <p className="sugu-auth-screen__alerte">ⓘ Code incorrect, réessayez.</p>}

          <Button type="submit" size="lg" fullWidth disabled={!codeComplet || envoi}>
            {envoi ? 'Vérification…' : 'Vérifier'}
          </Button>
        </form>

        <p className="sugu-auth-screen__lien-bas">
          {decompte > 0 ? (
            <span>Renvoyer le code dans {decompte}s</span>
          ) : (
            <span>
              Pas reçu de code ?{' '}
              <span
                className="sugu-link"
                onClick={(e) => {
                  e.preventDefault();
                  renvoyer();
                }}
              >
                Renvoyer
              </span>
            </span>
          )}
        </p>
        <p className="sugu-auth-screen__retour">
          <span className="sugu-link" onClick={() => navigate('/connexion')}>‹ Revenir à la connexion</span>
        </p>
      </div>
    </AuthLayout>
  );
}
