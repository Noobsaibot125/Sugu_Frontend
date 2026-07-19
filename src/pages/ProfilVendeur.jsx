import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ListingCard from '../components/listings/ListingCard';
import {
  VENDEUR_MOCK,
  ANNONCES_MOCK,
  AVIS_MOCK,
  REPARTITION_NOTES_VENDEUR,
  CONSEILS_SECURITE,
  MESSAGES_RAPIDES_VENDEUR,
} from '../data/mock';
import './ProfilVendeur.css';

function Etoiles({ note }) {
  return (
    <span className="sugu-etoiles" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill={i <= Math.round(note) ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
      ))}
    </span>
  );
}

const ICONE = {
  check: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  lieu: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  agenda: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  eclair: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  bouclier: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6z" />
    </svg>
  ),
  drapeau: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 21V4M4 4h13l-2.5 4L17 12H4" />
    </svg>
  ),
  ferme: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};

export default function ProfilVendeur() {
  // Données mock en attendant le backend des vendeurs (GET /api/vendeurs/:id).
  const vendeur = VENDEUR_MOCK;
  const [categorie, setCategorie] = useState('Toutes');
  const [chatOuvert, setChatOuvert] = useState(false);
  const [messageEnvoye, setMessageEnvoye] = useState(false);

  const annoncesActives = useMemo(() => ANNONCES_MOCK.filter((a) => a.statut === 'active'), []);
  const categories = useMemo(
    () => ['Toutes', ...new Set(annoncesActives.map((a) => a.categorie))],
    [annoncesActives]
  );
  const annoncesFiltrees = useMemo(
    () => (categorie === 'Toutes' ? annoncesActives : annoncesActives.filter((a) => a.categorie === categorie)),
    [annoncesActives, categorie]
  );

  const totalNotes = REPARTITION_NOTES_VENDEUR.reduce((somme, r) => somme + r.nb, 0);

  const ouvrirChat = () => {
    setChatOuvert(true);
    setMessageEnvoye(false);
  };
  const fermerChat = () => setChatOuvert(false);
  const envoyerMessage = () => setMessageEnvoye(true);

  return (
    <div className="sugu-vendeur">
      {/* Fil d'ariane */}
      <div className="container sugu-vendeur__fil">
        <Link to="/" className="sugu-link">Accueil</Link>
        <span>›</span>
        <span className="sugu-link">Vendeurs</span>
        <span>›</span>
        <strong>{vendeur.nom}</strong>
      </div>

      {/* Bandeau héro */}
      <section className="container">
        <div className="sugu-vendeur__hero">
          <div className="sugu-vendeur__hero-avatar">
            <Avatar src={vendeur.avatar_url} nom={vendeur.nom} size={96} />
            {vendeur.est_verifie && <span className="sugu-vendeur__hero-check">{ICONE.check}</span>}
          </div>

          <div className="sugu-vendeur__hero-infos">
            <h1>{vendeur.nom}</h1>

            <div className="sugu-vendeur__hero-badges">
              {vendeur.est_boutique && <span className="sugu-vendeur__badge-pro">★ PROFESSIONNEL</span>}
              {vendeur.est_verifie && (
                <span className="sugu-vendeur__badge-verifie">{ICONE.check} Identité vérifiée</span>
              )}
            </div>

            <div className="sugu-vendeur__hero-meta">
              <span className="sugu-vendeur__hero-note">
                <Etoiles note={vendeur.note_moyenne} />
                <b>{vendeur.note_moyenne}</b>
                <span>({vendeur.nombre_avis} avis)</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{ICONE.lieu} {vendeur.commune}, {vendeur.ville}</span>
              <span aria-hidden="true">·</span>
              <span>{ICONE.agenda} Membre depuis {vendeur.membre_depuis}</span>
            </div>

            <div className="sugu-vendeur__hero-reponse">
              {ICONE.eclair} Répond généralement en {vendeur.delai_reponse} · Taux de réponse {vendeur.taux_reponse}
            </div>
          </div>
        </div>
      </section>

      <main className="container sugu-vendeur__corps">
        <div className="sugu-vendeur__grille-principale">
          {/* ===== Colonne gauche : annonces + avis ===== */}
          <div className="sugu-vendeur__colonne-gauche">
            <section>
              <div className="sugu-vendeur__section-entete">
                <h2>
                  Annonces actives <span className="sugu-vendeur__compteur">({annoncesActives.length})</span>
                </h2>
              </div>

              <div className="sugu-vendeur__chips" role="tablist">
                {categories.map((c) => {
                  const nb = c === 'Toutes' ? annoncesActives.length : annoncesActives.filter((a) => a.categorie === c).length;
                  const actif = categorie === c;
                  return (
                    <button
                      key={c}
                      role="tab"
                      aria-selected={actif}
                      className={`sugu-vendeur__chip${actif ? ' actif' : ''}`}
                      onClick={() => setCategorie(c)}
                    >
                      {c} <span>{nb}</span>
                    </button>
                  );
                })}
              </div>

              <div className="sugu-vendeur__grille-annonces">
                {annoncesFiltrees.map((annonce) => (
                  <ListingCard key={annonce.id} annonce={annonce} avecFavori={false} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="sugu-vendeur__titre-avis">Avis &amp; évaluations</h2>

              <div className="sugu-vendeur__resume-avis">
                <div className="sugu-vendeur__note-globale">
                  <div className="sugu-vendeur__note-chiffre">{vendeur.note_moyenne}</div>
                  <Etoiles note={vendeur.note_moyenne} />
                  <div className="sugu-vendeur__note-total">{vendeur.nombre_avis} avis</div>
                </div>
                <div className="sugu-vendeur__barres">
                  {REPARTITION_NOTES_VENDEUR.map((r) => (
                    <div key={r.etoiles} className="sugu-vendeur__barre-ligne">
                      <span className="sugu-vendeur__barre-label">{r.etoiles}★</span>
                      <div className="sugu-vendeur__barre-piste">
                        <div className="sugu-vendeur__barre-remplie" style={{ width: `${Math.round((r.nb / totalNotes) * 100)}%` }} />
                      </div>
                      <span className="sugu-vendeur__barre-compte">{r.nb}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sugu-vendeur__liste-avis">
                {AVIS_MOCK.map((avis) => (
                  <article key={avis.id} className="sugu-avis">
                    <div className="sugu-avis__entete">
                      <Avatar nom={avis.auteur} size={42} />
                      <div>
                        <div className="sugu-avis__nom-ligne">
                          <strong>{avis.auteur}</strong>
                          {avis.achat_confirme && <Badge tone="secondary">{ICONE.check} Achat confirmé</Badge>}
                        </div>
                        <div className="sugu-avis__meta">
                          <Etoiles note={avis.note} />
                          <span>{avis.date}</span>
                        </div>
                      </div>
                    </div>
                    <p>{avis.commentaire}</p>
                  </article>
                ))}
              </div>

              <button type="button" className="sugu-vendeur__voir-tous">
                Voir les {vendeur.nombre_avis} avis
              </button>
            </section>
          </div>

          {/* ===== Colonne droite ===== */}
          <aside className="sugu-vendeur__colonne-droite">
            <div className="sugu-vendeur__carte-contact">
              <div className="sugu-vendeur__stats-rapides">
                <div className="sugu-vendeur__stat-rapide sugu-vendeur__stat-rapide--primaire">
                  <strong>{annoncesActives.length}</strong>
                  <span>annonces actives</span>
                </div>
                <div className="sugu-vendeur__stat-rapide sugu-vendeur__stat-rapide--secondaire">
                  <strong>{vendeur.ventes_realisees}+</strong>
                  <span>ventes réalisées</span>
                </div>
              </div>

              <Button fullWidth size="lg" onClick={ouvrirChat} className="sugu-vendeur__btn-contact">
                {ICONE.message} Contacter le vendeur
              </Button>

              <ul className="sugu-vendeur__checklist">
                <li>{ICONE.check} Identité et téléphone vérifiés</li>
                <li>{ICONE.check} Vendeur professionnel depuis {vendeur.membre_depuis}</li>
                <li>{ICONE.check} Réponse rapide et fiable</li>
              </ul>
            </div>

            <div className="sugu-vendeur__securite">
              <div className="sugu-vendeur__securite-titre">
                <span className="sugu-vendeur__securite-icone">{ICONE.bouclier}</span>
                Conseils de sécurité
              </div>
              <ul>
                {CONSEILS_SECURITE.map((conseil) => (
                  <li key={conseil}>{conseil}</li>
                ))}
              </ul>
            </div>

            <button type="button" className="sugu-vendeur__signaler">
              {ICONE.drapeau} Signaler ce vendeur
            </button>
          </aside>
        </div>
      </main>

      {/* ===== Modale de contact ===== */}
      {chatOuvert && (
        <div className="sugu-modal-fond" onClick={fermerChat}>
          <div className="sugu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sugu-modal__entete">
              <div className="sugu-modal__avatar">
                <Avatar src={vendeur.avatar_url} nom={vendeur.nom} size={46} />
                <span className="sugu-modal__avatar-check">{ICONE.check}</span>
              </div>
              <div className="sugu-modal__identite">
                <div className="sugu-modal__nom">{vendeur.nom}</div>
                <div className="sugu-modal__statut">● En ligne · répond en {vendeur.delai_reponse}</div>
              </div>
              <button type="button" className="sugu-modal__fermer" onClick={fermerChat} aria-label="Fermer">
                {ICONE.ferme}
              </button>
            </div>

            <div className="sugu-modal__corps">
              {messageEnvoye ? (
                <div className="sugu-modal__confirmation">
                  <span className="sugu-modal__confirmation-icone">{ICONE.check}</span>
                  <div className="sugu-modal__confirmation-titre">Message envoyé !</div>
                  <p>Le vendeur vous répondra très vite. Retrouvez la conversation dans votre messagerie.</p>
                </div>
              ) : (
                <>
                  <div className="sugu-modal__label">Messages rapides</div>
                  <div className="sugu-modal__rapides">
                    {MESSAGES_RAPIDES_VENDEUR.map((message) => (
                      <button
                        key={message}
                        type="button"
                        className="sugu-modal__rapide"
                        onClick={envoyerMessage}
                      >
                        {message.replace('{commune}', vendeur.commune)}
                      </button>
                    ))}
                  </div>
                  <textarea placeholder="Écrivez votre message…" className="sugu-modal__texte" />
                  <Button fullWidth size="lg" variant="secondary" onClick={envoyerMessage}>
                    Envoyer le message
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
