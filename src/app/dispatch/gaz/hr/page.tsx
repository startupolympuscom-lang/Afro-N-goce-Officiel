import React, { useState, useMemo, useEffect } from 'react';
import { useDispatchGazStore, GazPaySlip } from '../../../../stores/useDispatchGazStore';
import { Users, FileText, Download, Calculator, Search, Filter, CheckCircle2, Trash2, QrCode, UserPlus, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DispatchHRPage() {
  const { drivers, sales, commissions, brands, paySlips, addPaySlip, deletePaySlip, expenses } = useDispatchGazStore();
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'cnss'>('generator');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [acompteInput, setAcompteInput] = useState<number>(0);
  
  // History states
  const [historySearch, setHistorySearch] = useState('');
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));

  // CNSS filter states
  const [cnssFilterMonth, setCnssFilterMonth] = useState('');
  const [cnssFilterDriverId, setCnssFilterDriverId] = useState('');

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const savedPaySlip = useMemo(() => {
    return paySlips.find(p => p.driverId === selectedDriverId && p.month === month);
  }, [selectedDriverId, month, paySlips]);

  useEffect(() => {
    if (savedPaySlip) {
      setAcompteInput(savedPaySlip.acompte || 0);
    } else if (selectedDriverId && month) {
      // Calculate total advances for this driver in this month from expenses
      const advancesSum = expenses
        .filter(
          (e) =>
            e.driverId === selectedDriverId &&
            e.date.startsWith(month) &&
            e.reason.toLowerCase().includes('avance sur salaire')
        )
        .reduce((sum, e) => sum + e.amount, 0);
      setAcompteInput(advancesSum);
    } else {
      setAcompteInput(0);
    }
  }, [savedPaySlip, selectedDriverId, month, expenses]);

  const calculatePayroll = (driverId: string, targetMonth: string) => {
    const driverSales = sales.filter(s => 
      s.driverId === driverId && 
      s.date.startsWith(targetMonth)
    );

    let totalCommission = 0;
    const details: { brandName: string, category: string, quantity: number, commissionRate: number, total: number }[] = [];

    const salesSummary: Record<string, number> = {};
    driverSales.forEach(sale => {
      const key = `${sale.brandId}_${sale.category}`;
      salesSummary[key] = (salesSummary[key] || 0) + sale.quantity;
    });

    Object.entries(salesSummary).forEach(([key, quantity]) => {
      const [brandId, category] = key.split('_');
      const commission = commissions.find(c => c.brandId === brandId && c.category === category);
      const brand = brands.find(b => b.id === brandId);
      
      const rate = commission ? commission.rate : 0;
      const total = quantity * rate;
      totalCommission += total;

      details.push({
        brandName: brand?.name || 'Inconnu',
        category,
        quantity,
        commissionRate: rate,
        total
      });
    });

    return {
      totalCommission,
      details,
      salesCount: driverSales.length,
      totalVolume: driverSales.reduce((sum, s) => sum + s.quantity, 0)
    };
  };

  const payrollData = useMemo(() => {
    if (!selectedDriverId || !month) return null;
    return calculatePayroll(selectedDriverId, month);
  }, [selectedDriverId, month, sales, commissions, brands]);

  const handleSavePaySlip = () => {
    if (!payrollData || !selectedDriverId) return;

    // Check if already exists
    const existing = paySlips.find(p => p.driverId === selectedDriverId && p.month === month);
    if (existing) {
      toast.error('Une fiche de paie existe déjà pour ce chauffeur et ce mois.');
      return;
    }

    const newPaySlip: GazPaySlip = {
      id: nanoid(),
      driverId: selectedDriverId,
      month,
      totalCommission: payrollData.totalCommission,
      details: payrollData.details,
      generatedAt: new Date().toISOString(),
      acompte: acompteInput || 0
    };

    addPaySlip(newPaySlip);
    toast.success('Fiche de paie enregistrée avec succès.');
  };

  const handleExportWord = () => {
    if (!payrollData || !selectedDriver) {
      toast.error('Aucune donnée à exporter.');
      return;
    }
    
    // Company properties
    const compName = selectedDriver.company === 'chakirine_gaz' ? 'CHAKIRINE GAZ' : 'STE. AFRO NÉGOCE';
    const compCnssNum = selectedDriver.company === 'chakirine_gaz' ? '8425163' : '9764251';

    // Calculations
    const totalCommission = payrollData.totalCommission;
    const SMIG = 3422.72;
    const baseCNSS = totalCommission > SMIG ? SMIG : totalCommission;
    const cnss = baseCNSS * 0.0448;
    const amo = baseCNSS * 0.0226;
    const totalRetenues = cnss + amo;
    const salaireNet = totalCommission - totalRetenues;
    const acompte = acompteInput || 0;
    const netAPayer = salaireNet - acompte;

    const basePayer = Math.min(3000.00, totalCommission);
    const transportPayer = totalCommission > SMIG ? Math.min(580.00, totalCommission - SMIG) : 0.00;
    const commissionPayer = totalCommission > SMIG ? 422.72 : Math.max(0, totalCommission - 3000.00);
    const primePayer = totalCommission > SMIG ? Math.max(0, totalCommission - SMIG - 580.00) : 0.00;

    const yearNum = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const lastDay = new Date(yearNum, monthNum, 0).getDate();

    const exportHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #000;">
        <table width="100%" style="margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 10px;">
          <tr>
            <td>
              <h1 style="font-size: 18px; margin: 0;">${compName}</h1>
              <p style="font-size: 12px; margin: 0; color: #666;">NZARANE SAADA</p>
            </td>
            <td style="text-align: right;">
              <h1 style="font-size: 18px; margin: 0;">BULLETIN DE PAIE</h1>
              <p style="font-size: 12px; margin: 0; color: #666;">N° CNSS Employeur: ${compCnssNum}</p>
              <p style="font-size: 12px; margin: 0; color: #666;">Période: 01/${monthNum.toString().padStart(2, '0')}/${yearNum} au ${lastDay.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${yearNum}</p>
            </td>
          </tr>
        </table>

        <table width="100%" style="margin-bottom: 30px; border: 1px solid #eee; padding: 10px;">
          <tr>
            <td width="50%">
              <p style="margin: 2px 0; font-size: 12px;"><strong>SALARIE(E):</strong> ${selectedDriver.prenom} ${selectedDriver.nom}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>QUALIFICATION:</strong> VENDEUR</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>MATRICULE:</strong> ${selectedDriver.id.substring(0, 5).toUpperCase()}</p>
            </td>
            <td width="50%" style="text-align: right;">
              <p style="margin: 2px 0; font-size: 12px;"><strong>N° CIN:</strong> ${selectedDriver.cin || 'D637148'}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>N° CNSS:</strong> ${selectedDriver.cnss || '104963262'}</p>
              <p style="margin: 2px 0; font-size: 12px;"><strong>NET DUR A PAYER:</strong> ${netAPayer.toFixed(2)} MAD</p>
            </td>
          </tr>
        </table>

        <table width="100%" border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th align="left" colspan="2">Libellé de la rubrique</th>
              <th align="center">Base / Nombre</th>
              <th align="center">Taux</th>
              <th align="right">A Payer / Déduire</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="2"><strong>SALAIRE DE BASE</strong></td>
              <td align="center">26.00</td>
              <td align="center">${(basePayer / 26).toFixed(2)}</td>
              <td align="right"><strong>+${basePayer.toFixed(2)}</strong></td>
            </tr>
            ${transportPayer > 0 ? `
            <tr>
              <td colspan="2"><strong>INDIMNITE DE TRANSPORT</strong></td>
              <td align="center">1.00</td>
              <td align="center">${transportPayer.toFixed(2)}</td>
              <td align="right"><strong>+${transportPayer.toFixed(2)}</strong></td>
            </tr>` : ''}
            ${commissionPayer > 0 ? `
            <tr>
              <td colspan="2"><strong>COMMISSION</strong></td>
              <td align="center">1.00</td>
              <td align="center">${commissionPayer.toFixed(2)}</td>
              <td align="right"><strong>+${commissionPayer.toFixed(2)}</strong></td>
            </tr>` : ''}
            ${primePayer > 0 ? `
            <tr>
              <td colspan="2"><strong>PRIME DE LA TOURNEE</strong></td>
              <td align="center">1.00</td>
              <td align="center">${primePayer.toFixed(2)}</td>
              <td align="right"><strong>+${primePayer.toFixed(2)}</strong></td>
            </tr>` : ''}
            
            <tr style="background-color: #f1f5f9;">
              <td colspan="4"><strong>SALAIRE BRUT</strong></td>
              <td align="right"><strong>${totalCommission.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td colspan="2">RETENUE CNSS (PATRONALE / OUT)</td>
              <td align="center">${baseCNSS.toFixed(2)}</td>
              <td align="center">4.48%</td>
              <td align="right">-${cnss.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2">RETENUE AMO</td>
              <td align="center">${baseCNSS.toFixed(2)}</td>
              <td align="center">2.26%</td>
              <td align="right">-${amo.toFixed(2)}</td>
            </tr>
            
            <tr style="background-color: #f1f5f9;">
              <td colspan="4"><strong>SALAIRE NET DE CHARGES</strong></td>
              <td align="right"><strong>${salaireNet.toFixed(2)}</strong></td>
            </tr>
            
            ${acompte > 0 ? `
            <tr>
              <td colspan="4">AVANCE / ACOMPTE</td>
              <td align="right">-${acompte.toFixed(2)}</td>
            </tr>` : ''}
            
            <tr style="background-color: #e2e8f0; font-size: 13px;">
              <td colspan="4"><strong>SALAIRE NET A PERCEVOIR (MAD)</strong></td>
              <td align="right"><strong>${netAPayer.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <p style="font-size: 10px; color: #666; margin-top: 30px;">Mode de paiement: VIREMENT AGENCEDUCOMPTE<br>Signé électroniquement</p>
      </div>
    `;

    const fileContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Bulletin de Paie</title></head>
      <body>${exportHTML}</body></html>
    `;

    const blob = new Blob(['\ufeff', fileContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fiche_Paie_${selectedDriver.nom}_${month}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!payrollData || !selectedDriver) {
      toast.error('Aucune donnée à exporter.');
      return;
    }
    
    // Company properties
    const compName = selectedDriver.company === 'chakirine_gaz' ? 'CHAKIRINE GAZ' : 'STE. AFRO NÉGOCE';
    const compCnssNum = selectedDriver.company === 'chakirine_gaz' ? '8425163' : '9764251';

    const doc = new jsPDF();
    const yearNum = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]);
    const formattedStart = `01/${monthNum.toString().padStart(2, '0')}/${yearNum}`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const formattedEnd = `${lastDay.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${yearNum}`;
    
    // 1. Company Logo/Header Left
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate 900
    doc.text(compName, 14, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate 600
    doc.text('NZARANE SAADA', 14, 24);
    
    // 2. Bulletin de Paie Header Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('BULLETIN DE PAIE', 196, 18, { align: 'right' });
    
    // Header Right Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('N° CNSS', 130, 24);
    doc.text(compCnssNum, 196, 24, { align: 'right' });
    doc.text('Période de paie du', 130, 29);
    doc.text(formattedStart, 196, 29, { align: 'right' });
    doc.text('Période de paie au', 130, 34);
    doc.text(formattedEnd, 196, 34, { align: 'right' });
    
    // Calculations for the line items
    const K = payrollData.totalCommission;
    const SMIG = 3422.72;
    const baseCNSS = K > SMIG ? SMIG : K;
    const cnss = baseCNSS * 0.0448;
    const amo = baseCNSS * 0.0226;
    const totalRetenues = cnss + amo;
    const salaireNet = K - totalRetenues;
    const acompteVal = acompteInput || 0;
    const netAPayer = salaireNet - acompteVal;
    
    // 3. Employee Info Block Box
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.4);
    doc.rect(14, 38, 182, 24); // x, y, width, height
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const driverFullName = `${selectedDriver.prenom.toUpperCase()} ${selectedDriver.nom.toUpperCase()}`;
    doc.text(driverFullName, 18, 44);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Matricule   ${selectedDriver.id.substring(0, 5).toUpperCase()}`, 18, 49);
    doc.text(`N° CIN: ${selectedDriver.cin || 'D637148'}`, 75, 49);
    doc.text(`Salaire à payer:  ${netAPayer.toFixed(2)} MAD`, 140, 49);
    
    doc.text(selectedDriver.address || '4522 RUE 95 OUJAH AROUSS', 18, 54);
    doc.text('MEKNES', 140, 58);
    
    // 4. Qualifications/Contract Table (Grid)
    autoTable(doc, {
      startY: 66,
      head: [[
        'Qualification', 'Code\nSect.', 'Code\nCat.', 'Date\nNaissance', 'Date\nEmbauche', 
        'SF', 'Enf.', 'Déd.', 'N° CNSS', 'N° Mutuelle', 'N° CIMR', 'Autre', 'Autre1', 'Autre2'
      ]],
      body: [[
        'VENDEUR', '001', '001', '', '01/06/2017', 
        'D', '2', '2', selectedDriver.cnss || '104963262', '104963262', '', '', '', ''
      ]],
      theme: 'grid',
      headStyles: { 
        fillColor: [241, 245, 249], 
        textColor: [15, 23, 42], 
        fontStyle: 'bold', 
        fontSize: 7.5, 
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [203, 213, 225]
      },
      bodyStyles: { 
        fontSize: 7.5, 
        halign: 'center', 
        textColor: [71, 85, 105],
        lineWidth: 0.1,
        lineColor: [203, 213, 225]
      },
      styles: { cellPadding: 1 },
    });
    
    // 5. Main Earnings & Deductions Table
    const tableRows = [];
    
    // Base salary row
    const basePayer = Math.min(3000.00, K);
    const baseTaux = basePayer / 26.00;
    tableRows.push([
      'SALAIRE DE BASE',
      '26.00',
      baseTaux.toFixed(2),
      basePayer.toFixed(2),
      ''
    ]);
    
    // Transport row
    const transportPayer = K > SMIG ? Math.min(580.00, K - SMIG) : 0.00;
    if (transportPayer > 0 || K > SMIG) {
      tableRows.push([
        'INDIMNITE DE TRANSPORT',
        '1.00',
        transportPayer.toFixed(2),
        transportPayer.toFixed(2),
        ''
      ]);
    }
    
    // Commission row (SMIG part)
    const commissionPayer = K > SMIG ? 422.72 : Math.max(0, K - 3000.00);
    if (commissionPayer > 0 || K > SMIG) {
      tableRows.push([
        'COMMISSION',
        '1.00',
        commissionPayer.toFixed(2),
        commissionPayer.toFixed(2),
        ''
      ]);
    }
    
    // Tournée Prime row
    const primePayer = K > SMIG ? Math.max(0, K - SMIG - 580.00) : 0.00;
    if (primePayer > 0 || K > SMIG) {
      tableRows.push([
        'PRIME DE LA TOURNEE',
        '1.00',
        primePayer.toFixed(2),
        primePayer.toFixed(2),
        ''
      ]);
    }
    
    // Salaire Brut
    tableRows.push([
      'SALAIRE BRUT',
      '',
      '',
      K.toFixed(2),
      ''
    ]);
    
    // CNSS deduction
    tableRows.push([
      'RETENUE CNSS',
      baseCNSS.toFixed(2),
      '4.48',
      '',
      cnss.toFixed(2)
    ]);
    
    // AMO deduction
    tableRows.push([
      'RETENUE AMO',
      baseCNSS.toFixed(2),
      '2.26',
      '',
      amo.toFixed(2)
    ]);
    
    // Salaire Net
    tableRows.push([
      'SALAIRE NET',
      '',
      '',
      salaireNet.toFixed(2),
      ''
    ]);
    
    // Acompte if any
    if (acompteVal > 0) {
      tableRows.push([
        'ACOMPTE',
        '',
        '',
        '',
        acompteVal.toFixed(2)
      ]);
    }
    
    // Salaire A Payer
    tableRows.push([
      'SALAIRE A PAYER',
      '',
      '',
      netAPayer.toFixed(2),
      ''
    ]);
    
    // Render the main table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 3,
      head: [['Libellé', 'Base / Nombre', 'Taux', 'A Payer', 'A Déduire']],
      body: tableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [241, 196, 15], 
        textColor: [15, 23, 42], 
        fontStyle: 'bold', 
        fontSize: 8.5, 
        halign: 'center' 
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      styles: { 
        fontSize: 8.5, 
        cellPadding: 1.5,
        lineColor: [203, 213, 225],
        lineWidth: 0.1
      },
      didParseCell: (data) => {
        const rowText = data.row.cells[0]?.text?.[0] || '';
        if (
          rowText.includes('SALAIRE BRUT') || 
          rowText.includes('SALAIRE NET') || 
          rowText.includes('SALAIRE A PAYER')
        ) {
          data.cell.styles.fontStyle = 'bold';
          if (rowText.includes('SALAIRE A PAYER')) {
            data.cell.styles.fillColor = [248, 250, 252];
          }
        }
      }
    });
    
    const finalTableY = (doc as any).lastAutoTable.finalY || 180;
    
    // 6. Cumul Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('CUMUL', 105, finalTableY + 6, { align: 'center' });
    
    // Cumul Table Grid
    autoTable(doc, {
      startY: finalTableY + 8,
      head: [[
        'Jours', 'Congé', 'Férié', 'H.Nor.', 'HSup', 'HFerié', 'Salaire Brut', 'Base Impos.', 'Salaire Net', 'IGR', 'CNSS', 'Retraite', 'Mutuelle'
      ]],
      body: [[
        '104.0', '0.00', '0.00', '762.66', '0.00', '0.00', (K * 3).toFixed(2), (baseCNSS * 3).toFixed(2), (salaireNet * 3).toFixed(2), '0.00', (cnss * 3).toFixed(2), '0.00', '0.00'
      ]],
      theme: 'grid',
      headStyles: { 
        fillColor: [241, 245, 249], 
        textColor: [15, 23, 42], 
        fontStyle: 'bold', 
        fontSize: 7, 
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 7, 
        halign: 'center', 
        textColor: [71, 85, 105],
        lineWidth: 0.1,
        lineColor: [203, 213, 225]
      },
      styles: { cellPadding: 1 },
    });
    
    const finalCumulY = (doc as any).lastAutoTable.finalY || 215;
    
    // Left Attributes mode of payment
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100);
    doc.text('Mode de paiement : VIREMENT CHEZ COMPTE AGENCE', 14, finalCumulY + 12);
    doc.text(`Licence accordée à : ${selectedDriver.company === 'chakirine_gaz' ? 'STE CHAKIRINE GAZ' : 'STE AFRO NÉGOCE'}`, 14, finalCumulY + 17);
    
    // Center signature area
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURE DU SALARIE', 85, finalCumulY + 12);
    doc.setDrawColor(200);
    doc.line(85, finalCumulY + 28, 125, finalCumulY + 28);
    
    // Right Net à Payer double-bordered box
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.6);
    doc.rect(144, finalCumulY + 8, 52, 18);
    doc.setLineWidth(0.2);
    doc.rect(145, finalCumulY + 9, 50, 16);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('NET A PAYER (MAD)', 170, finalCumulY + 14, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${netAPayer.toFixed(2)}`, 170, finalCumulY + 21, { align: 'center' });
    
    // Document footer note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 285);
    
    doc.save(`Fiche_Paie_${selectedDriver.nom.toUpperCase()}__${month}.pdf`);
    toast.success('Document PDF généré avec succès.');
  };

  const historyData = useMemo(() => {
    if (activeTab !== 'history') return [];

    // We can show both saved pay slips AND calculated ones (as drafts)
    // Or just saved ones. The user said "browse past fiche de paie generated".
    // I'll show saved ones as "Validée" and others as "Non validée" if they have sales.

    const results: any[] = [];

    if (historySearch) {
      const matchingDrivers = drivers.filter(d => 
        `${d.prenom} ${d.nom}`.toLowerCase().includes(historySearch.toLowerCase())
      );

      matchingDrivers.forEach(driver => {
        // Get saved ones
        const saved = paySlips.filter(p => p.driverId === driver.id);
        saved.forEach(p => {
          results.push({
            driver,
            month: p.month,
            totalCommission: p.totalCommission,
            salesCount: '-', // We don't store this in paySlip yet, but could
            totalVolume: '-',
            status: 'validée',
            paySlipId: p.id
          });
        });

        // Find months with sales that are NOT saved
        const driverSales = sales.filter(s => s.driverId === driver.id);
        const months = Array.from(new Set(driverSales.map(s => s.date.slice(0, 7)))) as string[];
        
        months.forEach(m => {
          if (!saved.find(p => p.month === m)) {
            const payroll = calculatePayroll(driver.id, m);
            if (payroll.totalCommission > 0) {
              results.push({
                driver,
                month: m,
                ...payroll,
                status: 'brouillon'
              });
            }
          }
        });
      });
    } else {
      // Show all for selected month
      drivers.forEach(driver => {
        const saved = paySlips.find(p => p.driverId === driver.id && p.month === historyMonth);
        if (saved) {
          results.push({
            driver,
            month: historyMonth,
            totalCommission: saved.totalCommission,
            salesCount: '-',
            totalVolume: '-',
            status: 'validée',
            paySlipId: saved.id
          });
        } else {
          const payroll = calculatePayroll(driver.id, historyMonth);
          if (payroll.totalCommission > 0) {
            results.push({
              driver,
              month: historyMonth,
              ...payroll,
              status: 'brouillon'
            });
          }
        }
      });
    }

    return results.sort((a, b) => b.month.localeCompare(a.month));
  }, [activeTab, historySearch, historyMonth, drivers, sales, commissions, brands, paySlips]);

  const isAlreadySaved = useMemo(() => {
    return paySlips.some(p => p.driverId === selectedDriverId && p.month === month);
  }, [selectedDriverId, month, paySlips]);

  const cnssData = useMemo(() => {
    if (activeTab !== 'cnss') return [];
    
    return paySlips.map(slip => {
      const driver = drivers.find(d => d.id === slip.driverId);
      const totalCommission = slip.totalCommission;
      const SMIG = 3422.72;
      const baseCNSS = totalCommission > SMIG ? SMIG : totalCommission;
      const cnss = baseCNSS * 0.0448;
      const amo = baseCNSS * 0.0226;
      return {
        ...slip,
        driver,
        baseCNSS,
        cnss,
        amo,
        totalRetenue: cnss + amo
      };
    }).filter(item => {
      if (cnssFilterMonth && item.month !== cnssFilterMonth) return false;
      if (cnssFilterDriverId && item.driverId !== cnssFilterDriverId) return false;
      return true;
    }).sort((a, b) => b.month.localeCompare(a.month));
  }, [activeTab, paySlips, drivers, cnssFilterMonth, cnssFilterDriverId]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link 
          to="/dispatch/gaz/hr/pointage"
          className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-tight">Suivi Pointage</h3>
              <p className="text-xs text-slate-500">QR Code & Présences quotidiennes</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </Link>
        <Link 
          to="/dispatch/gaz/hr/manual-pointage"
          className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-tight">Pointage Manuelle</h3>
              <p className="text-xs text-slate-500">Enregistrement administratif manuel</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
        </Link>
        <Link 
          to="/dispatch/gaz/hr/convoyeurs"
          className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-tight">Convoyeurs</h3>
              <p className="text-xs text-slate-500">Liste des accompagnateurs</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-600" />
          Paie & Commissions
        </h1>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'generator' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Générateur
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'history' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab('cnss')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'cnss' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            CNSS
          </button>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                Sélection
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chauffeur / Vendeur</label>
                  <select 
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Sélectionner un chauffeur...</option>
                    {drivers.map((d, dIdx) => (
                      <option key={`hr-driver-opt-${d.id || dIdx}-${dIdx}`} value={d.id}>
                        {d.prenom} {d.nom} ({d.company === 'chakirine_gaz' ? 'Chakirine Gaz' : 'Afro Négoce'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mois de paie</label>
                  <input 
                    type="month" 
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Acompte / Avances (MAD)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="Ex: 2000.00"
                    value={acompteInput || ''}
                    onChange={(e) => setAcompteInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 mt-1">
                    Les sorties de caisse "Avance sur salaire" du mois sont calculées automatiquement.
                  </p>
                </div>
              </div>
            </div>

            {selectedDriver && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Informations Chauffeur</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Société Affiliée</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                      selectedDriver.company === 'chakirine_gaz' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedDriver.company === 'chakirine_gaz' ? 'Chakirine Gaz' : 'Ste. Afro Négoce'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Nom complet</span>
                    <span className="font-medium text-slate-900">{selectedDriver.prenom} {selectedDriver.nom}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">CIN</span>
                    <span className="font-medium text-slate-900">{selectedDriver.cin || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">N° CNSS</span>
                    <span className="font-medium text-slate-900">{selectedDriver.cnss || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Téléphone</span>
                    <span className="font-medium text-slate-900">{selectedDriver.phone || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Adresse</span>
                    <span className="font-medium text-slate-900">{selectedDriver.address || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {payrollData ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">Fiche de Paie Estimée</h2>
                      {isAlreadySaved && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Validée
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">Période: {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-2">
                    {!isAlreadySaved && (
                      <button 
                        onClick={handleSavePaySlip}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Valider la paie
                      </button>
                    )}
                    <div className="flex items-center gap-3">
                      <button onClick={handleExportWord} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors">
                        <FileText className="w-4 h-4" />
                        Exporter DOC
                      </button>
                      <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Exporter PDF
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1">
                  {(() => {
                    const totalCommission = payrollData.totalCommission;
                    const SMIG = 3422.72;
                    const baseCNSS = totalCommission > SMIG ? SMIG : totalCommission;
                    const indemnites = totalCommission > SMIG ? totalCommission - SMIG : 0;
                    const cnss = baseCNSS * 0.0448;
                    const amo = baseCNSS * 0.0226;
                    const totalRetenues = cnss + amo;
                    const salaireNet = totalCommission - totalRetenues;
                    const acompte = acompteInput || 0;
                    const netAPayer = salaireNet - acompte;

                    // Simulated bulletin line items
                    const yearNum = parseInt(month.split('-')[0]);
                    const monthNum = parseInt(month.split('-')[1]);
                    const basePayer = Math.min(3000.00, totalCommission);
                    const baseTaux = basePayer / 26.00;
                    const transportPayer = totalCommission > SMIG ? Math.min(580.00, totalCommission - SMIG) : 0.00;
                    const commissionPayer = totalCommission > SMIG ? 422.72 : Math.max(0, totalCommission - 3000.00);
                    const primePayer = totalCommission > SMIG ? Math.max(0, totalCommission - SMIG - 580.00) : 0.00;

                    return (
                      <>
                        <div className="grid grid-cols-1 mb-8 gap-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Salaire Net à Payer</p>
                                  <p className="text-3xl font-black text-emerald-700">{netAPayer.toFixed(2)} MAD</p>
                                </div>
                                <div className="sm:text-right p-3 bg-white/60 rounded-lg">
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Commissions (Brut)</p>
                                  <p className="text-xl font-bold text-blue-600">{totalCommission.toFixed(2)} MAD</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span>Base CNSS/AMO</span>
                                <span className="bg-slate-200 text-slate-600 px-1 py-0.2 text-[9px] rounded font-mono font-bold">SMIG Plafond</span>
                              </p>
                              <p className="text-base font-bold text-slate-700">{baseCNSS.toFixed(2)} MAD</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-500 tracking-wider mb-1 flex items-center justify-between">
                                <span className="uppercase text-slate-500 font-bold">Indemnités</span>
                                <span className="text-[9px] text-slate-400 font-mono">Exo-charges</span>
                              </p>
                              <p className="text-base font-bold text-orange-600">{indemnites.toFixed(2)} MAD</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl border-red-100">
                              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span>CNSS</span>
                                <span className="bg-red-100 px-1 rounded">4.48%</span>
                              </p>
                              <p className="text-base font-bold text-red-700">-{cnss.toFixed(2)} MAD</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl border-red-100">
                              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span>AMO</span>
                                <span className="bg-red-100 px-1 rounded">2.26%</span>
                              </p>
                              <p className="text-base font-bold text-red-700">-{amo.toFixed(2)} MAD</p>
                            </div>
                          </div>
                        </div>

                        {/* High Fidelity Bulletin de Paie Visual Replica */}
                        <div className="mb-8 border border-amber-200 bg-amber-50/5 rounded-2xl p-6 font-mono text-xs text-slate-800 shadow-sm max-w-2xl mx-auto border-dashed relative overflow-hidden bg-radial">
                          {/* Top Border Accent */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                          
                          <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                            <div>
                              <p className="font-bold text-sm text-slate-900">GOCE SARL</p>
                              <p className="text-slate-500 text-[10px]">NZARANE SAADA</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-sm text-slate-900 tracking-tight">BULLETIN DE PAIE</p>
                              <p className="text-slate-500 text-[10px] uppercase font-bold">N° CNSS Employeur: 9764251</p>
                              <p className="text-slate-500 text-[10px]">Période: 01/{monthNum.toString().padStart(2, '0')}/{yearNum} au {new Date(yearNum, monthNum, 0).getDate().toString().padStart(2, '0')}/{monthNum.toString().padStart(2, '0')}/{yearNum}</p>
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <p className="text-slate-400">SALARIE(E):</p>
                              <p className="font-bold text-slate-900 text-xs uppercase">{selectedDriver.prenom} {selectedDriver.nom}</p>
                              <p className="mt-1"><span className="text-slate-400">QUALIFICATION:</span> VENDEUR</p>
                              <p><span className="text-slate-400">MATRICULE:</span> {selectedDriver.id.substring(0, 5).toUpperCase()}</p>
                            </div>
                            <div className="text-right flex flex-col justify-between">
                              <div>
                                <p><span className="text-slate-400">N° CIN:</span> {selectedDriver.cin || 'D637148'}</p>
                                <p><span className="text-slate-400">N° CNSS:</span> {selectedDriver.cnss || '104963262'}</p>
                              </div>
                              <div>
                                <p className="text-[11px]"><span className="text-slate-500 font-bold">NET DUR A PAYER:</span> <span className="font-black text-emerald-600 text-xs">{netAPayer.toFixed(2)} MAD</span></p>
                              </div>
                            </div>
                          </div>

                          {/* Line items simulator */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-[10px]">
                            <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-200 p-2 font-bold text-slate-600 uppercase text-[9px] text-center">
                              <div className="col-span-2 text-left">Libellé de la rubrique</div>
                              <div>Base / Nombre</div>
                              <div>Taux</div>
                              <div className="text-right">A Payer / Déduire</div>
                            </div>
                            <div className="divide-y divide-slate-100 p-2 space-y-1">
                              <div className="grid grid-cols-5 py-0.5">
                                <div className="col-span-2 font-bold text-slate-900">SALAIRE DE BASE</div>
                                <div className="text-center">26.00</div>
                                <div className="text-center">{baseTaux.toFixed(2)}</div>
                                <div className="text-right font-medium text-slate-700">+{basePayer.toFixed(2)}</div>
                              </div>
                              {(transportPayer > 0 || totalCommission > SMIG) && (
                                <div className="grid grid-cols-5 py-0.5">
                                  <div className="col-span-2 font-bold text-slate-900">INDIMNITE DE TRANSPORT</div>
                                  <div className="text-center">1.00</div>
                                  <div className="text-center">{transportPayer.toFixed(2)}</div>
                                  <div className="text-right font-medium text-slate-700">+{transportPayer.toFixed(2)}</div>
                                </div>
                              )}
                              {(commissionPayer > 0 || totalCommission > SMIG) && (
                                <div className="grid grid-cols-5 py-0.5">
                                  <div className="col-span-2 font-bold text-slate-900">COMMISSION</div>
                                  <div className="text-center">1.00</div>
                                  <div className="text-center">{commissionPayer.toFixed(2)}</div>
                                  <div className="text-right font-medium text-slate-700">+{commissionPayer.toFixed(2)}</div>
                                </div>
                              )}
                              {(primePayer > 0 || totalCommission > SMIG) && (
                                <div className="grid grid-cols-5 py-0.5">
                                  <div className="col-span-2 font-bold text-slate-900">PRIME DE LA TOURNEE</div>
                                  <div className="text-center">1.00</div>
                                  <div className="text-center">{primePayer.toFixed(2)}</div>
                                  <div className="text-right font-medium text-slate-700">+{primePayer.toFixed(2)}</div>
                                </div>
                              )}
                              <div className="grid grid-cols-5 py-0.5 border-t border-slate-200 mt-1 font-bold text-slate-900 text-[11px]">
                                <div className="col-span-2">SALAIRE BRUT</div>
                                <div className="text-center"></div>
                                <div className="text-center"></div>
                                <div className="text-right font-bold text-slate-900">{totalCommission.toFixed(2)}</div>
                              </div>
                              <div className="grid grid-cols-5 py-0.5 text-red-600">
                                <div className="col-span-2">RETENUE CNSS (PATRONALE / OUT)</div>
                                <div className="text-center">{baseCNSS.toFixed(2)}</div>
                                <div className="text-center">4.48%</div>
                                <div className="text-right">-{cnss.toFixed(2)}</div>
                              </div>
                              <div className="grid grid-cols-5 py-0.5 text-red-600">
                                <div className="col-span-2">RETENUE AMO</div>
                                <div className="text-center">{baseCNSS.toFixed(2)}</div>
                                <div className="text-center">2.26%</div>
                                <div className="text-right">-{amo.toFixed(2)}</div>
                              </div>
                              <div className="grid grid-cols-5 py-0.5 border-t border-slate-200 font-bold text-slate-900 text-[11px]">
                                <div className="col-span-2">SALAIRE NET DE CHARGES</div>
                                <div className="text-center"></div>
                                <div className="text-center"></div>
                                <div className="text-right text-slate-900">{salaireNet.toFixed(2)}</div>
                              </div>
                              {acompte > 0 && (
                                <div className="grid grid-cols-5 py-0.5 text-amber-700 font-medium">
                                  <div className="col-span-2">AVANCE / ACOMPTE SUR COMMISSIONS</div>
                                  <div className="text-center"></div>
                                  <div className="text-center"></div>
                                  <div className="text-right">-{acompte.toFixed(2)}</div>
                                </div>
                              )}
                              <div className="grid grid-cols-5 py-1 border-t-2 border-slate-300 font-black text-slate-900 text-xs bg-slate-50 uppercase">
                                <div className="col-span-2">SALAIRE NET A PERCEVOIR (MAD)</div>
                                <div className="text-center"></div>
                                <div className="text-center"></div>
                                <div className="text-right text-emerald-700 font-bold">{netAPayer.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-400 mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                            <div>Mode de paiement: VIREMENT AGENCEDUCOMPTE</div>
                            <div className="italic">Signé électroniquement</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Volume Vendu</p>
                        <p className="text-2xl font-black text-slate-700">{payrollData.totalVolume} uni.</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transactions</p>
                        <p className="text-2xl font-black text-slate-700">{payrollData.salesCount}</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-slate-400" />
                    Détail des Commissions
                  </h3>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-3 font-medium text-slate-600">Produit</th>
                          <th className="p-3 font-medium text-slate-600 text-right">Quantité</th>
                          <th className="p-3 font-medium text-slate-600 text-right">Taux Commission</th>
                          <th className="p-3 font-medium text-slate-600 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payrollData.details.map((detail, idx) => (
                          <tr key={`payroll-detail-${detail.brandName || idx}-${detail.category || idx}-${idx}`} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-900">{detail.brandName} - {detail.category}</td>
                            <td className="p-3 text-right text-slate-600">{detail.quantity}</td>
                            <td className="p-3 text-right text-slate-600">{detail.commissionRate.toFixed(2)} MAD</td>
                            <td className="p-3 text-right font-medium text-slate-900">{detail.total.toFixed(2)} MAD</td>
                          </tr>
                        ))}
                        {payrollData.details.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">Aucune vente enregistrée pour cette période.</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={3} className="p-3 text-right text-slate-700">Total Commissions:</td>
                          <td className="p-3 text-right text-blue-600 text-lg">{payrollData.totalCommission.toFixed(2)} MAD</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800 flex items-start gap-3">
                    <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                      <strong>Note:</strong> Ce chauffeur est rémunéré exclusivement à la commission. 
                      Les taux de commission sont définis dans les paramètres GPL par marque et catégorie de produit.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <FileText className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Générateur de Fiche de Paie</h3>
                <p className="text-slate-500 max-w-md">
                  Sélectionnez un chauffeur et un mois dans le panneau latéral pour calculer les commissions et générer la fiche de paie.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'history' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Rechercher un employé</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nom ou prénom..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mois (si pas de recherche)</label>
                <input
                  type="month"
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value)}
                  disabled={!!historySearch}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                {historySearch 
                  ? `Historique pour "${historySearch}"` 
                  : `Fiches de paie - ${new Date(historyMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                }
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-medium text-slate-600">Employé</th>
                    <th className="p-4 font-medium text-slate-600">Période</th>
                    <th className="p-4 font-medium text-slate-600 text-right">Volume</th>
                    <th className="p-4 font-medium text-slate-600 text-right">Transactions</th>
                    <th className="p-4 font-medium text-slate-600 text-right">Total Net</th>
                    <th className="p-4 font-medium text-slate-600 text-center">Statut</th>
                    <th className="p-4 font-medium text-slate-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyData.map((item, idx) => (
                    <tr key={`payroll-history-${item.driver?.id || idx}-${item.month}-${idx}`} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.driver.prenom} {item.driver.nom}</div>
                        <div className="text-xs text-slate-500">CIN: {item.driver.cin || '-'}</div>
                      </td>
                      <td className="p-4 text-slate-600">
                        {new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right text-slate-600">{item.totalVolume}</td>
                      <td className="p-4 text-right text-slate-600">{item.salesCount}</td>
                      <td className="p-4 text-right font-bold text-blue-600">{item.totalCommission.toFixed(2)} MAD</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'validée' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => {
                              setSelectedDriverId(item.driver.id);
                              setMonth(item.month);
                              setActiveTab('generator');
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {item.status === 'validée' && (
                            <button 
                              onClick={() => {
                                if (confirm('Supprimer cette fiche de paie validée ?')) {
                                  deletePaySlip(item.paySlipId);
                                  toast.success('Fiche de paie supprimée.');
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">
                        Aucun résultat trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Filtrer les déclarations CNSS</h2>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Chauffeur</label>
                <select 
                  value={cnssFilterDriverId}
                  onChange={e => setCnssFilterDriverId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Tous les chauffeurs</option>
                  {drivers.map((d, dIdx) => (
                    <option key={`cnss-driver-opt-${d.id || dIdx}-${dIdx}`} value={d.id}>{d.prenom} {d.nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mois</label>
                <input 
                  type="month"
                  value={cnssFilterMonth}
                  onChange={e => setCnssFilterMonth(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="p-4">Mois</th>
                    <th className="p-4">Chauffeur</th>
                    <th className="p-4">Salaire Brut (MAD)</th>
                    <th className="p-4">Base CNSS (MAD)</th>
                    <th className="p-4 text-right">CNSS 4.48% (MAD)</th>
                    <th className="p-4 text-right">AMO 2.26% (MAD)</th>
                    <th className="p-4 text-right">Total Retenues (MAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cnssData.map((item, idx) => (
                    <tr key={`cnss-row-${item.driverId || idx}-${item.month}-${idx}`} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{item.month}</td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{item.driver?.prenom} {item.driver?.nom}</div>
                        <div className="text-xs text-slate-500">Matricule: {item.driverId.substring(0, 5).toUpperCase()}</div>
                      </td>
                      <td className="p-4 text-slate-700">{item.totalCommission.toFixed(2)}</td>
                      <td className="p-4 font-medium text-slate-700">{item.baseCNSS.toFixed(2)}</td>
                      <td className="p-4 text-right text-red-600 font-medium">-{item.cnss.toFixed(2)}</td>
                      <td className="p-4 text-right text-red-600 font-medium">-{item.amo.toFixed(2)}</td>
                      <td className="p-4 text-right text-red-700 font-bold">-{item.totalRetenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {cnssData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">
                        Aucune déclaration trouvée pour les filtres sélectionnés.
                      </td>
                    </tr>
                  )}
                </tbody>
                {cnssData.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={4} className="p-4 text-right text-slate-700">Total Général:</td>
                      <td className="p-4 text-right text-red-600">
                        -{cnssData.reduce((sum, item) => sum + item.cnss, 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-red-600">
                        -{cnssData.reduce((sum, item) => sum + item.amo, 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-red-700">
                        -{cnssData.reduce((sum, item) => sum + item.totalRetenue, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
