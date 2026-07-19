import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AuthLayout from './AuthLayout';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [afficherMdp, setAfficherMdp] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  
  const { ouvrirSession } = useAuth();
  const navigate = useNavigate();

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);

    try {
      const res = await client.post('/auth/connexion', {
        identifiant: email,
        mot_de_passe: motDePasse,
      });

      const data = res.data;
      
      // Vérifier le rôle de l'utilisateur retourné
      if (data?.user?.role !== 'admin') {
        setErreur("Accès refusé. Cette interface est strictement réservée aux administrateurs.");
      } else {
        ouvrirSession(data);
        navigate('/admin');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Connexion impossible, réessayez.';
      setErreur(message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <AuthLayout>
      <div className="sugu-auth-screen">
        <h1 style={{ color: 'var(--sugu-primary)' }}>Espace Administrateur</h1>
        <p className="sugu-auth-screen__sous-titre">
          Veuillez vous authentifier pour accéder au tableau de bord.
        </p>

        {erreur && (
          <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale" style={{ backgroundColor: '#FFF1F0', color: '#F5222D', borderColor: '#FFCCC7', padding: '10px', borderRadius: '6px', border: '1px solid', fontSize: '13px', marginBottom: '16px' }}>
            {erreur}
          </p>
        )}

        <form className="sugu-auth-screen__form" onSubmit={soumettre}>
          <Input
            id="email"
            label="Adresse e-mail admin"
            type="email"
            placeholder="admin@sugu.ci"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <div>
            <div className="sugu-auth-champ-ligne">
              <label htmlFor="mot_de_passe">Mot de passe</label>
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
              <button
                type="button"
                className="sugu-auth-champ-compose__oeil"
                onClick={() => setAfficherMdp((v) => !v)}
                aria-label={afficherMdp ? 'Masquer' : 'Afficher'}
              >
                {afficherMdp ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth disabled={envoi} style={{ marginTop: '16px' }}>
            {envoi ? 'Connexion en cours...' : 'Se connecter en tant qu\'admin'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
