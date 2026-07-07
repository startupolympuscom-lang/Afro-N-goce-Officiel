import React, { useState, useEffect } from 'react';
import { 
  Truck as TruckIcon, 
  Fuel as FuelIcon, 
  Droplet as DropletIcon, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  Search, 
  Calendar, 
  Check, 
  X, 
  Gauge, 
  Bell, 
  Trash2, 
  Sliders, 
  CheckCircle,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';

// Interfaces based on the user logic requirements
interface Camion {
  id: string;
  immatriculation: string;
  modele: string;
  kilometrageActuel: number;
  prochaineVidange: number;
  intervalleDefaut: number; // e.g. 10000 km
}

interface Ravitaillement {
  id: string;
  camionId: string;
  date: string;
  litres: number;
  prixTotal: number;
  kilometrageEnregistre: number;
}

interface Vidange {
  id: string;
  camionId: string;
  date: string;
  kilometrage: number;
  intervalle: number;
  prochainKilometrage: number;
  prixHuile: number;
  typeHuile: string;
  filtreHuileActive: boolean;
  filtreHuilePrix: number;
  filtreGasoilActive: boolean;
  filtreGasoilPrix: number;
  filtreAirActive: boolean;
  filtreAirPrix: number;
  prixTotal: number;
  notes?: string;
}

// Initial mock data to make the application immediately interactive and useful
const INITIAL_CAMIONS: Camion[] = [
  {
    id: 'c1',
    immatriculation: 'AB-123-CD',
    modele: 'Volvo FH16 (Tractor)',
    kilometrageActuel: 145200,
    prochaineVidange: 150000, // Safe (Last change at 140000, interval 10000)
    intervalleDefaut: 10000
  },
  {
    id: 'c2',
    immatriculation: 'EF-456-GH',
    modele: 'Scania R500 (V8)',
    kilometrageActuel: 288500,
    prochaineVidange: 285000, // Alarm! (Last change at 275000, mileage is now 288500 -> surpassed by 3500 km)
    intervalleDefaut: 10000
  },
  {
    id: 'c3',
    immatriculation: 'IJ-789-KL',
    modele: 'Mercedes Actros',
    kilometrageActuel: 98120,
    prochaineVidange: 95000, // Alarm! (Last change at 85000, current mileage 98120 -> surpassed by 3120 km)
    intervalleDefaut: 10000
  },
  {
    id: 'c4',
    immatriculation: 'MN-012-OP',
    modele: 'MAN TGX',
    kilometrageActuel: 412100,
    prochaineVidange: 415000, // Safe (Last change at 407000, interval 8000)
    intervalleDefaut: 8000
  }
];

const INITIAL_RAVITAILLEMENTS: Ravitaillement[] = [
  { id: 'r1', camionId: 'c1', date: '2026-07-01', litres: 350, prixTotal: 630, kilometrageEnregistre: 143500 },
  { id: 'r2', camionId: 'c2', date: '2026-07-02', litres: 400, prixTotal: 720, kilometrageEnregistre: 286200 },
  { id: 'r3', camionId: 'c3', date: '2026-07-04', litres: 280, prixTotal: 504, kilometrageEnregistre: 96800 },
  { id: 'r4', camionId: 'c4', date: '2026-07-05', litres: 380, prixTotal: 684, kilometrageEnregistre: 411500 },
  { id: 'r5', camionId: 'c2', date: '2026-07-06', litres: 410, prixTotal: 738, kilometrageEnregistre: 288500 } // This refill set the current mileage to 288500
];

const INITIAL_VIDANGES: Vidange[] = [
  {
    id: 'v1',
    camionId: 'c1',
    date: '2026-06-15',
    kilometrage: 140000,
    intervalle: 10000,
    prochainKilometrage: 150000,
    prixHuile: 180,
    typeHuile: '15W40 (Semi-Synthétique)',
    filtreHuileActive: true,
    filtreHuilePrix: 35,
    filtreGasoilActive: true,
    filtreGasoilPrix: 45,
    filtreAirActive: false,
    filtreAirPrix: 0,
    prixTotal: 260
  },
  {
    id: 'v2',
    camionId: 'c2',
    date: '2026-05-10',
    kilometrage: 275000,
    intervalle: 10000,
    prochainKilometrage: 285000,
    prixHuile: 195,
    typeHuile: '10W40 (Synthétique Camion)',
    filtreHuileActive: true,
    filtreHuilePrix: 40,
    filtreGasoilActive: false,
    filtreGasoilPrix: 0,
    filtreAirActive: false,
    filtreAirPrix: 0,
    prixTotal: 235
  },
  {
    id: 'v3',
    camionId: 'c3',
    date: '2026-05-20',
    kilometrage: 85000,
    intervalle: 10000,
    prochainKilometrage: 95000,
    prixHuile: 170,
    typeHuile: '15W40 (Standard)',
    filtreHuileActive: true,
    filtreHuilePrix: 30,
    filtreGasoilActive: true,
    filtreGasoilPrix: 40,
    filtreAirActive: true,
    filtreAirPrix: 50,
    prixTotal: 290
  }
];

// PDF receipt generation helper function
const downloadVidangeTicket = (v: Vidange, c: Camion) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 190]
  });

  // Dark slate header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 80, 26, 'F');

  // Title & Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FLEETOPS', 40, 10, { align: 'center' });
  
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175); // slate-400
  doc.text('TICKET DE MAINTENANCE VIDANGE', 40, 16, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text(`ID Ticket: ${v.id}`, 40, 21, { align: 'center' });

  // Body elements color
  doc.setTextColor(30, 41, 59); // slate-800

  // 1. Truck Details Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('VÉHICULE & INFOS', 6, 33);
  doc.setLineWidth(0.25);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(6, 35, 74, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Immatriculation:', 6, 41);
  doc.setFont('helvetica', 'bold');
  doc.text(c.immatriculation, 32, 41);

  doc.setFont('helvetica', 'normal');
  doc.text('Modèle:', 6, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(c.modele.length > 22 ? c.modele.substring(0, 22) + '...' : c.modele, 32, 46);

  // 2. Mileage & Next Due Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('KILOMÉTRAGE & ÉCHÉANCE', 6, 55);
  doc.line(6, 57, 74, 57);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Kilométrage actuel:', 6, 63);
  doc.setFont('helvetica', 'bold');
  doc.text(`${v.kilometrage.toLocaleString()} km`, 38, 63);

  doc.setFont('helvetica', 'normal');
  doc.text('Intervalle prévu:', 6, 68);
  doc.setFont('helvetica', 'bold');
  doc.text(`+ ${v.intervalle.toLocaleString()} km`, 38, 68);

  doc.setFont('helvetica', 'normal');
  doc.text('Prochaine vidange:', 6, 73);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`${v.prochainKilometrage.toLocaleString()} km`, 38, 73);
  doc.setTextColor(30, 41, 59); // reset slate-800

  // 3. Oil Type & Prices Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("TYPE D'HUILE & BASE", 6, 82);
  doc.line(6, 84, 74, 84);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Type d'huile utilisé:", 6, 90);
  doc.setFont('helvetica', 'bold');
  doc.text(v.typeHuile || '15W40 (Standard)', 38, 90);

  doc.setFont('helvetica', 'normal');
  doc.text("Prix de l'huile:", 6, 95);
  doc.setFont('helvetica', 'bold');
  doc.text(`${v.prixHuile.toLocaleString()} €`, 38, 95);

  // 4. Filters Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FILTRES REMPLACÉS', 6, 104);
  doc.line(6, 106, 74, 106);

  let filterY = 111;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Filtre à huile
  doc.text('Filtre à Huile:', 6, filterY);
  doc.setFont('helvetica', 'bold');
  if (v.filtreHuileActive) {
    doc.text(`Oui (${v.filtreHuilePrix} €)`, 38, filterY);
  } else {
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Non', 38, filterY);
    doc.setTextColor(30, 41, 59); // reset
  }
  filterY += 5;

  // Filtre à gasoil
  doc.setFont('helvetica', 'normal');
  doc.text('Filtre à Gasoil:', 6, filterY);
  doc.setFont('helvetica', 'bold');
  if (v.filtreGasoilActive) {
    doc.text(`Oui (${v.filtreGasoilPrix} €)`, 38, filterY);
  } else {
    doc.setTextColor(148, 163, 184);
    doc.text('Non', 38, filterY);
    doc.setTextColor(30, 41, 59);
  }
  filterY += 5;

  // Filtre à air
  doc.setFont('helvetica', 'normal');
  doc.text('Filtre à Air:', 6, filterY);
  doc.setFont('helvetica', 'bold');
  if (v.filtreAirActive) {
    doc.text(`Oui (${v.filtreAirPrix} €)`, 38, filterY);
  } else {
    doc.setTextColor(148, 163, 184);
    doc.text('Non', 38, filterY);
    doc.setTextColor(30, 41, 59);
  }
  filterY += 7;

  // 5. Total Section
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(5, filterY - 2, 70, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTAL PAYÉ:', 8, filterY + 4);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`${v.prixTotal.toLocaleString()} €`, 72, filterY + 4, { align: 'right' });
  doc.setTextColor(30, 41, 59); // reset

  filterY += 13;

  // Date and notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Date d'enregistrement: ${v.date}`, 6, filterY);
  filterY += 5;

  if (v.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Notes:', 6, filterY);
    const splitNotes = doc.splitTextToSize(v.notes, 68);
    doc.text(splitNotes, 6, filterY + 3.5);
    filterY += 3.5 + (splitNotes.length * 3);
  }

  // Footer bar code line / thanks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('* MERCI POUR VOTRE COOPÉRATION *', 40, 180, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Généré automatiquement par FleetOps', 40, 184, { align: 'center' });

  // Save PDF
  doc.save(`Ticket_Vidange_${c.immatriculation}_${v.date}.pdf`);
};

export default function App() {
  // --- Persistent Storage Hook ---
  const [camions, setCamions] = useState<Camion[]>(() => {
    const saved = localStorage.getItem('fleetops_camions');
    return saved ? JSON.parse(saved) : INITIAL_CAMIONS;
  });

  const [ravitaillements, setRavitaillements] = useState<Ravitaillement[]>(() => {
    const saved = localStorage.getItem('fleetops_ravitaillements');
    return saved ? JSON.parse(saved) : INITIAL_RAVITAILLEMENTS;
  });

  const [vidanges, setVidanges] = useState<Vidange[]>(() => {
    const saved = localStorage.getItem('fleetops_vidanges');
    return saved ? JSON.parse(saved) : INITIAL_VIDANGES;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('fleetops_camions', JSON.stringify(camions));
  }, [camions]);

  useEffect(() => {
    localStorage.setItem('fleetops_ravitaillements', JSON.stringify(ravitaillements));
  }, [ravitaillements]);

  useEffect(() => {
    localStorage.setItem('fleetops_vidanges', JSON.stringify(vidanges));
  }, [vidanges]);

  // --- Active Tab State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'camions' | 'carburant' | 'vidanges'>('dashboard');

  // --- Search Filter State ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Form & Modal States ---
  const [showAddCamionModal, setShowAddCamionModal] = useState(false);
  const [showAddFuelModal, setShowAddFuelModal] = useState(false);
  const [showAddVidangeModal, setShowAddVidangeModal] = useState(false);

  // --- Toast/Alert Message State ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // --- Form States for Camion ---
  const [newCamion, setNewCamion] = useState({
    immatriculation: '',
    modele: '',
    kilometrageActuel: '',
    intervalleDefaut: '10000'
  });

  // --- Form States for Fuel Refill ---
  const [newFuel, setNewFuel] = useState({
    camionId: '',
    date: new Date().toISOString().split('T')[0],
    litres: '',
    prixTotal: '',
    kilometrageEnregistre: ''
  });

  // --- Form States for Vidange ---
  const [newVidange, setNewVidange] = useState({
    camionId: '',
    date: new Date().toISOString().split('T')[0],
    kilometrage: '',
    intervalle: '10000',
    prixHuile: '',
    typeHuile: '15W40',
    // Filter toggles
    filtreHuileActive: false,
    filtreHuilePrix: '',
    filtreGasoilActive: false,
    filtreGasoilPrix: '',
    filtreAirActive: false,
    filtreAirPrix: '',
    notes: ''
  });

  // Automatically update suggested mileage when selecting a truck in Vidange or Fuel Form
  const handleVidangeCamionChange = (id: string) => {
    const selectedTruck = camions.find(c => c.id === id);
    if (selectedTruck) {
      setNewVidange(prev => ({
        ...prev,
        camionId: id,
        kilometrage: selectedTruck.kilometrageActuel.toString(),
        intervalle: selectedTruck.intervalleDefaut.toString()
      }));
    } else {
      setNewVidange(prev => ({ ...prev, camionId: id }));
    }
  };

  const handleFuelCamionChange = (id: string) => {
    const selectedTruck = camions.find(c => c.id === id);
    if (selectedTruck) {
      setNewFuel(prev => ({
        ...prev,
        camionId: id,
        kilometrageEnregistre: selectedTruck.kilometrageActuel.toString()
      }));
    } else {
      setNewFuel(prev => ({ ...prev, camionId: id }));
    }
  };

  // --- Handle Adding a Truck ---
  const handleAddCamionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamion.immatriculation || !newCamion.modele || !newCamion.kilometrageActuel) {
      triggerToast('Veuillez remplir tous les champs requis.', 'warning');
      return;
    }

    const km = parseInt(newCamion.kilometrageActuel);
    const interval = parseInt(newCamion.intervalleDefaut) || 10000;

    const truck: Camion = {
      id: 'c_' + Date.now(),
      immatriculation: newCamion.immatriculation.toUpperCase(),
      modele: newCamion.modele,
      kilometrageActuel: km,
      prochaineVidange: km + interval, // Initial recommendation
      intervalleDefaut: interval
    };

    setCamions(prev => [truck, ...prev]);
    setShowAddCamionModal(false);
    setNewCamion({ immatriculation: '', modele: '', kilometrageActuel: '', intervalleDefaut: '10000' });
    triggerToast(`Camion ${truck.immatriculation} ajouté avec succès !`);
  };

  // --- Handle Adding Fuel Refill ---
  const handleAddFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { camionId, date, litres, prixTotal, kilometrageEnregistre } = newFuel;

    if (!camionId || !litres || !prixTotal || !kilometrageEnregistre) {
      triggerToast('Veuillez remplir tous les champs du ravitaillement.', 'warning');
      return;
    }

    const kmLogged = parseInt(kilometrageEnregistre);
    const ltrs = parseFloat(litres);
    const totalCost = parseFloat(prixTotal);

    const selectedTruck = camions.find(c => c.id === camionId);
    if (!selectedTruck) return;

    if (kmLogged < selectedTruck.kilometrageActuel) {
      if (!window.confirm(`Attention: Le kilométrage saisi (${kmLogged} km) est inférieur au kilométrage actuel enregistré du camion (${selectedTruck.kilometrageActuel} km). Voulez-vous continuer ?`)) {
        return;
      }
    }

    const fuelRecord: Ravitaillement = {
      id: 'r_' + Date.now(),
      camionId,
      date,
      litres: ltrs,
      prixTotal: totalCost,
      kilometrageEnregistre: kmLogged
    };

    // Update truck current mileage based on this fuel refill
    setCamions(prev => prev.map(c => {
      if (c.id === camionId) {
        const updatedKm = Math.max(c.kilometrageActuel, kmLogged);
        const surpassed = updatedKm > c.prochaineVidange;
        if (surpassed) {
          // Trigger a reactive layout notification
          setTimeout(() => {
            triggerToast(`⚠️ ALARME : Le camion ${c.immatriculation} a dépassé son kilométrage de vidange (${updatedKm} km > ${c.prochaineVidange} km) !`, 'warning');
          }, 600);
        }
        return {
          ...c,
          kilometrageActuel: updatedKm
        };
      }
      return c;
    }));

    setRavitaillements(prev => [fuelRecord, ...prev]);
    setShowAddFuelModal(false);
    setNewFuel({
      camionId: '',
      date: new Date().toISOString().split('T')[0],
      litres: '',
      prixTotal: '',
      kilometrageEnregistre: ''
    });
    triggerToast(`Ravitaillement carburant enregistré. Kilométrage du camion mis à jour à ${kmLogged} km.`);
  };

  // --- Handle Adding Oil Change (Vidange) ---
  const handleAddVidangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { 
      camionId, date, kilometrage, intervalle, prixHuile, typeHuile,
      filtreHuileActive, filtreHuilePrix,
      filtreGasoilActive, filtreGasoilPrix,
      filtreAirActive, filtreAirPrix, notes
    } = newVidange;

    if (!camionId || !kilometrage || !prixHuile) {
      triggerToast("Veuillez renseigner le camion, le kilométrage et le prix de l'huile.", "warning");
      return;
    }

    const kmVidange = parseInt(kilometrage);
    const oilInterval = parseInt(intervalle) || 10000;
    const oilPrice = parseFloat(prixHuile);
    
    // Filter prices are calculated only if the filter checkbox is active (cochée)
    const fHuilePrice = filtreHuileActive ? (parseFloat(filtreHuilePrix) || 0) : 0;
    const fGasoilPrice = filtreGasoilActive ? (parseFloat(filtreGasoilPrix) || 0) : 0;
    const fAirPrice = filtreAirActive ? (parseFloat(filtreAirPrix) || 0) : 0;

    const totalCost = oilPrice + fHuilePrice + fGasoilPrice + fAirPrice;
    const nextOilChangeKm = kmVidange + oilInterval;

    const vidangeRecord: Vidange = {
      id: 'v_' + Date.now(),
      camionId,
      date,
      kilometrage: kmVidange,
      intervalle: oilInterval,
      prochainKilometrage: nextOilChangeKm,
      prixHuile: oilPrice,
      typeHuile: typeHuile || '15W40',
      filtreHuileActive,
      filtreHuilePrix: fHuilePrice,
      filtreGasoilActive,
      filtreGasoilPrix: fGasoilPrice,
      filtreAirActive,
      filtreAirPrix: fAirPrice,
      prixTotal: totalCost,
      notes: notes || undefined
    };

    // Update truck mileage and update next scheduled oil change (prochaineVidange)
    setCamions(prev => prev.map(c => {
      if (c.id === camionId) {
        return {
          ...c,
          // Set its mileage to at least the mileage of this oil change
          kilometrageActuel: Math.max(c.kilometrageActuel, kmVidange),
          prochaineVidange: nextOilChangeKm
        };
      }
      return c;
    }));

    setVidanges(prev => [vidangeRecord, ...prev]);
    setShowAddVidangeModal(false);
    
    // Reset form state
    setNewVidange({
      camionId: '',
      date: new Date().toISOString().split('T')[0],
      kilometrage: '',
      intervalle: '10000',
      prixHuile: '',
      typeHuile: '15W40',
      filtreHuileActive: false,
      filtreHuilePrix: '',
      filtreGasoilActive: false,
      filtreGasoilPrix: '',
      filtreAirActive: false,
      filtreAirPrix: '',
      notes: ''
    });

    // Automatically trigger PDF download of ticket
    const currentCamion = camions.find(c => c.id === camionId);
    if (currentCamion) {
      try {
        downloadVidangeTicket(vidangeRecord, currentCamion);
        triggerToast(`Vidange enregistrée avec succès. Votre ticket PDF a été téléchargé ! Prochaine vidange planifiée à ${nextOilChangeKm} km.`);
      } catch (err) {
        console.error("PDF download failed", err);
        triggerToast(`Vidange enregistrée avec succès. Prochaine vidange planifiée à ${nextOilChangeKm} km.`);
      }
    } else {
      triggerToast(`Vidange enregistrée avec succès. Prochaine vidange planifiée à ${nextOilChangeKm} km.`);
    }
  };

  // --- Deletion Handlers ---
  const deleteTruck = (id: string, immatriculation: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le camion ${immatriculation} ? Cela ne supprimera pas l'historique associé.`)) {
      setCamions(prev => prev.filter(c => c.id !== id));
      triggerToast(`Camion ${immatriculation} supprimé.`);
    }
  };

  const deleteFuelLog = (id: string) => {
    if (window.confirm("Supprimer ce reçu de carburant ?")) {
      setRavitaillements(prev => prev.filter(r => r.id !== id));
      triggerToast("Ravitaillement carburant supprimé.");
    }
  };

  const deleteVidangeLog = (id: string) => {
    if (window.confirm("Supprimer cette fiche de vidange ?")) {
      setVidanges(prev => prev.filter(v => v.id !== id));
      triggerToast("Fiche de vidange supprimée.");
    }
  };

  // --- Calculation of Alarm lists ---
  // A truck is in alarm state if its current mileage has surpassed its next scheduled oil change mileage
  const alarmCamions = camions.filter(c => c.kilometrageActuel > c.prochaineVidange);

  // --- Search Filtering ---
  const filteredCamions = camions.filter(c => 
    c.immatriculation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.modele.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTruckLabel = (id: string) => {
    const truck = camions.find(c => c.id === id);
    return truck ? `${truck.immatriculation} (${truck.modele})` : 'Camion inconnu';
  };

  // Compute stats
  const totalFuelSpend = ravitaillements.reduce((sum, r) => sum + r.prixTotal, 0);
  const totalVidangeSpend = vidanges.reduce((sum, v) => sum + v.prixTotal, 0);
  const totalLitres = ravitaillements.reduce((sum, r) => sum + r.litres, 0);

  // Live total price calculator for Vidange Form
  const calculatedVidangeFormTotal = () => {
    const oilPrice = parseFloat(newVidange.prixHuile) || 0;
    const fHuile = newVidange.filtreHuileActive ? (parseFloat(newVidange.filtreHuilePrix) || 0) : 0;
    const fGasoil = newVidange.filtreGasoilActive ? (parseFloat(newVidange.filtreGasoilPrix) || 0) : 0;
    const fAir = newVidange.filtreAirActive ? (parseFloat(newVidange.filtreAirPrix) || 0) : 0;
    return oilPrice + fHuile + fGasoil + fAir;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-900">
      
      {/* --- Top Global Header --- */}
      <header id="global_header" className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div id="brand_title_wrapper" className="flex items-center space-x-3">
          <div id="brand_logo" className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TruckIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 id="app_main_heading" className="text-xl font-bold tracking-tight text-white flex items-center">
              Fleet<span className="text-emerald-400 font-extrabold">Ops</span>
              <span className="ml-2.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 rounded-full border border-slate-700">v1.2</span>
            </h1>
            <p className="text-xs text-slate-400">Gestion de Flotte, Suivi Consommation & Maintenance</p>
          </div>
        </div>

        {/* Real-time alarm counter in header */}
        <div id="header_alarms_badge" className="flex items-center space-x-4">
          {alarmCamions.length > 0 && (
            <div id="alarm_badge_pill" className="flex items-center space-x-2 bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>{alarmCamions.length} {alarmCamions.length === 1 ? 'ALERTE DEPASSEE' : 'ALERTES DEPASSEES'}</span>
            </div>
          )}
          <div className="text-xs text-slate-400 font-mono hidden md:block">
            Mise à jour: {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </header>

      {/* --- Alert Banner if Oil Changes Surpassed --- */}
      {alarmCamions.length > 0 && (
        <div id="global_alarm_banner" className="bg-gradient-to-r from-red-950/90 to-amber-950/90 border-b border-red-500/30 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-100">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="font-semibold text-sm text-red-200">Alerte Kilométrage Vidange Dépassé !</p>
              <p className="text-xs text-red-300 mt-0.5">
                Les camions suivants ont dépassé le kilométrage maximal recommandé pour leur prochaine vidange d'huile :
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {alarmCamions.map(c => {
                  const depassement = c.kilometrageActuel - c.prochaineVidange;
                  return (
                    <span id={`alarm_pill_${c.id}`} key={c.id} className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs bg-red-500/20 text-red-200 font-mono border border-red-500/30">
                      <strong className="text-white">{c.immatriculation}</strong> 
                      <span>(+{depassement.toLocaleString()} km)</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center">
            <button
              id="action_solve_alarm_btn"
              onClick={() => {
                // Pre-populate vidange form with first alarmed truck
                if (alarmCamions.length > 0) {
                  handleVidangeCamionChange(alarmCamions[0].id);
                }
                setShowAddVidangeModal(true);
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-red-950 transition-all flex items-center space-x-1"
            >
              <DropletIcon className="w-3.5 h-3.5" />
              <span>Faire une vidange maintenant</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Main Workspace Grid --- */}
      <div id="main_workspace" className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <nav id="left_nav_column" className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-1">Navigation</p>
            <button
              id="tab_btn_dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Tableau de Bord</span>
            </button>
            <button
              id="tab_btn_camions"
              onClick={() => setActiveTab('camions')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'camions' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TruckIcon className="w-4 h-4 shrink-0" />
              <span>Camions ({camions.length})</span>
            </button>
            <button
              id="tab_btn_carburant"
              onClick={() => setActiveTab('carburant')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'carburant' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FuelIcon className="w-4 h-4 shrink-0" />
              <span>Carburant ({ravitaillements.length})</span>
            </button>
            <button
              id="tab_btn_vidanges"
              onClick={() => setActiveTab('vidanges')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'vidanges' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <DropletIcon className="w-4 h-4 shrink-0" />
              <span>Vidanges ({vidanges.length})</span>
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Actions Rapides</h3>
            <button
              id="action_add_camion_btn"
              onClick={() => setShowAddCamionModal(true)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Nouveau Camion</span>
            </button>
            <button
              id="action_add_fuel_btn"
              onClick={() => {
                if (camions.length > 0) {
                  handleFuelCamionChange(camions[0].id);
                }
                setShowAddFuelModal(true);
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Plein Carburant</span>
            </button>
            <button
              id="action_add_vidange_btn"
              onClick={() => {
                if (camions.length > 0) {
                  handleVidangeCamionChange(camions[0].id);
                }
                setShowAddVidangeModal(true);
              }}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Vidange</span>
            </button>
          </div>

          {/* Key Rule Note (Explaining user logic) */}
          <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-5 space-y-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Logique FleetOps</span>
            </div>
            <p className="leading-relaxed">
              1. <strong>Ravitaillement</strong>: Enregistrer un plein met à jour le dernier kilométrage du camion.
            </p>
            <p className="leading-relaxed">
              2. <strong>Calcul d'Alerte</strong>: Si le kilométrage actuel dépasse l'échéance de vidange, une alarme retentit visuellement.
            </p>
            <p className="leading-relaxed">
              3. <strong>Filtres</strong>: Cochez les filtres d'huile, gasoil ou air pour saisir leur prix individuel dans la vidange.
            </p>
          </div>
        </nav>

        {/* Workspace Display Area */}
        <main id="right_content_column" className="lg:col-span-3 space-y-6">
          
          {/* Toast Alert Banner */}
          {toast && (
            <div
              id="toast_alert_box"
              className={`p-4 rounded-xl border flex items-start justify-between transition-all ${
                toast.type === 'success' 
                  ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/40' 
                  : toast.type === 'warning'
                  ? 'bg-red-900/40 text-red-200 border-red-500/40'
                  : 'bg-blue-900/40 text-blue-200 border-blue-500/40'
              }`}
            >
              <div className="flex items-center space-x-3 text-sm">
                <Bell className="w-5 h-5 shrink-0" />
                <span>{toast.message}</span>
              </div>
              <button onClick={() => setToast(null)} className="p-0.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search bar inside right column */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {activeTab === 'dashboard' && 'Tableau de Bord Analytique'}
                {activeTab === 'camions' && 'Parc de Camions'}
                {activeTab === 'carburant' && 'Registre des Ravitaillements Carburant'}
                {activeTab === 'vidanges' && 'Fiches des Vidanges Effectuées'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {activeTab === 'dashboard' && "Statistiques, coûts de maintenance, et suivi d'alarme."}
                {activeTab === 'camions' && 'Suivi des camions actifs, kilométrage actuel et prochaines échéances.'}
                {activeTab === 'carburant' && 'Dépenses en carburant et enregistrement des relevés de kilométrage.'}
                {activeTab === 'vidanges' && "Historique complet des vidanges d'huile et remplacement des filtres."}
              </p>
            </div>

            {activeTab !== 'dashboard' && (
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="search_input_field"
                  type="text"
                  placeholder="Rechercher immatriculation/modèle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 transition-all"
                />
              </div>
            )}
          </div>

          {/* ==================== TAB 1: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div id="tab_pane_dashboard" className="space-y-6">
              
              {/* Core KPI Metrics Grid */}
              <div id="kpi_grid" className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div id="kpi_card_spend" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Dépenses Totales</span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white mt-3 font-mono">
                    {(totalFuelSpend + totalVidangeSpend).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1.5">
                    <span>Maint. : {totalVidangeSpend.toLocaleString('fr-FR')} €</span>
                    <span className="text-slate-600">•</span>
                    <span>Carb. : {totalFuelSpend.toLocaleString('fr-FR')} €</span>
                  </p>
                </div>

                <div id="kpi_card_alarms" className={`border p-5 rounded-2xl relative overflow-hidden ${
                  alarmCamions.length > 0 
                    ? 'bg-red-950/30 border-red-500/30 text-red-100' 
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider">Alarmes Vidange</span>
                    <div className={`p-2 rounded-xl ${alarmCamions.length > 0 ? 'bg-red-500/20 text-red-400 animate-bounce' : 'bg-slate-800 text-slate-500'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black mt-3 font-mono ${alarmCamions.length > 0 ? 'text-red-400' : 'text-white'}`}>
                    {alarmCamions.length}
                  </p>
                  <p className="text-xs mt-2 text-slate-400">
                    {alarmCamions.length > 0 ? "Camions dépassant l'échéance d'huile !" : "Aucun retard enregistré"}
                  </p>
                </div>

                <div id="kpi_card_litres" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Volume Carburant</span>
                    <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                      <FuelIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white mt-3 font-mono">
                    {totalLitres.toLocaleString('fr-FR')} L
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {ravitaillements.length} pleins de carburant effectués
                  </p>
                </div>

                <div id="kpi_card_trucks" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Camions Actifs</span>
                    <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                      <TruckIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white mt-3 font-mono">
                    {camions.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Véhicules de fret configurés
                  </p>
                </div>

              </div>

              {/* Status and Analytics grid */}
              <div id="dashboard_analytics_grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Gauge Panel: Next Maintenance Tracker */}
                <div id="maintenance_panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Gauge className="w-5 h-5 text-emerald-400" />
                      <span>Statut d'Usure d'Huile & Échéances</span>
                    </h3>
                    <span className="text-xs text-slate-400">Progression vers la vidange</span>
                  </div>

                  <div className="space-y-4">
                    {camions.map(c => {
                      // Calculate oil life remaining
                      const totalInterval = c.intervalleDefaut;
                      
                      // Find last oil change mileage to see starting point
                      const lastVidange = [...vidanges]
                        .filter(v => v.camionId === c.id)
                        .sort((a, b) => b.kilometrage - a.kilometrage)[0];
                        
                      const startingKm = lastVidange ? lastVidange.kilometrage : (c.prochaineVidange - c.intervalleDefaut);
                      const kmSinceLastChange = c.kilometrageActuel - startingKm;
                      const percentage = Math.max(0, Math.min(100, (kmSinceLastChange / totalInterval) * 100));
                      const isOver = c.kilometrageActuel > c.prochaineVidange;
                      const rem = c.prochaineVidange - c.kilometrageActuel;

                      return (
                        <div id={`truck_meter_${c.id}`} key={c.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-100 text-sm font-mono">{c.immatriculation}</span>
                                <span className="text-xs text-slate-400">({c.modele})</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Compteur : <strong className="text-slate-300 font-mono">{c.kilometrageActuel.toLocaleString()} km</strong>
                              </p>
                            </div>
                            <div className="text-right">
                              {isOver ? (
                                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                                  Dépassement de {Math.abs(rem).toLocaleString()} km
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  Prévu à {c.prochaineVidange.toLocaleString()} km ({rem.toLocaleString()} km restants)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress bar container */}
                          <div className="space-y-1">
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOver 
                                    ? 'bg-gradient-to-r from-red-600 to-red-400 w-full' 
                                    : percentage > 85
                                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                    : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>Dernière vidange : {startingKm.toLocaleString()} km</span>
                              <span>{Math.round(percentage)}% d'usure</span>
                              <span>Prochaine : {c.prochaineVidange.toLocaleString()} km</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Info & Logic summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <span>Dernières Activités</span>
                  </h3>
                  
                  <div className="space-y-3.5">
                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Récents Ravitaillements</p>
                    {ravitaillements.slice(0, 3).map(r => (
                      <div id={`recent_fuel_${r.id}`} key={r.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-200">{getTruckLabel(r.camionId).split(' ')[0]}</span>
                          <p className="text-slate-500 text-[10px] flex items-center space-x-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{r.date}</span>
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-white font-bold">{r.prixTotal} €</span>
                          <p className="text-slate-500 text-[10px]">{r.litres}L • {r.kilometrageEnregistre.toLocaleString()} km</p>
                        </div>
                      </div>
                    ))}

                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider pt-2">Récentes Vidanges</p>
                    {vidanges.slice(0, 2).map(v => (
                      <div id={`recent_vidange_${v.id}`} key={v.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-200">{getTruckLabel(v.camionId).split(' ')[0]}</span>
                          <p className="text-slate-500 text-[10px] flex items-center space-x-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{v.date}</span>
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-emerald-400 font-bold">{v.prixTotal} €</span>
                          <p className="text-slate-500 text-[10px]">{v.kilometrage.toLocaleString()} km</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==================== TAB 2: CAMIONS ==================== */}
          {activeTab === 'camions' && (
            <div id="tab_pane_camions" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {filteredCamions.length} camion(s) trouvé(s)
                </p>
                <button
                  id="tab_camions_add_btn"
                  onClick={() => setShowAddCamionModal(true)}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un Camion</span>
                </button>
              </div>

              <div id="camions_list_grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCamions.map(c => {
                  const hasAlarm = c.kilometrageActuel > c.prochaineVidange;
                  const delta = c.prochaineVidange - c.kilometrageActuel;

                  return (
                    <div id={`camion_item_${c.id}`} key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                      
                      {hasAlarm && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-bl-xl tracking-wider animate-pulse flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>VIDANGE RECOMMANDÉE</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-black text-white font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            {c.immatriculation}
                          </span>
                          <span className="text-sm text-slate-300 font-medium">{c.modele}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3">
                          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Compteur Actuel</span>
                            <span className="text-sm font-bold text-white font-mono">{c.kilometrageActuel.toLocaleString()} km</span>
                          </div>
                          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Prochaine Échéance</span>
                            <span className={`text-sm font-bold font-mono ${hasAlarm ? 'text-red-400' : 'text-emerald-400'}`}>
                              {c.prochaineVidange.toLocaleString()} km
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Statut de maintenance:</span>
                          {hasAlarm ? (
                            <span className="text-red-400 font-bold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>En dépassement ({Math.abs(delta).toLocaleString()} km)</span>
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold flex items-center space-x-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>En règle ({delta.toLocaleString()} km restants)</span>
                            </span>
                          )}
                        </div>

                        <div className="border-t border-slate-800 pt-3 flex justify-between gap-2">
                          <button
                            id={`btn_camion_vidange_${c.id}`}
                            onClick={() => {
                              handleVidangeCamionChange(c.id);
                              setShowAddVidangeModal(true);
                            }}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center space-x-1"
                          >
                            <DropletIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Faire Vidange</span>
                          </button>
                          <button
                            id={`btn_camion_fuel_${c.id}`}
                            onClick={() => {
                              handleFuelCamionChange(c.id);
                              setShowAddFuelModal(true);
                            }}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center space-x-1"
                          >
                            <FuelIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Plein Carburant</span>
                          </button>
                          <button
                            id={`btn_camion_delete_${c.id}`}
                            onClick={() => deleteTruck(c.id, c.immatriculation)}
                            className="p-1.5 bg-slate-850 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded-lg border border-slate-800 transition-all"
                            title="Supprimer Camion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
                {filteredCamions.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500">
                    Aucun camion ne correspond à votre recherche.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: CARBURANT ==================== */}
          {activeTab === 'carburant' && (
            <div id="tab_pane_carburant" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {ravitaillements.length} fiches de ravitaillement au total
                </p>
                <button
                  id="tab_carburant_add_btn"
                  onClick={() => {
                    if (camions.length > 0) {
                      handleFuelCamionChange(camions[0].id);
                    }
                    setShowAddFuelModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enregistrer un Ravitaillement</span>
                </button>
              </div>

              {/* Ravitaillement Log List */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-850 text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Camion</th>
                        <th className="px-5 py-3 text-right">Volume</th>
                        <th className="px-5 py-3 text-right">Kilométrage</th>
                        <th className="px-5 py-3 text-right">Prix Total</th>
                        <th className="px-5 py-3 text-right">Prix/Litre</th>
                        <th className="px-5 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {ravitaillements
                        .filter(r => getTruckLabel(r.camionId).toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(r => {
                          const unitPrice = r.litres > 0 ? (r.prixTotal / r.litres) : 0;
                          return (
                            <tr id={`fuel_row_${r.id}`} key={r.id} className="hover:bg-slate-850/40 transition-colors">
                              <td className="px-5 py-4 font-mono text-slate-300">{r.date}</td>
                              <td className="px-5 py-4">
                                <span className="font-bold text-slate-200">{getTruckLabel(r.camionId).split(' ')[0]}</span>
                                <span className="text-slate-500 text-[10px] block">{getTruckLabel(r.camionId).split('(')[1]?.replace(')', '') || ''}</span>
                              </td>
                              <td className="px-5 py-4 text-right font-mono text-slate-200">{r.litres.toLocaleString()} L</td>
                              <td className="px-5 py-4 text-right font-mono text-slate-300">{r.kilometrageEnregistre.toLocaleString()} km</td>
                              <td className="px-5 py-4 text-right font-mono text-emerald-400 font-bold">{r.prixTotal.toLocaleString()} €</td>
                              <td className="px-5 py-4 text-right font-mono text-slate-400">{unitPrice.toFixed(3)} €/L</td>
                              <td className="px-5 py-4 text-center">
                                <button
                                  id={`btn_delete_fuel_${r.id}`}
                                  onClick={() => deleteFuelLog(r.id)}
                                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {ravitaillements.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                            Aucun ravitaillement carburant enregistré.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: VIDANGES ==================== */}
          {activeTab === 'vidanges' && (
            <div id="tab_pane_vidanges" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {vidanges.length} fiches de vidange au total
                </p>
                <button
                  id="tab_vidanges_add_btn"
                  onClick={() => {
                    if (camions.length > 0) {
                      handleVidangeCamionChange(camions[0].id);
                    }
                    setShowAddVidangeModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enregistrer une Vidange</span>
                </button>
              </div>

              {/* Vidanges List Grid / Cards with Filter breakdown */}
              <div id="vidanges_registry" className="space-y-4">
                {vidanges
                  .filter(v => getTruckLabel(v.camionId).toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(v => {
                    const filtersCount = (v.filtreHuileActive ? 1 : 0) + (v.filtreGasoilActive ? 1 : 0) + (v.filtreAirActive ? 1 : 0);

                    return (
                      <div id={`vidange_log_${v.id}`} key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                              <DropletIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 block font-mono">{v.date}</span>
                              <strong className="text-white text-base font-bold">{getTruckLabel(v.camionId)}</strong>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-right">
                            <div className="font-mono">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Coût total opération</span>
                              <strong className="text-emerald-400 text-lg font-black">{v.prixTotal.toLocaleString()} €</strong>
                            </div>
                            <button
                              id={`btn_pdf_download_${v.id}`}
                              onClick={() => {
                                const selectedTruck = camions.find(c => c.id === v.camionId);
                                if (selectedTruck) {
                                  downloadVidangeTicket(v, selectedTruck);
                                } else {
                                  triggerToast("Erreur: Camion introuvable", "warning");
                                }
                              }}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition-all border border-transparent hover:border-slate-800 flex items-center justify-center"
                              title="Télécharger Ticket PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn_delete_vidange_${v.id}`}
                              onClick={() => deleteVidangeLog(v.id)}
                              className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-all border border-transparent hover:border-slate-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                          
                          {/* Mileage metrics */}
                          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 space-y-1">
                            <span className="text-slate-500 text-[10px] uppercase tracking-wider">Kilométrages</span>
                            <p className="text-slate-200">
                              Fait à : <strong className="font-mono text-white">{v.kilometrage.toLocaleString()} km</strong>
                            </p>
                            <p className="text-slate-400">
                              Intervalle : <span className="font-mono">{v.intervalle.toLocaleString()} km</span>
                            </p>
                            <p className="text-slate-400">
                              Prochaine : <strong className="font-mono text-emerald-400">{(v.kilometrage + v.intervalle).toLocaleString()} km</strong>
                            </p>
                          </div>

                          {/* Base Oil Cost */}
                          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex flex-col justify-between">
                            <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Huile moteur</span>
                            <div className="text-slate-200 space-y-1">
                              <div className="text-[11px]">Type: <strong className="text-slate-100 font-semibold">{v.typeHuile || '15W40'}</strong></div>
                              <div className="text-[11px]">Prix: <strong className="text-white font-mono">{v.prixHuile.toLocaleString()} €</strong></div>
                            </div>
                          </div>

                          {/* Filters state breakdown (requested logic indicator) */}
                          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 md:col-span-2 space-y-2">
                            <span className="text-slate-500 text-[10px] uppercase tracking-wider block">Filtres Remplacés ({filtersCount}/3)</span>
                            
                            <div className="grid grid-cols-3 gap-2 text-[11px]">
                              
                              <div className={`p-2 rounded-lg border ${
                                v.filtreHuileActive 
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                                  : 'bg-slate-900/40 border-slate-850 text-slate-500'
                              }`}>
                                <span className="block font-semibold">Filtre Huile</span>
                                <span className="font-mono mt-0.5 block font-bold">
                                  {v.filtreHuileActive ? `${v.filtreHuilePrix} €` : 'Non fait'}
                                </span>
                              </div>

                              <div className={`p-2 rounded-lg border ${
                                v.filtreGasoilActive 
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                                  : 'bg-slate-900/40 border-slate-850 text-slate-500'
                              }`}>
                                <span className="block font-semibold">Filtre Gasoil</span>
                                <span className="font-mono mt-0.5 block font-bold">
                                  {v.filtreGasoilActive ? `${v.filtreGasoilPrix} €` : 'Non fait'}
                                </span>
                              </div>

                              <div className={`p-2 rounded-lg border ${
                                v.filtreAirActive 
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                                  : 'bg-slate-900/40 border-slate-850 text-slate-500'
                              }`}>
                                <span className="block font-semibold">Filtre Air</span>
                                <span className="font-mono mt-0.5 block font-bold">
                                  {v.filtreAirActive ? `${v.filtreAirPrix} €` : 'Non fait'}
                                </span>
                              </div>

                            </div>
                          </div>

                        </div>

                        {v.notes && (
                          <div className="bg-slate-950/30 p-2.5 rounded-xl text-xs text-slate-400 border border-slate-850/50">
                            <strong>Note :</strong> {v.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                {vidanges.length === 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                    Aucun historique de vidange d'huile enregistré.
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================== MODAL 1: ADD TRUCK ==================== */}
      {showAddCamionModal && (
        <div id="modal_add_camion" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              id="close_add_camion_modal"
              onClick={() => setShowAddCamionModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
              <TruckIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Ajouter un Nouveau Camion</h3>
            </div>

            <form onSubmit={handleAddCamionSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Plaque d'Immatriculation *</label>
                <input
                  id="form_camion_immat"
                  type="text"
                  placeholder="Ex: AB-123-CD"
                  value={newCamion.immatriculation}
                  onChange={(e) => setNewCamion(prev => ({ ...prev, immatriculation: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Marque & Modèle *</label>
                <input
                  id="form_camion_modele"
                  type="text"
                  placeholder="Ex: Volvo FH 500"
                  value={newCamion.modele}
                  onChange={(e) => setNewCamion(prev => ({ ...prev, modele: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Kilométrage Actuel au compteur *</label>
                <input
                  id="form_camion_km"
                  type="number"
                  placeholder="Ex: 154000"
                  value={newCamion.kilometrageActuel}
                  onChange={(e) => setNewCamion(prev => ({ ...prev, kilometrageActuel: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Intervalle par défaut de vidange (km)</label>
                <input
                  id="form_camion_interval"
                  type="number"
                  placeholder="10000"
                  value={newCamion.intervalleDefaut}
                  onChange={(e) => setNewCamion(prev => ({ ...prev, intervalleDefaut: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  id="btn_cancel_add_camion"
                  type="button"
                  onClick={() => setShowAddCamionModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  id="btn_submit_add_camion"
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50"
                >
                  Enregistrer le camion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ADD FUEL REFILL ==================== */}
      {showAddFuelModal && (
        <div id="modal_add_fuel" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              id="close_add_fuel_modal"
              onClick={() => setShowAddFuelModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
              <FuelIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Ravitaillement en Carburant</h3>
            </div>

            <form onSubmit={handleAddFuelSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sélectionner le Camion *</label>
                <select
                  id="form_fuel_camion"
                  value={newFuel.camionId}
                  onChange={(e) => handleFuelCamionChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- Choisir un camion --</option>
                  {camions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.immatriculation} - {c.modele} (Actuel: {c.kilometrageActuel.toLocaleString()} km)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Date du plein *</label>
                  <input
                    id="form_fuel_date"
                    type="date"
                    value={newFuel.date}
                    onChange={(e) => setNewFuel(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Kilométrage Enregistré *</label>
                  <input
                    id="form_fuel_km"
                    type="number"
                    placeholder="Ex: 145000"
                    value={newFuel.kilometrageEnregistre}
                    onChange={(e) => setNewFuel(prev => ({ ...prev, kilometrageEnregistre: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Volume en Litres *</label>
                  <input
                    id="form_fuel_litres"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 350"
                    value={newFuel.litres}
                    onChange={(e) => setNewFuel(prev => ({ ...prev, litres: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Montant Total Payé (€) *</label>
                  <input
                    id="form_fuel_price"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 630"
                    value={newFuel.prixTotal}
                    onChange={(e) => setNewFuel(prev => ({ ...prev, prixTotal: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Instant calculation preview */}
              {newFuel.litres && newFuel.prixTotal && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs text-slate-400 flex justify-between">
                  <span>Prix unitaire calculé :</span>
                  <strong className="text-emerald-400 font-mono">
                    {(parseFloat(newFuel.prixTotal) / parseFloat(newFuel.litres)).toFixed(3)} €/L
                  </strong>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  id="btn_cancel_add_fuel"
                  type="button"
                  onClick={() => setShowAddFuelModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  id="btn_submit_add_fuel"
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50"
                >
                  Valider le Ravitaillement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: ADD OIL CHANGE (VIDANGE) ==================== */}
      {/* With conditional filters check input requested logic */}
      {showAddVidangeModal && (
        <div id="modal_add_vidange" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative my-8">
            <button
              id="close_add_vidange_modal"
              onClick={() => setShowAddVidangeModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
              <DropletIcon className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Nouvelle Fiche de Vidange</h3>
                <p className="text-xs text-slate-400">Enregistrer l'entretien de vidange et filtres du camion.</p>
              </div>
            </div>

            <form onSubmit={handleAddVidangeSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sélectionner le Camion *</label>
                <select
                  id="form_vidange_camion"
                  value={newVidange.camionId}
                  onChange={(e) => handleVidangeCamionChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- Choisir un camion --</option>
                  {camions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.immatriculation} - {c.modele} (Compteur: {c.kilometrageActuel.toLocaleString()} km)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Date de l'opération *</label>
                  <input
                    id="form_vidange_date"
                    type="date"
                    value={newVidange.date}
                    onChange={(e) => setNewVidange(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Kilométrage au compteur *</label>
                  <input
                    id="form_vidange_km"
                    type="number"
                    placeholder="Ex: 140000"
                    value={newVidange.kilometrage}
                    onChange={(e) => setNewVidange(prev => ({ ...prev, kilometrage: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Type de Huile Moteur *</label>
                  <input
                    id="form_vidange_oil_type"
                    type="text"
                    placeholder="Ex: 15W40, 5W30"
                    value={newVidange.typeHuile}
                    onChange={(e) => setNewVidange(prev => ({ ...prev, typeHuile: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Prix Huile moteur (€) *</label>
                  <input
                    id="form_vidange_oil_price"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 180"
                    value={newVidange.prixHuile}
                    onChange={(e) => setNewVidange(prev => ({ ...prev, prixHuile: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Intervalle Prochaine Vidange (km)</label>
                  <input
                    id="form_vidange_interval"
                    type="number"
                    placeholder="Ex: 10000"
                    value={newVidange.intervalle}
                    onChange={(e) => setNewVidange(prev => ({ ...prev, intervalle: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div className="flex items-end pb-1 text-xs text-slate-400 leading-tight">
                  La prochaine vidange est estimée à ce kilométrage plus l'intervalle.
                </div>
              </div>

              {/* CRITICAL USER REQUIREMENT DESIGN: Checkboxes for filters first. 
                  "faut d'abord cauncher si le camion va fair que le filtre huile ou tout les filtre si un filtre est caucher onlyy then you give to inout the price"
              */}
              <div id="filter_selection_section" className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Remplacement des Filtres</span>
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Cochez d'abord le filtre que le camion va remplacer, puis saisissez son prix individuel.
                </p>

                <div className="space-y-3 pt-1">
                  
                  {/* Filter 1: Filtre à Huile */}
                  <div className="space-y-2">
                    <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                      <input
                        id="checkbox_filtre_huile"
                        type="checkbox"
                        checked={newVidange.filtreHuileActive}
                        onChange={(e) => setNewVidange(prev => ({ 
                          ...prev, 
                          filtreHuileActive: e.target.checked,
                          filtreHuilePrix: e.target.checked ? prev.filtreHuilePrix : '' 
                        }))}
                        className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4 bg-slate-900"
                      />
                      <span className="text-xs font-semibold text-slate-200">Filtre à Huile</span>
                    </label>
                    {/* Animated Price input: ONLY show / enable when checked */}
                    {newVidange.filtreHuileActive && (
                      <div id="input_container_filtre_huile" className="pl-6 animate-fadeIn transition-all duration-200">
                        <label className="text-[10px] text-slate-400 block mb-1">Prix du Filtre à Huile (€) *</label>
                        <input
                          id="form_vidange_filtre_huile_prix"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 35.00"
                          value={newVidange.filtreHuilePrix}
                          onChange={(e) => setNewVidange(prev => ({ ...prev, filtreHuilePrix: e.target.value }))}
                          className="w-full max-w-xs px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          required={newVidange.filtreHuileActive}
                        />
                      </div>
                    )}
                  </div>

                  {/* Filter 2: Filtre à Gasoil */}
                  <div className="space-y-2">
                    <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                      <input
                        id="checkbox_filtre_gasoil"
                        type="checkbox"
                        checked={newVidange.filtreGasoilActive}
                        onChange={(e) => setNewVidange(prev => ({ 
                          ...prev, 
                          filtreGasoilActive: e.target.checked,
                          filtreGasoilPrix: e.target.checked ? prev.filtreGasoilPrix : ''
                        }))}
                        className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4 bg-slate-900"
                      />
                      <span className="text-xs font-semibold text-slate-200">Filtre à Gasoil (Fuel)</span>
                    </label>
                    {/* Animated Price input: ONLY show / enable when checked */}
                    {newVidange.filtreGasoilActive && (
                      <div id="input_container_filtre_gasoil" className="pl-6 animate-fadeIn transition-all duration-200">
                        <label className="text-[10px] text-slate-400 block mb-1">Prix du Filtre à Gasoil (€) *</label>
                        <input
                          id="form_vidange_filtre_gasoil_prix"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 45.00"
                          value={newVidange.filtreGasoilPrix}
                          onChange={(e) => setNewVidange(prev => ({ ...prev, filtreGasoilPrix: e.target.value }))}
                          className="w-full max-w-xs px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          required={newVidange.filtreGasoilActive}
                        />
                      </div>
                    )}
                  </div>

                  {/* Filter 3: Filtre à Air */}
                  <div className="space-y-2">
                    <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                      <input
                        id="checkbox_filtre_air"
                        type="checkbox"
                        checked={newVidange.filtreAirActive}
                        onChange={(e) => setNewVidange(prev => ({ 
                          ...prev, 
                          filtreAirActive: e.target.checked,
                          filtreAirPrix: e.target.checked ? prev.filtreAirPrix : ''
                        }))}
                        className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4 bg-slate-900"
                      />
                      <span className="text-xs font-semibold text-slate-200">Filtre à Air</span>
                    </label>
                    {/* Animated Price input: ONLY show / enable when checked */}
                    {newVidange.filtreAirActive && (
                      <div id="input_container_filtre_air" className="pl-6 animate-fadeIn transition-all duration-200">
                        <label className="text-[10px] text-slate-400 block mb-1">Prix du Filtre à Air (€) *</label>
                        <input
                          id="form_vidange_filtre_air_prix"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 50.00"
                          value={newVidange.filtreAirPrix}
                          onChange={(e) => setNewVidange(prev => ({ ...prev, filtreAirPrix: e.target.value }))}
                          className="w-full max-w-xs px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          required={newVidange.filtreAirActive}
                        />
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Dynamic Price Calculation & Planning feedback inside Modal */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Prochain Kilométrage</span>
                  <strong className="text-emerald-400 font-mono text-sm">
                    {newVidange.kilometrage && newVidange.intervalle 
                      ? (parseInt(newVidange.kilometrage) + parseInt(newVidange.intervalle)).toLocaleString()
                      : 0} km
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block uppercase">Total Calculé</span>
                  <strong className="text-white font-mono text-sm">
                    {calculatedVidangeFormTotal().toLocaleString()} €
                  </strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Notes / Remarques complémentaires</label>
                <textarea
                  id="form_vidange_notes"
                  placeholder="Ex: Remplacement du joint de carter, changement filtre habitacle..."
                  value={newVidange.notes}
                  onChange={(e) => setNewVidange(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 h-16 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  id="btn_cancel_add_vidange"
                  type="button"
                  onClick={() => setShowAddVidangeModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  id="btn_submit_add_vidange"
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50"
                >
                  Enregistrer la Vidange
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Global Footer --- */}
      <footer id="global_footer" className="bg-slate-900 border-t border-slate-850 px-6 py-4 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 FleetOps - Outil professionnel d'analyse de maintenance de flotte.</p>
      </footer>

    </div>
  );
}
