import React from 'react';
import type { Recommendation, SimResult, SimScenario } from '../../../../lib/tresorerieSim';
import { fmtMAD } from './ui';
import { dayName } from './ScenarioEditors';

/** Every rule of the simulation, in plain words, with figures taken from the current month. */
export function FormulaPanel({ scenario, result, recommendations }: { scenario: SimScenario; result: SimResult; recommendations: Recommendation[] }) {
  const example = [...recommendations].filter((r) => r.status === 'ok' && r.capacity.length > 1).sort((a, b) => b.amount - a.amount)[0];
  const cap = example?.capacity.find((c) => c.day === example.recommendedDay);
  const before = example?.capacity.find((c) => c.day === example.recommendedDay - 1);
  const credit = 100 - scenario.cashSharePct;
  return (
    <div className="space-y-5 text-sm text-slate-700">
      <ol className="list-decimal space-y-2.5 pl-5">
        <li>
          <strong>Ventes du mois.</strong> Le chiffre d'affaires ({fmtMAD(result.turnover)}) est réparti sur les {result.workDaysCount} jours travaillés : {fmtMAD(result.dailySales)} par jour.
          {' '}{scenario.cashSharePct} % rentrent le jour même ; les {credit} % vendus à crédit rentrent {scenario.creditDelayDays} jours plus tard.
          Ceux qui tombent après la fin du mois ({fmtMAD(result.creditNextMonth)}) seront encaissés le mois prochain.
        </li>
        <li>
          <strong>Clients à crédit du mois dernier.</strong> Le montant saisi ({fmtMAD(scenario.priorCredit)}) rentre sur les premiers jours du mois,
          le jour où le délai de chaque vente se termine.
        </li>
        <li>
          <strong>Solde de chaque jour.</strong> Solde du jour = solde de la veille + rentrées du jour − paiements du jour.
          Le flux de trésorerie du mois est la différence entre le solde de fin de mois et celui du 1er ({result.cashFlow > 0 ? '+' : ''}{fmtMAD(result.cashFlow)}).
        </li>
        <li>
          <strong>Ce qu'on peut payer un jour donné.</strong> Le plus petit solde entre ce jour et la fin du mois, moins le montant à garder en caisse ({fmtMAD(scenario.minReserve)}).
          Payer ce jour-là ne met donc en danger aucun paiement plus tard dans le mois.
        </li>
        <li>
          <strong>Date conseillée.</strong> Les dépenses dont la date limite est la plus proche sont placées d'abord (à date égale : salaires, CNSS et impôts avant les fournisseurs),
          chacune au premier jour de sa période où la caisse peut la payer. À défaut, l'outil indique s'il faut entamer le montant de sécurité, utiliser le découvert,
          ou combien il manque à la date limite.
        </li>
        <li>
          <strong>Pistes pour une trésorerie positive.</strong> Pour chaque levier pris seul (chiffre d'affaires, dépenses, part comptant, délai des clients),
          l'outil cherche la plus petite valeur qui donne un flux du mois positif et une caisse qui ne passe jamais sous le montant de sécurité, puis vérifie
          ce résultat en refaisant la simulation.
        </li>
        <li>
          <strong>Banque.</strong> Le découvert couvre un solde négatif jusqu'à son plafond ; agios = montant débiteur × taux ÷ 360 par jour, prélevés en fin de mois.
          Crédit de trésorerie : remboursé avec intérêts = montant × taux × jours ÷ 360. Escompte : la banque avance les créances (moins intérêts et frais),
          puis le client paie la banque à l'échéance. Le délai obtenu du fournisseur gaz repousse ses paiements : ce qui passe après la fin du mois est un gain ponctuel.
        </li>
      </ol>
      {example && cap && (
        <p className="rounded-lg bg-slate-50 px-4 py-3">
          Exemple : {example.label}{example.installments > 1 ? ` (${example.index + 1}/${example.installments})` : ''}, {fmtMAD(example.amount)}.
          {before ? <> Le {before.day}, on ne peut payer que {fmtMAD(Math.max(0, before.value))} ;</> : null} le {dayName(scenario.month, example.recommendedDay, { weekday: 'long', day: 'numeric' })}, on peut payer {fmtMAD(cap.value)} : c'est la date conseillée.
        </p>
      )}
      <div className="rounded-lg border border-slate-200 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-slate-700">
        Solde(J) = Solde(J−1) + rentrées(J) − paiements(J)<br />
        Flux du mois = Solde(fin du mois) − Solde(1er) = rentrées du mois − sorties du mois<br />
        Peut payer(J) = min(Solde(J), …, Solde(fin du mois)) − montant de sécurité<br />
        Date conseillée = premier jour de la période où Peut payer(J) ≥ montant<br />
        Indice de santé = 40 × couverture + 30 × jours sans rupture + 20 × coussin + 10 × autonomie bancaire
      </div>
    </div>
  );
}
