import { Link } from 'react-router-dom';
import { PIED_DE_PAGE } from '../../data/mock';
import './Footer.css';
import logoImg from '../../assets/TrouveTout_Logo.png';

const RESEAUX = ['f', '◎', 'in', '♪'];

export default function Footer() {
  return (
    <footer className="sugu-footer">
      <div className="sugu-footer__main">
        <div className="sugu-footer__brand">
          <Link to="/" className="sugu-footer__logo" aria-label="TrouveTout accueil">
            <img src={logoImg} alt="TrouveTout" className="sugu-footer__logo-img" />
          </Link>
          <p>
            La marketplace des petites annonces en Côte d'Ivoire. Achetez et vendez en toute confiance, partout à
            Abidjan et au-delà.
          </p>
          <div className="sugu-socials">
            {RESEAUX.map((social) => (
              <button key={social} type="button" className="sugu-btn sugu-socials__item">
                {social}
              </button>
            ))}
          </div>
        </div>

        <div className="sugu-footer__col">
          <div className="sugu-footer__title">Catégories</div>
          {PIED_DE_PAGE.categories.map((item) => (
            <Link key={item} to="/recherche" className="sugu-link">
              {item}
            </Link>
          ))}
        </div>

        <div className="sugu-footer__col">
          <div className="sugu-footer__title">À propos</div>
          {PIED_DE_PAGE.aPropos.map((item) => (
            <Link key={item} to="/" className="sugu-link">
              {item}
            </Link>
          ))}
        </div>

        <div className="sugu-footer__col">
          <div className="sugu-footer__title">Aide &amp; Légal</div>
          {PIED_DE_PAGE.aide.map((item) => (
            <Link key={item} to="/" className="sugu-link">
              {item}
            </Link>
          ))}
        </div>
      </div>

      <div className="sugu-footer__bottom">
        <div className="sugu-footer__bottom-inner">
          <span>© 2026 TrouveTout · Abidjan, Côte d'Ivoire · Tous droits réservés</span>
          <div>
            <Link to="/" className="sugu-link">
              Conditions générales
            </Link>
            <Link to="/confidentialite" className="sugu-link">
              Confidentialité
            </Link>
            <span>🌐 Français</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
