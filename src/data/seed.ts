import { Vehicule, Chauffeur, TicketCarburant, Maintenance, Mission, Infraction, StationInterne, Document, BudgetMensuel, Prestataire } from '../types';
import { nanoid } from 'nanoid';

export const mockVehicules: Vehicule[] = [
  { 
    id: nanoid(), 
    immatriculation: '12345-A-7', 
    marque: 'Mercedes-Benz', 
    modele: 'Actros 2545', 
    anneeAcquisition: 2021, 
    poids: 18, 
    typeMoteur: 'diesel', 
    kilometrageActuel: 142500, 
    status: 'disponible', 
    documentStatus: 'valide', 
    outillage: [
      { id: 'tool-1', nom: 'Cric hydraulique télescopique 20 Tonnes', quantite: 1, dateAjout: '2024-01-15', status: 'present' },
      { id: 'tool-2', nom: 'Clé démonte-roue et rallonge dynamométrique', quantite: 1, dateAjout: '2024-01-15', status: 'present' },
      { id: 'tool-3', nom: 'Gilets haute visibilité fluorescent (Lot de 2)', quantite: 2, dateAjout: '2024-01-15', status: 'present' },
      { id: 'tool-4', nom: 'Triangles de présignalisation renforcés', quantite: 2, dateAjout: '2024-01-15', status: 'present' },
      { id: 'tool-5', nom: 'Extincteur 6kg à poudre polyvalente ABC', quantite: 1, dateAjout: '2024-01-15', status: 'present' },
      { id: 'tool-6', nom: 'Câbles de démarrage poids lourd 50mm² 5m', quantite: 1, dateAjout: '2024-01-15', status: 'present' },
      { id: 'tool-7', nom: 'Boîte de secours médical premiers soins', quantite: 1, dateAjout: '2024-01-15', status: 'present' },
      { id: 'tool-8', nom: 'Lampe baladeuse rechargeable LED étanche', quantite: 1, dateAjout: '2024-02-10', status: 'present' }
    ], 
    parc: 'Afro Négoce', 
    createdAt: new Date().toISOString() 
  },
  { 
    id: nanoid(), 
    immatriculation: '67890-B-7', 
    marque: 'Volvo', 
    modele: 'FH 500', 
    anneeAcquisition: 2020, 
    poids: 20, 
    typeMoteur: 'diesel', 
    kilometrageActuel: 198700, 
    status: 'en_mission', 
    documentStatus: 'valide', 
    outillage: [
      { id: 'tool-9', nom: 'Cric hydraulique 15T', quantite: 1, dateAjout: '2024-02-01', status: 'present' },
      { id: 'tool-10', nom: 'Clé démonte-roue', quantite: 1, dateAjout: '2024-02-01', status: 'present' },
      { id: 'tool-11', nom: 'Gilet haute visibilité', quantite: 2, dateAjout: '2024-02-01', status: 'present' },
      { id: 'tool-12', nom: 'Triangle de sécurité', quantite: 2, dateAjout: '2024-02-01', status: 'present' },
      { id: 'tool-13', nom: 'Extincteur 6kg ABC', quantite: 1, dateAjout: '2024-02-01', status: 'present' },
      { id: 'tool-14', nom: 'Flexible de gonflage avec manomètre', quantite: 1, dateAjout: '2024-03-01', status: 'present' }
    ], 
    parc: 'Chakirine Gaz', 
    createdAt: new Date().toISOString() 
  },
  { id: nanoid(), immatriculation: '11111-C-5', marque: 'MAN', modele: 'TGX 18.480', anneeAcquisition: 2022, poids: 18, typeMoteur: 'diesel', kilometrageActuel: 87300, status: 'en_maintenance', documentStatus: 'expire_bientot', outillage: [], parc: 'Afro Négoce', createdAt: new Date().toISOString() },
  { id: nanoid(), immatriculation: '22222-D-5', marque: 'Renault Trucks', modele: 'T 480', anneeAcquisition: 2019, poids: 17, typeMoteur: 'diesel', kilometrageActuel: 267800, status: 'disponible', documentStatus: 'valide', outillage: [], parc: 'Chakirine Gaz', createdAt: new Date().toISOString() },
  { id: nanoid(), immatriculation: '33333-E-6', marque: 'Scania', modele: 'R 500', anneeAcquisition: 2021, poids: 19, typeMoteur: 'diesel', kilometrageActuel: 156200, status: 'disponible', documentStatus: 'valide', outillage: [], parc: 'Afro Négoce', createdAt: new Date().toISOString() },
  { id: nanoid(), immatriculation: '44444-F-6', marque: 'DAF', modele: 'XF 480', anneeAcquisition: 2020, poids: 18, typeMoteur: 'diesel', kilometrageActuel: 189400, status: 'en_mission', documentStatus: 'valide', outillage: [], parc: 'Chakirine Gaz', createdAt: new Date().toISOString() },
  { id: nanoid(), immatriculation: '55555-G-4', marque: 'Mercedes-Benz', modele: 'Arocs 3348', anneeAcquisition: 2018, poids: 22, typeMoteur: 'diesel', kilometrageActuel: 312600, status: 'immobilise', documentStatus: 'expire', outillage: [], parc: 'Afro Négoce', createdAt: new Date().toISOString() },
  { id: nanoid(), immatriculation: '66666-H-4', marque: 'Volvo', modele: 'FM 420', anneeAcquisition: 2022, poids: 16, typeMoteur: 'diesel', kilometrageActuel: 64100, status: 'disponible', documentStatus: 'valide', outillage: [], parc: 'Chakirine Gaz', createdAt: new Date().toISOString() },
  { id: nanoid(), immatriculation: '77777-I-3', marque: 'MAN', modele: 'TGM 18.290', anneeAcquisition: 2019, poids: 14, typeMoteur: 'diesel', kilometrageActuel: 231900, status: 'disponible', documentStatus: 'valide', outillage: [], parc: 'Afro Négoce', createdAt: new Date().toISOString() },
  { id: nanoid(), immatriculation: '88888-J-3', marque: 'DAF', modele: 'LF 280', anneeAcquisition: 2023, poids: 12, typeMoteur: 'diesel', kilometrageActuel: 28400, status: 'disponible', documentStatus: 'valide', outillage: [], parc: 'Chakirine Gaz', createdAt: new Date().toISOString() },
];

