import { useLayoutEffect, useRef, useState } from 'react';
import { formatStability, moveRoundFirst, newEntityId, setRoundEntries } from '@teamgym/domain';
import type { Round, RoundEntry, SpringDiscipline, Workspace } from '@teamgym/domain';
import { applyPotentialPreview } from '@teamgym/rules';
import type { BonusPotential, RoundEvaluation, RulePackage, TeamProfile } from '@teamgym/rules';
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

export function SpringPage(props: DataProps & { teamId: string }) {
  const team = props.workspace.teams.find((item) => item.id === props.teamId)!;
  const resolved = registry.resolve(team.rulesetBinding);
  const [discipline, setDiscipline] = useState<SpringDiscipline>('tumbling');
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">{team.name} · Seks vedvarende omgange</p>
          <h1>Springplan</h1>
        </div>
      </div>
      <div className="tabs" aria-label="Springdisciplin">
        <button aria-pressed={discipline === 'tumbling'} onClick={() => setDiscipline('tumbling')}>
          Bane
        </button>
        <button aria-pressed={discipline === 'trampet'} onClick={() => setDiscipline('trampet')}>
          Trampet
        </button>
      </div>
      {resolved.status === 'known' ? (
        <SpringDisciplineView
          key={`${props.teamId}:${discipline}`}
          {...props}
          discipline={discipline}
          rulePackage={resolved.rulePackage}
          profile={resolved.profile}
        />
      ) : (
        <Empty>Holdets præcise regelpakke er ikke installeret. Opstillinger bevares; se Reglement.</Empty>
      )}
    </>
  );
}
function SpringDisciplineView({
  workspace,
  teamId,
  change,
  writable,
  discipline,
  rulePackage,
  profile,
}: DataProps & {
  teamId: string;
  discipline: SpringDiscipline;
  rulePackage: RulePackage;
  profile: TeamProfile;
}) {
  const plan = workspace.plans.find((item) => item.teamId === teamId)!;
  const evaluation = rulePackage.analyze(workspace, teamId, discipline);
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
  const [athlete, setAthlete] = useState<{ id: string; registrationId: string | undefined } | null>(null);
  const [preview, setPreview] = useState<BonusPotential | null>(null);
  const [sortRoundId, setSortRoundId] = useState<string | null>(null);
  const [entryError, setEntryError] = useState('');
  const [entryStatus, setEntryStatus] = useState('');
  const potentials = usePotentials(workspace, teamId, discipline);
  function entries(round: Round, next: RoundEntry[]) {
    change(setRoundEntries(workspace, plan.id, discipline, round.id, next, profile));
    setEntryError('');
    setEntryStatus(
      `${plan[discipline].findIndex((item) => item.id === round.id) + 1}. omgang opdateret: ${next.map((entry) => workspace.athletes.find((athlete) => athlete.id === entry.athleteId)?.name).join(', ')}.`,
    );
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
  const [drag, setDrag] = useState<{ roundId: string; entryId: string } | null>(null);
  function accessibleName(athleteId: string, name: string) {
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
          <span>Planlagt D · disciplin</span>
          <strong className="number-change" key={evaluation.panelD?.toString() ?? 'unknown'}>
            {points(evaluation.panelD)}
          </strong>
          <small>{statusText[evaluation.difficulty.status]} · Tre omganges D / 3</small>
        </div>
        <div>
          <span>Planlagt C · disciplin</span>
          <strong className="number-change" key={evaluation.composition.panel?.toString() ?? 'unknown'}>
            {points(evaluation.composition.panel)}
          </strong>
          <small>{statusText[evaluation.composition.status]} · Flow kræver observation</small>
        </div>
        <div>
          <span>Holdprofil</span>
          <strong>
            {profile.counting} + {profile.extra}
          </strong>
          <small>Tællende + højst ekstra først</small>
        </div>
      </div>
      <div className="round-tabs" aria-label="Vælg omgang">
        {plan[discipline].map((round, index) => (
          <button key={round.id} aria-pressed={activeRound === index} onClick={() => setActiveRound(index)}>
            {index + 1}. {index === 0 ? 'Holdomgang' : 'Omgang'}
          </button>
        ))}
      </div>
      <div className="round-grid">
        {plan[discipline].map((round, roundIndex) => {
          const result = evaluation.rounds[roundIndex]!;
          return (
            <section
              className={`round ${roundIndex === activeRound ? 'active-round' : ''}`}
              key={round.id}
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
                      change(moveRoundFirst(workspace, plan.id, discipline, round.id));
                      setActiveRound(0);
                    }}
                  >
                    Gør til holdomgang
                  </button>
                )}
              </div>
              <p className="round-totals">
                D <strong>{points(result.panelD)}</strong> <span>{statusText[result.difficulty.status]}</span>
              </p>
              <ol className="round-entries">
                {result.entries.map((participant, index) => (
                  <li
                    key={participant.entry.id}
                    ref={(node) => {
                      if (node) rowNodes.current.set(participant.entry.id, node);
                      else rowNodes.current.delete(participant.entry.id);
                    }}
                    className={participant.entry.role === 'extra' ? 'extra-entry' : ''}
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
                        onClick={() => setEntryDialog({ round, entry: participant.entry })}
                      >
                        <strong>{participant.athleteName}</strong>
                        <small>
                          {
                            workspace.athletes.find((athlete) => athlete.id === participant.entry.athleteId)
                              ?.discriminator
                          }
                        </small>
                        <small>
                          {participant.entry.role === 'extra' ? 'EKSTRA · ' : ''}
                          {participant.skill?.name ?? 'Vælg registreret færdighed'}
                        </small>
                      </button>
                      <span className="entry-value">
                        {points(participant.adjustedD.value)}
                        <small>
                          {participant.registration?.stability === null || !participant.registration
                            ? 'Ikke vurderet'
                            : `${participant.registration.stability}/5`}
                        </small>
                      </span>
                    </div>
                    <div className="entry-tools">
                      <button
                        className="quiet"
                        disabled={!writable || index === 0}
                        aria-label={`Flyt ${accessibleName(participant.entry.athleteId, participant.athleteName)} op i ${roundIndex + 1}. omgang`}
                        onClick={() => shift(round, index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        className="quiet"
                        disabled={!writable || index === round.entries.length - 1}
                        aria-label={`Flyt ${accessibleName(participant.entry.athleteId, participant.athleteName)} ned i ${roundIndex + 1}. omgang`}
                        onClick={() => shift(round, index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        className="quiet"
                        onClick={() =>
                          setAthlete({
                            id: participant.entry.athleteId,
                            registrationId: participant.registration?.id,
                          })
                        }
                      >
                        Vurdering
                      </button>
                      <button
                        className="quiet"
                        disabled={!writable}
                        aria-label={`Fjern ${accessibleName(participant.entry.athleteId, participant.athleteName)} fra ${roundIndex + 1}. omgang`}
                        onClick={() =>
                          entries(
                            round,
                            round.entries.filter((entry) => entry.id !== participant.entry.id),
                          )
                        }
                      >
                        Fjern
                      </button>
                    </div>
                    {(participant.diagnostics.length > 0 || participant.adjustedD.status !== 'known') && (
                      <p className="entry-warning">
                        {participant.diagnostics.map((diagnostic) => diagnostic.message).join(' ') ||
                          statusText[participant.adjustedD.status]}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              {!round.entries.length && (
                <Empty>Ingen gymnaster valgt. Tilføj holdets registrerede færdigheder.</Empty>
              )}
              <button
                className="add-entry"
                disabled={!writable || round.entries.length >= profile.counting + profile.extra}
                onClick={() => setEntryDialog({ round })}
              >
                + Tilføj plads
              </button>
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
                <p>Rækkefølge: {statusText[result.order.deduction.status]}</p>
                <button
                  className="quiet"
                  disabled={!writable || result.sortedEntryIds.length !== round.entries.length}
                  onClick={() => setSortRoundId(round.id)}
                >
                  Vis sorteringsforslag
                </button>
                <p className="muted">
                  Rotationskategori før stigende D. Sortering anvendes kun efter dit valg.
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
      <section className="composition">
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
                Berørte valg:{' '}
                {item.affectedIds
                  .map(
                    (id) =>
                      workspace.athletes.find((athlete) => athlete.id === id)?.name ??
                      evaluation.rounds
                        .flatMap((round) => round.entries)
                        .find((entry) => entry.entry.id === id)?.athleteName ??
                      'Omgang/disciplin',
                  )
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
      <section>
        <div className="section-heading">
          <h2>Holdets dokumenterede muligheder</h2>
          {!potentials.result && (
            <button className="quiet" onClick={potentials.cancel}>
              Afbryd søgning
            </button>
          )}
        </div>
        <p>
          Hvert tillæg har sin egen opstilling. Mulighederne kan være indbyrdes uforenelige og lægges ikke
          sammen som sikker samlet C.
        </p>
        {potentials.error && <p role="alert">{potentials.error}</p>}
        {!potentials.result && !potentials.error ? (
          <p role="status">Beregner registrerede muligheder… Du kan redigere videre.</p>
        ) : (
          <div className="potential-list">
            {potentials.result?.map((item) => (
              <div key={item.id}>
                <strong>{item.label}</strong>
                <p>
                  Valgt {points(item.selected)} · dokumenteret {points(item.documentedValue)} · regelmaksimum{' '}
                  {points(item.ruleMaximum)}
                </p>
                <small>
                  {item.status === 'lower-bound'
                    ? 'Dokumenteret undergrænse; søgningen blev begrænset eller afbrudt.'
                    : item.status === 'proven'
                      ? 'Dokumenteret med konkret opstilling.'
                      : item.status === 'unresolved'
                        ? `Uafklaret ${item.issue ?? ''}`
                        : 'Ikke nok anvendelige registreringer til en fuld opstilling.'}
                </small>
                <button className="quiet" disabled={!item.preview} onClick={() => setPreview(item)}>
                  Se konkrete ændringer
                </button>
              </div>
            ))}
          </div>
        )}
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
          title={entryDialog.entry ? 'Redigér omgangsplads' : 'Tilføj omgangsplads'}
          close={() => setEntryDialog(null)}
        >
          <EntryForm
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
            submit={(entry) => {
              const changed = entryDialog.entry
                ? entryDialog.round.entries.map((existing) => (existing.id === entry.id ? entry : existing))
                : [...entryDialog.round.entries, entry];
              entries(entryDialog.round, [
                ...changed.filter((item) => item.role === 'extra'),
                ...changed.filter((item) => item.role === 'counting'),
              ]);
              setEntryDialog(null);
            }}
          />
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
                    {participant.athleteName} · {participant.skill?.name ?? 'Færdighed mangler'} · fra plads{' '}
                    {round.entries.indexOf(participant) + 1} · D {points(participant.originalD.value)}
                  </li>
                );
              })}
          </ol>
          <ActionForm
            disabled={!writable}
            label="Anvend rækkefølgen"
            submit={() => {
              const round = plan[discipline].find((item) => item.id === sortRoundId)!;
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
                </li>
              );
            })}
          </ul>
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
            label="Anvend opstillingen i kladde"
            submit={() => {
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
function StabilitySummary({ value }: { value: RoundEvaluation['stability']['counting'] }) {
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
function EntryForm({
  workspace,
  teamId,
  discipline,
  rulePackage,
  round,
  entry,
  writable,
  submit,
  inspect,
}: {
  workspace: Workspace;
  teamId: string;
  discipline: SpringDiscipline;
  rulePackage: RulePackage;
  round: Round;
  entry: RoundEntry | undefined;
  writable: boolean;
  submit: (entry: RoundEntry) => void;
  inspect: (athleteId: string) => void;
}) {
  const athletes = workspace.athletes.filter(
    (athlete) =>
      athlete.teamId === teamId &&
      !athlete.archived &&
      (!round.entries.some((item) => item.athleteId === athlete.id) || entry?.athleteId === athlete.id),
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
      disabled={!writable || !athleteId}
      submit={(data) =>
        submit({
          id: entry?.id ?? newEntityId(),
          athleteId,
          athleteSkillId: String(data.get('skill')) || null,
          role: data.get('role') === 'extra' ? 'extra' : 'counting',
        })
      }
    >
      <fieldset disabled={!writable}>
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
        <label>
          Registreret komplet færdighed
          <select
            name="skill"
            key={athleteId}
            defaultValue={entry?.athleteId === athleteId ? (entry.athleteSkillId ?? '') : ''}
          >
            <option value="">Ikke valgt · ufuldstændig plads</option>
            {skills.map((registration) => (
              <option key={registration.id} value={registration.id}>
                {workspace.skills.find((skill) => skill.id === registration.skillId)!.name} ·{' '}
                {registration.stability === null ? 'Ikke vurderet' : `${registration.stability}/5`}
              </option>
            ))}
          </select>
        </label>
        <label>
          Rolle
          <select name="role" defaultValue={entry?.role ?? 'counting'}>
            <option value="counting">Tællende</option>
            <option value="extra">Ekstra · først · indgår ikke i D/C/stabilitet</option>
          </select>
        </label>
      </fieldset>
      <button type="button" className="quiet" disabled={!athleteId} onClick={() => inspect(athleteId)}>
        Åbn gymnastens færdigheder
      </button>
      <p className="muted">
        Kun holdets egne aktive gymnaster og deres registrerede komplette udførelser kan vælges.
      </p>
    </ActionForm>
  );
}
