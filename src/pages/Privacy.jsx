import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Privacy.css';

export default function Privacy() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="sugu-privacy-page">
      <div className="sugu-privacy-page__hero">
        <div className="container">
          <h1 className="sugu-privacy-page__main-title">Politique de Confidentialité</h1>
          <p className="sugu-privacy-page__subtitle">
            Dernière mise à jour : 18 juillet 2026 · Chez TrouveTout, nous protégeons vos données personnelles.
          </p>
        </div>
      </div>

      <div className="container sugu-privacy-page__content">
        <div className="sugu-privacy-page__grid">
          {/* Main content */}
          <div className="sugu-privacy-page__main-content">
            <section className="sugu-privacy-page__section" id="introduction">
              <h2>1. Introduction</h2>
              <p>
                TrouveTout ("Sugu") s'engage à protéger la vie privée et les données personnelles des utilisateurs 
                de sa marketplace. Cette politique de confidentialité vous informe sur la manière dont nous collectons, 
                utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre site internet et 
                nos services associés.
              </p>
              <p>
                En accédant ou en utilisant nos services, vous acceptez les pratiques décrites dans cette Politique 
                de Confidentialité. Si vous n'êtes pas d'accord avec ces dispositions, veuillez cesser d'utiliser 
                nos plateformes.
              </p>
            </section>

            <section className="sugu-privacy-page__section" id="data-collection">
              <h2>2. Données que nous collectons</h2>
              <p>
                Nous collectons différents types d'informations pour vous fournir le meilleur service possible :
              </p>
              <ul>
                <li>
                  <strong>Informations de compte :</strong> Votre nom, adresse e-mail, numéro de téléphone, 
                  mot de passe chiffré, et votre avatar de profil lors de votre inscription.
                </li>
                <li>
                  <strong>Annonces publiées :</strong> Les photos, le titre, la description, l'état physique, 
                  le prix et la localisation géographique (ville et commune) des articles ou services que vous proposez.
                </li>
                <li>
                  <strong>Données de transaction :</strong> Les informations liées à vos transactions de vente sécurisées 
                  (montant de la commission, statut de la livraison et historique des demandes de retrait Mobile Money).
                </li>
                <li>
                  <strong>Messagerie interne :</strong> Les messages, propositions de prix et négociations échangés 
                  directement entre acheteurs et vendeurs via notre service de chat sécurisé.
                </li>
              </ul>
            </section>

            <section className="sugu-privacy-page__section" id="data-use">
              <h2>3. Utilisation de vos données</h2>
              <p>
                Vos informations personnelles sont traitées pour les finalités suivantes :
              </p>
              <ul>
                <li>Mettre en relation les vendeurs et les acheteurs de manière fluide et sécurisée.</li>
                <li>
                  Améliorer votre expérience de publication grâce à notre **Studio de Création par IA** qui analyse 
                  vos descriptions pour suggérer automatiquement le titre, le prix et les caractéristiques techniques.
                </li>
                <li>Traiter les paiements, sécuriser les fonds en séquestre et gérer les demandes de transferts.</li>
                <li>Assurer la modération des annonces, prévenir la fraude et garantir le respect de nos CGU.</li>
                <li>Suivre les statistiques de clics, de vues et d'affichage pour les comptes professionnels (Pro).</li>
              </ul>
            </section>

            <section className="sugu-privacy-page__section" id="data-sharing">
              <h2>4. Partage et visibilité des données</h2>
              <p>
                Certaines de vos données sont visibles publiquement par nature pour le bon fonctionnement de la marketplace :
              </p>
              <ul>
                <li>
                  <strong>Sur vos annonces :</strong> Votre prénom, votre commune de vente, votre avatar et le badge Pro 
                  (si applicable) sont visibles par tous les visiteurs pour instaurer un climat de confiance.
                </li>
                <li>
                  <strong>Livraison et Retrait :</strong> Lorsque vous achetez un article via un lien sécurisé, 
                  vos coordonnées de livraison (nom, prénom, numéro de téléphone, commune et adresse précise) ou vos 
                  préférences de rendez-vous sont transmises au vendeur concerné afin de finaliser la transaction.
                </li>
                <li>
                  Nous ne vendons, ne louons, ni ne partageons vos données nominatives avec des tiers à des fins de marketing 
                  sans votre consentement explicite.
                </li>
              </ul>
            </section>

            <section className="sugu-privacy-page__section" id="security">
              <h2>5. Sécurité de vos informations</h2>
              <p>
                TrouveTout met en œuvre des mesures de sécurité techniques et organisationnelles rigoureuses pour protéger 
                vos données contre tout accès non autorisé, altération, divulgation ou destruction :
              </p>
              <p>
                Vos mots de passe sont hachés de manière sécurisée en base de données, et les échanges de paiements et de 
                retrait s'effectuent via des protocoles chiffrés et sécurisés en partenariat avec les principaux opérateurs 
                de Mobile Money (Orange Money, Wave, MTN).
              </p>
            </section>

            <section className="sugu-privacy-page__section" id="user-rights">
              <h2>6. Vos droits et contrôles</h2>
              <p>
                Conformément à la réglementation applicable sur la protection des données personnelles, vous disposez des droits suivants :
              </p>
              <ul>
                <li><strong>Accès et Modification :</strong> Vous pouvez mettre à jour vos coordonnées et détails de profil depuis votre Espace Personnel.</li>
                <li><strong>Gestion de la Boutique :</strong> Si vous disposez d'un compte professionnel, vous pouvez modifier votre nom commercial, logo et horaires à tout moment.</li>
                <li><strong>Suppression de compte :</strong> Vous pouvez demander la suppression définitive de votre compte et de toutes vos annonces en écrivant à notre service d'assistance.</li>
              </ul>
            </section>

            <section className="sugu-privacy-page__section" id="contact">
              <h2>7. Contactez-nous</h2>
              <p>
                Pour toute question, réclamation ou demande d'exercice de vos droits concernant vos données personnelles, 
                notre équipe est à votre entière disposition :
              </p>
              <div className="sugu-privacy-page__contact-card">
                <p><strong>TrouveTout Assistance Légal</strong></p>
                <p>📍 Abidjan, Côte d'Ivoire</p>
                <p>📧 legal@trouvetout.ci</p>
                <p>📞 +225 07 07 07 07 07</p>
              </div>
            </section>
          </div>

          {/* Sidebar Navigation */}
          <aside className="sugu-privacy-page__sidebar">
            <div className="sugu-privacy-page__nav-card">
              <h3>Sommaire</h3>
              <nav>
                <a href="#introduction">1. Introduction</a>
                <a href="#data-collection">2. Données collectées</a>
                <a href="#data-use">3. Utilisation</a>
                <a href="#data-sharing">4. Partage des données</a>
                <a href="#security">5. Sécurité</a>
                <a href="#user-rights">6. Vos Droits</a>
                <a href="#contact">7. Contact</a>
              </nav>
              <div className="sugu-privacy-page__nav-divider" />
              <Link to="/" className="sugu-btn sugu-privacy-page__back-btn">
                Retour à l'accueil
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
