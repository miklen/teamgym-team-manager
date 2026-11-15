import { AMBITION_ROUNDS_ISSUE } from '@teamgym/rules';
import type { BonusPotential, CompositionGuideOverview, CompositionGuideRow, DisciplineEvaluation, RulePackage, TeamProfile } from '@teamgym/rules';
import { extraLimitText, points, SourceLinks } from './components';
import { RuleUncertainty } from './rule-uncertainty';
import { hasAmbitionScorePotential, maximumScoreText } from './planned-spot';
import './composition-guide.css';

function overviewAmount(overview: CompositionGuideOverview, kind: 'bonus' | 'deduction'): string {
  if (!overview.started || overview.contextInvalid) return '—';
  const decision = overview[kind];
  const sign = kind === 'bonus' ? '+' : '−';
  if (overview.complete && decision.value !== null) return `${sign}${points(decision.value)}`;
  return decision.knownSubtotal.compare(0) > 0 ? `Foreløbigt ${sign}${points(decision.knownSubtotal)}` : 'Afventer';
}

export function CompositionGuide({ rows, overview, maximum, profile, rulePackage, potentials, potentialError, onCancelSearch, onPreview, onRound }: {
  rows: readonly CompositionGuideRow[]; overview: CompositionGuideOverview; maximum?: DisciplineEvaluation; profile: TeamProfile; rulePackage: RulePackage;
  potentials: readonly BonusPotential[] | null; potentialError: string;
  onCancelSearch: () => void; onPreview: (potential: BonusPotential) => void;
  onRound: (roundId: string) => void;
}) {
  const groups = [
    { title: 'Krav til omgangene', rows: rows.filter((row) => row.category !== 'bonus') },
    { title: 'Mulige tillæg', rows: rows.filter((row) => row.category === 'bonus') },
  ];
  const otherDeductions = maximum?.contributions.filter((item) => item.kind === 'deduction' && item.id !== 'C-HOLD' && item.id !== 'C-RETNING' && item.id !== 'C-REDSKAB' && (item.decision.value === null || item.decision.value.compare(0) !== 0)) ?? [];
  const missing = maximum?.rounds.reduce((sum, round) => sum + round.entries.filter((item) => item.entry.athleteId === null).length, 0) ?? 0;
  const progress = overview.contextInvalid ? 'Regelgrundlag kræver gennemgang'
    : !overview.started ? 'Ingen omgange klar'
      : `${overview.readyRounds}/${overview.totalRounds} omgange klar${overview.unresolved ? ' · åbne regler' : ''}${missing ? ` · ${missing} mangler gymnast` : ''}`;
  return <section className="composition-guide" aria-label="Guide til springplanens komposition">
    <details className="composition-guide-disclosure">
      <summary className="composition-guide-overview">
        <span className="guide-overview-title"><strong>Kompositionsguide</strong><small>{progress}</small></span>
        <span className="guide-overview-metric"><small>Tillæg</small><strong>{overviewAmount(overview, 'bonus')}</strong></span>
        <span className="guide-overview-metric"><small>Fradrag</small><strong>{overviewAmount(overview, 'deduction')}</strong></span>
        {maximum && <span className="guide-overview-metric guide-overview-maximum"><small>Maks. mulig karakter · loft</small><strong>{hasAmbitionScorePotential(maximum) && 'Foreløbigt '}{maximumScoreText(maximum)}{maximum.rounds.some((round) => round.plannedExecution.count > 0) && maximum.spotCost.value && <span className="guide-overview-note"> · modtagning {points(maximum.spotCost.value)}</span>}</strong></span>}
        <span className="guide-overview-toggle">Vis detaljer <span aria-hidden="true">⌄</span></span>
      </summary>
      <div className="composition-guide-expanded">
        <div className="composition-guide-heading">
          <div><h2>Planen mod reglementet</h2><p>{profile.counting} tællende · {extraLimitText(rulePackage, profile)} · {overview.totalRounds} omgange.</p></div>
        </div>
    <div className="composition-guide-groups">
      {groups.map((group) => <div className="composition-guide-group" key={group.title}>
        <h3>{group.title}</h3>
      {group.rows.map((row) => {
        const potential = potentials?.find((item) => item.id === row.id);
        return <details className="composition-guide-row" key={row.id}>
          <summary>
            <span className="guide-row-main"><strong>{row.label}</strong><small>{row.counting}</small></span>
            <span className="guide-row-status">
              <span className="guide-status-line">{row.status}<span className="guide-chevron" aria-hidden="true">⌄</span></span>
              {potential?.documentedValue && <small>Dokumenteret {points(potential.documentedValue)}{potential.status === 'lower-bound' ? ' eller mere' : ''}</small>}
            </span>
          </summary>
          <div className="guide-row-detail">
            <p>{row.requirement}</p>
            {(row.counts.length === 0 || row.id === 'G-RAMME' || row.id === 'B-ELEMENT') && <p>{row.detail}</p>}
            {row.counts.length > 0 && row.id !== 'G-RAMME' && row.id !== 'C-FLOW' && <div className="guide-round-data" aria-label="Fordeling på omgange">
              {row.counts.map((series, seriesIndex) => <div className="guide-round-series" key={seriesIndex}>
                {row.counts.length > 1 && <strong>{row.id === 'C-RETNING' ? seriesIndex === 0 ? 'Forlæns' : 'Baglæns' : seriesIndex === 0 ? 'Med Pegasus' : 'Uden Pegasus'}</strong>}
                <div className="guide-round-values">{series.map((count, index) => <button type="button" key={index} className="guide-round-value" onClick={() => onRound(rows[0]!.roundIds[index]!)}>
                  <span>{index + 1}. omgang</span><b>{row.id === 'B-ELEMENT' ? count : `${count}/${profile.counting}`}</b>
                </button>)}</div>
              </div>)}
            </div>}
            {row.ruleMaximum && <p>Maksimalt tillæg: {points(row.ruleMaximum)} ved {profile.counting}/{profile.counting}. Delvist tillæg tæller også.</p>}
            {row.preliminary && <p>Foreløbigt planbidrag: {points(row.preliminary)}. Beløbet er ikke et endeligt C-tillæg.</p>}
            {potential && <div className="guide-potential">
              <p>Planlagt {points(potential.selected)} · dokumenteret mulighed {points(potential.documentedValue)}.</p>
              <small>{potential.status === 'lower-bound'
                ? 'Dokumenteret undergrænse; søgningen blev begrænset eller afbrudt.'
                : potential.status === 'proven'
                  ? 'Dokumenteret med en konkret opstilling.'
                  : potential.status === 'unresolved'
                    ? `Uafklaret ${potential.issue ?? ''}`
                    : potential.issue === AMBITION_ROUNDS_ISSUE
                      ? 'Forslag udskifter ikke omgange med ambitioner. Besæt eller fjern dem for at se forslag.'
                      : 'Ikke nok anvendelige registreringer til en fuld opstilling.'}</small>
              <button className="quiet" type="button" disabled={!potential.preview} onClick={() => onPreview(potential)}>Se konkrete ændringer</button>
            </div>}
            {row.example && <p>Eksempel at træne frem mod: {row.example.label} ({row.example.code}). Eksemplet viser et katalogspring, ikke en gymnasts registrerede kunnen.</p>}
            <RuleUncertainty ids={row.issues} knownIssues={rulePackage.knownIssues} />
            <SourceLinks sources={row.sources} rulePackage={rulePackage} />
            {row.example && <SourceLinks sources={row.example.sources} rulePackage={rulePackage} />}
            {(row.counts.length === 0 || row.id === 'G-RAMME') && <div className="guide-row-actions">
              {row.roundIds.length ? row.roundIds.map((id, index) => <button key={id} type="button" className="quiet" onClick={() => onRound(id)}>Se {(rows[0]?.roundIds.indexOf(id) ?? index) + 1}. omgang</button>)
                : <button type="button" className="quiet" onClick={() => onRound(rows[0]!.roundIds[0]!)}>Se 1. omgang</button>}
            </div>}
          </div>
        </details>;
      })}
      </div>)}
    </div>
    {maximum && <div className="guide-account" aria-label="C-regnskab">
      <div className="guide-account-head"><h3>C-regnskab</h3><span>Planlagt sammensætning · udførelse vurderes på gulvet</span></div>
      <div className="guide-account-equation">
        <div><small>Grundværdi</small><strong>{points(maximum.contributions.find((item) => item.kind === 'base')?.decision.value ?? null)}</strong></div>
        <div><small>Tillæg</small><strong>{overviewAmount(overview, 'bonus')}</strong></div>
        <div><small>Fradrag</small><strong>{overviewAmount(overview, 'deduction')}</strong></div>
        <div className="guide-account-result"><small>Planlagt C</small><strong>{points(maximum.composition.panel)}</strong></div>
      </div>
      {otherDeductions.length > 0 && <div className="guide-extra-deductions"><h4>Øvrige fradrag</h4>
        {otherDeductions.map((item) => <details key={item.id} className="guide-deduction">
          <summary><span>{item.label}</span><strong>{item.decision.value === null ? 'Afventer' : `−${points(item.decision.value)}`}</strong><span className="guide-chevron" aria-hidden="true">⌄</span></summary>
          <div className="guide-deduction-detail">
            {item.affectedIds.length > 0 && <p>{item.id === 'C-GENTAG' && !rulePackage.knownIssues.some((issue) => issue.id === 'Q03') ? 'Berørte omgange' : 'Berørte valg'}: {item.affectedIds.map((id) => {
              const index = maximum.rounds.findIndex((round) => round.id === id);
              if (index >= 0) return `Omgang ${index + 1}`;
              return maximum.rounds.flatMap((round) => round.entries).find((entry) => entry.entry.id === id)?.athleteName ?? 'Hele disciplinen';
            }).join(', ')}</p>}
            <RuleUncertainty ids={item.decision.issues} knownIssues={rulePackage.knownIssues} />
            <SourceLinks sources={item.sources} rulePackage={rulePackage} />
          </div>
        </details>)}
      </div>}
    </div>}
    {(potentialError || !potentials) && <div className="composition-guide-note">
      {potentialError && <p role="alert">{potentialError}</p>}
      {!potentials && !potentialError && <p role="status">Beregner registrerede muligheder… Du kan redigere videre. <button className="quiet" type="button" onClick={onCancelSearch}>Afbryd søgning</button></p>}
    </div>}
      </div>
    </details>
  </section>;
}
