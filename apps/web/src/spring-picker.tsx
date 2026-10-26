import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Fraction, STABILITY_ANCHORS } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { matchesSpring, springRegistrationPlan } from './spring-library';
import { SpringChoiceRows } from './spring-choice-rows';
import type { FoundationControls } from './spring-choice-rows';
import { springPickerRowRank, springPickerRows } from './spring-picker-model';
import { skillFamily } from './skill-overview';
import type { SpringChoice, SpringSelection } from './spring-library';

export function SpringPicker({
  controls,
  library,
  discipline,
  workspace,
  athleteId,
  rulePackage,
  selections,
  change,
  includeShorter,
  setIncludeShorter,
  assessedAt,
  setAssessedAt,
}: {
  controls: FoundationControls;
  library: SpringChoice[];
  discipline: 'tumbling' | 'trampet';
  workspace: Workspace;
  athleteId: string;
  rulePackage: RulePackage;
  selections: SpringSelection[];
  change: (selection: SpringSelection[]) => void;
  includeShorter: boolean;
  setIncludeShorter: (value: boolean) => void;
  assessedAt: string;
  setAssessedAt: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [minimum, setMinimum] = useState('');
  const [unknown, setUnknown] = useState(false);
  const evaluations = useMemo(
    () => new Map(library.map((item) => [item.id, rulePackage.evaluateSkill(item.definition)])),
    [library, rulePackage],
  );
  const [group, setGroup] = useState('Alle spring');
  const [onlySelected, setOnlySelected] = useState(false);
  const selectionFilter = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const list = picker.current?.querySelector('.unified-spring-list');
    if (list) list.scrollTop = 0;
  }, [query, minimum, unknown, group, onlySelected]);
  const threshold = /^\d+(?:[.,]\d+)?$/.test(minimum) ? Fraction.from(minimum.replace(',', '.')) : null;
  const choices = library.filter(
    (item) =>
      item.definition.discipline === discipline &&
      (group === 'Alle spring' || skillFamily(item.definition, rulePackage) === group) &&
      (unknown
        ? evaluations.get(item.id)!.difficulty.value === null
        : !threshold || (evaluations.get(item.id)!.difficulty.value?.compare(threshold) ?? -1) >= 0) &&
      matchesSpring(item, query),
  );
  const plan = useMemo(
    () =>
      springRegistrationPlan(selections, rulePackage, includeShorter, { ...controls, workspace, athleteId }),
    [selections, rulePackage, includeShorter, controls, workspace, athleteId],
  );
  const inherited = plan.filter((item) => !item.explicit && !item.excluded);
  const rows = springPickerRows(library, onlySelected ? [] : choices, plan, query);
  const matches = rows.filter((row) => springPickerRowRank(row, query) !== null).length;
  const scoped = onlySelected || group !== 'Alle spring' || minimum !== '' || unknown;
  return (
    <section ref={picker} className="unified-picker" aria-label="Springvælger">
      <p className="muted picker-intro">
        Vælg hele serier uden mellemtrin, og angiv sikkerhed fra 1–5 for hvert spring.
      </p>
      <div className="form-grid picker-filters">
        <label>
          Find spring
          <input
            type="search"
            aria-label="Søg sammensat spring eller alias"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Fx rondat-flik-1/1 eller kraft barani"
          />
        </label>
        <label>
          Springgruppe
          <select value={group} onChange={(event) => setGroup(event.target.value)}>
            <option>Alle spring</option>
            {[
              ...new Set(
                library
                  .filter((item) => item.definition.discipline === discipline)
                  .map((item) => skillFamily(item.definition, rulePackage)),
              ),
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Minimum-D
          <input
            type="text"
            inputMode="decimal"
            placeholder="Alle værdier"
            value={minimum}
            onChange={(event) => {
              if (/^\d*(?:[.,]\d*)?$/.test(event.target.value)) setMinimum(event.target.value);
            }}
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={unknown} onChange={(event) => setUnknown(event.target.checked)} />
          Vis kun ukendt D
        </label>
      </div>
      <div className="spring-selection-toolbar">
        <div className="batch-summary" role="status">
          {selections.length} spring valgt
          {inherited.length ? ` · ${inherited.length} fundament medtages` : ''}
        </div>
        <label className="check">
          <input
            ref={selectionFilter}
            type="checkbox"
            checked={onlySelected}
            onChange={(event) => setOnlySelected(event.target.checked)}
          />
          Kun valgte
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={includeShorter}
            onChange={(event) => setIncludeShorter(event.target.checked)}
          />
          Medtag fundament automatisk
        </label>
      </div>
      {query.trim() && (
        <div className="picker-search-feedback">
          <span role="status">
            {matches} spring matcher{plan.length ? ' · dine valg er bevaret' : ''}
          </span>
          {scoped && (
            <button
              type="button"
              className="quiet"
              onClick={() => {
                setGroup('Alle spring');
                setMinimum('');
                setUnknown(false);
                setOnlySelected(false);
              }}
            >
              Søg i alle spring
            </button>
          )}
        </div>
      )}
      <SpringChoiceRows
        rows={rows}
        {...{ selections, controls, rulePackage, workspace, athleteId, evaluations }}
        change={(next) => {
          change(next);
          if (onlySelected && next.length < selections.length)
            requestAnimationFrame(() => {
              if (
                document.activeElement === document.body ||
                document.activeElement instanceof HTMLDialogElement
              )
                selectionFilter.current?.focus();
            });
        }}
      />
      {(selections.some((item) => item.stability !== null) ||
        [...controls.ownAssessments.values()].some((value) => value !== null)) && (
        <label>
          Vurderingsdato
          <input
            type="date"
            value={assessedAt}
            required
            onChange={(event) => setAssessedAt(event.target.value)}
          />
        </label>
      )}
      <details>
        <summary>Hvad betyder sikkerhed 1–5?</summary>
        <ol>
          {STABILITY_ANCHORS.map((anchor) => (
            <li key={anchor}>{anchor}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
