import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ListingCard.css';

const formatPrix = new Intl.NumberFormat('fr-FR');

export const LIBELLES_ETAT = {
  neuf: 'Neuf',
  tres_bon: 'Très bon état',
  bon: 'Bon état',
  correct: 'État correct',
};

const TONS_ETAT = { neuf: 'neuf' };

const TINTS = ['#EADFCE', '#E9E1D2', '#E9E0D0', '#E6DDD0', '#E8E0D1', '#E4DDCC', '#EDE2CF', '#E6DDCE'];

/** Carte annonce Sugu : vignette teintée avec badge et favori, prix en FCFA, titre, localisation, date. */
export default function ListingCard({ annonce, sponsorise = false, avecFavori = true }) {
  const { id, titre, prix, periode, image, image_label, ville, commune, etat, badge, statut, publie_depuis, isEmploi, type_contrat } = annonce;
  const [favori, setFavori] = useState(false);

  const badgeAffiche = badge || (isEmploi && type_contrat ? { label: type_contrat, tone: 'neuf' } : (etat ? { label: LIBELLES_ETAT[etat] || etat, tone: TONS_ETAT[etat] || 'occasion' } : null));
  const tint = TINTS[Number(id) % TINTS.length] || TINTS[0];

  const basculerFavori = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavori((f) => !f);
  };

  return (
    <Link to={`/annonce/${id}`} className={`sugu-card${sponsorise ? ' sugu-card--sponsorise' : ''}`}>
      <div className="sugu-card__media">
        {image ? (
          <img src={image} alt={titre} loading="lazy" />
        ) : (
          <div className="sugu-card__placeholder" style={{ background: tint }} aria-hidden="true">
            <span>{image_label || '[ photo ]'}</span>
          </div>
        )}

        <div className="sugu-card__badges">
          {sponsorise && <span className="sugu-card__badge sugu-card__badge--pro">★ Pro</span>}
          {(annonce.isBoosted || annonce.is_boosted || annonce.boosted) && (
            <span className="sugu-card__badge" style={{ background: 'linear-gradient(90deg, #FFF7E6 0%, #FFE8B3 100%)', color: '#D35400', border: '1px solid #F5C65F', fontWeight: 800 }}>⚡ Boosté</span>
          )}
          {badgeAffiche && (
            <span className={`sugu-card__badge sugu-card__badge--${badgeAffiche.tone}`}>{badgeAffiche.label}</span>
          )}
        </div>

        {avecFavori && (
          <button
            type="button"
            className={`sugu-card__coeur${favori ? ' actif' : ''}`}
            onClick={basculerFavori}
            aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill={favori ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        )}

        {statut === 'vendue' && <span className="sugu-card__vendue">Vendue</span>}
      </div>

      <div className="sugu-card__body">
        <p className="sugu-card__prix">
          {isEmploi ? (
            prix === 0 ? <span>Salaire à discuter</span> : <span>{formatPrix.format(prix)} FCFA / mois</span>
          ) : (
            <>
              {formatPrix.format(prix)} <span>FCFA{periode ? `/${periode}` : ''}</span>
              {(annonce.prix_negociable === 1 || annonce.prix_negociable === true) && (
                <span className="sugu-card__badge" style={{ display: 'inline-block', fontSize: '10px', color: '#106c62', background: '#e6f4f2', border: '1px solid #ccece6', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold', verticalAlign: 'middle', height: 'fit-content' }}>Négociable</span>
              )}
            </>
          )}
        </p>
        <h3 className="sugu-card__titre">{titre}</h3>
        <div className="sugu-card__meta">
          <span className="sugu-card__lieu">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {commune ? `${commune}, ${ville}` : ville}
          </span>
          {publie_depuis && <span className="sugu-card__date">{publie_depuis}</span>}
        </div>
      </div>
    </Link>
  );
}
