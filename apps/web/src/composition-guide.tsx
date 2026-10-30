import type { BonusPotential, CompositionGuideOverview, CompositionGuideRow, RulePackage, TeamProfile } from '@teamgym/rules';
import { points, SourceLinks } from './components';
import { RuleUncertainty } from './rule-uncertainty';
import './composition-guide.css';

function overviewAmount(overview: CompositionGuideOverview, kind: 'bonus' | 'deduction'): string {
  if (!overview.started || overview.contextInvalid) return '—';
  const decision = overview[kind];
  const sign = kind === 'bonus' ? '+' : '−';
  if (overview.complete && decision.value !== null) return `${sign}${points(decision.value)}`;
  return decision.knownSubtotal.compare(0) > 0 ? `Foreløbigt ${sign}${points(decision.knownSubtotal)}` : 'Afventer';
}

export function CompositionGuide({ rows, overview, profile, rulePackage, potentials, potentialError, onCancelSearch, onPreview, onRound, onAnalysis }: {
  rows: readonly CompositionGuideRow[]; overview: CompositionGuideOverview; profile: TeamProfile; rulePackage: RulePackage;
  potentials: readonly BonusPotential[] | null; potentialError: string;
  onCancelSearch: () => void; onPreview: (potential: BonusPotential) => void;
  onRound: (roundId: string) => void; onAnalysis: () => void;
}) {
  const groups = [
    { title: 'Rammer og krav', rows: rows.filter((row) => row.category !== 'bonus') },
    { title: 'Tillæg', rows: rows.filter((row) => row.category === 'bonus') },
  ];
  const progress = overview.contextInvalid ? 'Regelgrundlag kræver gennemgang'
    : !overview.started ? 'Ingen omgange klar'
      : `${overview.readyRounds}/${overview.totalRounds} omgange klar${overview.unresolved ? ' · åbne regler' : ''}`;
  return <section className="composition-guide" aria-label="Guide til springplanens komposition">
    <details className="composition-guide-disclosure">
      <summary className="composition-guide-overview">
        <span className="guide-overview-title"><strong>Kompositionsguide</strong><small>{progress}</small></span>
        <span className="guide-overview-metric"><small>Tillæg</small><strong>{overviewAmount(overview, 'bonus')}</strong></span>
        <span className="guide-overview-metric"><small>Fradrag</small><strong>{overviewAmount(overview, 'deduction')}</strong></span>
        <span className="guide-overview-toggle">Vis detaljer <span aria-hidden="true">⌄</span></span>
      </summary>
      <div className="composition-guide-expanded">
        <div className="composition-guide-heading">
          <p>Holdprofil: {profile.counting} tællende · højst {profile.extra} ekstra først · {overview.totalRounds} omgange.</p>
          <button className="quiet" type="button" onClick={onAnalysis}>Fuld C-analyse</button>
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
            <p>{row.detail}</p>
            {row.ruleMaximum && <p>Regelbaseret træningsmål: op til {points(row.ruleMaximum)} pr. tillæg ved {row.counting.toLowerCase()}. Seks af seks er fuld udnyttelse, ikke en forudsætning for delvist tillæg.</p>}
            {row.preliminary && <p>Foreløbigt planbidrag: {points(row.preliminary)}. Beløbet er ikke et endeligt C-tillæg.</p>}
            {potential && <div className="guide-potential">
              <p>Valgt i planen: {points(potential.selected)} · Dokumenteret med registreret kunnen: {points(potential.documentedValue)}.</p>
              <small>{potential.status === 'lower-bound'
                ? 'Dokumenteret undergrænse; søgningen blev begrænset eller afbrudt.'
                : potential.status === 'proven'
                  ? 'Dokumenteret med en konkret opstilling.'
                  : potential.status === 'unresolved'
                    ? `Uafklaret ${potential.issue ?? ''}`
                    : 'Ikke nok anvendelige registreringer til en fuld opstilling.'}</small>
              <button className="quiet" type="button" disabled={!potential.preview} onClick={() => onPreview(potential)}>Se konkrete ændringer</button>
            </div>}
            {row.example && <p>Eksempel at træne frem mod: {row.example.label} ({row.example.code}). Eksemplet viser et katalogspring, ikke en gymnasts registrerede kunnen.</p>}
            <RuleUncertainty ids={row.issues} />
            <SourceLinks sources={row.sources} rulePackage={rulePackage} />
            {row.example && <SourceLinks sources={row.example.sources} rulePackage={rulePackage} />}
            <div className="guide-row-actions">
              {row.roundIds.length ? row.roundIds.map((id, index) => <button key={id} type="button" className="quiet" onClick={() => onRound(id)}>Se {(rows[0]?.roundIds.indexOf(id) ?? index) + 1}. omgang</button>)
                : <button type="button" className="quiet" onClick={() => onRound(rows[0]!.roundIds[0]!)}>Se 1. omgang</button>}
              <button type="button" className="quiet" onClick={onAnalysis}>Se fuld C-analyse</button>
            </div>
          </div>
        </details>;
      })}
      </div>)}
    </div>
    <div className="composition-guide-note">
      <p>Træningsmål kommer fra reglerne. Dokumenterede muligheder bygger på registreret kunnen og kan ikke lægges sammen.</p>
      {potentialError && <p role="alert">{potentialError}</p>}
      {!potentials && !potentialError && <p role="status">Beregner registrerede muligheder… Du kan redigere videre. <button className="quiet" type="button" onClick={onCancelSearch}>Afbryd søgning</button></p>}
    </div>
      </div>
    </details>
  </section>;
}
