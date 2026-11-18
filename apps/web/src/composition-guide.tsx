import { useId } from 'react';
import { AMBITION_ROUNDS_ISSUE } from '@teamgym/rules';
import type { BonusPotential, CompositionGuideOverview, CompositionGuideRow, DisciplineEvaluation, RulePackage, TeamProfile } from '@teamgym/rules';
import { extraLimitText, points, SourceLinks } from './components';
import { bonusIncrease, bonusName } from './composition-opportunities';
import { RuleUncertainty } from './rule-uncertainty';
import { hasAmbitionScorePotential, maximumScoreText } from './planned-spot';
import { Icon } from './ui';
import './composition-guide.css';

function overviewAmount(overview: CompositionGuideOverview, kind: 'bonus' | 'deduction'): string {
  if (!overview.started || overview.contextInvalid) return '—';
  const decision = overview[kind];
  const sign = kind === 'bonus' ? '+' : '−';
  if (overview.complete && decision.value !== null) return sign + points(decision.value);
  return decision.knownSubtotal.compare(0) > 0 ? 'Foreløbigt ' + sign + points(decision.knownSubtotal) : 'Afventer';
}

function bonusOutcome(row: CompositionGuideRow) {
  if (row.current !== null) return row.current.compare(0) > 0 ? '+' + points(row.current) + ' i planen' : 'Intet tillæg i planen';
  if (row.preliminary?.compare(0)) return 'Foreløbigt +' + points(row.preliminary);
  return row.status;
}

function bonusCoverage(row: CompositionGuideRow) {
  if (row.id === 'B-ELEMENT') return row.counting;
  const counts = row.counts[0] ?? [];
  const best = Math.max(0, ...counts);
  if (!best) return row.counting;
  const rounds = counts.flatMap((count, index) => count === best ? [index + 1] : []);
  return `${best} tællende ${best === 1 ? 'gymnast' : 'gymnaster'} · ${rounds.length === 1 ? rounds[0] + '. omgang' : 'flere omgange'}`;
}

function ruleText(row: CompositionGuideRow, counting: number) {
  if ((row.id === 'T-DOBBELT-FRI' || row.id === 'T-DOBBELT-REDSKAB') && row.ruleMaximum) {
    const rate = row.ruleMaximum.divide(counting).decimal(2).replace('.', ',');
    const apparatus = row.id === 'T-DOBBELT-FRI' ? 'uden Pegasus' : 'med Pegasus';
    return `Hver tællende gymnast med dobbeltsalto ${apparatus} giver ${rate} point. Omgangen med flest afgør tillægget.`;
  }
  return row.requirement;
}

function GuideRoundData({ row, roundIds, counting, onRound }: {
  row: CompositionGuideRow; roundIds: readonly string[]; counting: number; onRound: (id: string) => void;
}) {
  return <div className="guide-round-data" aria-label="Fordeling på omgange">
    {row.counts.map((series, seriesIndex) => {
      const best = Math.max(...series);
      return <div className="guide-round-series" key={seriesIndex}>
        {row.counts.length > 1 && <strong>{row.id === 'C-RETNING' ? seriesIndex === 0 ? 'Forlæns' : 'Baglæns' : seriesIndex === 0 ? 'Med Pegasus' : 'Uden Pegasus'}</strong>}
        <div className="guide-round-values">{series.map((count, index) => (
          <button key={roundIds[index]} type="button" className="guide-round-value" data-best={count > 0 && count === best}
            onClick={() => onRound(roundIds[index]!)}>
            <span>{index + 1}. omgang</span>
            <b>{row.id === 'B-ELEMENT' ? count : `${count}/${counting}`}</b>
          </button>
        ))}</div>
      </div>;
    })}
  </div>;
}

function GuideRow({ row, group, potential, roundIds, profile, rulePackage, onRound, onPreview }: {
  row: CompositionGuideRow; group: string; potential?: BonusPotential | undefined; roundIds: readonly string[];
  profile: TeamProfile; rulePackage: RulePackage;
  onRound: (id: string) => void; onPreview: (potential: BonusPotential) => void;
}) {
  const bonus = row.category === 'bonus';
  const increase = bonusIncrease(potential);
  const full = row.current !== null && row.ruleMaximum !== null && row.current.compare(row.ruleMaximum) >= 0;
  return <details className="composition-guide-row" name={group} data-guide-rule={row.id}>
    <summary>
      <span className="guide-row-main">
        <strong>{bonus ? bonusName(row) : row.label}</strong>
        <small>{bonus ? bonusCoverage(row) : row.counting}</small>
      </span>
      <span className="guide-row-status">
        <span className="guide-status-line">{bonus ? bonusOutcome(row) : row.status}</span>
        {increase && <small className="guide-gain">+{points(increase)} med ændringer</small>}
      </span>
      <Icon name="right" className="guide-chevron" />
    </summary>
    <div className="guide-row-detail">
      {increase && potential && <div className="guide-potential">
        <dl>
          <div><dt>{row.preliminary ? 'Foreløbigt i planen' : 'I planen'}</dt><dd>+{points(potential.selected ?? potential.selectedKnownSubtotal)}</dd></div>
          <div><dt>Med forslaget</dt><dd>+{points(potential.documentedValue)}</dd></div>
        </dl>
        {potential.status === 'lower-bound' && <p>Søgningen nåede at finde denne opstilling.</p>}
        <button type="button" className="finding-next" onClick={() => onPreview(potential)}>Se konkrete ændringer<Icon name="arrow" /></button>
      </div>}
      <p className="guide-rule-text">{ruleText(row, profile.counting)}</p>
      {(row.counts.length === 0 || row.id === 'G-RAMME' || row.id === 'B-ELEMENT') && <p>{row.detail}</p>}
      {row.counts.length > 0 && row.id !== 'G-RAMME' && row.id !== 'C-FLOW' && <GuideRoundData row={row} roundIds={roundIds} counting={profile.counting} onRound={onRound} />}
      {!increase && potential && row.status !== 'Uafklaret' && <p className="guide-bonus-note">
        {full ? 'Planen får det fulde tillæg.'
          : potential.issue === AMBITION_ROUNDS_ISSUE ? 'Forslag kan beregnes, når de berørte ambitioner er besat eller fjernet.'
          : 'Søgningen fandt ingen opstilling med et højere tillæg blandt holdets registrerede spring.'}
      </p>}
      <RuleUncertainty ids={row.issues} knownIssues={rulePackage.knownIssues} />
      {(row.counts.length === 0 || row.id === 'G-RAMME') && <div className="guide-row-actions">
        {(row.roundIds.length ? row.roundIds : roundIds.slice(0, 1)).map((id) => (
          <button key={id} type="button" className="finding-next" onClick={() => onRound(id)}>Se {roundIds.indexOf(id) + 1}. omgang<Icon name="arrow" /></button>
        ))}
      </div>}
      <div className="guide-rule-footer">
        <SourceLinks sources={row.sources} rulePackage={rulePackage} />
        {row.ruleMaximum && <span>Maks. i reglementet +{points(row.ruleMaximum)}</span>}
      </div>
      {row.example && <details className="guide-example">
        <summary>Eksempel fra springkataloget <Icon name="right" className="guide-chevron" /></summary>
        <p>{row.example.label} <span>({row.example.code})</span></p>
        <SourceLinks sources={row.example.sources} rulePackage={rulePackage} />
      </details>}
    </div>
  </details>;
}

