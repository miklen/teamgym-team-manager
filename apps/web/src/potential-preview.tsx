import { useState } from 'react';
import { formatStability, workspacePayload } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import type { BonusPotential, DisciplineEvaluation, ParticipantEvaluation, RoundEvaluation, RulePackage } from '@teamgym/rules';
import { ActionForm, Dialog, points, statusText } from './components';
import { PlanDifficulty, PlanSafety } from './plan-skill-select';
import { spotGradeLabel } from './planned-spot';
import { springDisplayName } from './spring-library';
import { springName as executionName } from './spring-names';
import { Icon } from './ui';
import './potential-preview.css';

type AvailableProposal = BonusPotential & { preview: NonNullable<BonusPotential['preview']> };
type Safety = RoundEvaluation['stability']['counting'];

function compositionAndDifficulty(evaluation: DisciplineEvaluation) {
  const { composition, difficulty } = evaluation;
  return composition.value && difficulty.value ? composition.value.add(difficulty.value).panelFloor() : null;
}

function roundLabel(index: number) {
  return index === 0 ? '1. Holdomgang' : `${index + 1}. omgang`;
}

function springName(participant: ParticipantEvaluation, rulePackage: RulePackage) {
  return participant.skill ? springDisplayName(participant.skill, rulePackage) : 'Spring mangler';
}

function SpringLine({
  participant,
  rulePackage,
  showVariant,
}: {
  participant: ParticipantEvaluation;
  rulePackage: RulePackage;
  showVariant?: boolean;
}) {
  return (
    <div className="proposal-spring">
      <div className="proposal-spring-name">
        <strong>{springName(participant, rulePackage)}</strong>
        {showVariant && participant.skill && <small>{executionName(participant.skill)}</small>}
      </div>
      <span className="proposal-spring-values">
        <PlanDifficulty
          value={participant.originalD.value === null ? null : points(participant.originalD.value)}
        />
        {participant.entry.athleteId !== null && (
          <PlanSafety value={participant.registration?.stability ?? null} />
        )}
      </span>
    </div>
  );
}

function PlacementShift({ before, after }: { before: number; after: number }) {
  return (
    <span className="proposal-place-shift">
      <span className="sr-only">Flytter fra plads </span>
      <span>{before}</span>
      <Icon name="arrow" />
      <span className="sr-only"> til plads </span>
      <strong>{after}</strong>
    </span>
  );
}

function SafetyValue({ value }: { value: Safety }) {
  return (
    <div className="proposal-safety-value">
      <strong>
        {formatStability(value.mean)}
        {value.mean !== null ? '/5' : ''}
      </strong>
      <small>
        {value.assessedCount}/{value.requiredCount} vurderet · {value.filledCount}/{value.requiredCount}{' '}
        udfyldt
      </small>
      <small>
        Min. {value.minimum ?? '—'} · {value.lowCount} med 1–2
      </small>
    </div>
  );
}

