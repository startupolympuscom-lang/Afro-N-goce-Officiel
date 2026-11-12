import React from 'react';
import type { Recommendation, SimResult, SimScenario } from '../../../../lib/tresorerieSim';
import { fmtMAD } from './ui';
import { dayName } from './ScenarioEditors';

/** How the suggested dates are found, in plain words, with an example taken from the current month. */
export function FormulaPanel({ scenario, result, recommendations }: { scenario: SimScenario; result: SimResult; recommendations: Recommendation[] }) {
  const example = [...recommendations].filter((r) => r.status === 'ok' && r.capacity.length > 1).sort((a, b) => b.amount - a.amount)[0];
  const cap = example?.capacity.find((c) => c.day === example.recommendedDay);
  const before = example?.capacity.find((c) => c.day === example.recommendedDay - 1);
  return (
    <div className="space-y-5 text-sm text-slate-700">
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          <strong>Ce qui rentre chaque jour.</strong> Le chiffre d'affaires du mois est réparti sur les {result.workDaysCount} jours travaillés ({fmtMAD(result.dailySales)} par jour).
          La part payée comptant ({scenario.cashSharePct} %) rentre le jour même, le reste rentre {scenario.creditDelayDays} jours plus tard.
        </li>
        <li>
          <strong>Ce qu'on peut payer un jour donné.</strong> On regarde le solde de ce jour et de tous les jours suivants : on peut payer le plus petit de ces soldes,
          moins le seuil de sécurité ({fmtMAD(scenario.minReserve)}). Ainsi, payer ce jour-là ne met en danger aucun paiement plus tard dans le mois.
        </li>
        <li>
          <strong>La date conseillée.</strong> Les dépenses dont la date limite est la plus proche sont placées en premier (à date égale : salaires, CNSS et impôts
          avant les fournisseurs), chacune au premier jour de sa période où la caisse peut la payer. Si aucun jour ne suffit, l'outil le signale avec le montant qui manque.
        </li>
      </ol>
      {example && cap && (
        <p className="rounded-lg bg-slate-50 px-4 py-3">
          Exemple : {example.label}{example.installments > 1 ? ` (${example.index + 1}/${example.installments})` : ''}, {fmtMAD(example.amount)}.
          {before ? <> Le {before.day}, on ne peut payer que {fmtMAD(Math.max(0, before.value))} ;</> : null} le {dayName(scenario.month, example.recommendedDay, { weekday: 'long', day: 'numeric' })}, on peut payer {fmtMAD(cap.value)} : c'est la date conseillée.
        </p>
      )}
      <div className="rounded-lg border border-slate-200 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-slate-700">
        Solde(J) = Solde(J−1) + encaissements(J) − paiements(J)<br />
        Peut payer(J) = min(Solde(J), Solde(J+1), …, Solde(fin du mois)) − seuil<br />
        Date conseillée = premier jour de la période où Peut payer(J) ≥ montant<br />
        Indice de santé = 40 × couverture + 30 × jours sans rupture + 20 × coussin + 10 × autonomie bancaire
      </div>
    </div>
  );
}