export function CompositionGuide({ rows, overview, maximum, profile, rulePackage, potentials, potentialError, onCancelSearch, onPreview, onRound }: {
  rows: readonly CompositionGuideRow[]; overview: CompositionGuideOverview; maximum?: DisciplineEvaluation; profile: TeamProfile; rulePackage: RulePackage;
  potentials: readonly BonusPotential[] | null; potentialError: string;
  onCancelSearch: () => void; onPreview: (potential: BonusPotential) => void; onRound: (roundId: string) => void;
}) {
  const id = useId();
  const roundIds = rows[0]?.roundIds ?? [];
  const groups = [
    { title: 'Krav til omgangene', rows: rows.filter((row) => row.category !== 'bonus') },
    { title: 'Tillæg', rows: rows.filter((row) => row.category === 'bonus') },
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
        <span className="guide-overview-toggle">Detaljer <Icon name="right" /></span>
      </summary>
      <div className="composition-guide-expanded">
        <div className="composition-guide-heading">
          <h2>Planen mod reglementet</h2>
          <p>{profile.counting} tællende · {extraLimitText(rulePackage, profile)} · {overview.totalRounds} omgange</p>
        </div>
        {maximum && <div className="guide-account" aria-label="C-regnskab">
          <div className="guide-account-head"><h3>C-regnskab</h3><span>Planlagt sammensætning</span></div>
          <div className="guide-account-equation">
            <div><small>Grundværdi</small><strong>{points(maximum.contributions.find((item) => item.kind === 'base')?.decision.value ?? null)}</strong></div>
            <div><small>Tillæg</small><strong>{overviewAmount(overview, 'bonus')}</strong></div>
            <div><small>Fradrag</small><strong>{overviewAmount(overview, 'deduction')}</strong></div>
            <div className="guide-account-result"><small>Planlagt C</small><strong>{points(maximum.composition.panel)}</strong></div>
          </div>
          {otherDeductions.length > 0 && <div className="guide-extra-deductions"><h4>Øvrige fradrag</h4>
            {otherDeductions.map((item) => {
              const finding = maximum.planFindings.find((entry) => entry.contributionId === item.id);
              return <details key={item.id} name={id + '-deductions'} className="guide-deduction" data-guide-rule={item.id}>
                <summary><span>{item.label}</span><strong>{item.decision.value === null ? 'Afventer' : '−' + points(item.decision.value)}</strong><Icon name="right" className="guide-chevron" /></summary>
                <div className="guide-deduction-detail">
                  {finding && <p>{finding.detail}</p>}
                  <RuleUncertainty ids={item.decision.issues} knownIssues={rulePackage.knownIssues} />
                  <div className="guide-rule-footer">
                    <SourceLinks sources={item.sources} rulePackage={rulePackage} />
                    {finding?.roundIds.length ? <div role="group" aria-label="Berørte omgange" className="guide-round-links">
                      {finding.roundIds.map((id) => <button key={id} type="button" className="finding-next" onClick={() => onRound(id)}>Se {roundIds.indexOf(id) + 1}. omgang<Icon name="arrow" /></button>)}
                    </div> : null}
                  </div>
                </div>
              </details>;
            })}
          </div>}
        </div>}
        <div className="composition-guide-groups">
          {groups.map((group) => <div className="composition-guide-group" key={group.title}>
            <h3>{group.title}</h3>
            {group.rows.map((row) => <GuideRow key={row.id} row={row} group={id + group.title} roundIds={roundIds} profile={profile}
              rulePackage={rulePackage} potential={potentials?.find((item) => item.id === row.id)} onPreview={onPreview} onRound={onRound} />)}
          </div>)}
        </div>
        {(potentialError || !potentials) && <div className="composition-guide-note">
          {potentialError
            ? <p role="alert">{potentialError}</p>
            : <p role="status">Søger efter forbedringer med holdets spring. <button className="quiet" type="button" onClick={onCancelSearch}>Afbryd søgning</button></p>}
        </div>}
      </div>
    </details>
  </section>;
}