export const mockChauffeurs: Chauffeur[] = [
  { id: nanoid(), nom: 'Benali', prenom: 'Hassan', cin: 'AB123456', dateNaissance: '1980-05-12', adresse: 'Casablanca', telephone: '0612345678', contactUrgenceNom: 'Fatima Benali', contactUrgenceTel: '0687654321', numeroPermis: 'P123456', categoriePermis: 'EC', dateExpirationPermis: '2028-05-12', dateCertificatMedical: '2023-01-10', dateExpirationCertificatMedical: '2025-01-10', numeroCarte: 'C123', dateExpirationCarte: '2027-01-01', dateEmbauche: '2018-03-15', status: 'actif', score: 85, createdAt: new Date().toISOString() },
  { id: nanoid(), nom: 'El Mansouri', prenom: 'Youssef', cin: 'CD789012', dateNaissance: '1985-08-22', adresse: 'Rabat', telephone: '0623456789', contactUrgenceNom: 'Amina El Mansouri', contactUrgenceTel: '0698765432', numeroPermis: 'P789012', categoriePermis: 'EC', dateExpirationPermis: '2026-08-22', dateCertificatMedical: '2024-02-15', dateExpirationCertificatMedical: '2026-02-15', numeroCarte: 'C456', dateExpirationCarte: '2028-02-01', dateEmbauche: '2019-06-20', status: 'actif', score: 92, createdAt: new Date().toISOString() },
];

export const mockStationInterne: StationInterne = {
  capacite: 10000,
  stockActuel: 1850,
  historique: []
};

export const mockBudgets: BudgetMensuel[] = [
  { id: nanoid(), mois: '2025-03', categorie: 'carburant', montantAlloue: 120000, montantDepense: 95000 },
  { id: nanoid(), mois: '2025-03', categorie: 'maintenance', montantAlloue: 80000, montantDepense: 71000 },
  { id: nanoid(), mois: '2025-03', categorie: 'pneus', montantAlloue: 30000, montantDepense: 12000 },
  { id: nanoid(), mois: '2025-03', categorie: 'infractions', montantAlloue: 10000, montantDepense: 8500 },
];
