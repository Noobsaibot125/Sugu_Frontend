import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Connexion from './pages/auth/Connexion';
import Inscription from './pages/auth/Inscription';
import Verification from './pages/auth/Verification';
import ReinitialisationMotDePasse from './pages/auth/ReinitialisationMotDePasse';
import ProfilVendeur from './pages/ProfilVendeur';
import Recherche from './pages/Recherche';
import AnnonceDetail from './pages/AnnonceDetail';
import Publier from './pages/Publier';
import TableauDeBord from './pages/TableauDeBord';
import AchatLien from './pages/AchatLien';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/auth/AdminLogin';
import Abonnements from './pages/Abonnements';
import PasserPro from './pages/PasserPro';
import BoutiqueDetail from './pages/BoutiqueDetail';
import Privacy from './pages/Privacy';
import PaiementSucces from './pages/PaiementSucces';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Home />} />

      {/* Routes avec Header et Footer */}
      <Route element={<MainLayout />}>
        <Route path="/vendeur/:id" element={<ProfilVendeur />} />
        <Route path="/recherche" element={<Recherche />} />
        <Route path="/annonce/:id" element={<AnnonceDetail />} />
        <Route path="/boutique/:id" element={<BoutiqueDetail />} />
        <Route path="/confidentialite" element={<Privacy />} />
      </Route>

      {/* Routes indépendantes sans Header/Footer global */}
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/verification" element={<Verification />} />
      <Route path="/mot-de-passe-oublie" element={<ReinitialisationMotDePasse />} />
      <Route path="/publier" element={<Publier />} />
      <Route path="/tableau-de-bord" element={<TableauDeBord />} />
      <Route path="/messages" element={<TableauDeBord />} />
      <Route path="/achat/:id" element={<AchatLien />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/abonnements" element={<Abonnements />} />
      <Route path="/passer-pro" element={<PasserPro />} />
      <Route path="/paiement/succes" element={<PaiementSucces />} />
    </Routes>
  );
}