export function PotentialPreviewDialog({
  proposal,
  workspace,
  scenarioName,
  rulePackage,
  writable,
  submit,
  close,
}: {
  proposal: AvailableProposal;
  workspace: Workspace;
  scenarioName: string;
  rulePackage: RulePackage;
  writable: boolean;
  submit: () => void;
  close: () => void;
}) {
  const { before, after, changes, reserveChanges, basisPayload, discipline } = proposal.preview;
  const current = proposal.selected ?? proposal.selectedKnownSubtotal;
  const beforeCD = compositionAndDifficulty(before);
  const afterCD = compositionAndDifficulty(after);
  const beforeMaximum = before.maximumScore.value?.panelFloor() ?? null;
  const afterMaximum = after.maximumScore.value?.panelFloor() ?? null;
  const maximumChange = beforeMaximum && afterMaximum ? afterMaximum.subtract(beforeMaximum) : null;
  const cdChange = beforeCD && afterCD ? afterCD.subtract(beforeCD) : null;
  const scoreChange = maximumChange ?? cdChange;
  const trend = scoreChange?.compare(0);
  const outcome = maximumChange
    ? trend === 0 ? 'Samme karakterloft' : trend === -1 ? 'Lavere karakterloft' : 'Højere karakterloft'
    : cdChange ? 'Forskel i C + D · karakterloftet afventer' : 'Karakterloftet afventer';
  const names = new Map(
    workspace.athletes.map((athlete) => [
      athlete.id,
      [athlete.name, athlete.discriminator].filter(Boolean).join(' · '),
    ]),
  );
  const changedRounds = after.rounds.map((round, index) => {
    const original = before.rounds[index]!;
    const participants = changes
      .filter((item) => item.roundId === round.id)
      .map((item) => {
        const beforeIndex = original.entries.findIndex((entry) => entry.entry.athleteId === item.athleteId);
        const afterIndex = round.entries.findIndex((entry) => entry.entry.athleteId === item.athleteId);
        const previous = original.entries[beforeIndex];
        const next = round.entries[afterIndex];
        const name = names.get(item.athleteId) ?? item.athleteName;
        const springChanged = !!previous && !!next && item.beforeRegistrationId !== item.afterRegistrationId;
        const roleChanged = !!previous && !!next && previous.entry.role !== next.entry.role;
        const promoted = reserveChanges.some(
          (reserve) => reserve.roundId === round.id && reserve.athleteId === item.athleteId,
        );
        return {
          item,
          previous,
          next,
          name,
          from: beforeIndex + 1,
          to: afterIndex + 1,
          springChanged,
          roleChanged,
          promoted,
          onlyMoved:
            !!previous && !!next && !springChanged && !roleChanged && !promoted && !item.plannedSpotRemoved,
        };
      });
    const important = participants
      .filter((item) => !item.onlyMoved)
      .sort((a, b) => (a.to || a.from) - (b.to || b.from));
    const moves = participants.filter((item) => item.onlyMoved).sort((a, b) => a.to - b.to);
    return { round, original, index, important, moves };
  });
  const affected = changedRounds.filter(({ important, moves }) => important.length > 0 || moves.length > 0);
  const [mode, setMode] = useState<'changes' | 'lineup'>('changes');
  const [activeRound, setActiveRound] = useState(affected[0]?.index ?? 0);
  const active = changedRounds[activeRound]!;
  const stale = workspacePayload(workspace) !== basisPayload;
  const numbers = [
    {
      label: 'Tillæg',
      previous: `${proposal.selected === null ? 'Foreløbigt ' : ''}+${points(current)}`,
      next: '+' + points(proposal.documentedValue),
    },
    {
      label: 'Sværhed · D',
      previous: before.panelD ? points(before.panelD) : statusText[before.difficulty.status],
      next: after.panelD ? points(after.panelD) : statusText[after.difficulty.status],
    },
    {
      label: 'Komposition · C',
      previous: before.composition.panel
        ? points(before.composition.panel)
        : statusText[before.composition.status],
      next: after.composition.panel ? points(after.composition.panel) : statusText[after.composition.status],
    },
    {
      label: 'C + D',
      previous: beforeCD ? points(beforeCD) : 'Afventer',
      next: afterCD ? points(afterCD) : 'Afventer',
      total: true,
    },
    {
      label: 'Karakterloft',
      detail: 'Med planlagt E-loft',
      previous: beforeMaximum ? points(beforeMaximum) : statusText[before.maximumScore.status],
      next: afterMaximum ? points(afterMaximum) : statusText[after.maximumScore.status],
      total: true,
    },
  ];
  return (
    <Dialog title={proposal.label} close={close} className="potential-preview">
      <div className="proposal-overview">
        <div className="proposal-outcome" data-trend={trend}>
          <span>
            {scenarioName} · {discipline === 'tumbling' ? 'Bane' : 'Trampet'}
          </span>
          <div>
            <strong>
              {scoreChange ? (trend === 1 ? '+' : '') + points(scoreChange).replace('-', '−') : '—'}
            </strong>
            <small>{outcome}</small>
          </div>
        </div>
        <table className="proposal-scoreboard" aria-label="Point før og med forslaget">
          <thead>
            <tr>
              <td />
              <th scope="col">I planen</th>
              <th scope="col">Med forslaget</th>
            </tr>
          </thead>
          <tbody>
            {numbers.map(({ label, detail, previous, next, total }) => (
              <tr key={label} data-total={total}>
                <th scope="row">{label}{detail && <small>{detail}</small>}</th>
                <td>{previous}</td>
                <td data-different={previous !== next}>{next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActionForm
        className="proposal-form"
        disabled={!writable || stale}
        submit={submit}
        label="Anvend hele forslaget"
        secondaryAction={
          <button type="button" className="quiet" onClick={close}>
            Annuller
          </button>
        }
      >
        <div className="proposal-review">
          <div className="proposal-controls">
            <div className="proposal-view-switch" role="group" aria-label="Visning af forslaget">
              <button type="button" aria-pressed={mode === 'changes'} onClick={() => setMode('changes')}>
                Ændringer
              </button>
              <button type="button" aria-pressed={mode === 'lineup'} onClick={() => setMode('lineup')}>
                Hele opstillingen
              </button>
            </div>
            <div className="proposal-round-switch" role="group" aria-label="Vælg omgang i forslaget">
              {changedRounds.map(({ round, index, important, moves }) => {
                const count = important.length + moves.length;
                return (
                  <button
                    key={round.id}
                    type="button"
                    aria-pressed={activeRound === index}
                    onClick={() => setActiveRound(index)}
                  >
                    <span>{index === 0 ? 'Holdomgang' : roundLabel(index)}</span>
                    <small>
                      {count === 0 ? 'Uændret' : `${count} ${count === 1 ? 'berørt' : 'berørte'}`}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>
          {mode === 'changes' ? (
            <section
              className="proposal-view proposal-round"
              key={'changes:' + active.round.id}
              aria-label={roundLabel(active.index)}
            >
              {active.important.length > 0 && (
                <ul className="proposal-changes" role="list">
                  {active.important.map(
                    ({ item, previous, next, name, from, to, springChanged, roleChanged, promoted }) => {
                      const role = next?.entry.role ?? previous?.entry.role;
                      const variant =
                        !!previous &&
                        !!next &&
                        springName(previous, rulePackage) === springName(next, rulePackage);
                      return (
                        <li
                          key={item.athleteId}
                          className="proposal-change"
                          data-kind={
                            springChanged ? 'spring' : next && previous ? 'role' : next ? 'added' : 'removed'
                          }
                        >
                          <div className="proposal-person">
                            <div>
                              <strong>{name}</strong>
                              <small>
                                {promoted
                                  ? 'Fra reserve'
                                  : !previous
                                    ? 'Sættes ind'
                                    : !next
                                      ? 'Går ud'
                                      : springChanged
                                        ? variant
                                          ? 'Ny springvariant'
                                          : 'Nyt spring'
                                        : 'Ændret rolle'}
                              </small>
                            </div>
                            <span className="proposal-person-meta">
                              {previous && next && from !== to ? (
                                <PlacementShift before={from} after={to} />
                              ) : (
                                `Plads ${to || from}`
                              )}
                              {roleChanged ? (
                                <small>{role === 'extra' ? 'Bliver ekstra' : 'Bliver tællende'}</small>
                              ) : (
                                role === 'extra' && <small>Ekstra</small>
                              )}
                            </span>
                          </div>
                          {springChanged && previous && next ? (
                            <div className="proposal-spring-comparison">
                              <div>
                                <small>Før</small>
                                <SpringLine
                                  participant={previous}
                                  rulePackage={rulePackage}
                                  showVariant={variant}
                                />
                              </div>
                              <Icon name="arrow" />
                              <div>
                                <small>Forslag</small>
                                <SpringLine
                                  participant={next}
                                  rulePackage={rulePackage}
                                  showVariant={variant}
                                />
                              </div>
                            </div>
                          ) : (
                            (next ?? previous) && (
                              <SpringLine participant={(next ?? previous)!} rulePackage={rulePackage} />
                            )
                          )}
                          {item.plannedSpotRemoved && (
                            <p className="proposal-spot">
                              Planlagt modtagning bortfalder
                              {previous?.entry.plannedSpot
                                ? ` (${spotGradeLabel(previous.entry.plannedSpot.grade, rulePackage)})`
                                : ''}
                              .
                            </p>
                          )}
                        </li>
                      );
                    },
                  )}
                </ul>
              )}
              {active.moves.length > 0 && (
                <details className="proposal-moves" open={active.important.length === 0 || undefined}>
                  <summary>
                    {active.moves.length}{' '}
                    {active.moves.length === 1 ? 'gymnast flytter' : 'gymnaster flytter'} plads{' '}
                    <Icon name="right" />
                  </summary>
                  <ul role="list">
                    {active.moves.map(({ item, name, from, to }) => (
                      <li key={item.athleteId}>
                        <span>{name}</span>
                        <PlacementShift before={from} after={to} />
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {active.important.length === 0 && active.moves.length === 0 && (
                <p className="proposal-no-changes">Denne omgang bevares som i planen.</p>
              )}
            </section>
          ) : (
            <ol
              className="proposal-view proposal-lineup"
              role="list"
              aria-label={`${roundLabel(active.index)} med forslaget`}
              key={'lineup:' + active.round.id}
            >
              {active.round.entries.map((entry, index) => (
                <li key={entry.entry.id}>
                  <span className="proposal-slot-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <strong>{names.get(entry.entry.athleteId ?? '') ?? entry.athleteName}</strong>
                    {entry.entry.role === 'extra' && <small> · Ekstra</small>}
                    <SpringLine participant={entry} rulePackage={rulePackage} />
                  </div>
                </li>
              ))}
            </ol>
          )}
          {affected.length > 0 && (
            <details className="proposal-safety">
              <summary>
                Sikkerhed i de berørte omgange <Icon name="right" />
              </summary>
              <table aria-label="Sikkerhed før og med forslaget">
                <thead>
                  <tr>
                    <td />
                    <th scope="col">I planen</th>
                    <th scope="col">Med forslaget</th>
                  </tr>
                </thead>
                <tbody>
                  {affected.map(({ original, round, index }) => (
                    <tr key={round.id}>
                      <th scope="row">{roundLabel(index)}</th>
                      <td>
                        <SafetyValue value={original.stability.counting} />
                      </td>
                      <td>
                        <SafetyValue value={round.stability.counting} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
          {stale && (
            <p className="notice" role="alert">
              Planen er ændret. Luk forslaget, og åbn det igen.
            </p>
          )}
        </div>
      </ActionForm>
    </Dialog>
  );
}
