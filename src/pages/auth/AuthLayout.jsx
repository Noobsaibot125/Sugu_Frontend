import { Link } from 'react-router-dom';
import logoImg from '../../assets/TrouveTout_Logo_Black.png';
import './AuthLayout.css';

const CHIFFRES = [
  { valeur: '1,2 M+', libelle: 'annonces' },
  { valeur: '32', libelle: 'communes' },
  { valeur: '100%', libelle: 'gratuit' },
];

/** Mise en page partagée des écrans d'authentification : panneau de marque + panneau formulaire. */
export default function AuthLayout({ children }) {
  return (
    <div className="sugu-auth-wrap">
      <div className="sugu-auth-brand">
        <div className="sugu-auth-brand__logo">
          <img src={logoImg} alt="TrouveTout Logo" className="sugu-auth-brand__logo-img" />
        </div>

        <div className="sugu-auth-brand__pitch">
          <h2>Achetez et vendez, en toute confiance à Abidjan.</h2>
          <p>Rejoignez plus de 850 000 Ivoiriens qui donnent une seconde vie à leurs objets, chaque jour.</p>
          <div className="sugu-auth-brand__chiffres">
            {CHIFFRES.map((c) => (
              <div key={c.libelle}>
                <div className="sugu-auth-brand__chiffre-valeur">{c.valeur}</div>
                <div className="sugu-auth-brand__chiffre-libelle">{c.libelle}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sugu-auth-brand__copyright">© 2026 TrouveTout · Abidjan, Côte d'Ivoire</div>
      </div>

      <div className="sugu-auth-form-panel">
        <Link to="/" className="sugu-auth-back-home">
          ← Retour à l'accueil
        </Link>
        <div className="sugu-auth-form-panel__inner">
          <div className="sugu-auth-mobile-logo">
            <img src={logoImg} alt="TrouveTout Logo" className="sugu-auth-brand__logo-img" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
