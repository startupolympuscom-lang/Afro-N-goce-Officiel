import React from 'react';
import type { Recommendation, SimResult, SimScenario } from '../../../../lib/tresorerieSim';
import { fmtMAD } from './ui';
import { dayName } from './ScenarioEditors';

function Formula({ title, formula, example }: { title: string; formula: React.ReactNode; example?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[13px] leading-relaxed text-slate-800">{formula}</p>
      {example && <p className="mt-2 text-sm text-slate-600">{example}</p>}
    </div>
  );
}

/** The formulas of the simulation, with the figures of the current month. */
export function FormulaPanel({ scenario, result, recommendations }: { scenario: SimScenario; result: SimResult; recommendations: Recommendation[] }) {
  const example = [...recommendations].filter((r) => r.status === 'ok' && r.capacity.length > 1).sort((a, b) => b.amount - a.amount)[0];
  const exampleCap = example?.capacity.find((c) => c.day === example.recommendedDay);
  const dayBefore = example?.capacity.find((c) => c.day === example.recommendedDay - 1);
  const credit = 100 - scenario.cashSharePct;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Formula
        title="1. Ventes encaissées chaque jour"
        formula={<>Ventes du jour = CA du mois ÷ jours travaillés<br />Encaissé le jour J = ventes du jour × % comptant + ventes du jour (J − délai) × % crédit</>}
        example={<>{fmtMAD(result.turnover)} ÷ {result.workDaysCount} jours = <strong>{fmtMAD(result.dailySales)}</strong> par jour : {fmtMAD(result.dailySales * scenario.cashSharePct / 100)} encaissés le jour même ({scenario.cashSharePct} %) et {fmtMAD(result.dailySales * credit / 100)} {scenario.creditDelayDays} jours plus tard ({credit} %).</>}
      />
      <Formula
        title="2. Solde de chaque jour"
        formula={<>Solde(J) = Solde(J − 1) + Encaissements(J) − Paiements(J)<br />Disponible(J) = Solde(J) + découvert autorisé</>}
        example={<>Départ : {fmtMAD(scenario.openingBalance)} au 1er. Point le plus bas : <strong>{fmtMAD(result.minBalance)}</strong> le {result.minBalanceDay}. Un paiement est impossible quand Disponible(J) &lt; 0.</>}
      />
      <Formula
        title="3. Capacité de paiement d'un jour"
        formula={<>Capacité(J) = min( Solde(J), Solde(J + 1), …, Solde(fin du mois) ) − seuil de sécurité</>}
        example={<>C'est ce qu'on peut payer le jour J sans qu'aucun jour suivant ne passe sous le seuil ({fmtMAD(scenario.minReserve)}). On regarde les jours suivants car les paiements de fin de mois (salaires…) doivent aussi passer.</>}
      />
      <Formula
        title="4. Meilleur jour d'échéance"
        formula={<>Meilleur jour = premier jour de la fenêtre autorisée où Capacité(J) ≥ montant<br />Ordre : la date limite la plus proche d'abord, puis le plus gros montant<br />Sinon : premier jour en entamant le seuil, puis avec le découvert, sinon manque signalé à la date limite</>}
        example={example && exampleCap ? (
          <>
            Exemple, {example.label}{example.installments > 1 ? ` (${example.index + 1}/${example.installments})` : ''} : {fmtMAD(example.amount)}.
            {dayBefore ? <> Le {dayBefore.day}, la capacité n'est que de {fmtMAD(dayBefore.value)} ;</> : null} le {dayName(scenario.month, example.recommendedDay, { weekday: 'long', day: 'numeric' })}, elle atteint {fmtMAD(exampleCap.value)} : c'est le meilleur jour.
            Après chaque paiement placé, la capacité des jours suivants baisse du montant payé.
          </>
        ) : <>Saisissez les montants et les fenêtres des dépenses pour voir l'exemple calculé.</>}
      />
      <Formula
        title="5. Indice de solvabilité (sur 100)"
        formula={<>40 × couverture + 30 × jours sans rupture + 20 × coussin + 10 × autonomie bancaire<br />Couverture = (solde au 1er + encaissements) ÷ paiements du mois</>}
        example={<>Couverture du mois : {(result.coverage * 100).toFixed(0)} % ; {result.ruptureDays} jour(s) en rupture ; {result.daysInOverdraft} jour(s) à découvert. Un seul jour en rupture plafonne l'indice à 39, un recours au découvert à 69.</>}
      />
      <Formula
        title="6. Coût des produits bancaires"
        formula={<>Agios = Σ montant débiteur × taux ÷ 360 (par jour à découvert)<br />Intérêts crédit = montant × taux × jours ÷ 360 ; Escompte reçu = montant − montant × taux × jours d'avance ÷ 360 − frais</>}
        example={<>Coût bancaire estimé du mois : <strong>{fmtMAD(result.bankCost)}</strong>.</>}
      />
    </div>
  );
}
