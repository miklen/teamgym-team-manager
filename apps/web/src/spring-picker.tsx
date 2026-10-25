import { useMemo, useState } from 'react';
import { STABILITY_ANCHORS } from '@teamgym/domain';
import type { Stability, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { points, statusText } from './components';
import { matchesSpring, springRegistrationPlan } from './spring-library';
import type { SpringChoice, SpringSelection } from './spring-library';

export function SpringPicker({
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
  const [group, setGroup] = useState('Alle spring');
  const selected = new Map(
    selections.map((item) => [rulePackage.evaluateSkill(item.definition).identity, item]),
  );
  const existing = useMemo(
    () =>
      new Map(
        workspace.athleteSkills
          .filter((item) => item.athleteId === athleteId)
          .flatMap((registration) => {
            const skill = workspace.skills.find((item) => item.id === registration.skillId)!;
            return skill.discipline === 'rhythm'
              ? []
              : [[rulePackage.evaluateSkill(skill).identity, registration] as const];
          }),
      ),
    [workspace, athleteId, rulePackage],
  );
  const choices = library.filter(
    (item) =>
      item.definition.discipline === discipline &&
      (group === 'Alle spring' || item.group === group) &&
      matchesSpring(item, query),
  );
  const plan = useMemo(
    () => springRegistrationPlan(selections, rulePackage, includeShorter),
    [selections, rulePackage, includeShorter],
  );
  const inherited = plan.filter((item) => !item.explicit);
  return (
    <>
      <p className="muted">
        Markér de spring, gymnasten kan udføre som en hel serie uden mellemtrin. Angiv sikkerhed fra 1–5 ud
        for hvert spring.
      </p>
      <div className="form-grid">
        <label>
          Søg sammensat spring eller alias
          <input
            type="search"
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
                library.filter((item) => item.definition.discipline === discipline).map((item) => item.group),
              ),
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <ul className="spring-batch" aria-label="Færdige spring">
        {choices.map((choice) => {
          const evaluation = rulePackage.evaluateSkill(choice.definition);
          const identity = evaluation.identity;
          const selection = selected.get(identity);
          const previous = existing.get(identity);
          return (
            <li className={selection ? 'spring-batch-row selected' : 'spring-batch-row'} key={choice.id}>
              <label className="spring-batch-choice">
                <input
                  type="checkbox"
                  checked={!!selection}
                  disabled={!!previous?.archived}
                  onChange={(event) =>
                    change(
                      event.target.checked
                        ? [
                            ...selections,
                            {
                              definition: choice.definition,
                              stability: previous?.stability ?? null,
                              confirmed: true,
                            },
                          ]
                        : selections.filter(
                            (item) => rulePackage.evaluateSkill(item.definition).identity !== identity,
                          ),
                    )
                  }
                />
                <span>
                  {choice.definition.name}
                  <small>
                    {choice.group} · D:{' '}
                    {evaluation.difficulty.value
                      ? points(evaluation.difficulty.value)
                      : statusText[evaluation.difficulty.status]}
                    {previous
                      ? previous.archived
                        ? ' · Arkiveret på gymnasten'
                        : ' · Allerede registreret'
                      : ''}
                  </small>
                </span>
              </label>
              <label className="spring-batch-rating">
                <span>Sikkerhed</span>
                <select
                  aria-label={`Sikkerhed for ${choice.definition.name}`}
                  disabled={!selection}
                  value={selection?.stability ?? ''}
                  onChange={(event) =>
                    change(
                      selections.map((item) =>
                        rulePackage.evaluateSkill(item.definition).identity === identity
                          ? {
                              ...item,
                              stability: event.target.value
                                ? (Number(event.target.value) as Stability)
                                : null,
                            }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="">Ikke vurderet</option>
                  {[1, 2, 3, 4, 5].map((number) => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          );
        })}
        {choices.length === 0 && <li>Ingen spring matcher. Prøv en anden søgning, eller vælg Byg selv.</li>}
      </ul>
      <div className="batch-summary" role="status">
        {selections.length} spring valgt
        {inherited.length ? ` · ${inherited.length} kortere serier medtages` : ''}
      </div>
      {selections.length > 0 && (
        <details>
          <summary>Se valgte spring og sikkerhed</summary>
          <ul>
            {selections.map((item) => (
              <li key={rulePackage.evaluateSkill(item.definition).identity}>
                {item.definition.name} · {item.stability === null ? 'Ikke vurderet' : `${item.stability}/5`}
              </li>
            ))}
          </ul>
          <button type="button" className="quiet" onClick={() => change([])}>
            Ryd valg
          </button>
        </details>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={includeShorter}
          onChange={(event) => setIncludeShorter(event.target.checked)}
        />
        Medtag kortere serier med samme sikkerhed
      </label>
      <p className="muted">
        Kortere serier får samme sikkerhed, også når de allerede er registreret. Deles en kortere serie af
        flere valgte spring, bruges springet med lavest sværhed (D). Vælger du den korte serie særskilt,
        bruges dens egen vurdering.
      </p>
      {inherited.length > 0 && (
        <details>
          <summary>Se sikkerhed på kortere serier</summary>
          <ul>
            {inherited.map((item) => (
              <li key={rulePackage.evaluateSkill(item.definition).identity}>
                <strong>
                  {item.definition.name} · {item.stability === null ? 'Ikke vurderet' : `${item.stability}/5`}
                </strong>
                <small>Arvet fra {item.sourceName}</small>
              </li>
            ))}
          </ul>
        </details>
      )}
      {selections.some((item) => item.stability !== null) && (
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
    </>
  );
}
