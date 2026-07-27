import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AuthLayout from './AuthLayout';
import GoogleAuthFlowModal from '../../components/ui/GoogleAuthFlowModal';
import CguPrivacyModal from '../../components/ui/CguPrivacyModal';

const TYPES_COMPTE = [
  { cle: 'particulier', icone: '🙋', label: 'Particulier', description: 'Je vends mes objets personnels' },
  { cle: 'pro', icone: '🏪', label: 'Professionnel', description: 'Boutique, badge Pro, statistiques' },
];

export default function Inscription() {
  const [typeCompte, setTypeCompte] = useState('particulier');
  const [typeInscription, setTypeInscription] = useState('email'); // email | telephone
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [accepteConditions, setAccepteConditions] = useState(false);
  const [cguModalOpen, setCguModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState('cgu');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [rccm, setRccm] = useState('');
  const [googleFlowOpen, setGoogleFlowOpen] = useState(false);
  const navigate = useNavigate();

  const handleCheckboxClick = (e) => {
    e.preventDefault();
    if (!accepteConditions) {
      setModalDefaultTab('cgu');
      setCguModalOpen(true);
    } else {
      setAccepteConditions(false);
    }
  };

  const handleOpenCguLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setModalDefaultTab('cgu');
    setCguModalOpen(true);
  };

  const handleOpenPrivacyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setModalDefaultTab('privacy');
    setCguModalOpen(true);
  };

  const handleAcceptCgu = () => {
    setAccepteConditions(true);
    setCguModalOpen(false);
  };

  const handleRefuseCgu = () => {
    setAccepteConditions(false);
    setCguModalOpen(false);
  };

  const motsDePasseDifferents = confirmation.length > 0 && motDePasse !== confirmation;
  const identifiantValide = typeInscription === 'email'
    ? (email.trim().length > 0 && /\S+@\S+\.\S+/.test(email))
    : (telephone.trim().length >= 8);
  
  const rccmRegex = /^CI-[A-Z0-9]{3}-\d{4}-[A-Z0-9]{1}-\d{5}$/i;
  const estPro = typeCompte === 'pro';
  const isRccmValide = !estPro || rccmRegex.test(rccm);

  const formulaireValide = nom.trim().length >= 2 && prenom.trim().length >= 2 && motDePasse.length >= 8 && motDePasse === confirmation && accepteConditions && identifiantValide && isRccmValide;

  async function soumettre(e) {
    e.preventDefault();
    if (!formulaireValide) return;
    setErreur('');
    setEnvoi(true);
    try {
      const formattedPhone = telephone ? `+225${telephone.replace(/\s/g, '')}` : '';
      const payload = {
        nom,
        prenom,
        type_inscription: typeInscription,
        email: typeInscription === 'email' ? email : '',
        telephone: typeInscription === 'telephone' ? formattedPhone : '',
        mot_de_passe: motDePasse,
        ville: 'Abidjan',
        est_boutique: estPro ? 1 : 0,
        rccm: estPro ? rccm : null
      };
      const res = await client.post('/auth/inscription', payload);
      navigate('/verification', {
        state: {
          userId: res.data.userId,
          typeInscription,
          destination: typeInscription === 'email' ? email : formattedPhone
        }
      });
    } catch (err) {
      setErreur(err.response?.data?.message || 'Inscription impossible, réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <AuthLayout>
      <div className="sugu-auth-screen">
        <h1>Créer un compte</h1>
        <p className="sugu-auth-screen__sous-titre">C'est gratuit et ça prend moins d'une minute.</p>

        <div className="sugu-auth-types">
          {TYPES_COMPTE.map((t) => (
            <button
              key={t.cle}
              type="button"
              className={`sugu-auth-type${typeCompte === t.cle ? ' actif' : ''}`}
              onClick={() => setTypeCompte(t.cle)}
            >
              <span className="sugu-auth-type__icone">{t.icone}</span>
              <span className="sugu-auth-type__label">{t.label}</span>
              <span className="sugu-auth-type__desc">{t.description}</span>
              {typeCompte === t.cle && <span className="sugu-auth-type__coche">✓</span>}
            </button>
          ))}
        </div>

        {erreur && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale">{erreur}</p>}

        <form className="sugu-auth-screen__form" onSubmit={soumettre}>
          <div className="sugu-auth-onglets" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={typeInscription === 'email'}
              className={`sugu-auth-onglet${typeInscription === 'email' ? ' actif' : ''}`}
              onClick={() => setTypeInscription('email')}
            >
              ✉ E-mail
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={typeInscription === 'telephone'}
              className={`sugu-auth-onglet${typeInscription === 'telephone' ? ' actif' : ''}`}
              onClick={() => setTypeInscription('telephone')}
            >
              📱 Téléphone
            </button>
          </div>

          <div className="sugu-auth-row-nom-prenom" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              id="nom"
              label={estPro ? 'Nom de la boutique' : 'Nom'}
              placeholder={estPro ? 'Ex : Koffi Tech Store' : 'Ex : Koné'}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
            <Input
              id="prenom"
              label={estPro ? 'Prénom du gérant' : 'Prénom'}
              placeholder={estPro ? 'Ex : Aya' : 'Ex : Aya'}
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
            />
          </div>
          {typeInscription === 'email' ? (
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="vous@email.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          ) : (
            <div>
              <span className="sugu-auth-champ-label">Téléphone</span>
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
          )}
          <Input
            id="mot_de_passe"
            label="Mot de passe"
            type="password"
            placeholder="8 caractères minimum"
            minLength={8}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
          <Input
            id="confirmation"
            label="Confirmer le mot de passe"
            type="password"
            placeholder="Retapez votre mot de passe"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            error={motsDePasseDifferents ? 'Les mots de passe ne correspondent pas.' : ''}
            required
          />

          {estPro && (
            <Input
              id="rccm"
              label="RCCM / Immatriculation de commerce (Format: CI-XXX-AAAA-X-NNNNN) *"
              placeholder="Ex : CI-ABJ-2026-B-01234"
              value={rccm}
              onChange={(e) => setRccm(e.target.value.toUpperCase())}
              error={rccm && !rccmRegex.test(rccm) ? 'Format RCCM invalide (Ex: CI-ABJ-2026-B-01234)' : ''}
              required
            />
          )}

          <button
            type="button"
            className={`sugu-auth-conditions${accepteConditions ? ' actif' : ''}`}
            onClick={handleCheckboxClick}
          >
            <span className="sugu-auth-conditions__case">{accepteConditions ? '✓' : ''}</span>
            <span className="sugu-auth-conditions__texte">
              J'accepte les{' '}
              <span className="sugu-link" onClick={handleOpenCguLink}>
                conditions d'utilisation
              </span>{' '}
              et la{' '}
              <span className="sugu-link" onClick={handleOpenPrivacyLink}>
                politique de confidentialité
              </span>{' '}
              de Sugu.
            </span>
          </button>

          <Button type="submit" size="lg" fullWidth disabled={!formulaireValide || envoi}>
            {envoi ? 'Création…' : 'Créer mon compte'}
          </Button>

          <div className="sugu-auth-separateur" style={{ margin: '18px 0' }}>
            <span>ou</span>
          </div>

          <button
            type="button"
            className="sugu-auth-google-btn"
            onClick={() => setGoogleFlowOpen(true)}
          >
            <span className="sugu-auth-google-btn__g">G</span> S'inscrire avec Google
          </button>
        </form>

        <p className="sugu-auth-screen__lien-bas">
          Déjà inscrit ? <Link to="/connexion" className="sugu-link">Se connecter</Link>
        </p>

        <GoogleAuthFlowModal isOpen={googleFlowOpen} onClose={() => setGoogleFlowOpen(false)} />
        <CguPrivacyModal 
          isOpen={cguModalOpen}
          defaultTab={modalDefaultTab}
          onClose={handleRefuseCgu}
          onAccept={handleAcceptCgu}
          onRefuse={handleRefuseCgu}
        />
      </div>
    </AuthLayout>
  );
}
