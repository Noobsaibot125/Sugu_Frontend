/**
 * Données de démonstration en attendant le backend des annonces.
 * À remplacer par les appels API quand les écrans seront branchés.
 */
export const VENDEUR_MOCK = {
  id: 1,
  nom: 'Aminata Koné',
  avatar_url: null,
  ville: 'Abidjan',
  commune: 'Cocody',
  bio: "Vendeuse de confiance depuis 2022. Téléphones, accessoires et électronique. Remise en main propre à Cocody ou livraison sur tout Abidjan.",
  est_verifie: true,
  est_boutique: true,
  membre_depuis: 'mars 2022',
  note_moyenne: 4.8,
  nombre_avis: 127,
  annonces_actives: 24,
  ventes_realisees: 315,
  taux_reponse: '98 %',
  delai_reponse: '~15 min',
};

/** Répartition des notes du vendeur (5 à 1 étoiles), utilisée sur le profil vendeur. */
export const REPARTITION_NOTES_VENDEUR = [
  { etoiles: 5, nb: 108 },
  { etoiles: 4, nb: 13 },
  { etoiles: 3, nb: 4 },
  { etoiles: 2, nb: 1 },
  { etoiles: 1, nb: 1 },
];

export const CONSEILS_SECURITE = [
  'Privilégiez les rencontres dans des lieux publics et fréquentés.',
  "Vérifiez l'article avant de payer quoi que ce soit.",
  "Ne versez jamais d'acompte avant d'avoir vu le produit.",
  'Utilisez la messagerie Sugu pour garder une trace de vos échanges.',
];

export const MESSAGES_RAPIDES_VENDEUR = [
  'Bonjour, cet article est-il toujours disponible ?',
  'Quel est votre meilleur prix ?',
  'Peut-on se rencontrer à {commune} ?',
];

/** Communes proposées dans le sélecteur de la barre de recherche. */
export const COMMUNES = [
  "Toute la Côte d'Ivoire",
  'Cocody',
  'Yopougon',
  'Plateau',
  'Marcory',
  'Treichville',
  'Adjamé',
  'Abobo',
  'Bingerville',
  'Port-Bouët',
  'Koumassi',
  'Attécoubé',
];

export const RECHERCHES_POPULAIRES = ['iPhone', 'Toyota', 'Terrain Bingerville', 'Chambre à louer', 'Réfrigérateur', 'Groupe électrogène'];

export const CATEGORIES_MOCK = [
  { id: 'electronique', icone: '📱', label: 'Électronique & Informatique', nombre: '48 200' },
  { id: 'vehicules', icone: '🚗', label: 'Véhicules', nombre: '32 100' },
  { id: 'immobilier', icone: '🏠', label: 'Immobilier', nombre: '26 400' },
  { id: 'mode', icone: '👗', label: 'Mode', nombre: '61 800' },
  { id: 'maison', icone: '🛋️', label: 'Maison', nombre: '39 500' },
  { id: 'services', icone: '🛠️', label: 'Services', nombre: '18 300' },
  { id: 'emploi', icone: '💼', label: 'Emploi', nombre: '9 100' },
];

/** Annonces mises en avant (boutiques Pro) affichées sur l'accueil. */
export const ANNONCES_VEDETTES = [
  { id: 101, titre: 'Appartement standing 3 pièces', prix: 25000000, image: null, image_label: '[ photo immobilier ]', ville: 'Cocody Riviera', statut: 'active', publie_depuis: 'il y a 3h', badge: { label: 'À visiter', tone: 'neuf' } },
  { id: 102, titre: 'Mercedes Classe C 2019', prix: 18500000, image: null, image_label: '[ photo véhicule ]', ville: 'Marcory', statut: 'active', publie_depuis: 'il y a 5h', badge: { label: 'Occasion', tone: 'occasion' } },
  { id: 103, titre: 'iPhone 15 Pro Max 512 Go', prix: 950000, image: null, image_label: '[ photo produit ]', ville: 'Plateau', statut: 'active', publie_depuis: 'il y a 1h', badge: { label: 'Neuf', tone: 'neuf' } },
  { id: 104, titre: 'Terrain 500 m² titré (ACD)', prix: 15000000, image: null, image_label: '[ photo terrain ]', ville: 'Bingerville', statut: 'active', publie_depuis: 'il y a 8h', badge: { label: 'Titré', tone: 'primary' } },
];

