import { useState, useEffect } from 'react';
import logoImg from '../../assets/TrouveTout_Logo.png';
import Button from './Button';

export default function CguPrivacyModal({ isOpen, onClose, onAccept, onRefuse, defaultTab = 'cgu' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="sugu-modal-backdrop" 
      style={{ 
        zIndex: 2000, 
        backgroundColor: 'rgba(15, 12, 9, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onRefuse || onClose}
    >
      <div 
        className="sugu-modal-content animate-fade-in" 
        style={{ 
          maxWidth: '680px', 
          width: '100%', 
          maxHeight: '90vh',
          borderRadius: '24px', 
          padding: '0',
          background: '#FFFFFF',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--sugu-border, #E6DEC3)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '28px 28px 20px 28px',
          textAlign: 'center',
          borderBottom: '1px solid #F2EBE1',
          position: 'relative',
          background: 'linear-gradient(180deg, #FAF6F0 0%, #FFFFFF 100%)'
        }}>
          {/* Close Button */}
          <button 
            type="button" 
            onClick={onRefuse || onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#EFEAE1',
              border: 'none',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#554D43',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#E2DAD0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#EFEAE1'}
          >
            ✕
          </button>

          {/* Centered Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <img 
              src={logoImg} 
              alt="Sugu TrouveTout" 
              style={{ height: '90px', maxWidth: '280px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>

          <h2 style={{ 
            margin: '0 0 6px 0', 
            fontSize: '20px', 
            fontWeight: 800, 
            color: 'var(--sugu-ink, #2C2621)',
            letterSpacing: '-0.3px' 
          }}>
            Conditions d'Utilisation & Confidentialité
          </h2>
          <p style={{ 
            margin: 0, 
            fontSize: '13.5px', 
            color: 'var(--sugu-ink-faint, #7A7067)',
            lineHeight: 1.4
          }}>
            Veuillez lire attentivement nos engagements et règles avant de valider votre inscription.
          </p>

          {/* Tabs Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '20px', 
            background: '#EFEAE1', 
            padding: '4px', 
            borderRadius: '12px' 
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('cgu')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '9px',
                border: 'none',
                background: activeTab === 'cgu' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'cgu' ? 'var(--sugu-primary, #E05624)' : '#665E55',
                fontWeight: activeTab === 'cgu' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'cgu' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📜 Conditions d'Utilisation (CGU)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '9px',
                border: 'none',
                background: activeTab === 'privacy' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'privacy' ? 'var(--sugu-primary, #E05624)' : '#665E55',
                fontWeight: activeTab === 'privacy' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'privacy' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🔒 Politique de Confidentialité
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div style={{ 
          padding: '24px 28px', 
          overflowY: 'auto', 
          flex: 1,
          fontSize: '13.5px',
          color: '#443D36',
          lineHeight: 1.6,
          background: '#FFFFFF'
        }}>
          {activeTab === 'cgu' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#FAF6F0', border: '1px solid #EFE4D6', borderRadius: '12px', padding: '14px 16px' }}>
                <strong style={{ color: 'var(--sugu-primary, #E05624)' }}>💡 En résumé :</strong> Sugu est un marché en ligne sécurisé en Côte d'Ivoire qui protège vos acheteurs et vos vendeurs grâce au système de paiement sous séquestre Mobile Money et à la remise en main propre vérifiée.
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>1. Inscription et Sécurité des Comptes</h4>
                <p style={{ margin: 0 }}>
                  Chaque utilisateur doit fournir des informations exactes lors de son inscription. Les numéros de téléphone et e-mails font l'objet d'une vérification obligatoire. Vous êtes responsable du maintien de la confidentialité de vos identifiants.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>2. Publication d'Annonces et Règles de la Communauté</h4>
                <p style={{ margin: 0 }}>
                  Il est strictement interdit de publier des produits illicites, contrefaits, des armes ou des substances prohibées par la législation ivoirienne. Toute annonce frauduleuse entraînera la suppression immédiate de l'annonce et le bannissement du compte.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>3. Système de Paiement Sécurisé & Séquestre</h4>
                <p style={{ margin: 0 }}>
                  Les fonds versés par l'acheteur sont conservés en séquestre sécurisé. Ils ne sont transférés sur le portefeuille du vendeur qu'après confirmation de la bonne réception du colis ou de la conformité de la remise en main propre.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>4. Gestion des Retours & Articles Non Conformes</h4>
                <p style={{ margin: 0 }}>
                  En cas d'article non conforme, l'acheteur dispose d'un délai pour signaler le problème. L'article doit être restitué au vendeur, et dès confirmation de réception par ce dernier, les fonds sont intégralement restitués à l'acheteur.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>5. Compte Professionnel & Badges Pro</h4>
                <p style={{ margin: 0 }}>
                  Les boutiques et vendeurs professionnels sont soumis à la vérification de leur immatriculation (RCCM). Sugu se réserve le droit de révoquer un badge Pro en cas de manquements répétés.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#EAF4F2', border: '1px solid #C4E3DE', borderRadius: '12px', padding: '14px 16px' }}>
                <strong style={{ color: '#106C62' }}>🛡️ Respect de la Vie Privée :</strong> Vos données personnelles ne sont jamais vendues à des tiers. Elles sont uniquement utilisées pour assurer vos transactions et livraisons.
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>1. Données Personnelles Collectées</h4>
                <p style={{ margin: 0 }}>
                  Nous collectons votre nom, prénom, numéro de téléphone, adresse e-mail, ainsi que vos coordonnées de livraison lorsque vous effectuez des achats ou ventes sur la plateforme.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>2. Utilisation des Données de Géolocalisation</h4>
                <p style={{ margin: 0 }}>
                  La géolocalisation n'est activée que lorsque vous utilisez explicitement le bouton « Me localiser » pour faciliter la saisie de votre lieu de retrait ou de livraison.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>3. Transactions & Partenaires de Paiement</h4>
                <p style={{ margin: 0 }}>
                  Vos transactions Mobile Money (Wave, Orange, MTN) sont sécurisées par des protocoles bancaires certifiés. Nous ne stockons aucun code secret ni mot de passe Mobile Money.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#2C2621', fontWeight: 700 }}>4. Vos Droits & Modification du Profil</h4>
                <p style={{ margin: 0 }}>
                  Vous disposez d'un droit permanent d'accès, de modification et de suppression de vos données personnelles depuis les paramètres de votre compte dans le Tableau de Bord.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div style={{ 
          padding: '16px 28px 24px 28px', 
          borderTop: '1px solid #F2EBE1', 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end',
          background: '#FAF6F0'
        }}>
          <button
            type="button"
            onClick={onRefuse}
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              border: '1.5px solid #D8CFCE',
              background: '#FFFFFF',
              color: '#665E55',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F5EFEA'; e.currentTarget.style.borderColor = '#C4BBB7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D8CFCE'; }}
          >
            Refuser
          </button>

          <Button
            type="button"
            size="lg"
            onClick={onAccept}
            style={{
              padding: '12px 26px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ✓ J'accepte les conditions
          </Button>
        </div>
      </div>
    </div>
  );
}
