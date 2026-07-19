import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function PasserPro() {
  const { user, mettreAJourUser } = useAuth();
  const navigate = useNavigate();

  const [nomEntreprise, setNomEntreprise] = useState('');
  const [justificatifBase64, setJustificatifBase64] = useState('');
  const [justificatifName, setJustificatifName] = useState('');
  const [demandeExistante, setDemandeExistante] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/connexion');
      return;
    }

    async function chargerDemande() {
      try {
        const res = await client.get('/demandes-pro/moi');
        setDemandeExistante(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setChargement(false);
      }
    }
    chargerDemande();
  }, [user, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setJustificatifName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setJustificatifBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSoumettre = async (e) => {
    e.preventDefault();
    if (!nomEntreprise || !justificatifBase64) {
      setErreur('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setErreur('');
    setEnvoi(true);

    try {
      await client.post('/demandes-pro', {
        nom_entreprise: nomEntreprise,
        justificatif: justificatifBase64
      });
      setSucces('Votre demande a été soumise avec succès.');
      // Refresh request
      const res = await client.get('/demandes-pro/moi');
      setDemandeExistante(res.data);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la soumission de la demande.');
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: 'var(--sugu-ink-soft)', fontWeight: 600 }}>Chargement en cours...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--sugu-bg-soft)' }}>
      <Header />
      <main style={{ flex: 1, padding: '40px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#FFF', padding: '36px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
          
          <h1 style={{ fontFamily: 'var(--sugu-font-heading)', fontSize: '26px', fontWeight: 800, color: 'var(--sugu-ink)', marginBottom: '10px' }}>
            💼 Devenir Vendeur Professionnel
          </h1>
          <p style={{ color: 'var(--sugu-ink-soft)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            Débloquez votre e-vitrine personnalisée, augmentez votre quota d'annonces actives, accédez aux statistiques avancées et remontez vos annonces pour vendre plus rapidement.
          </p>

          {demandeExistante ? (
            <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--sugu-bg-soft)', border: '1.5px solid var(--sugu-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                {demandeExistante.statut === 'en_attente' && '⏳'}
                {demandeExistante.statut === 'approuve' && '✅'}
                {demandeExistante.statut === 'rejete' && '❌'}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sugu-ink)', marginBottom: '8px' }}>
                Demande {demandeExistante.statut === 'en_attente' ? 'en attente de validation' : demandeExistante.statut === 'approuve' ? 'approuvée' : 'rejetée'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--sugu-ink-soft)', lineHeight: 1.5, marginBottom: '16px' }}>
                Entreprise : <strong>{demandeExistante.nom_entreprise}</strong><br />
                Soumise le : {new Date(demandeExistante.created_at).toLocaleDateString('fr-FR')}
              </p>

              {demandeExistante.notes && (
                <div style={{ background: '#FFF', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--sugu-primary)', textAlign: 'left', marginBottom: '16px', fontSize: '13px' }}>
                  <strong>Notes de l'administrateur :</strong> {demandeExistante.notes}
                </div>
              )}

              {demandeExistante.statut === 'approuve' && (
                <Button onClick={() => navigate('/abonnements')} size="lg" style={{ width: '100%' }}>
                  Choisir mon abonnement Pro →
                </Button>
              )}

              {demandeExistante.statut === 'rejete' && (
                <Button onClick={() => setDemandeExistante(null)} variant="secondary" size="lg" style={{ width: '100%' }}>
                  Soumettre une nouvelle demande
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSoumettre} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {erreur && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale">{erreur}</p>}
              {succes && <p className="sugu-auth-screen__alerte sugu-auth-screen__alerte--globale sugu-auth-screen__alerte--succes">{succes}</p>}

              <Input
                id="nom_entreprise"
                label="Nom de l'entreprise ou raison sociale *"
                placeholder="Ex: Concessionnaire Auto Abidjan"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                required
              />

              <div>
                <label className="sugu-field__label" style={{ display: 'block', marginBottom: '8px' }}>
                  Justificatif d'immatriculation (Registre de commerce RCCM, DFE ou pièce d'identité) *
                </label>
                <div style={{ border: '2px dashed var(--sugu-border)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'var(--sugu-bg-soft)', position: 'relative', cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    required
                  />
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
                  <p style={{ fontSize: '13px', color: 'var(--sugu-ink-soft)', margin: 0 }}>
                    {justificatifName ? `Fichier sélectionné : ${justificatifName}` : 'Glissez-déposez ou cliquez pour ajouter un fichier (PDF ou Image)'}
                  </p>
                </div>
              </div>

              <Button type="submit" size="lg" disabled={envoi} style={{ marginTop: '10px' }}>
                {envoi ? 'Envoi en cours...' : 'Soumettre ma demande de validation'}
              </Button>
            </form>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
