export type Role = 'super_admin' | 'admin' | 'chef_de_parc' | 'vendeur_comptoir' | 'stock_superviseur'

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  password?: string
  role: Role
  avatarInitials: string
  createdAt: string
}

export type VehiculeStatus = 'disponible' | 'en_mission' | 'en_maintenance' | 'immobilise'
export type DocumentStatus = 'valide' | 'expire_bientot' | 'expire'
export type TypeMoteur = 'diesel' | 'essence' | 'electrique'

export type ParcVehicule = string;

export interface Vehicule {
  id: string
  immatriculation: string
  marque: string
  modele: string
  anneeAcquisition: number
  poids: number
  typeMoteur: TypeMoteur
  cylindree?: number
  numeroChassis?: string
  kilometrageActuel: number
  prixAchat?: number
  outillage: OutilBoite[]
  chauffeurAssigneId?: string
  status: VehiculeStatus
  documentStatus: DocumentStatus
  isCDC?: boolean
  parc: ParcVehicule
  createdAt: string
}

export interface OutilBoite {
  id: string
  nom: string
  quantite: number
  dateAjout: string
  dateRetrait?: string
  status: 'present' | 'retire'
}

export type ChauffeurStatus = 'actif' | 'conge' | 'suspendu'
export type CategoriePermis = 'B' | 'C' | 'D' | 'EC' | 'C1' | 'C1E'

export interface Chauffeur {
  id: string
  nom: string
  prenom: string
  cin: string
  dateNaissance?: string
  adresse?: string
  telephone: string
  email?: string
  contactUrgenceNom?: string
  contactUrgenceTel?: string
  numeroPermis?: string
  categoriePermis: CategoriePermis
  dateExpirationPermis?: string
  dateCertificatMedical?: string
  dateExpirationCertificatMedical?: string
  numeroCarte?: string
  dateExpirationCarte?: string
  dateEmbauche: string
  status: ChauffeurStatus
  vehiculeAssigneId?: string
  score: number
  createdAt: string
}

export type TypeDocument =
  | 'assurance' | 'visite_technique' | 'vignette' | 'carte_grise' | 'certificat_circulation'
  | 'permis_conduire' | 'certificat_medical' | 'carte_professionnelle'
  | 'visite_medicale' | 'formation_continue' | 'carte_carburant'
  | 'assurance_marchandise' | 'licence_transport' | 'autre'

export interface Document {
  id: string
  entiteId: string
  entiteType: 'vehicule' | 'chauffeur'
  type: TypeDocument
  reference?: string
  dateEmission: string
  dateExpiration: string
  prestataire?: string
  cout?: number
  fichierUrl?: string
  notes?: string
  status: DocumentStatus
}

export type LieuRavitaillement = 'interne' | 'externe'
export type TypeCarburant = 'diesel' | 'essence'

export interface TicketCarburant {
  id: string
  reference: string
  vehiculeId: string
  chauffeurId: string
  dateHeure: string
  kilometrageAuPlein: number
  kilometragePrecedent: number
  volume: number
  prixParLitre: number
  coutTotal: number
  typeCarburant: TypeCarburant
  lieu: LieuRavitaillement
  prestataireId?: string
  lPour100km?: number
  notes?: string
  createdAt: string
}

export interface StationInterne {
  capacite: number
  stockActuel: number
  historique: ApprovisionnementStation[]
}

export interface ApprovisionnementStation {
  id: string
  date: string
  volume: number
  fournisseur: string
  prixParLitre: number
  coutTotal: number
}

export type TypeMaintenance = 'preventive' | 'corrective' | 'urgence'
export type StatusMaintenance = 'planifiee' | 'en_cours' | 'terminee' | 'annulee'

export interface Maintenance {
  id: string
  reference: string
  vehiculeId: string
  type: TypeMaintenance
  status: StatusMaintenance
  prestataireId?: string
  prestataireNom?: string
  technicien?: string
  dateDebut: string
  dateFinEstimee: string
  dateFinReelle?: string
  pieces: PieceMaintenance[]
  coutMainOeuvre: number
  coutTotal: number
  notes?: string
  recommandations?: string
  createdAt: string
}

export interface PieceMaintenance {
  id: string
  designation: string
  description?: string
  quantite: number
  coutUnitaire: number
  sousTotal: number
}

export type StatusMission = 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
export type TypeChargement = 'marchandises' | 'materiaux' | 'liquides' | 'autre'

export interface Mission {
  id: string
  reference: string
  vehiculeId: string
  chauffeurId: string
  depart: string
  destination: string
  dateDepartPlanifiee: string
  dateRetourPlanifiee: string
  dateDepartReelle?: string
  dateRetourReelle?: string
  distanceEstimee: number
  distanceReelle?: number
  typeChargement: TypeChargement
  descriptionCargaison?: string
  status: StatusMission
  incidents?: string
  noteChauffeur?: number
  createdAt: string
}

export type PositionPneu = 'AVG' | 'AVD' | 'ARG1' | 'ARG2' | 'ARD1' | 'ARD2' | 'SECOURS'
export type StatusPneu = 'bon' | 'use' | 'critique' | 'remplace'

export interface Pneu {
  id: string
  vehiculeId: string
  position: PositionPneu
  marque: string
  modele: string
  numeroSerie: string
  dateMontage: string
  kilometrageAuMontage: number
  dureeVieEstimee: number
  kilometrageActuel: number
  usurePourcentage: number
  status: StatusPneu
  cout: number
  estActif: boolean
}

export type TypeInfraction =
  | 'excès_vitesse' | 'feu_rouge' | 'surcharge' | 'stationnement'
  | 'documents' | 'téléphone' | 'autre'
export type StatusPaiement = 'impayee' | 'payee' | 'contestee'

export interface Infraction {
  id: string
  chauffeurId: string
  vehiculeId: string
  date: string
  type: TypeInfraction
  montant: number
  autoritéEmettrice: string
  referencePV: string
  statusPaiement: StatusPaiement
  datePaiement?: string
  notes?: string
  createdAt: string
}

export type TypePrestataire = 'station_carburant' | 'garage' | 'pneus' | 'administration' | 'autre'

export interface Prestataire {
  id: string
  nom: string
  type: TypePrestataire
  ville: string
  adresse: string
  contactNom: string
  telephone: string
  email?: string
  referenceContrat?: string
  dateExpirationContrat?: string
  totalDepense: number
  createdAt: string
}

export type CategorieBudget = 'carburant' | 'maintenance' | 'pneus' | 'infractions' | 'autre'

export interface BudgetMensuel {
  id: string
  mois: string
  categorie: CategorieBudget
  montantAlloue: number
  montantDepense: number
  vehiculeId?: string
}

export type SeveriteNotification = 'critique' | 'avertissement' | 'info'

export interface Notification {
  id: string
  titre: string
  description: string
  severite: SeveriteNotification
  lien?: string
  entiteId?: string
  lu: boolean
  createdAt: string
}

export type ActionAudit = 'CREATE' | 'UPDATE' | 'DELETE'

export interface EntreeAudit {
  id: string
  timestamp: string
  userId: string
  userNom: string
  userRole: Role
  action: ActionAudit
  module: string
  referenceRecord: string
  avant?: Record<string, unknown>
  apres?: Record<string, unknown>
}

export interface LeasingContrat {
  id: string;
  vehiculeId: string;
  organisme: string;
  referenceContrat: string;
  dateDebut: string;
  dateFin: string;
  montantTotal: number;
  montantMensuel: number;
  dureeMois: number;
  jourPrelevement: number;
  fichierUrl?: string;
  notes?: string;
  createdAt: string;
}
