import { useMemo, useState } from 'react';
import { skillIdentity } from '@teamgym/domain';
import type { ElementExecution, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { SpringChain } from './spring-chain';
import { EMPTY_CHAIN, chainIsEmpty, chainPrefill, listedSpring } from './spring-chain-model';
import type { ChainSlot, ChainState } from './spring-chain-model';
import { filterSpringChoices, springPickerRows, teamSpringCounts } from './spring-picker-model';
import { springDirectionText, springDisplayName, springLibrary } from './spring-library';
import type { SpringDefinition } from './spring-library';
import { PlanDifficulty, PlanNoAthlete } from './plan-skill-select';
import { points } from './components';

/** Samme katalog, kædefilter, D-filter og rangering som gymnastens vælger, uden personlig vurdering. */
export function AmbitionSpringPicker({ workspace, rulePackage, discipline, teamId, selected, approvalNote, onSelect, onBuild }: {
  workspace: Workspace;
  rulePackage: RulePackage;
  discipline: 'tumbling' | 'trampet';
  teamId: string;
  selected: SpringDefinition | null;
  approvalNote?: string | null;
  onSelect: (definition: SpringDefinition) => void;
  onBuild: (elements: ElementExecution[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [minimum, setMinimum] = useState('');
  const [unknown, setUnknown] = useState(false);
  const [chain, setChain] = useState<ChainState>(EMPTY_CHAIN);
  const [active, setActive] = useState<ChainSlot | null>(0);
  const library = useMemo(() => springLibrary(rulePackage, workspace).filter((item) => item.definition.discipline === discipline && listedSpring(item)), [rulePackage, workspace, discipline]);
  const prechain = filterSpringChoices(library, discipline, query, EMPTY_CHAIN, minimum, unknown, rulePackage);
  const choices = filterSpringChoices(library, discipline, query, chain, minimum, unknown, rulePackage);
  const counts = useMemo(() => teamSpringCounts(workspace, teamId), [workspace, teamId]);
  const rows = springPickerRows(library, choices, [], query, counts);
  const prefill = chainPrefill(library.map((item) => item.definition), chain);
  const preview = selected?.discipline === 'tumbling' && approvalNote ? { ...selected, sharedConnectionApproval: { executionIdentity: skillIdentity(selected), approvedAt: new Date().toISOString(), note: approvalNote } } : selected;
  const selectionEvaluation = preview ? rulePackage.evaluateSkill(preview) : null;
  const reset = () => { setQuery(''); setMinimum(''); setUnknown(false); setChain(EMPTY_CHAIN); setActive(0); };
  return (
    <section className="ambition-picker" aria-label="Find spring til ambition">
      <div className="ambition-picker-search" role="search" aria-label="Find spring">
        <label>Søg spring
          <input type="search" aria-label="Søg sammensat spring eller alias" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Søg, fx strakt rondat" />
        </label>
        <details className="ambition-chain-filter">
          <summary>Kædefilter{!chainIsEmpty(chain) ? ' · aktivt' : ''}</summary>
          <SpringChain discipline={discipline} definitions={prechain.map((item) => item.definition)} labels={library.map((item) => item.definition)} state={chain} change={setChain} active={active} setActive={setActive} />
        </details>
        <details className="picker-more" open={minimum !== '' || unknown || undefined}>
          <summary>Filtrér på D{minimum || unknown ? ' · aktivt' : ''}</summary>
          <div className="picker-more-fields">
            <label>Minimum-D
              <input type="text" inputMode="decimal" value={minimum} disabled={unknown} onChange={(event) => { if (/^\d*(?:[.,]\d*)?$/.test(event.target.value)) setMinimum(event.target.value); }} placeholder="Alle værdier" />
            </label>
            <label className="check"><input type="checkbox" checked={unknown} onChange={(event) => setUnknown(event.target.checked)} />Kun spring, hvor D er ukendt</label>
          </div>
        </details>
      </div>
      {selected && <div className="ambition-picker-selected" role="status">
        <small>Valgt spring · bevares ved filtrering</small>
        <strong>{springDisplayName(selected, rulePackage)}</strong>
        <span>{springDirectionText(selected)}</span>
        <PlanDifficulty value={selectionEvaluation?.difficulty.value ? points(selectionEvaluation.difficulty.value) : null} />
        <PlanNoAthlete />
        {selected.discipline === 'tumbling' && (selected.sharedConnectionApproval || approvalNote) && <small>Trænerbekræftet forbindelse{approvalNote ? ' ved gemning' : ''}</small>}
      </div>}
      <div className="ambition-picker-results-head"><strong>Resultater</strong><span role="status">{choices.length} spring passer</span>{(query || minimum || unknown || !chainIsEmpty(chain)) && <button type="button" className="quiet" onClick={reset}>Nulstil filtre</button>}</div>
      {choices.length ? <div className="ambition-picker-results" role="list">
        {rows.map((row) => {
          const choice = row.choice;
          if (!choice) return null;
          const evaluation = rulePackage.evaluateSkill(choice.definition);
          return <div key={row.key} role="listitem"><button type="button" className="ambition-picker-row" aria-label={`Vælg ${springDisplayName(choice.definition, rulePackage)}`} onClick={() => onSelect({ ...structuredClone(choice.definition), id: choice.own ? choice.definition.id : crypto.randomUUID() })}>
            <span><strong>{springDisplayName(choice.definition, rulePackage)}</strong><small>{springDirectionText(choice.definition)} · {choice.definition.discipline === 'tumbling' && choice.definition.sharedConnectionApproval ? 'Trænerbekræftet forbindelse' : evaluation.connection === 'unverified' ? 'Forbindelse uafklaret' : 'Forbindelse kendt'}</small></span>
            <PlanDifficulty value={evaluation.difficulty.value ? points(evaluation.difficulty.value) : null} />
            <PlanNoAthlete />
          </button></div>;
        })}
      </div> : <div className="ambition-picker-empty" role="status">
        <p>Ingen færdige spring passer til filtrene.</p>
        {prefill.length > 0 ? <button type="button" onClick={() => onBuild(prefill)}>Byg videre fra den valgte kæde</button> : !chainIsEmpty(chain) && <p>Vælg en præcis variant for at fortsætte, eller start fra bunden.</p>}
        <button type="button" className="quiet" onClick={() => onBuild([])}>Byg fra bunden</button>
      </div>}
      {choices.length > 0 && <button type="button" className="quiet ambition-picker-build" onClick={() => onBuild([])}>Byg det selv →</button>}
    </section>
  );
}
