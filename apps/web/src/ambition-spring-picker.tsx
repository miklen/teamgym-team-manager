import { useMemo, useState } from 'react';
import { skillIdentity } from '@teamgym/domain';
import type { ElementExecution, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { SpringChain } from './spring-chain';
import { EMPTY_CHAIN, chainIsEmpty, chainPrefill, listedSpring, matchesChain } from './spring-chain-model';
import type { ChainSlot, ChainState } from './spring-chain-model';
import { matchesDirection, springPickerRows, springPurity, teamUsableSpringCounts } from './spring-picker-model';
import type { SpringDirectionFilter as DirectionFilter } from './spring-picker-model';
import { SpringDirectionFilter, directionCounts } from './spring-direction-filter';
import { SpringMinimumFilter, passesSpringMinimum, useSpringMinimum } from './spring-minimum-filter';
import { matchesSpring, springDirectionText, springDisplayName, springLibrary } from './spring-library';
import type { SpringDefinition } from './spring-library';
import { PlanDifficulty } from './plan-skill-select';
import { points } from './components';
import { TwistSplit } from './twist-split';
import { twistElements, withTwistDistribution } from './twist-choice';

/** Samme katalog, kædefilter, D-filter og rangering som gymnastens vælger, uden personlig vurdering. */
export function AmbitionSpringPicker({ workspace, rulePackage, discipline, teamId, selected, approvalNote, apparatus, onSelect, onBuild }: {
  workspace: Workspace;
  rulePackage: RulePackage;
  discipline: 'tumbling' | 'trampet';
  teamId: string;
  selected: SpringDefinition | null;
  approvalNote?: string | null;
  apparatus?: { allows: (definition: SpringDefinition) => boolean; message: string } | undefined;
  onSelect: (definition: SpringDefinition) => void;
  onBuild: (elements: ElementExecution[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [minimum, setMinimum] = useSpringMinimum();
  const [unknown, setUnknown] = useState(false);
  const [chain, setChain] = useState<ChainState>(EMPTY_CHAIN);
  const [active, setActive] = useState<ChainSlot | null>(0);
  const [direction, setDirection] = useState<DirectionFilter>('all');
  const directional = discipline === 'tumbling';
  const allChoices = useMemo(() => springLibrary(rulePackage, workspace)
    .filter((choice) => choice.definition.discipline === discipline && listedSpring(choice))
    .map((choice) => {
      const evaluation = rulePackage.evaluateSkill(choice.definition);
      return { choice, evaluation, purity: springPurity(evaluation), difficulty: evaluation.difficulty.value };
    }), [rulePackage, workspace, discipline]);
  const available = apparatus ? allChoices.filter(({ choice }) => apparatus.allows(choice.definition)) : allChoices;
  const library = available.map(({ choice }) => choice);
  const searched = available.filter(({ choice }) => matchesSpring(choice, query));
  const byDifficulty = ({ difficulty }: (typeof available)[number]) =>
    unknown ? difficulty === null : passesSpringMinimum(difficulty, minimum);
  const inDirection = ({ purity }: (typeof available)[number]) => !directional || matchesDirection(purity, direction);
  const prechain = searched.filter(byDifficulty);
  const chained = searched.filter(({ choice }) => matchesChain(choice.definition, chain));
  const matchingDifficulty = chained.filter(byDifficulty);
  const choices = matchingDifficulty.filter(inDirection).map(({ choice }) => choice);
  const evaluations = new Map(available.map(({ choice, evaluation }) => [choice.id, evaluation]));
  const counts = useMemo(() => teamUsableSpringCounts(workspace, teamId, rulePackage), [workspace, teamId, rulePackage]);
  const rowCounts = new Map(available.map(({ choice, evaluation }) => [skillIdentity(choice.definition), counts.get(evaluation.identity) ?? 0]));
  const rows = springPickerRows(library, choices, [], query, rowCounts);
  const prefill = chainPrefill(library.map((item) => item.definition), chain);
  const preview = selected?.discipline === 'tumbling' && approvalNote ? { ...selected, sharedConnectionApproval: { executionIdentity: skillIdentity(selected), approvedAt: new Date().toISOString(), note: approvalNote } } : selected;
  const selectionEvaluation = preview ? rulePackage.evaluateSkill(preview) : null;
  const selectedCapable = selectionEvaluation ? counts.get(selectionEvaluation.identity) ?? 0 : 0;
  const reset = () => { setQuery(''); setMinimum(null); setUnknown(false); setChain(EMPTY_CHAIN); setActive(0); setDirection('all'); };
  return (
    <section className="ambition-picker" aria-label="Find spring til ambition">
      {apparatus?.message && <p className="muted">{apparatus.message}</p>}
      <div className="ambition-picker-search" role="search" aria-label="Find spring">
        <label>Søg spring
          <input type="search" aria-label="Søg sammensat spring eller alias" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Søg, fx strakt rondat" />
        </label>
        {directional && <SpringDirectionFilter value={direction} onChange={setDirection} counts={directionCounts(matchingDifficulty.map(({ purity }) => purity))} />}
        <details className="ambition-chain-filter">
          <summary>Kædefilter{!chainIsEmpty(chain) ? ' · aktivt' : ''}</summary>
          <SpringChain discipline={discipline} definitions={prechain.map(({ choice }) => choice.definition)} labels={library.map((item) => item.definition)} state={chain} change={setChain} active={active} setActive={setActive} />
        </details>
        <SpringMinimumFilter
          minimum={minimum}
          difficulties={available.map(({ difficulty }) => difficulty)}
          shown={choices.length}
          total={chained.filter(inDirection).length}
          onChange={setMinimum}
          unknownOnly={unknown}
        />
        <label className="check ambition-picker-unknown">
          <input
            type="checkbox"
            checked={unknown}
            onChange={(event) => {
              event.stopPropagation();
              setUnknown(event.target.checked);
            }}
          />
          Kun spring, hvor D er ukendt
        </label>
      </div>
      {selected && <div className="ambition-picker-selected" role="status">
        <small>Valgt spring · bevares ved filtrering</small>
        <strong>{springDisplayName(selected, rulePackage)}</strong>
        <span>{springDirectionText(selected)}</span>
        <PlanDifficulty value={selectionEvaluation?.difficulty.value ? points(selectionEvaluation.difficulty.value) : null} />
        <span className={`ambition-picker-count${selectedCapable ? ' has-capable' : ''}`}>{selectedCapable} kan springet</span>
        {selected.discipline === 'tumbling' && (selected.sharedConnectionApproval || approvalNote) && <small>Trænerbekræftet forbindelse{approvalNote ? ' ved gemning' : ''}</small>}
      </div>}
      {selected && twistElements(selected).map(({ element, index, label }) => <TwistSplit key={index} element={element} label={label} onChange={(distribution) => onSelect(withTwistDistribution(selected, index, distribution))} />)}
      <div className="ambition-picker-results-head"><strong>Resultater</strong>{(query || minimum || unknown || !chainIsEmpty(chain) || (directional && direction !== 'all')) && <button type="button" className="quiet" onClick={reset}>Nulstil filtre</button>}</div>
      {choices.length ? <div className="ambition-picker-results" role="list">
        {rows.map((row) => {
          const choice = row.choice;
          const evaluation = choice && evaluations.get(choice.id);
          if (!choice || !evaluation) return null;
          const capable = counts.get(evaluation.identity) ?? 0;
          return <div key={row.key} role="listitem"><button type="button" className="ambition-picker-row" aria-label={`Vælg ${springDisplayName(choice.definition, rulePackage)}, ${capable} ${capable === 1 ? 'gymnast kan' : 'gymnaster kan'} springet`} onClick={() => onSelect({ ...structuredClone(choice.definition), id: choice.own ? choice.definition.id : crypto.randomUUID() })}>
            <span><strong>{springDisplayName(choice.definition, rulePackage)}</strong><small>{springDirectionText(choice.definition)} · {choice.definition.discipline === 'tumbling' && choice.definition.sharedConnectionApproval ? 'Trænerbekræftet forbindelse' : evaluation.connection === 'unverified' ? 'Forbindelse uafklaret' : 'Forbindelse kendt'}</small></span>
            <PlanDifficulty value={evaluation.difficulty.value ? points(evaluation.difficulty.value) : null} />
            <span className={`ambition-picker-count${capable ? ' has-capable' : ''}`}>{capable} kan springet</span>
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
