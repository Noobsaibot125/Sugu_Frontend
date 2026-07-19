import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AuthLayout from './AuthLayout';
import client from '../../api/client';

export default function ReinitialisationMotDePasse() {
  const [etape, setEtape] = useState(1);
  const [identifiant, setIdentifiant] = useState('');
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const motsDePasseDifferents = confirmation.length > 0 && motDePasse !== confirmation;
  const nouveauMdpValide = motDePasse.length >= 8 && motDePasse === confirmation && code.length === 6;

  async function envoyerCode(e) {
    e.preventDefault();
    if (!identifiant) return;
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/auth/demande-reinitialisation-mdp', { identifiant });
      setUserId(res.data.userId);
      setEtape(2);
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function reinitialiser(e) {
    e.preventDefault();
    if (!nouveauMdpValide) return;
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/confirmer-reinitialisation-mdp', {
        userId,
        code,
        nouveauMotDePasse: motDePasse
      });
      setEtape(3);
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (etape === 3) {
    return (
      <AuthLayout>
        <div className="sugu-auth-succes">
          <div className="sugu-auth-succes__icone">✓</div>
          <h1>Mot de passe modifié</h1>
          <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <Button size="lg" onClick={() => navigate('/connexion')}>
            Se connecter
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (etape === 2) {
    return (
      <AuthLayout>
        <div className="sugu-auth-screen">
          <div className="sugu-auth-icone-tete">🔒</div>
          <h1>Nouveau mot de passe</h1>
          <p className="sugu-auth-screen__sous-titre">Choisissez un nouveau mot de passe pour votre compte.</p>

          {error && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale">{error}</p>}

          <form className="sugu-auth-screen__form" onSubmit={reinitialiser}>
            <Input
              id="code"
              label="Code de confirmation (6 chiffres)"
              type="text"
              placeholder="Ex: 123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              required
            />
            <Input
              id="nouveau_mdp"
              label="Nouveau mot de passe"
              type="password"
              placeholder="8 caractères minimum"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
            <Input
              id="confirmation_mdp"
              label="Confirmer le mot de passe"
              type="password"
              placeholder="Retapez le mot de passe"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              error={motsDePasseDifferents ? 'Les mots de passe ne correspondent pas.' : ''}
              required
            />
            <Button type="submit" size="lg" fullWidth disabled={!nouveauMdpValide || loading}>
              {loading ? "Chargement..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="sugu-auth-screen">
        <div className="sugu-auth-icone-tete">🔑</div>
        <h1>Mot de passe oublié ?</h1>
        <p className="sugu-auth-screen__sous-titre">
          Entrez votre e-mail ou téléphone, nous vous enverrons un code de réinitialisation.
        </p>

        {error && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale">{error}</p>}

        <form className="sugu-auth-screen__form" onSubmit={envoyerCode}>
          <Input
            id="identifiant"
            label="E-mail ou téléphone"
            placeholder="vous@email.ci ou 07 00 00 00 00"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            required
          />
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le code"}
          </Button>
        </form>

        <p className="sugu-auth-screen__retour">
          <span className="sugu-link" onClick={() => navigate('/connexion')}>‹ Revenir à la connexion</span>
        </p>
      </div>
    </AuthLayout>
  );
}
