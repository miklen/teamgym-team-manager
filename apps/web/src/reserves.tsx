import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { insertReserve, setRoundReserves, workspacePayload } from '@teamgym/domain';
import { spotGradeLabel } from './planned-spot';
import type { ReserveEntry, Round, Scenario, SpringDiscipline, Workspace } from '@teamgym/domain';
import type { DisciplineEvaluation, RoundEvaluation, RulePackage, TeamProfile } from '@teamgym/rules';
import type { DataProps } from './athletes';
import { AthleteInspector } from './athletes';
import { ActionForm, Dialog, points, statusText } from './components';
import { EntryForm, StabilitySummary } from './spring';
import { PlanDifficulty, PlanSafety } from './plan-skill-select';
import { springDisplayName } from './spring-library';

export function ReserveList({
  workspace,
  change,
  writable,
  teamId,
  planId,
  discipline,
  scenario,
  round,
  result,
  rulePackage,
  profile,
  registerLeave,
  selectScenario,
  inserted,
}: DataProps & {
  teamId: string;
  planId: string;
  discipline: SpringDiscipline;
  scenario: Scenario;
  round: Round;
  result: RoundEvaluation;
  rulePackage: RulePackage;
  profile: TeamProfile;
  registerLeave: (handler: ((action: () => void) => void) | null) => void;
  selectScenario: (id: string) => void;
  inserted: (id: string) => void;
}) {
  const alternatives = workspace.plans.find((item) => item.id === planId)![discipline];
  const [editing, setEditing] = useState<{ entry?: ReserveEntry } | null>(null);
  const [inserting, setInserting] = useState<ReserveEntry | null>(null);
  const [targetId, setTargetId] = useState('');
  const [preview, setPreview] = useState<{
    basis: string;
    workspace: Workspace;
    before: DisciplineEvaluation;
    after: DisciplineEvaluation;
  } | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const dirty = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const [leaving, setLeaving] = useState(false);
  const root = useRef<HTMLElement>(null);
  const positions = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    for (const node of root.current?.querySelectorAll<HTMLElement>('[data-reserve-id]') ?? []) {
      const id = node.dataset.reserveId!;
      const top = node.offsetTop;
      const previous = positions.current.get(id);
      if (
        previous !== undefined &&
        top !== previous &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        node.getAnimations().forEach((animation) => animation.cancel());
        node.animate([{ transform: `translateY(${previous - top}px)` }, { transform: 'translateY(0)' }], {
          duration: 160,
          easing: 'ease-out',
        });
      }
      next.set(id, top);
    }
    positions.current = next;
  }, [round.reserves]);
  function leave(action: () => void) {
    if (editing && dirty.current) {
      pending.current = action;
      setLeaving(true);
    } else {
      setEditing(null);
      setInserting(null);
      action();
    }
  }
  useEffect(() => {
    if (!editing && !inserting) return;
    registerLeave(leave);
    return () => registerLeave(null);
  });
  function name(id: string) {
    const athlete = workspace.athletes.find((item) => item.id === id);
    return `${athlete?.name ?? 'Ukendt gymnast'}${athlete?.discriminator ? ` · ${athlete.discriminator}` : ''}`;
  }
  function update(next: ReserveEntry[], message: string) {
    change(setRoundReserves(workspace, planId, discipline, scenario.id, round.id, next));
    setStatus(message);
    setError('');
  }
  function shift(index: number, delta: number) {
    const copy = [...round.reserves];
    const entry = copy[index]!;
    [copy[index], copy[index + delta]] = [copy[index + delta]!, entry];
    try {
      update(copy, `${name(entry.athleteId)} er nu ${index + delta + 1}. reserve.`);
      requestAnimationFrame(() =>
        root.current
          ?.querySelector<HTMLButtonElement>(`[data-reserve-id="${entry.id}"] .reserve-edit`)
          ?.focus(),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Prioriteten kunne ikke ændres.');
    }
  }
  function calculate(entryId: string, reserve: ReserveEntry) {
    setTargetId(entryId);
    setPreview(null);
    setError('');
    if (!entryId) return;
    try {
      const registration = workspace.athleteSkills.find((item) => item.id === reserve.athleteSkillId);
      const skill = workspace.skills.find((item) => item.id === registration?.skillId);
      if (
        skill &&
        registration &&
        (skill.discipline === 'rhythm' || rulePackage.evaluateSkill(skill, registration).validity !== 'known')
      )
        throw new Error('Ret reservens spring eller vælg bevidst Vælg senere før indsættelse.');
      const basis = workspacePayload(workspace);
      const next = insertReserve(
        workspace,
        planId,
        discipline,
        scenario.id,
        round.id,
        reserve.id,
        entryId,
        basis,
        profile,
      );
      setPreview({
        basis,
        workspace: next,
        before: rulePackage.analyze(workspace, teamId, discipline, scenario.id),
        after: rulePackage.analyze(next, teamId, discipline, scenario.id),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ret reserven før indsættelse.');
    }
  }
  return (
    <section ref={root} className="reserve-section" aria-label="Reserver">
      <div className="reserve-heading">
        <h3>Reserver</h3>
        <span>{round.reserves.length || 'Ingen valgt'}</span>
      </div>
      {!round.reserves.length && (
        <p className="muted">Beredskab til hele omgangen. Reserver tæller først med, når de sættes ind.</p>
      )}
      <ol className="reserve-list">
        {result.reserves.map((participant, index) => {
          const reserve = round.reserves[index]!;
          const unavailable =
            participant.diagnostics.some((item) => item.status === 'invalid') ||
            (participant.evaluation?.validity !== 'known' && reserve.athleteSkillId !== null);
          return (
            <li key={reserve.id} data-reserve-id={reserve.id}>
              <div className="reserve-priority">{index + 1}. reserve</div>
              <button
                className="reserve-edit entry-name"
                onClick={() => {
                  dirty.current = false;
                  setEditing({ entry: reserve });
                }}
              >
                <strong>{name(reserve.athleteId)}</strong>
                <small>
                  {participant.skill
                    ? springDisplayName(participant.skill, rulePackage)
                    : 'Vælg senere · spring mangler'}
                </small>
              </button>
              <div className="reserve-metrics">
                <span>
                  D{' '}
                  <PlanDifficulty
                    value={participant.originalD.value ? points(participant.originalD.value) : null}
                  />
                </span>
                <PlanSafety value={unavailable ? null : (participant.registration?.stability ?? null)} />
              </div>
              {(unavailable || reserve.athleteSkillId === null) && (
                <p className="reserve-warning">
                  {unavailable
                    ? `Utilgængelig reserve. ${participant.diagnostics.map((item) => item.message).join(' ')} Ret reserven før indsættelse.`
                    : 'Spring mangler på reserven. Den udførende opstilling er uændret.'}
                </p>
              )}
              <div className="reserve-actions">
                <button
                  disabled={!writable || !round.entries.some((entry) => entry.athleteId !== null) || unavailable}
                  onClick={() => {
                    setInserting(reserve);
                    setTargetId('');
                    setPreview(null);
                    setError('');
                  }}
                >
                  Sæt ind
                </button>
                <button
                  className="quiet"
                  aria-label={`Flyt ${name(reserve.athleteId)} op som reserve`}
                  disabled={!writable || index === 0}
                  onClick={() => shift(index, -1)}
                >
                  ↑
                </button>
                <button
                  className="quiet"
                  aria-label={`Flyt ${name(reserve.athleteId)} ned som reserve`}
                  disabled={!writable || index === round.reserves.length - 1}
                  onClick={() => shift(index, 1)}
                >
                  ↓
                </button>
                <button
                  className="quiet"
                  disabled={!writable}
                  aria-label={`Fjern ${name(reserve.athleteId)} som reserve`}
                  onClick={() => {
                    update(
                      round.reserves.filter((item) => item.id !== reserve.id),
                      `${name(reserve.athleteId)} fjernet som reserve.`,
                    );
                    requestAnimationFrame(() =>
                      root.current?.querySelector<HTMLButtonElement>('.add-reserve')?.focus(),
                    );
                  }}
                >
                  Fjern
                </button>
              </div>
              {!round.entries.some((entry) => entry.athleteId !== null) && (
                <small>
                  {round.entries.length
                    ? 'Ambitioner kan ikke erstattes. Besæt en plads for at sætte en reserve ind.'
                    : 'Tilføj først en udførende plads for at sætte en reserve ind.'}
                </small>
              )}
            </li>
          );
        })}
      </ol>
      <button
        className="quiet add-reserve"
        disabled={!writable}
        onClick={() => {
          dirty.current = false;
          setEditing({});
        }}
      >
        + Tilføj reserve
      </button>
      <p role="status" className="sr-only">
        {status}
      </p>
      {error && !inserting && <p role="alert">{error}</p>}
      {editing && (
        <Dialog title={editing.entry ? 'Redigér reserve' : 'Tilføj reserve'} close={() => leave(() => {})}>
          <p>
            {scenario.name} · {scenario.rounds.findIndex((item) => item.id === round.id) + 1}. omgang
          </p>
          <label>
            Vis scenarie
            <select
              value={scenario.id}
              onChange={(event) => {
                const id = event.target.value;
                leave(() => selectScenario(id));
              }}
            >
              {alternatives.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <EntryForm
            reserve
            formRef={form}
            onDirty={() => {
              dirty.current = true;
            }}
            workspace={workspace}
            teamId={teamId}
            discipline={discipline}
            rulePackage={rulePackage}
            round={round}
            entry={editing.entry ? { ...editing.entry, role: 'counting' } : undefined}
            writable={writable}
            inspect={(id) => leave(() => setAthleteId(id))}
            submit={({ role: _role, plannedSkillId: _plannedSkillId, ...entry }) => {
              void _role;
              void _plannedSkillId;
              update(
                editing.entry
                  ? round.reserves.map((item) => (item.id === entry.id ? entry : item))
                  : [...round.reserves, entry],
                `${name(entry.athleteId)} gemt som reserve.`,
              );
              dirty.current = false;
              setEditing(null);
              const action = pending.current;
              pending.current = null;
              action?.();
            }}
          />
        </Dialog>
      )}
      {athleteId && (
        <AthleteInspector
          workspace={workspace}
          change={change}
          writable={writable}
          athleteId={athleteId}
          close={() => setAthleteId(null)}
        />
      )}
      {leaving && (
        <Dialog
          title="Gem formularændringer?"
          close={() => {
            setLeaving(false);
            pending.current = null;
          }}
        >
          <p>Reserveformularen i {scenario.name} har ændringer. Opdater ændrer kun den lokale kladde.</p>
          <div className="actions">
            <button
              onClick={() => {
                setLeaving(false);
                form.current?.requestSubmit();
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
                setEditing(null);
                action?.();
              }}
            >
              Kassér
            </button>
            <button
              className="quiet"
              onClick={() => {
                pending.current = null;
                setLeaving(false);
              }}
            >
              Bliv
            </button>
          </div>
        </Dialog>
      )}
      {inserting && (
        <Dialog
          wide
          title="Sæt reserve ind"
          close={() => {
            setInserting(null);
            setError('');
          }}
        >
          <p>
            <strong>{scenario.name}</strong> · {discipline === 'tumbling' ? 'Bane' : 'Trampet'} ·{' '}
            {scenario.rounds.findIndex((item) => item.id === round.id) + 1}. omgang
          </p>
          <p>Reserve: {name(inserting.athleteId)}. Den udgående gymnast bliver ikke automatisk reserve.</p>
          <label>
            Gymnast der udgår
            <select autoFocus value={targetId} onChange={(event) => calculate(event.target.value, inserting)}>
              <option value="">Vælg udførende plads</option>
              {round.entries.map((entry, index) =>
                entry.athleteId === null ? null : (
                  <option key={entry.id} value={entry.id}>
                    {index + 1}. {name(entry.athleteId)} · {entry.role === 'extra' ? 'Ekstra' : 'Tællende'}
                  </option>
                ),
              )}
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
          {(() => {
            const spot = round.entries.find((entry) => entry.id === targetId)?.plannedSpot;
            return spot ? (
              <p className="spot-removed">
                Pladsens planlagte modtagning ({spotGradeLabel(spot.grade, rulePackage)}) bortfalder. Reserver
                indsættes uden modtagning.
              </p>
            ) : null;
          })()}
          {preview && (
            <>
              <div className="comparison">
                {(['before', 'after'] as const).map((key) => (
                  <div key={key}>
                    <h3>{key === 'before' ? 'Før' : 'Efter'}</h3>
                    <p>
                      D {points(preview[key].panelD)} · {statusText[preview[key].difficulty.status]}
                      <br />C {points(preview[key].composition.panel)} ·{' '}
                      {statusText[preview[key].composition.status]}
                    </p>
                    <p>
                      {statusText[preview[key].difficulty.status]} ·{' '}
                      {preview[key].rounds.reduce(
                        (sum, item) =>
                          sum +
                          item.entries.filter((entry) => entry.status !== 'known').length +
                          Math.max(0, profile.counting - item.counting.length),
                        0,
                      )}{' '}
                      manglende eller uafklarede pladser
                    </p>
                    {preview[key].rounds.map((item, index) => (
                      <div key={item.id}>
                        <small>{index + 1}. omgang · sikkerhed</small>
                        <StabilitySummary value={item.stability.counting} />
                      </div>
                    ))}
                    {preview[key].diagnostics.length > 0 && (
                      <ul className="reserve-consequences">
                        {preview[key].diagnostics.map((item, index) => (
                          <li key={index}>{item.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <p>Rolle og plads bevares. Rækkefølgen sorteres ikke automatisk.</p>
              {workspacePayload(workspace) !== preview.basis && (
                <p role="alert">Data er ændret siden forhåndsvisningen. Beregn igen.</p>
              )}
              <ActionForm
                disabled={!writable}
                label="Bekræft indsættelse"
                submit={() => {
                  const next = insertReserve(
                    workspace,
                    planId,
                    discipline,
                    scenario.id,
                    round.id,
                    inserting.id,
                    targetId,
                    preview.basis,
                    profile,
                  );
                  change(next);
                  inserted(targetId);
                  setInserting(null);
                  setStatus(`${name(inserting.athleteId)} sat ind i ${scenario.name}.`);
                  requestAnimationFrame(() =>
                    root.current?.querySelector<HTMLButtonElement>('.add-reserve')?.focus(),
                  );
                }}
              >
                <span />
              </ActionForm>
            </>
          )}
          <div className="actions">
            <button
              className="quiet"
              onClick={() => {
                setInserting(null);
                setError('');
              }}
            >
              Annuller
            </button>
            {targetId && (
              <button className="quiet" onClick={() => calculate(targetId, inserting)}>
                Beregn igen
              </button>
            )}
          </div>
        </Dialog>
      )}
    </section>
  );
}