/** Annonces récentes tous vendeurs confondus, affichées sur l'accueil. */
export const ANNONCES_RECENTES = [
  { id: 201, titre: 'iPhone 13 Pro 256 Go', prix: 385000, image: null, image_label: '[ photo produit ]', ville: 'Cocody', statut: 'active', publie_depuis: 'il y a 2h', badge: { label: 'Neuf', tone: 'neuf' } },
  { id: 202, titre: 'Toyota Corolla 2016', prix: 6800000, image: null, image_label: '[ photo véhicule ]', ville: 'Yopougon', statut: 'active', publie_depuis: 'il y a 4h', badge: { label: 'Occasion', tone: 'occasion' } },
  { id: 203, titre: "Canapé d'angle 5 places", prix: 220000, image: null, image_label: '[ photo meuble ]', ville: 'Marcory', statut: 'active', publie_depuis: 'il y a 6h', badge: { label: 'Occasion', tone: 'occasion' } },
  { id: 204, titre: 'Villa 4 pièces à louer', prix: 450000, periode: 'mois', image: null, image_label: '[ photo immobilier ]', ville: 'Cocody Angré', statut: 'active', publie_depuis: 'il y a 7h', badge: { label: 'À louer', tone: 'accent' } },
  { id: 205, titre: 'MacBook Air M2 8/256', prix: 720000, image: null, image_label: '[ photo produit ]', ville: 'Plateau', statut: 'active', publie_depuis: 'il y a 9h', badge: { label: 'Neuf', tone: 'neuf' } },
  { id: 206, titre: 'Robe wax sur mesure', prix: 25000, image: null, image_label: '[ photo mode ]', ville: 'Treichville', statut: 'active', publie_depuis: 'il y a 11h', badge: { label: 'Neuf', tone: 'neuf' } },
  { id: 207, titre: 'Réfrigérateur Samsung 2 portes', prix: 180000, image: null, image_label: '[ photo électroménager ]', ville: 'Adjamé', statut: 'active', publie_depuis: 'il y a 13h', badge: { label: 'Occasion', tone: 'occasion' } },
  { id: 208, titre: 'Groupe électrogène 3,5 kVA', prix: 320000, image: null, image_label: '[ photo produit ]', ville: 'Abobo', statut: 'active', publie_depuis: 'il y a 1j', badge: { label: 'Neuf', tone: 'neuf' } },
];

export const STATS_MOCK = [
  { valeur: '1,2 M+', libelle: 'annonces publiées' },
  { valeur: '850 K+', libelle: 'utilisateurs actifs' },
  { valeur: '32', libelle: 'communes couvertes' },
  { valeur: '15 K+', libelle: 'professionnels vérifiés' },
];

export const PIED_DE_PAGE = {
  categories: ['Électronique', 'Véhicules', 'Immobilier', 'Mode & Beauté', 'Maison & Jardin', 'Services'],
  aPropos: ['Qui sommes-nous', 'Boutique Pro', 'Sécurité & confiance', 'Blog', 'Carrières'],
  aide: ["Centre d'aide", 'Contactez-nous', 'Signaler une annonce', 'Conditions générales', 'Mentions légales'],
};

export const ANNONCES_MOCK = [
  { id: 1, titre: 'iPhone 13 128 Go — état impeccable, facture disponible', prix: 285000, image: null, categorie: 'Téléphones', ville: 'Abidjan', commune: 'Cocody', etat: 'tres_bon', statut: 'active', publie_depuis: 'il y a 2 h' },
  { id: 2, titre: 'Samsung Galaxy A54 5G neuf scellé', prix: 195000, image: null, categorie: 'Téléphones', ville: 'Abidjan', commune: 'Cocody', etat: 'neuf', statut: 'active', publie_depuis: 'hier' },
  { id: 3, titre: 'AirPods Pro 2ᵉ génération, authentiques', prix: 145000, image: null, categorie: 'Accessoires', ville: 'Abidjan', commune: 'Cocody', etat: 'neuf', statut: 'active', publie_depuis: 'il y a 3 j' },
  { id: 4, titre: 'MacBook Air M1 2020 — 8 Go / 256 Go', prix: 450000, image: null, categorie: 'Ordinateurs', ville: 'Abidjan', commune: 'Cocody', etat: 'bon', statut: 'active', publie_depuis: 'il y a 5 j' },
  { id: 5, titre: 'Montre connectée Huawei Watch GT 4', prix: 85000, image: null, categorie: 'Accessoires', ville: 'Abidjan', commune: 'Cocody', etat: 'tres_bon', statut: 'vendue', publie_depuis: 'il y a 1 sem.' },
  { id: 6, titre: 'Enceinte JBL Charge 5 — garantie 6 mois', prix: 62000, image: null, categorie: 'Accessoires', ville: 'Abidjan', commune: 'Cocody', etat: 'neuf', statut: 'active', publie_depuis: 'il y a 1 sem.' },
];

export const AVIS_MOCK = [
  { id: 1, auteur: 'Yao Kouassi', note: 5, date: 'il y a 3 jours', achat_confirme: true, commentaire: 'Transaction rapide et téléphone conforme à la description. Je recommande vivement !' },
  { id: 2, auteur: 'Mariam Diabaté', note: 5, date: 'il y a 1 semaine', achat_confirme: true, commentaire: 'Très professionnelle, produit neuf scellé comme annoncé. Livraison le jour même à Yopougon.' },
  { id: 3, auteur: 'Serge N’Guessan', note: 4, date: 'il y a 2 semaines', achat_confirme: false, commentaire: 'Bon vendeur, léger retard au rendez-vous mais produit nickel.' },
];
