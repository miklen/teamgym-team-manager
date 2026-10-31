import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { addAmbition, changeAmbitionSkill, clearPlannedSpot, fillAmbition, formatStability, moveRoundFirst, newEntityId, setPlannedSpot, setRoundEntries } from '@teamgym/domain';
import type { Round, RoundEntry, RoundEntryInput, SpringDiscipline, Workspace } from '@teamgym/domain';
import { ambitionCanNow, ambitionEnvironment, applyPotentialPreview } from '@teamgym/rules';
import type { BonusPotential, ParticipantEvaluation, RoundEvaluation, RulePackage, TeamProfile } from '@teamgym/rules';
import type { DataProps } from './athletes';
import { AthleteInspector } from './athletes';
import {
  ActionForm,
  Decision,
  Dialog,
  Empty,
  points,
  SkillBreakdown,
  SourceLinks,
  statusText,
} from './components';
import { registry } from './rules';
import { usePotentials } from './use-potentials';
import { springDirectionText, springDisplayName } from './spring-library';
import { ScenarioBar } from './scenario-bar';
import { useScenarioSelection } from './scenario-context';
import { ReserveList } from './reserves';
import { PlanDifficulty, PlanSafety, PlanSkillSelect } from './plan-skill-select';
import { RuleUncertainty } from './rule-uncertainty';
import { Icon } from './ui';
import type { IconName } from './ui';
import { CompositionGuide } from './composition-guide';
import { AmbitionReadiness, AmbitionCreateForm, AmbitionFillForm, ambitionLabel, SlotModeSwitch } from './ambition';
import type { AmbitionRequest, SlotMode } from './ambition';
import { MaximumScoreMetric, RoundPlannedExecution, RoundSpotShare, SlotSpot, spotGradeLabel } from './planned-spot';
import type { SpotChange } from './planned-spot';

