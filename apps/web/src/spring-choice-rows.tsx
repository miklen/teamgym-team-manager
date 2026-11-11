import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { STABILITY_ANCHORS, skillIdentity } from '@teamgym/domain';
import type { Stability, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { points, statusText } from './components';
import { springDirectionText, springDisplayName, springFoundation } from './spring-library';
import type { SpringDefinition, SpringSelection } from './spring-library';
import type { SpringPickerRow } from './spring-picker-model';
import { TwistSplit } from './twist-split';
import { twistElements, withTwistDistribution } from './twist-choice';

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
  teamCounts,
  empty,
}: {
  rows: SpringPickerRow[];
  selections: SpringSelection[];
  change: (value: SpringSelection[]) => void;
  controls: FoundationControls;
  rulePackage: RulePackage;
  workspace: Workspace;
  athleteId: string;
  evaluations?: ReadonlyMap<string, ReturnType<RulePackage['evaluateSkill']>>;
  /** Afledt holdkendskab; vises kun, gemmes ikke. */
  teamCounts?: ReadonlyMap<string, number>;
  /** Vises, når ingen spring passer. */
  empty?: ReactNode;
}) {
  const existing = useMemo(() => {
    const identities = new Map(workspace.skills.map((skill) => [skill.id, skillIdentity(skill)]));
    return new Map(
      workspace.athleteSkills
        .filter((item) => item.athleteId === athleteId)
        .map((item) => [identities.get(item.skillId)!, item]),
    );
  }, [workspace, athleteId]);
  const evaluate = ({ definition, identity, choice }: SpringPickerRow) =>
    (choice && skillIdentity(choice.definition) === identity && evaluations?.get(choice.id)) ||
    rulePackage.evaluateSkill(definition);
  const select = (definition: SpringDefinition, identity: string, stability?: Stability | null) => {
    const previous = existing.get(identity);
    controls.setExcluded(controls.excluded.filter((item) => item !== identity));
    change([
      ...selections,
      {
        definition,
        stability:
          stability !== undefined ? stability : previous?.archived ? null : (previous?.stability ?? null),
        confirmed: true,
      },
    ]);
  };
  const setDirect = (identity: string, stability: Stability | null) =>
    change(
      selections.map((item) => (skillIdentity(item.definition) === identity ? { ...item, stability } : item)),
    );
  const setFoundation = (identity: string, value: Stability | null | 'inherit') => {
    const next = new Map(controls.ownAssessments);
    if (value === 'inherit') {
      next.delete(identity);
      controls.setFollowing([...controls.following, identity]);
    } else {
      next.set(identity, value);
      controls.setFollowing(controls.following.filter((item) => item !== identity));
    }
    controls.setOwnAssessments(next);
  };
  return (
    <>
      <div className="spring-picker-columns" aria-hidden="true">
        <span>Spring</span>
        <span>Sikkerhed · tryk for at vælge</span>
      </div>
      <ul className="spring-batch unified-spring-list" aria-label="Færdige spring">
        {rows.map((row) => {
          const { definition, identity, key, planned } = row;
          const evaluation = evaluate(row);
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
          const name = springDisplayName(definition, rulePackage);
          const known = teamCounts?.get(identity) ?? 0;
          const inherits = child && !planned.ownAssessment;
          const toggle = () => {
            if (child) {
              controls.setExcluded(
                planned.excluded
                  ? controls.excluded.filter((item) => item !== identity)
                  : [...new Set([...controls.excluded, identity])],
              );
            } else if (!planned) {
              select(definition, identity);
            } else {
              if (planned.relations.length)
                controls.setExcluded([...new Set([...controls.excluded, identity])]);
              change(selections.filter((item) => skillIdentity(item.definition) !== identity));
            }
          };
          const rate = (value: Stability | null) => {
            if (child) setFoundation(identity, value);
            else if (planned) setDirect(identity, value);
            else select(definition, identity, value);
          };
          return (
            <li
              key={key}
              data-spring-identity={identity}
              data-selection={planned ? (child ? 'foundation' : 'direct') : 'candidate'}
              data-included={checked}
              aria-label={`${name} ${status} ${springDirectionText(definition)} ${row.choice?.group ?? ''} ${known ? `· Kendt af ${known} på holdet` : ''} · D: ${points(evaluation.difficulty.value)}`
                .replace(/\s+/g, ' ')
                .trim()}
              className={`spring-batch-row ${checked ? 'selected' : ''} ${child ? 'spring-foundation-row' : ''} ${planned?.excluded ? 'is-excluded' : ''}`}
            >
              <div className="spring-batch-choice">
                <strong>{name}</strong>
                <small className="spring-directions">{springDirectionText(definition)}</small>
                {(status || known > 0) && (
                  <small className="spring-row-meta">
                    {status && <span className="spring-row-origin">{status}</span>}
                    {known > 0 && <span className="spring-team-known">Kendt af {known} på holdet</span>}
                  </small>
                )}
              </div>
              <span className="spring-row-d">
                <small>D</small>
                <strong>{planned?.unresolved ? 'Uafklaret' : difficultyText(evaluation)}</strong>
              </span>
              <div
                className="spring-rating"
                role="group"
                aria-label={`${child ? 'Vurdering' : 'Sikkerhed'} for ${name}`}
              >
                {child && (
                  <button
                    type="button"
                    className="spring-rating-inherit"
                    aria-pressed={checked && inherits}
                    disabled={!checked || planned.unresolved}
                    title="Følg sikkerheden fra det valgte spring"
                    onClick={() => setFoundation(identity, 'inherit')}
                  >
                    Arvet{' '}
                    {inherits && planned.stability !== null ? `${planned.stability}/5` : inherits ? '–' : ''}
                  </button>
                )}
                {STABILITY_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="spring-rating-value"
                    aria-pressed={checked && !inherits && planned.stability === value}
                    disabled={planned?.excluded || planned?.unresolved}
                    title={STABILITY_ANCHORS[value - 1]}
                    onClick={() => rate(value)}
                  >
                    {value}
                  </button>
                ))}
                <button
                  type="button"
                  className="spring-rating-toggle"
                  aria-label={
                    !planned
                      ? 'Vælg uden vurdering'
                      : planned.excluded
                        ? 'Medtag igen'
                        : child
                          ? 'Fravælg'
                          : 'Fjern'
                  }
                  title={
                    !planned
                      ? 'Vælg springet uden at vurdere sikkerheden nu'
                      : planned.excluded
                        ? 'Medtag i registreringen igen'
                        : child
                          ? 'Registrér ikke dette fundament'
                          : 'Fjern fra registreringen'
                  }
                  onClick={toggle}
                >
                  <span aria-hidden="true">
                    {!planned ? 'Vælg' : planned.excluded ? '↺ Medtag' : child ? '× Fravælg' : '× Fjern'}
                  </span>
                </button>
              </div>
              {planned?.explicit &&
                twistElements(definition).map(({ element, index, label }) => (
                  <TwistSplit
                    key={index}
                    element={element}
                    label={label}
                    onChange={(distribution) => {
                      const next = selections.map((item) => {
                        if (skillIdentity(item.definition) !== identity) return item;
                        const updated = withTwistDistribution(item.definition, index, distribution);
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
                                      skillIdentity(entry.definition) === skillIdentity(previous.definition),
                                  ) ?? (matches.length === 1 ? matches[0] : undefined);
                                return matching ? [skillIdentity(matching.definition)] : [];
                              }),
                            ]),
                          ]);
                        return { ...item, definition: updated };
                      });
                      change(next);
                    }}
                  />
                ))}
              {planned?.needsSource && (
                <label className="spring-row-detail">
                  Arvekilde for {name}
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
                            {springDisplayName(source, rulePackage)}
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
        {rows.length === 0 && <li className="empty">{empty ?? 'Ingen spring matcher.'}</li>}
      </ul>
    </>
  );
}

const STABILITY_VALUES = [1, 2, 3, 4, 5] as const;

function difficultyText(evaluation: ReturnType<RulePackage['evaluateSkill']>) {
  return evaluation.difficulty.value
    ? points(evaluation.difficulty.value)
    : statusText[evaluation.difficulty.status];
}
