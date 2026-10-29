import { useMemo } from 'react';
import { skillIdentity } from '@teamgym/domain';
import type { Stability, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { points, statusText } from './components';
import { springDirectionText, springFoundation } from './spring-library';
import type { SpringSelection } from './spring-library';
import type { SpringPickerRow } from './spring-picker-model';

export interface FoundationControls {
  following: string[];
  setFollowing: (value: string[]) => void;
  excluded: string[];
  setExcluded: (value: string[]) => void;
  ownAssessments: Map<string, Stability | null>;
  setOwnAssessments: (value: Map<string, Stability | null>) => void;
  sourceChoices: Map<string, string>;
  setSourceChoices: (value: Map<string, string>) => void;
}

export function SpringChoiceRows({
  rows,
  selections,
  change,
  controls,
  rulePackage,
  workspace,
  athleteId,
  evaluations,
}: {
  rows: SpringPickerRow[];
  selections: SpringSelection[];
  change: (value: SpringSelection[]) => void;
  controls: FoundationControls;
  rulePackage: RulePackage;
  workspace: Workspace;
  athleteId: string;
  evaluations?: ReadonlyMap<string, ReturnType<RulePackage['evaluateSkill']>>;
}) {
  const existing = useMemo(() => {
    const identities = new Map(workspace.skills.map((skill) => [skill.id, skillIdentity(skill)]));
    return new Map(
      workspace.athleteSkills
        .filter((item) => item.athleteId === athleteId)
        .map((item) => [identities.get(item.skillId)!, item]),
    );
  }, [workspace, athleteId]);
  return (
    <>
      <div className="spring-picker-columns" aria-hidden="true">
        <span>Spring og ophav</span>
        <span>Egen D</span>
        <span>Sikkerhed</span>
      </div>
      <ul className="spring-batch unified-spring-list" aria-label="Færdige spring">
        {rows.map(({ definition, identity, key, planned, choice }) => {
          const evaluation =
            (choice && skillIdentity(choice.definition) === identity && evaluations?.get(choice.id)) ||
            rulePackage.evaluateSkill(definition);
          const previous = existing.get(identity);
          const child = !!planned && !planned.explicit;
          const checked = !!planned && !planned.excluded;
          const status = planned?.unresolved
            ? 'Afklar skruefordeling'
            : planned?.excluded
              ? 'Fravalgt'
              : child
                ? planned.ownAssessment
                  ? 'Fundament · Egen vurdering'
                  : planned.sourceName
                    ? `Arvet fra ${planned.sourceName}`
                    : 'Vælg arvekilde · D er ukendt'
                : planned
                  ? 'Valgt direkte'
                  : previous && !previous.archived
                    ? 'Allerede registreret'
                    : '';
          const jump = definition.discipline === 'trampet' ? definition.jump : null;
          return (
            <li
              key={key}
              data-spring-identity={identity}
              data-selection={planned ? (child ? 'foundation' : 'direct') : 'candidate'}
              className={`spring-batch-row ${checked ? 'selected' : ''} ${child ? 'spring-foundation-row' : ''} ${planned?.excluded ? 'is-excluded' : ''}`}
            >
              <label className="spring-batch-choice">
                <input
                  type="checkbox"
                  checked={checked}
                  aria-label={`${definition.name} ${status} ${springDirectionText(definition)} ${choice?.group ?? ''} · D: ${points(evaluation.difficulty.value)}`
                    .replace(/\s+/g, ' ')
                    .trim()}
                  onChange={(event) => {
                    if (child) {
                      controls.setExcluded(
                        event.target.checked
                          ? controls.excluded.filter((item) => item !== identity)
                          : [...new Set([...controls.excluded, identity])],
                      );
                    } else if (event.target.checked) {
                      controls.setExcluded(controls.excluded.filter((item) => item !== identity));
                      change([
                        ...selections,
                        {
                          definition,
                          stability: previous?.archived ? null : (previous?.stability ?? null),
                          confirmed: true,
                        },
                      ]);
                    } else {
                      if (planned?.relations.length)
                        controls.setExcluded([...new Set([...controls.excluded, identity])]);
                      change(selections.filter((item) => skillIdentity(item.definition) !== identity));
                    }
                  }}
                />
                <span>
                  <strong>{definition.name}</strong>
                  <small className="spring-directions">{springDirectionText(definition)}</small>
                  {status && (
                    <small className="spring-row-origin">
                      {child && <span aria-hidden="true">↳ </span>}
                      {status}
                    </small>
                  )}
                </span>
              </label>
              <span className="spring-row-d">
                <small>Egen D</small>
                <strong>
                  {planned?.unresolved
                    ? 'Uafklaret'
                    : evaluation.difficulty.value
                      ? points(evaluation.difficulty.value)
                      : statusText[evaluation.difficulty.status]}
                </strong>
              </span>
              <label className="spring-batch-rating">
                <span>Sikkerhed</span>
                <select
                  aria-label={`${child ? 'Vurdering' : 'Sikkerhed'} for ${definition.name}`}
                  disabled={!checked || planned?.unresolved}
                  value={child && !planned.ownAssessment ? 'inherit' : (planned?.stability ?? '')}
                  onChange={(event) => {
                    const stability =
                      event.target.value && event.target.value !== 'inherit'
                        ? (Number(event.target.value) as Stability)
                        : null;
                    if (!child)
                      change(
                        selections.map((item) =>
                          skillIdentity(item.definition) === identity ? { ...item, stability } : item,
                        ),
                      );
                    else {
                      const next = new Map(controls.ownAssessments);
                      if (event.target.value === 'inherit') {
                        next.delete(identity);
                        controls.setFollowing([...controls.following, identity]);
                      } else {
                        next.set(identity, stability);
                        controls.setFollowing(controls.following.filter((item) => item !== identity));
                      }
                      controls.setOwnAssessments(next);
                    }
                  }}
                >
                  {child && (
                    <option value="inherit">
                      Arvet · {planned.stability === null ? 'Ikke vurderet' : `${planned.stability}/5`}
                    </option>
                  )}
                  <option value="">{child ? 'Egen · Ikke vurderet' : 'Ikke vurderet'}</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {child ? `Egen · ${value}/5` : `${value}/5`}
                    </option>
                  ))}
                </select>
              </label>
              {planned?.explicit &&
                jump?.rotationQuarterTurns === 8 &&
                [1, 3].includes(jump.twistsHalfTurns) && (
                  <label className="spring-row-detail">
                    Skruefordeling for {definition.name}
                    <select
                      value={jump.twistDistribution.join(',')}
                      onChange={(event) => {
                        const next = selections.map((item) => {
                          if (
                            skillIdentity(item.definition) !== identity ||
                            item.definition.discipline !== 'trampet'
                          )
                            return item;
                          const updated = {
                            ...item.definition,
                            jump: {
                              ...item.definition.jump,
                              twistDistribution: event.target.value
                                ? event.target.value.split(',').map(Number)
                                : [],
                            },
                          };
                          const previousFoundation = springFoundation(item.definition, rulePackage);
                          const updatedFoundation = springFoundation(updated, rulePackage);
                          const excludedRelations = previousFoundation.filter((entry) =>
                            controls.excluded.includes(skillIdentity(entry.definition)),
                          );
                          if (excludedRelations.length)
                            controls.setExcluded([
                              ...new Set([
                                ...controls.excluded,
                                ...excludedRelations.flatMap((previous) => {
                                  const matches = updatedFoundation.filter(
                                    (entry) => entry.relationId === previous.relationId,
                                  );
                                  const matching =
                                    matches.find(
                                      (entry) =>
                                        skillIdentity(entry.definition) ===
                                        skillIdentity(previous.definition),
                                    ) ?? (matches.length === 1 ? matches[0] : undefined);
                                  return matching ? [skillIdentity(matching.definition)] : [];
                                }),
                              ]),
                            ]);
                          return { ...item, definition: updated };
                        });
                        change(next);
                      }}
                    >
                      <option value="">Afklar skruefordeling</option>
                      {(jump.twistsHalfTurns === 1 ? ['1,0', '0,1'] : ['3,0', '1,2', '2,1', '0,3']).map(
                        (value) => (
                          <option key={value} value={value}>
                            {value
                              .split(',')
                              .map((part) => `${Number(part) * 180}°`)
                              .join(' + ')}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                )}
              {planned?.needsSource && (
                <label className="spring-row-detail">
                  Arvekilde for {definition.name}
                  <select
                    value={controls.sourceChoices.get(identity) ?? ''}
                    onChange={(event) => {
                      const next = new Map(controls.sourceChoices);
                      next.set(identity, event.target.value);
                      controls.setSourceChoices(next);
                    }}
                  >
                    <option value="">Vælg kilde</option>
                    {planned.relations.map((relation) => {
                      const source =
                        selections.find((item) => skillIdentity(item.definition) === relation.sourceIdentity)
                          ?.definition ??
                        workspace.skills.find((skill) => skillIdentity(skill) === relation.sourceIdentity);
                      return (
                        source && (
                          <option key={relation.sourceIdentity} value={relation.sourceIdentity}>
                            {source.name}
                          </option>
                        )
                      );
                    })}
                  </select>
                </label>
              )}
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="empty">Ingen spring matcher. Prøv en anden søgning, eller vælg Byg selv.</li>
        )}
      </ul>
    </>
  );
}
