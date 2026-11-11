import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { STABILITY_ANCHORS } from '@teamgym/domain';
import type { ElementExecution } from '@teamgym/domain';
import type { SpringDiscipline, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { springRegistrationPlan } from './spring-library';
import { SpringChoiceRows } from './spring-choice-rows';
import type { FoundationControls } from './spring-choice-rows';
import { filterSpringChoices, springPickerRowRank, springPickerRows, teamSpringCounts } from './spring-picker-model';
import { EMPTY_CHAIN, chainIsEmpty, chainPrefill, listedSpring, matchesChain } from './spring-chain-model';
import type { ChainSlot, ChainState } from './spring-chain-model';
import { SpringChain } from './spring-chain';
import type { SpringChoice, SpringSelection } from './spring-library';

export function SpringPicker({
  controls,
  library,
  apparatus,
  setApparatus,
  workspace,
  athleteId,
  rulePackage,
  selections,
  change,
  includeShorter,
  setIncludeShorter,
  assessedAt,
  setAssessedAt,
  build,
}: {
  controls: FoundationControls;
  library: SpringChoice[];
  /** Redskabsfilter; Alle viser bane og trampet i samme liste. Gemmes aldrig. */
  apparatus: SpringDiscipline | 'all';
  setApparatus: (value: SpringDiscipline | 'all') => void;
  workspace: Workspace;
  athleteId: string;
  rulePackage: RulePackage;
  selections: SpringSelection[];
  change: (selection: SpringSelection[]) => void;
  includeShorter: boolean;
  setIncludeShorter: (value: boolean) => void;
  assessedAt: string;
  setAssessedAt: (value: string) => void;
  /** Skift til Byg selv med kædens præcise elementer som start. */
  build: (elements: ElementExecution[]) => void;
}) {
  const ids = useId();
  const [query, setQuery] = useState('');
  const [minimum, setMinimum] = useState('');
  const [unknown, setUnknown] = useState(false);
  const evaluations = useMemo(
    () => new Map(library.map((item) => [item.id, rulePackage.evaluateSkill(item.definition)])),
    [library, rulePackage],
  );
  const [chain, setChain] = useState<ChainState>(EMPTY_CHAIN);
  const [activeSlot, setActiveSlot] = useState<ChainSlot | null>(0);
  // Kædens pladser betyder noget andet på trampet; begynd forfra ved skift af redskab.
  const chooseApparatus = (next: SpringDiscipline | 'all') => {
    if (next === apparatus) return;
    setApparatus(next);
    setChain(EMPTY_CHAIN);
    setActiveSlot(0);
    setOnlySelected(false);
  };
  const [onlySelected, setOnlySelected] = useState(false);
  const selectionFilter = useRef<HTMLButtonElement>(null);
  const picker = useRef<HTMLElement>(null);
  const results = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const list = picker.current?.querySelector('.unified-spring-list');
    if (list) list.scrollTop = 0;
  }, [query, minimum, unknown, chain, onlySelected, apparatus]);
  const disciplineLibrary = useMemo(
    // Atypiske indbyggede serier står uden for listen og bygges med Byg selv.
    () =>
      library.filter(
        (item) => (apparatus === 'all' || item.definition.discipline === apparatus) && listedSpring(item),
      ),
    [library, apparatus],
  );
  const filtered = filterSpringChoices(library, apparatus, query, EMPTY_CHAIN, minimum, unknown, rulePackage);
  const choices = filtered.filter((item) => matchesChain(item.definition, chain));
  const teamId = workspace.athletes.find((athlete) => athlete.id === athleteId)?.teamId;
  const teamCounts = useMemo(
    () => teamSpringCounts(workspace, teamId, athleteId),
    [workspace, teamId, athleteId],
  );
  const plan = useMemo(
    () =>
      springRegistrationPlan(selections, rulePackage, includeShorter, { ...controls, workspace, athleteId }),
    [selections, rulePackage, includeShorter, controls, workspace, athleteId],
  );
  const inherited = plan.filter((item) => !item.explicit && !item.excluded);
  const rows = springPickerRows(library, onlySelected ? [] : choices, plan, query, teamCounts);
  const matches = query.trim()
    ? rows.filter((row) => springPickerRowRank(row, query) !== null).length
    : choices.length;
  const filtersActive = minimum !== '' || unknown;
  const searching = !!query.trim() || !chainIsEmpty(chain) || filtersActive || apparatus !== 'all';
  const prefill = chainPrefill(
    disciplineLibrary.map((item) => item.definition),
    chain,
  );
  const reset = () => {
    setQuery('');
    setChain(EMPTY_CHAIN);
    setActiveSlot(0);
    setMinimum('');
    setUnknown(false);
    setOnlySelected(false);
    setApparatus('all');
  };
  const noResults = !onlySelected && choices.length === 0;
  const buildLink = noResults ? (
    <div className="picker-build picker-build-empty" role="status">
      {prefill.length > 0 ? (
        <>
          <p>Ingen færdige spring passer. Fortsæt fra den præcise begyndelse, du har valgt.</p>
          <button type="button" onClick={() => build(prefill)}>Byg videre <span aria-hidden="true">→</span></button>
        </>
      ) : (
        <p>{!chainIsEmpty(chain) ? 'Vælg en præcis variant i kæden for at bygge videre, eller start fra bunden.' : 'Ingen færdige spring passer til filtrene.'}</p>
      )}
      <button type="button" className="quiet" onClick={() => build([])}>Byg fra bunden</button>
    </div>
  ) : (
    <p className="picker-build">
      <span>{searching ? 'Finder du ikke springet?' : 'Mangler et spring?'}</span>
      <button type="button" className="quiet" onClick={() => build(prefill)}>
        Byg det selv <span aria-hidden="true">→</span>
      </button>
      {prefill.length > 0 && <small>Kæden, du har valgt, er lagt ind som start.</small>}
    </p>
  );
  return (
    <section ref={picker} className="unified-picker" aria-label="Springvælger">
      <div className="picker-layout">
        <div className="picker-find" role="search" aria-label="Find spring">
          <h3 className="picker-step">
            <span aria-hidden="true">1</span> Find springet
          </h3>
          <input
            type="search"
            aria-label="Søg sammensat spring eller alias"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOnlySelected(false);
            }}
            placeholder="Søg, fx rondat-flik-1/1 eller kraft barani"
          />
          <div className="picker-apparatus" role="group" aria-label="Redskab">
            {APPARATUS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={apparatus === value}
                onClick={() => chooseApparatus(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="picker-find-hint">… eller byg kæden op ét spring ad gangen:</p>
          <SpringChain
            discipline={apparatus}
            chooseDiscipline={chooseApparatus}
            definitions={filtered.map((item) => item.definition)}
            labels={disciplineLibrary.map((item) => item.definition)}
            state={chain}
            change={(next) => {
              setChain(next);
              setOnlySelected(false);
            }}
            active={activeSlot}
            setActive={setActiveSlot}
          />
          <details className="picker-more" open={filtersActive || undefined}>
            <summary>Filtrér på D{filtersActive ? ' · aktivt' : ''}</summary>
            <div className="picker-more-fields">
              <label>
                Minimum-D
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Alle værdier"
                  value={minimum}
                  disabled={unknown}
                  onChange={(event) => {
                    if (/^\d*(?:[.,]\d*)?$/.test(event.target.value)) setMinimum(event.target.value);
                  }}
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={unknown}
                  onChange={(event) => setUnknown(event.target.checked)}
                />
                Kun spring, hvor D er ukendt
              </label>
            </div>
          </details>
          <button
            type="button"
            className="picker-jump"
            onClick={() => {
              setActiveSlot(null);
              setOnlySelected(false);
              requestAnimationFrame(() =>
                results.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
              );
            }}
          >
            Vis {matches} spring <span aria-hidden="true">↓</span>
          </button>
        </div>
        <div ref={results} className="picker-results">
          <h3 className="picker-step">
            <span aria-hidden="true">2</span> Vælg og vurdér sikkerhed
          </h3>
          <div className="picker-results-head">
            <div className="picker-view" role="group" aria-label="Vis">
              <button type="button" aria-pressed={!onlySelected} onClick={() => setOnlySelected(false)}>
                {searching ? 'Resultater' : 'Alle spring'}
              </button>
              <button
                ref={selectionFilter}
                type="button"
                aria-pressed={onlySelected}
                onClick={() => setOnlySelected(true)}
              >
                Valgte <span className="picker-view-count">{selections.length}</span>
              </button>
            </div>
            {!onlySelected && (
              <span className="picker-count" role="status">
                {matches} spring passer
              </span>
            )}
            {searching && (
              <button type="button" className="quiet picker-reset" onClick={reset}>
                Nulstil søgning
              </button>
            )}
          </div>
          <SpringChoiceRows
            rows={rows}
            showApparatus={apparatus === 'all' || onlySelected}
            {...{ selections, controls, rulePackage, workspace, athleteId, evaluations, teamCounts }}
            empty={
              onlySelected
                ? 'Du har ikke valgt nogen spring endnu.'
                : 'Ingen spring i listen passer til søgningen.'
            }
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
          {buildLink}
          {selections.length > 0 && (
            <div className="picker-selection">
              <p className="picker-selection-summary" role="status">
                {selections.length} spring valgt
                {inherited.length ? ` · ${inherited.length} fundament medtages` : ''}
              </p>
              <div className="picker-switch-field">
                <label className="picker-switch">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-describedby={`${ids}-shorter`}
                    checked={includeShorter}
                    onChange={(event) => setIncludeShorter(event.target.checked)}
                  />
                  <span>Medtag fundament automatisk</span>
                </label>
                <small id={`${ids}-shorter`}>
                  Kortere begyndelser af de valgte serier, fx rondat – flik i rondat – flik – strakt salto,
                  registreres også. De arver sikkerheden og kan vurderes eller fravælges i listen.
                </small>
              </div>
              {(selections.some((item) => item.stability !== null) ||
                [...controls.ownAssessments.values()].some((value) => value !== null)) && (
                <label className="picker-date">
                  Vurderingsdato
                  <input
                    type="date"
                    value={assessedAt}
                    required
                    onChange={(event) => setAssessedAt(event.target.value)}
                  />
                </label>
              )}
            </div>
          )}
          <details className="picker-scale">
            <summary>Hvad betyder sikkerhed 1–5?</summary>
            <ol>
              {STABILITY_ANCHORS.map((anchor) => (
                <li key={anchor}>{anchor}</li>
              ))}
            </ol>
          </details>
        </div>
      </div>
    </section>
  );
}

const APPARATUS = [
  ['all', 'Alle'],
  ['tumbling', 'Bane'],
  ['trampet', 'Trampet'],
] as const;