export function SpringPage(props: DataProps & { teamId: string }) {
  const team = props.workspace.teams.find((item) => item.id === props.teamId)!;
  const resolved = registry.resolve(team.rulesetBinding);
  const [discipline, setDiscipline] = useState<SpringDiscipline>('tumbling');
  const plan = props.workspace.plans.find((item) => item.teamId === props.teamId)!;
  const [scenarioId, selectScenario] = useScenarioSelection(
    `${props.workspace.workspaceId}:${props.teamId}:${discipline}`,
    plan[discipline].map((item) => item.id),
  );
  const leave = useRef<((action: () => void) => void) | null>(null);
  const request = (action: () => void) => (leave.current ? leave.current(action) : action());
  return (
    <>
      <div className="page-title spring-title">
        <div>
          <h1>Springplan</h1>
          <p className="page-description">{team.name}. Tre omgange i hver disciplin.</p>
        </div>
        <div className="tabs" aria-label="Springdisciplin">
          <button
            aria-pressed={discipline === 'tumbling'}
            onClick={() => request(() => setDiscipline('tumbling'))}
          >
            Bane
          </button>
          <button
            aria-pressed={discipline === 'trampet'}
            onClick={() => request(() => setDiscipline('trampet'))}
          >
            Trampet
          </button>
        </div>
      </div>
      <ScenarioBar
        {...props}
        planId={plan.id}
        discipline={discipline}
        scenarioId={scenarioId}
        profile={resolved.status === 'known' ? resolved.profile : null}
        select={(id) => request(() => selectScenario(id))}
      />
      <div
        role="tabpanel"
        id={`scenario-panel-${plan.id}-${discipline}`}
        aria-labelledby={`scenario-tab-${scenarioId}`}
      >
        {resolved.status === 'known' ? (
          <SpringDisciplineView
            key={`${props.workspace.workspaceId}:${props.teamId}:${discipline}:${scenarioId}`}
            {...props}
            discipline={discipline}
            scenarioId={scenarioId}
            registerLeave={(handler) => {
              leave.current = handler;
            }}
            selectScenario={selectScenario}
            rulePackage={resolved.rulePackage}
            profile={resolved.profile}
          />
        ) : (
          <>
            <Empty>Holdets præcise regelpakke er ikke installeret. Opstillinger bevares; se Reglement.</Empty>
            {plan[discipline]
              .find((item) => item.id === scenarioId)!
              .rounds.map((round, index) => (
                <section key={round.id} className="round">
                  <h2>{index + 1}. omgang</h2>
                  {[...round.entries, ...round.reserves].map((entry) => (
                    <p key={entry.id}>
                      {entry.athleteId === null ? 'Ambition' : workspaceName(props.workspace, entry.athleteId)} ·{' '}
                      {props.workspace.skills.find(
                        (skill) =>
                          skill.id ===
                          (props.workspace.athleteSkills.find((item) => item.id === entry.athleteSkillId)
                            ?.skillId ?? ('plannedSkillId' in entry ? entry.plannedSkillId : null)),
                      )?.name ?? 'Vælg senere'}{' '}
                      · {'role' in entry ? 'Udførende' : 'Reserve'}
                    </p>
                  ))}
                </section>
              ))}
          </>
        )}
      </div>
    </>
  );
}
function workspaceName(workspace: Workspace, id: string) {
  const athlete = workspace.athletes.find((item) => item.id === id);
  return `${athlete?.name ?? 'Ukendt gymnast'} ${athlete?.discriminator ?? ''}`;
}
function SpringDisciplineView({
  workspace,
  teamId,
  change,
  writable,
  discipline,
  rulePackage,
  profile,
  scenarioId,
  registerLeave,
  selectScenario,
}: DataProps & {
  teamId: string;
  discipline: SpringDiscipline;
  rulePackage: RulePackage;
  profile: TeamProfile;
  scenarioId: string;
  registerLeave: (handler: ((action: () => void) => void) | null) => void;
  selectScenario: (id: string) => void;
}) {
  const plan = workspace.plans.find((item) => item.teamId === teamId)!;
  const scenario = plan[discipline].find((item) => item.id === scenarioId)!;
  const evaluation = rulePackage.analyze(workspace, teamId, discipline, scenarioId);
  const hasPlannedEntries = evaluation.rounds.some((round) => round.entries.length > 0);
  const dUncertainties = hasPlannedEntries ? [...evaluation.difficulty.issues, ...(rulePackage.manifest.packageVersion === '1.1.0' && evaluation.difficulty.value && evaluation.difficulty.value.multiply(100).denominator !== 1n ? ['H-U06'] : [])] : [];
  const cUncertainties = hasPlannedEntries ? [...new Set(evaluation.contributions.flatMap((item) => item.decision.issues)), ...(rulePackage.manifest.packageVersion === '1.1.0' && evaluation.composition.value && evaluation.composition.value.multiply(100).denominator !== 1n ? ['H-U06'] : [])] : [];
  const [activeRound, setActiveRound] = useState(0);
  const rowNodes = useRef(new Map<string, HTMLLIElement>());
  const rowPositions = useRef(new Map<string, { x: number; y: number }>());
  useLayoutEffect(() => {
    const next = new Map<string, { x: number; y: number }>();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const [id, node] of rowNodes.current) {
      if (!node.offsetParent) continue;
      const position = { x: node.offsetLeft, y: node.offsetTop };
      const previous = rowPositions.current.get(id);
      next.set(id, position);
      if (!reduced && previous && (previous.x !== position.x || previous.y !== position.y)) {
        for (const animation of node.getAnimations()) animation.cancel();
        node.animate(
          [
            { transform: `translate(${previous.x - position.x}px, ${previous.y - position.y}px)` },
            { transform: 'translate(0, 0)' },
          ],
          { duration: 160, easing: 'ease-out' },
        );
      }
    }
    rowPositions.current = next;
  }, [workspace, discipline, activeRound]);
  const [entryDialog, setEntryDialog] = useState<{ round: Round; entry?: RoundEntry } | null>(null);
  const dirty = useRef(false);
  const entryForm = useRef<HTMLFormElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const reserveLeave = useRef<((action: () => void) => void) | null>(null);
  const [leaving, setLeaving] = useState(false);
  function requestLeave(action: () => void) {
    if (reserveLeave.current) {
      reserveLeave.current(action);
      return;
    }
    if (entryDialog && dirty.current) {
      pending.current = action;
      setLeaving(true);
    } else {
      setEntryDialog(null);
      action();
    }
  }
  useEffect(() => {
    registerLeave(requestLeave);
    return () => registerLeave(null);
  });
  function openEntry(value: { round: Round; entry?: RoundEntry }) {
    dirty.current = false;
    setEntryDialog(value);
  }
  const [athlete, setAthlete] = useState<{ id: string; registrationId: string | undefined } | null>(null);
  const [preview, setPreview] = useState<BonusPotential | null>(null);
  const [sortRoundId, setSortRoundId] = useState<string | null>(null);
  const [entryError, setEntryError] = useState('');
  const [entryStatus, setEntryStatus] = useState('');
  const [insertedEntryId, setInsertedEntryId] = useState<string | null>(null);
  const potentials = usePotentials(workspace, teamId, discipline, scenarioId);
  const guide = rulePackage.guide(evaluation, profile, potentials.result);
  const guideOverview = rulePackage.guideOverview(evaluation);
  function goToRound(roundId: string) {
    const index = scenario.rounds.findIndex((round) => round.id === roundId);
    if (index < 0) return;
    setActiveRound(index);
    requestAnimationFrame(() => {
      const target = document.getElementById(`round-${roundId}`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
  }
  function goToAnalysis() {
    const target = document.getElementById('spring-composition-analysis');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  function entries(round: Round, next: RoundEntryInput[]) {
    change(setRoundEntries(workspace, plan.id, discipline, scenarioId, round.id, next, profile));
    setEntryError('');
    setEntryStatus(
      `${scenario.rounds.findIndex((item) => item.id === round.id) + 1}. omgang opdateret: ${next.map((entry) => (entry.athleteId === null ? 'ambition' : workspace.athletes.find((athlete) => athlete.id === entry.athleteId)?.name)).join(', ')}.`,
    );
  }
  const [filledEntryId, setFilledEntryId] = useState<string | null>(null);
  useEffect(() => {
    if (!filledEntryId) return;
    const frame = requestAnimationFrame(() =>
      rowNodes.current.get(filledEntryId)?.querySelector<HTMLButtonElement>('.entry-name')?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [filledEntryId]);
  function ambition(round: Round, value: AmbitionRequest) {
    const environment = ambitionEnvironment(rulePackage);
    const roundNumber = scenario.rounds.findIndex((item) => item.id === round.id) + 1;
    if (value.kind === 'add') {
      const position = value.role === 'extra' ? round.entries.filter((entry) => entry.role === 'extra').length : round.entries.length;
      change(addAmbition(workspace, plan.id, discipline, scenarioId, round.id, value.definition, value.role, position, profile, environment).workspace);
      setEntryError('');
      setEntryStatus(`${roundNumber}. omgang: ambition tilføjet · ${springDisplayName(value.definition, rulePackage)} · mangler gymnast.`);
      return;
    }
    let next = workspace;
    const current = round.entries.find((entry) => entry.id === value.entryId)!;
    if (value.role !== current.role) {
      const changed = round.entries.map((entry) => (entry.id === value.entryId ? { ...entry, role: value.role } : entry));
      next = setRoundEntries(next, plan.id, discipline, scenarioId, round.id,
        [...changed.filter((entry) => entry.role === 'extra'), ...changed.filter((entry) => entry.role === 'counting')], profile);
    }
    if (value.definition) next = changeAmbitionSkill(next, plan.id, discipline, scenarioId, round.id, value.entryId, value.definition, undefined, profile, environment);
    if (value.athleteSkillId) next = fillAmbition(next, plan.id, discipline, scenarioId, round.id, value.entryId, value.athleteSkillId, environment);
    change(next);
    setEntryError('');
    if (value.athleteSkillId) {
      const registration = next.athleteSkills.find((item) => item.id === value.athleteSkillId)!;
      setFilledEntryId(value.entryId);
      setEntryStatus(`${workspaceName(next, registration.athleteId).trim()} tager pladsen i ${roundNumber}. omgang.`);
    } else setEntryStatus(`${roundNumber}. omgang: ambitionen er opdateret.`);
  }
  function shift(round: Round, index: number, delta: number) {
    const copy = [...round.entries];
    [copy[index], copy[index + delta]] = [copy[index + delta]!, copy[index]!];
    try {
      entries(round, copy);
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Rækkefølgen kunne ikke ændres.');
    }
  }
  function spot(round: Round, participant: ParticipantEvaluation, value: SpotChange) {
    const name = accessibleName(participant);
    try {
      change(
        value
          ? setPlannedSpot(workspace, plan.id, discipline, scenarioId, round.id, participant.entry.id, value)
          : clearPlannedSpot(workspace, plan.id, discipline, scenarioId, round.id, participant.entry.id),
      );
      setEntryError('');
      setEntryStatus(
        value
          ? `Planlagt modtagning for ${name}: ${spotGradeLabel(value.grade, rulePackage)}.`
          : `Modtagning fjernet for ${name}.`,
      );
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Modtagningen kunne ikke ændres.');
    }
  }
  const [drag, setDrag] = useState<{ roundId: string; entryId: string } | null>(null);
  function accessibleName(participant: ParticipantEvaluation) {
    const { athleteId } = participant.entry;
    const name = participant.athleteName;
    if (athleteId === null)
      return `ambitionen ${participant.skill ? springDisplayName(participant.skill, rulePackage) : ''}`.trim();
    const athlete = workspace.athletes.find((item) => item.id === athleteId);
    return workspace.athletes.filter((item) => item.name === name).length > 1
      ? `${name} ${athlete?.discriminator || athleteId}`
      : name;
  }
  return (
    <>
      <p className="sr-only" role="status">
        {entryStatus}
      </p>
      {entryError && (
        <p className="notice" role="alert">
          {entryError}
        </p>
      )}
      <div className="analysis-strip">
        <div>
          <div className="analysis-metric-label"><span>Planlagt D · disciplin</span><RuleUncertainty ids={dUncertainties} context="D" compact /></div>
          <strong className="number-change" key={evaluation.panelD?.toString() ?? 'unknown'}>
            {points(evaluation.panelD)}
          </strong>
          <small>{statusText[evaluation.difficulty.status]} · Tre omganges D / 3</small>
        </div>
        <div>
          <div className="analysis-metric-label"><span>Planlagt C · disciplin</span><RuleUncertainty ids={cUncertainties} context="C" compact /></div>
          <strong className="number-change" key={evaluation.composition.panel?.toString() ?? 'unknown'}>
            {points(evaluation.composition.panel)}
          </strong>
          <small>{statusText[evaluation.composition.status]} · Flow kræver observation</small>
        </div>
        <MaximumScoreMetric evaluation={evaluation} roundIds={scenario.rounds.map((round) => round.id)} rulePackage={rulePackage} onRound={goToRound} />
      </div>
      <CompositionGuide rows={guide} overview={guideOverview} maximum={evaluation} profile={profile} rulePackage={rulePackage}
        potentials={potentials.result} potentialError={potentials.error} onCancelSearch={potentials.cancel}
        onPreview={setPreview} onRound={goToRound} onAnalysis={goToAnalysis} />
      <div className="round-tabs" aria-label="Vælg omgang">
        {scenario.rounds.map((round, index) => (
          <button key={round.id} aria-pressed={activeRound === index} onClick={() => setActiveRound(index)}>
            {index + 1}. {index === 0 ? 'Holdomgang' : 'Omgang'}
          </button>
        ))}
      </div>
      <div className="round-grid">
        {scenario.rounds.map((round, roundIndex) => {
          const result = evaluation.rounds[roundIndex]!;
          return (
            <section
              className={`round ${roundIndex === activeRound ? 'active-round' : ''}`}
              key={round.id}
              id={`round-${round.id}`}
              tabIndex={-1}
              aria-label={`${roundIndex + 1}. omgang`}
            >
              <div className="round-heading">
                <h2>
                  {roundIndex + 1}. {roundIndex === 0 ? 'Holdomgang' : 'Omgang'}
                </h2>
                {roundIndex > 0 && (
                  <button
                    className="quiet"
                    disabled={!writable}
                    onClick={() => {
                      change(moveRoundFirst(workspace, plan.id, discipline, scenarioId, round.id));
                      setActiveRound(0);
                    }}
                  >
                    Gør til holdomgang
                  </button>
                )}
              </div>
              <p className="round-totals">
                D <strong>{points(result.panelD)}</strong>
                <RoundSpotShare result={result} />
                <span>{statusText[result.difficulty.status]}</span>
                {round.entries.some((entry) => entry.athleteId === null) && (
                  <span className="round-missing">
                    {round.entries.filter((entry) => entry.athleteId === null).length} mangler gymnast
                  </span>
                )}
                <RoundPlannedExecution result={result} />
              </p>
              <RuleUncertainty ids={result.difficulty.issues} />
              {evaluation.diagnostics
                .filter((item) => item.code === 'mixed-apparatus' && item.affectedIds.includes(round.id))
                .map((item) => (
                  <p key={item.code} className="entry-warning" role="status">
                    {item.message} Vælg spring med samme redskab til hele omgangen.
                  </p>
                ))}
              {round.entries.some((entry) => entry.athleteId === null) &&
                evaluation.diagnostics
                  .filter((item) => item.code === 'mix-quota' && item.affectedIds.includes(round.id))
                  .map((item) => (
                    <p key={item.code} className="entry-warning">
                      {item.message}
                    </p>
                  ))}
              <ol className="round-entries">
                {result.entries.map((participant, index) => {
                  const isAmbition = participant.entry.athleteId === null;
                  const springName = participant.skill ? springDisplayName(participant.skill, rulePackage) : 'Spring mangler';
                  const canNow = isAmbition ? ambitionCanNow(workspace, rulePackage, teamId, round, participant.entry.id) : 0;
                  const warnings = participant.diagnostics.filter((diagnostic) => !isAmbition || diagnostic.code !== 'athlete-missing');
                  return (
                  <li
                    key={participant.entry.id}
                    ref={(node) => {
                      if (node) rowNodes.current.set(participant.entry.id, node);
                      else rowNodes.current.delete(participant.entry.id);
                    }}
                    className={`${participant.entry.role === 'extra' ? 'extra-entry' : ''}${isAmbition ? ' ambition-entry' : ''}${participant.entry.plannedSpot ? ' has-spot' : ''}${insertedEntryId === participant.entry.id ? ' reserve-inserted' : ''}${filledEntryId === participant.entry.id ? ' ambition-filled' : ''}`}
                    onAnimationEnd={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (insertedEntryId === participant.entry.id) setInsertedEntryId(null);
                      if (filledEntryId === participant.entry.id) setFilledEntryId(null);
                    }}
                    draggable={writable}
                    onDragStart={() => setDrag({ roundId: round.id, entryId: participant.entry.id })}
                    onDragOver={(event) => {
                      if (drag?.roundId === round.id) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (!drag || drag.roundId !== round.id) return;
                      const source = round.entries.findIndex((entry) => entry.id === drag.entryId);
                      const copy = [...round.entries];
                      const [moved] = copy.splice(source, 1);
                      copy.splice(index, 0, moved!);
                      try {
                        entries(round, copy);
                      } catch (error) {
                        setEntryError(
                          error instanceof Error ? error.message : 'Rækkefølgen kunne ikke ændres.',
                        );
                      }
                      setDrag(null);
                    }}
                  >
                    <div className="entry-main">
                      <button
                        className="entry-name"
                        aria-label={isAmbition ? ambitionLabel(springName, canNow) : undefined}
                        onClick={() => openEntry({ round, entry: participant.entry })}
                      >
                        <span className="entry-head">
                          <span className="entry-who">
                            {isAmbition ? (
                              <>
                                <span className="ambition-mark" aria-hidden="true">+</span>
                                <strong className="ambition-missing">Mangler gymnast</strong>
                                <AmbitionReadiness canNow={canNow} />
                              </>
                            ) : (
                              <>
                                <strong title={participant.athleteName}>{participant.athleteName}</strong>
                                <small>
                                  {workspace.athletes.find((athlete) => athlete.id === participant.entry.athleteId)?.discriminator}
                                </small>
                              </>
                            )}
                          </span>
                          <span className="entry-value">
                            {!isAmbition && <PlanSafety value={participant.registration?.stability ?? null} />}
                            <PlanDifficulty
                              value={participant.originalD.value ? points(participant.originalD.value) : null}
                              spotted={
                                participant.plannedSpot && participant.spotD !== participant.adjustedD && participant.spotD.value
                                  ? points(participant.spotD.value)
                                  : undefined
                              }
                            />
                          </span>
                        </span>
                        <span className="entry-what">
                          {participant.entry.role === 'extra' && <span className="entry-extra">EKSTRA</span>}
                          <span className="entry-spring">
                            {isAmbition || participant.skill ? springName : 'Vælg registreret færdighed'}
                          </span>
                          {participant.skill && springDirectionText(participant.skill) && (
                            <small className="spring-directions">{springDirectionText(participant.skill)}</small>
                          )}
                        </span>
                      </button>
                      <div className="entry-tools">
                        {isAmbition ? (
                          <button
                            className="quiet ambition-fill"
                            aria-label={`Besæt ambitionen ${springName} i ${roundIndex + 1}. omgang`}
                            onClick={() => openEntry({ round, entry: participant.entry })}
                          >
                            Besæt
                          </button>
                        ) : (
                          <SlotSpot
                            participant={participant}
                            athleteLabel={accessibleName(participant)}
                            rulePackage={rulePackage}
                            writable={writable}
                            onChange={(value) => spot(round, participant, value)}
                          />
                        )}
                        <EntryMenu
                          label={`Handlinger for ${accessibleName(participant)} i ${roundIndex + 1}. omgang`}
                          items={[
                            {
                              icon: 'up',
                              text: 'Flyt op',
                              label: `Flyt ${accessibleName(participant)} op i ${roundIndex + 1}. omgang`,
                              disabled: !writable || index === 0,
                              run: () => shift(round, index, -1),
                            },
                            {
                              icon: 'down',
                              text: 'Flyt ned',
                              label: `Flyt ${accessibleName(participant)} ned i ${roundIndex + 1}. omgang`,
                              disabled: !writable || index === round.entries.length - 1,
                              run: () => shift(round, index, 1),
                            },
                            ...(isAmbition
                              ? []
                              : [
                                  {
                                    icon: 'assess' as const,
                                    text: 'Vurdering',
                                    run: () =>
                                      setAthlete({
                                        id: participant.entry.athleteId!,
                                        registrationId: participant.registration?.id,
                                      }),
                                  },
                                ]),
                            {
                              icon: 'remove',
                              text: 'Fjern fra omgangen',
                              label: `Fjern ${accessibleName(participant)} fra ${roundIndex + 1}. omgang`,
                              disabled: !writable,
                              danger: true,
                              run: () =>
                                entries(
                                  round,
                                  round.entries.filter((entry) => entry.id !== participant.entry.id),
                                ),
                            },
                          ]}
                        />
                      </div>
                    </div>
                    <EntryNotes
                      participant={participant}
                      uncertainties={[
                        ...(participant.evaluation?.hasDouble ? ['A71-U01'] : []),
                        ...(participant.skill?.discipline === 'tumbling' && participant.skill.elements[0]?.family === 'salto' && participant.skill.elements[0].direction === 'forward' ? ['A3-U01'] : []),
                        ...(participant.spotD.issues.includes('Q-SPOT-DUP') ? ['Q-SPOT-DUP'] : []),
                      ]}
                      ambition={isAmbition}
                      warning={warnings
                              .map((diagnostic) => {
                                if (diagnostic.code === 'skill-archived')
                                  return 'Færdigheden er fjernet fra gymnasten. Vælg en anden færdighed.';
                                if (
                                  diagnostic.code === 'athlete-unavailable' &&
                                  workspace.athletes.find((item) => item.id === participant.entry.athleteId)?.archived
                                )
                                  return 'Gymnasten er fjernet. Vælg en anden gymnast.';
                                return diagnostic.message;
                              })
                              .join(' ')}
                    />
                  </li>
                  );
                })}
              </ol>
              {!round.entries.length && (
                <Empty>Ingen gymnaster valgt. Tilføj holdets registrerede færdigheder.</Empty>
              )}
              <button
                className="add-entry"
                disabled={!writable || round.entries.length >= profile.counting + profile.extra}
                onClick={() => openEntry({ round })}
              >
                + Tilføj plads
              </button>
              <ReserveList
                inserted={setInsertedEntryId}
                workspace={workspace}
                change={change}
                writable={writable}
                teamId={teamId}
                planId={plan.id}
                discipline={discipline}
                scenario={scenario}
                round={round}
                result={result}
                rulePackage={rulePackage}
                profile={profile}
                registerLeave={(handler) => {
                  reserveLeave.current = handler;
                }}
                selectScenario={selectScenario}
              />
              <StabilitySummary value={result.stability.counting} />
              <details>
                <summary>D-grundlag og rækkefølge</summary>
                <Decision value={result.difficulty} />
                <p>
                  Omgangssum af de tællende gymnasters justerede D. Ekstra indgår ikke. Disciplinens D er de
                  tre omgangssummer / 3.
                </p>
                <ul>
                  {result.counting.map((item) => (
                    <li key={item.entry.id}>
                      {item.athleteName}: oprindelig {points(item.originalD.value)} → justeret{' '}
                      {points(item.adjustedD.value)}
                      {item.evaluation && (
                        <>
                          <SkillBreakdown evaluation={item.evaluation} />
                          <small>{item.evaluation.explanation.notes.join(' ')}</small>
                          <SourceLinks
                            sources={item.evaluation.explanation.sources}
                            rulePackage={rulePackage}
                          />
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <p>
                  Rækkefølge:{' '}
                  {!result.order.applies
                    ? 'gælder ikke i 1. omgang'
                    : result.order.deduction.status === 'known' && result.orderFaultIds.length === 0
                      ? 'korrekt'
                      : result.order.deduction.status === 'known'
                        ? `${result.orderFaultIds.length} fejl · fradrag ${points(result.order.deduction.value)}`
                        : statusText[result.order.deduction.status]}
                </p>
                {result.orderFaultIds.length > 0 && (
                  <p className="muted">
                    Står efter et højere spring:{' '}
                    {result.orderFaultIds
                      .map((id) => result.counting.find((item) => item.entry.id === id)?.athleteName ?? 'Ukendt')
                      .join(', ')}
                  </p>
                )}
                <button
                  className="quiet"
                  disabled={!writable || result.sortedEntryIds.length !== round.entries.length}
                  onClick={() => setSortRoundId(round.id)}
                >
                  Vis sorteringsforslag
                </button>
                <p className="muted">
                  Uden salto, enkelt-, dobbelt- og trippelsalto; blandet serie i højeste kategori. Derefter stigende D.
                  Sortering anvendes kun efter dit valg.
                </p>
                {result.entries.some((item) => item.entry.role === 'extra') && (
                  <>
                    <h3>Ekstra · særskilt</h3>
                    <StabilitySummary value={result.stability.extra} />
                  </>
                )}
              </details>
            </section>
          );
        })}
      </div>
      <section className="composition" id="spring-composition-analysis" tabIndex={-1}>
        <h2>C · bidrag og fradrag</h2>
        <p>
          Planlagt sammensætning; udførelse og flow vurderes ved observation. En fuld konkurrencekarakter
          beregnes ikke.
        </p>
        <div className="contribution-list">
          {evaluation.contributions.map((item) => (
            <details key={item.id}>
              <summary>
                <span>{item.label}</span>
                {item.kind === 'observation' ? (
                  <span>Kræver observation</span>
                ) : (
                  <Decision value={item.decision} />
                )}
              </summary>
              <RuleUncertainty ids={item.decision.issues} />
              <p>
                {item.kind === 'deduction'
                  ? 'Råt fradrag før netto'
                  : item.kind === 'bonus'
                    ? 'Valgt tillæg'
                    : item.kind === 'observation'
                      ? 'Kræver observation'
                      : 'Grundværdi'}
              </p>
              <SourceLinks sources={item.sources} rulePackage={rulePackage} />
              <p>
                {item.id === 'C-GENTAG' && rulePackage.manifest.packageVersion === '1.1.0' ? 'Berørte omgange' : 'Berørte valg'}:{' '}
                {item.affectedIds
                  .map((id) => {
                    const roundIndex = evaluation.rounds.findIndex((round) => round.id === id);
                    if (roundIndex >= 0) return `Omgang ${roundIndex + 1}`;
                    return workspace.athletes.find((athlete) => athlete.id === id)?.name ??
                      evaluation.rounds.flatMap((round) => round.entries).find((entry) => entry.entry.id === id)?.athleteName ??
                      'Omgang/disciplin';
                  })
                  .join(', ') || 'Hele disciplinen'}
              </p>
            </details>
          ))}
        </div>
        <p>
          Rå C: {points(evaluation.composition.raw)} · netto efter minimum 0:{' '}
          {points(evaluation.composition.value)} · panel: {points(evaluation.composition.panel)}
        </p>
      </section>
      {evaluation.diagnostics.length > 0 && (
        <details>
          <summary>Planens øvrige advarsler ({evaluation.diagnostics.length})</summary>
          <ul>
            {evaluation.diagnostics.map((item, index) => (
              <li key={index}>{item.message}</li>
            ))}
          </ul>
        </details>
      )}
      {entryDialog && (
        <Dialog
          title={entryDialog.entry?.athleteId === null ? 'Besæt ambition' : entryDialog.entry ? 'Redigér omgangsplads' : 'Tilføj omgangsplads'}
          close={() => requestLeave(() => {})}
        >
          <label>
            Vis scenarie
            <select
              value={scenarioId}
              onChange={(event) => {
                const id = event.target.value;
                requestLeave(() => selectScenario(id));
              }}
            >
              {plan[discipline].map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <EntryForm
            formRef={entryForm}
            onDirty={() => {
              dirty.current = true;
            }}
            workspace={workspace}
            teamId={teamId}
            discipline={discipline}
            rulePackage={rulePackage}
            round={entryDialog.round}
            entry={entryDialog.entry}
            writable={writable}
            inspect={(id) => {
              setEntryDialog(null);
              setAthlete({ id, registrationId: undefined });
            }}
            ambition={{
              profile,
              planId: plan.id,
              scenarioId,
              request: (value) => {
                ambition(entryDialog.round, value);
                setEntryDialog(null);
                dirty.current = false;
                const action = pending.current;
                pending.current = null;
                action?.();
              },
            }}
            submit={(entry) => {
              const changed = entryDialog.entry
                ? entryDialog.round.entries.map((existing) => (existing.id === entry.id ? entry : existing))
                : [...entryDialog.round.entries, entry];
              entries(entryDialog.round, [
                ...changed.filter((item) => item.role === 'extra'),
                ...changed.filter((item) => item.role === 'counting'),
              ]);
              setEntryDialog(null);
              dirty.current = false;
              const action = pending.current;
              pending.current = null;
              action?.();
            }}
          />
        </Dialog>
      )}
      {leaving && (
        <Dialog
          title="Gem formularændringer?"
          close={() => {
            setLeaving(false);
            pending.current = null;
          }}
        >
          <p>Formularen i {scenario.name} har ændringer. Opdater ændrer kun den lokale kladde.</p>
          <div className="actions">
            <button
              onClick={() => {
                setLeaving(false);
                entryForm.current?.requestSubmit();
              }}
            >
              Opdater
            </button>
            <button
              className="quiet"
              onClick={() => {
                const action = pending.current;
                pending.current = null;
                dirty.current = false;
                setLeaving(false);
                setEntryDialog(null);
                action?.();
              }}
            >
              Kassér
            </button>
            <button
              className="quiet"
              onClick={() => {
                setLeaving(false);
                pending.current = null;
              }}
            >
              Bliv
            </button>
          </div>
        </Dialog>
      )}
      {sortRoundId && (
        <Dialog title="Foreslået rækkefølge" close={() => setSortRoundId(null)}>
          <p>
            Ekstra først, derefter rotationskategori før stigende D. Planen ændres først, når du anvender
            forslaget.
          </p>
          <ol>
            {evaluation.rounds
              .find((round) => round.id === sortRoundId)!
              .sortedEntryIds.map((id) => {
                const round = evaluation.rounds.find((round) => round.id === sortRoundId)!;
                const participant = round.entries.find((item) => item.entry.id === id)!;
                return (
                  <li key={id}>
                    {participant.athleteName} ·{' '}
                    {participant.skill
                      ? springDisplayName(participant.skill, rulePackage)
                      : 'Færdighed mangler'}{' '}
                    · fra plads {round.entries.indexOf(participant) + 1} · D{' '}
                    {points(participant.originalD.value)}
                  </li>
                );
              })}
          </ol>
          <ActionForm
            disabled={!writable}
            label="Anvend rækkefølgen"
            submit={() => {
              const round = scenario.rounds.find((item) => item.id === sortRoundId)!;
              entries(
                round,
                evaluation.rounds
                  .find((item) => item.id === sortRoundId)!
                  .sortedEntryIds.map((id) => round.entries.find((entry) => entry.id === id)!),
              );
              setSortRoundId(null);
            }}
          >
            <span />
          </ActionForm>
          <button className="quiet" onClick={() => setSortRoundId(null)}>
            Annuller
          </button>
        </Dialog>
      )}
      {athlete && (
        <AthleteInspector
          workspace={workspace}
          change={change}
          writable={writable}
          athleteId={athlete.id}
          initialRegistrationId={athlete.registrationId}
          close={() => setAthlete(null)}
        />
      )}
      {preview?.preview && (
        <Dialog wide title={preview.label} close={() => setPreview(null)}>
          <p>
            <strong>{scenario.name}</strong> · {discipline === 'tumbling' ? 'Bane' : 'Trampet'}
          </p>
          <p>
            Dokumenteret {points(preview.documentedValue)}. Hele den nødvendige vidneopstilling anvendes
            samlet.
          </p>
          <div className="comparison">
            <div>
              Før · D {points(preview.preview.before.panelD)} · C{' '}
              {points(preview.preview.before.composition.panel)}
            </div>
            <div>
              Efter · D {points(preview.preview.after.panelD)} · C{' '}
              {points(preview.preview.after.composition.panel)}
            </div>
          </div>
          <ul>
            {preview.preview.changes.map((item, index) => {
              const beforeRound = preview.preview!.before.rounds.find((round) => round.id === item.roundId)!;
              const afterRound = preview.preview!.after.rounds.find((round) => round.id === item.roundId)!;
              const beforeIndex = beforeRound.entries.findIndex(
                (entry) => entry.entry.athleteId === item.athleteId,
              );
              const afterIndex = afterRound.entries.findIndex(
                (entry) => entry.entry.athleteId === item.athleteId,
              );
              return (
                <li key={index}>
                  <strong>
                    {preview.preview!.before.rounds.indexOf(beforeRound) + 1}. omgang · {item.athleteName}
                    {workspace.athletes.find((athlete) => athlete.id === item.athleteId)?.discriminator
                      ? ` · ${workspace.athletes.find((athlete) => athlete.id === item.athleteId)!.discriminator}`
                      : ''}
                  </strong>
                  <small>
                    Plads {beforeIndex < 0 ? 'ikke valgt' : beforeIndex + 1} →{' '}
                    {afterIndex < 0 ? 'ikke valgt' : afterIndex + 1} · rolle{' '}
                    {beforeIndex < 0
                      ? 'ikke valgt'
                      : beforeRound.entries[beforeIndex]!.entry.role === 'extra'
                        ? 'ekstra'
                        : 'tællende'}{' '}
                    →{' '}
                    {afterIndex < 0
                      ? 'ikke valgt'
                      : afterRound.entries[afterIndex]!.entry.role === 'extra'
                        ? 'ekstra'
                        : 'tællende'}
                  </small>
                  {workspace.skills.find(
                    (skill) =>
                      skill.id ===
                      workspace.athleteSkills.find(
                        (registration) => registration.id === item.beforeRegistrationId,
                      )?.skillId,
                  )?.name ?? 'Ikke valgt'}{' '}
                  →{' '}
                  {workspace.skills.find(
                    (skill) =>
                      skill.id ===
                      workspace.athleteSkills.find(
                        (registration) => registration.id === item.afterRegistrationId,
                      )?.skillId,
                  )?.name ?? 'Ikke valgt'}{' '}
                  · stabilitet{' '}
                  {workspace.athleteSkills.find(
                    (registration) => registration.id === item.beforeRegistrationId,
                  )?.stability ?? '—'}{' '}
                  →{' '}
                  {workspace.athleteSkills.find(
                    (registration) => registration.id === item.afterRegistrationId,
                  )?.stability ?? '—'}
                  {item.plannedSpotRemoved && (
                    <span className="spot-removed">
                      Planlagt modtagning bortfalder
                      {beforeIndex >= 0 && beforeRound.entries[beforeIndex]!.entry.plannedSpot
                        ? ` (${spotGradeLabel(beforeRound.entries[beforeIndex]!.entry.plannedSpot!.grade, rulePackage)})`
                        : ''}
                      .
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {preview.preview.reserveChanges.length > 0 && (
            <p>
              Bliver udførende og fjernes fra reservelisten:{' '}
              {preview.preview.reserveChanges
                .map(
                  (item) =>
                    `${scenario.rounds.findIndex((round) => round.id === item.roundId) + 1}. omgang · ${workspaceName(workspace, item.athleteId)}`,
                )
                .join('; ')}
              .
            </p>
          )}
          <div className="comparison">
            <div>
              <h3>Stabilitet før</h3>
              {preview.preview.before.rounds.map((round) => (
                <StabilitySummary key={round.id} value={round.stability.counting} />
              ))}
            </div>
            <div>
              <h3>Stabilitet efter</h3>
              {preview.preview.after.rounds.map((round) => (
                <StabilitySummary key={round.id} value={round.stability.counting} />
              ))}
            </div>
          </div>
          <ActionForm
            disabled={!writable}
            label="Opdater"
            submit={() => {
              if (preview.preview!.scenarioId !== scenarioId)
                throw new Error('Forslaget tilhører et andet scenarie. Beregn igen.');
              change(applyPotentialPreview(workspace, preview.preview!));
              setPreview(null);
            }}
          >
            <p className="muted">
              Andre tillæg kan ændre sig. C kan fortsat være uafklaret; stabilitet er ingen pointfaktor.
            </p>
          </ActionForm>
          <button className="quiet" onClick={() => setPreview(null)}>
            Annuller
          </button>
        </Dialog>
      )}
    </>
  );
}
export function StabilitySummary({ value }: { value: RoundEvaluation['stability']['counting'] }) {
  return (
    <div className="stability-summary">
      <strong>
        {formatStability(value.mean)}
        {value.mean !== null ? '/5' : ''}
      </strong>
      <span>
        Min. {value.minimum ?? '—'} · lave 1–2: {value.lowCount}
      </span>
      <small>
        {value.assessedCount}/{value.requiredCount} vurderet · {value.filledCount}/{value.requiredCount}{' '}
        udfyldt{!value.complete ? ' · Ufuldstændig' : ''}
      </small>
    </div>
  );
}
interface EntryMenuItem {
  icon: IconName;
  text: string;
  label?: string;
  disabled?: boolean;
  danger?: boolean;
  run: () => void;
}
function EntryMenu({ label, items }: { label: string; items: EntryMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      ref={root}
      className={`entry-menu${open ? ' open' : ''}`}
      onKeyDown={(event) => {
        if (!open) return;
        if (event.key === 'Escape') {
          event.stopPropagation();
          close();
          return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const buttons = Array.from(root.current!.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'));
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : (at + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length;
        event.preventDefault();
        buttons[next]?.focus();
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="quiet entry-menu-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Flere handlinger"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">•••</span>
      </button>
      {open && (
        <div className="entry-menu-items" role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.text}
              type="button"
              role="menuitem"
              className={item.danger ? 'danger' : undefined}
              aria-label={item.label}
              disabled={item.disabled}
              onClick={() => {
                item.run();
                close();
              }}
            >
              <Icon name={item.icon} />
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function EntryNotes({ participant, uncertainties, warning, ambition }: { participant: ParticipantEvaluation; uncertainties: string[]; warning: string; ambition: boolean }) {
  const { originalD, adjustedD, spotD } = participant;
  const spotted = spotD !== adjustedD;
  const differs = (value: typeof spotD) => value.status !== 'known' || value.value?.compare(originalD.value ?? 0) !== 0;
  // En ambition bidrager aldrig, før den er besat; omgangens total siger allerede, at der mangler en gymnast.
  const contribution = !ambition && (differs(adjustedD) || (spotted && spotD.status !== 'known'));
  if (!contribution && !uncertainties.length && !warning) return null;
  const reason =
    participant.entry.role === 'extra'
      ? 'ekstra tæller ikke'
      : adjustedD.status !== 'known'
        ? 'afventer holdomgangen'
        : differs(adjustedD)
          ? 'afviger fra holdomgangen'
          : spotD.issues.includes('SPOT-RATES')
            ? 'modtagning uden kendte satser'
            : spotD.status !== 'known'
              ? 'halvering ved modtagning uafklaret'
              : 'kraftig hjælp halverer D';
  return (
    <div className="entry-notes">
      {contribution && (
        <p className="round-contribution">
          {spotted && (
            <>
              <span className="contribution-own">
                Egen D <strong>{originalD.value ? points(originalD.value) : statusText[originalD.status]}</strong>
              </span>{' '}
              ·{' '}
            </>
          )}
          Bidrag til omgang: <strong>{spotD.value ? points(spotD.value) : statusText[spotD.status]}</strong>{' '}
          <span className="contribution-reason">· {reason}</span>
        </p>
      )}
      {warning && <p className="entry-warning">{warning}</p>}
      <RuleUncertainty ids={uncertainties} />
    </div>
  );
}
type AthleteEntry = Omit<RoundEntryInput, 'athleteId'> & { athleteId: string };
interface EntryFormProps {
  workspace: Workspace;
  teamId: string;
  discipline: SpringDiscipline;
  rulePackage: RulePackage;
  round: Round;
  entry: RoundEntryInput | undefined;
  writable: boolean;
  submit: (entry: AthleteEntry) => void;
  inspect: (athleteId: string) => void;
  reserve?: boolean;
  formRef?: RefObject<HTMLFormElement | null>;
  onDirty?: () => void;
  /** Kun udførende pladser kan være ambitioner; reserver har altid en gymnast. */
  ambition?: { profile: TeamProfile; planId: string; scenarioId: string; request: (value: AmbitionRequest) => void };
}
export function EntryForm(props: EntryFormProps) {
  const [mode, setMode] = useState<SlotMode>('athlete');
  const { ambition, entry } = props;
  if (ambition && entry && entry.athleteId === null)
    return (
      <AmbitionFillForm
        {...props}
        {...ambition}
        entry={entry as RoundEntry}
        formRef={props.formRef}
        onDirty={props.onDirty}
      />
    );
  return (
    <>
      {ambition && !entry && <SlotModeSwitch value={mode} onChange={setMode} disabled={!props.writable} />}
      {ambition && !entry && mode === 'ambition' ? (
        <AmbitionCreateForm {...props} request={ambition.request} formRef={props.formRef} onDirty={props.onDirty} />
      ) : (
        <AthleteEntryForm {...props} />
      )}
    </>
  );
}
function AthleteEntryForm({
  workspace,
  teamId,
  discipline,
  rulePackage,
  round,
  entry,
  writable,
  submit,
  inspect,
  reserve = false,
  formRef,
  onDirty,
}: EntryFormProps) {
  const athletes = workspace.athletes.filter(
    (athlete) =>
      athlete.teamId === teamId &&
      !athlete.archived &&
      (![...round.entries, ...round.reserves].some((item) => item.athleteId === athlete.id) ||
        entry?.athleteId === athlete.id),
  );
  const [athleteId, setAthleteId] = useState(
    athletes.find((athlete) => athlete.id === entry?.athleteId)?.id ?? athletes[0]?.id ?? '',
  );
  const skills = workspace.athleteSkills.filter((registration) => {
    const skill = workspace.skills.find((skill) => skill.id === registration.skillId);
    return (
      registration.athleteId === athleteId &&
      !registration.archived &&
      skill &&
      !skill.archived &&
      skill.discipline === discipline &&
      rulePackage.evaluateSkill(skill, registration).validity === 'known'
    );
  });
  return (
    <ActionForm
      formRef={formRef}
      disabled={!writable || !athleteId}
      submit={(data) =>
        submit({
          id: entry?.id ?? newEntityId(),
          athleteId,
          athleteSkillId: String(data.get('skill')) || null,
          role: data.get('role') === 'extra' ? 'extra' : 'counting',
          plannedSkillId: null,
        })
      }
    >
      <fieldset disabled={!writable} onChange={onDirty}>
        <label>
          Gymnast
          <select value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>
            {!athletes.length && <option value="">Ingen ledige aktive gymnaster</option>}
            {athletes.map((athlete) => (
              <option value={athlete.id} key={athlete.id}>
                {athlete.name}
                {athlete.discriminator ? ` · ${athlete.discriminator}` : ''}
              </option>
            ))}
          </select>
        </label>
        <PlanSkillSelect
          onChange={onDirty}
          key={athleteId}
          initialValue={entry?.athleteId === athleteId ? (entry.athleteSkillId ?? '') : ''}
          options={skills.map((registration) => {
            const skill = workspace.skills.find((item) => item.id === registration.skillId)!;
            const difficulty =
              skill.discipline === 'rhythm'
                ? null
                : rulePackage.evaluateSkill(skill, registration).difficulty.value;
            return {
              id: registration.id,
              name: springDisplayName(skill, rulePackage),
              direction: springDirectionText(skill),
              difficulty: difficulty ? points(difficulty) : null,
              stability: registration.stability,
            };
          })}
        />
        {!reserve && (
          <label>
            Rolle
            <select name="role" defaultValue={entry?.role ?? 'counting'}>
              <option value="counting">Tællende</option>
              <option value="extra">Ekstra · først · indgår ikke i D/C/stabilitet</option>
            </select>
          </label>
        )}
      </fieldset>
      <button type="button" className="quiet" disabled={!athleteId} onClick={() => inspect(athleteId)}>
        Åbn gymnastens færdigheder
      </button>
      <p className="muted">
        Kun holdets egne aktive gymnaster og deres registrerede komplette udførelser kan vælges.
      </p>
      {!writable && (
        <p className="notice">Arbejdsrummet har læseadgang. Du kan gennemse valgene, men ikke ændre dem.</p>
      )}
    </ActionForm>
  );
}
