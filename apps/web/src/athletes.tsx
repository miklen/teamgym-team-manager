import { useEffect, useRef, useState } from 'react';
import {
  confirmRuleReview,
  planReferences,
  createAthlete,
  formatStability,
  dependentRegistrations,
  followAssessment,
  setOwnAssessment,
  newEntityId,
  moveAthlete,
  setArchived,
  updateAthlete,
} from '@teamgym/domain';
import type { Athlete, AthleteSkill, Stability, Team, Workspace } from '@teamgym/domain';
import {
  ActionForm,
  Decision,
  Dialog,
  Empty,
  SkillBreakdown,
  SourceLinks,
  StabilityControl,
} from './components';
import { registry } from './rules';
import type { RulePackage } from '@teamgym/rules';
import { SkillEditor } from './skill-editor';
import { Avatar, Icon } from './ui';
import { springDisplayName, springInheritanceContext } from './spring-library';
import { SkillRepertoire } from './skill-repertoire';

export interface DataProps {
  workspace: Workspace;
  change: (workspace: Workspace) => void;
  writable: boolean;
}
export function Athletes({ workspace, change, writable }: DataProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const searchField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (feedback) searchField.current?.focus();
  }, [feedback]);
  const athletes = workspace.athletes.filter(
    (athlete) =>
      !athlete.archived &&
      (filter === 'all' || (filter === 'none' ? athlete.teamId === null : athlete.teamId === filter)) &&
      `${athlete.name} ${athlete.discriminator}`
        .toLocaleLowerCase('da-DK')
        .includes(search.toLocaleLowerCase('da-DK')),
  );
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Gymnaster</h1>
          <p className="page-description">
            {athletes.length} gymnaster. Færdigheder og sikkerhed samlet ét sted.
          </p>
        </div>
        <button disabled={!writable} onClick={() => setCreating(true)}>
          <Icon name="plus" />
          Tilføj gymnast
        </button>
      </div>
      <div className="toolbar">
        <label>
          Søg gymnast
          <input
            ref={searchField}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Navn eller kendetegn"
          />
        </label>
        <label>
          Holdfilter
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">Alle hold</option>
            <option value="none">Uden hold</option>
            {workspace.teams
              .filter((team) => !team.archived)
              .map((team) => (
                <option value={team.id} key={team.id}>
                  {team.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      {feedback && (
        <p className="muted" role="status">
          {feedback}
        </p>
      )}
      {!athletes.length ? (
        <Empty>Ingen gymnaster passer til filteret. Tilføj en gymnast, eller justér filtrene.</Empty>
      ) : (
        <ul className="entity-list">
          {athletes.map((athlete) => (
            <li key={athlete.id}>
              <button
                className="entity-link"
                onClick={() => {
                  setFeedback('');
                  setSelected(athlete.id);
                }}
              >
                <Avatar name={athlete.name} />
                <span className="entity-copy">
                  <strong>{athlete.name}</strong>
                  <small>
                    {athlete.discriminator || 'Intet kendetegn'} ·{' '}
                    {workspace.teams.find((team) => team.id === athlete.teamId)?.name ?? 'Uden hold'}
                  </small>
                </span>
                <span className="entity-stat">
                  {
                    workspace.athleteSkills.filter((item) => item.athleteId === athlete.id && !item.archived)
                      .length
                  }{' '}
                  færdigheder <Icon name="arrow" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {creating && (
        <Dialog title="Tilføj gymnast" close={() => setCreating(false)}>
          <AthleteForm
            teams={workspace.teams}
            initialTeamId={filter !== 'all' && filter !== 'none' ? filter : null}
            submit={(data) => {
              change(createAthlete(workspace, data));
              setCreating(false);
            }}
          />
        </Dialog>
      )}
      {selected && (
        <AthleteInspector
          key={selected}
          {...{ workspace, change, writable }}
          athleteId={selected}
          close={() => setSelected(null)}
          removed={() => {
            setFeedback(
              `${workspace.athletes.find((item) => item.id === selected)!.name} er fjernet fra gymnastlisten.`,
            );
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

function AthleteForm({
  teams,
  athlete,
  initialTeamId = null,
  submit,
}: {
  teams: Team[];
  athlete?: Athlete;
  initialTeamId?: string | null;
  submit: (input: {
    name: string;
    teamId: string | null;
    discriminator: string;
    mixCategory: 'girl' | 'boy' | null;
  }) => void;
}) {
  return (
    <ActionForm
      submit={(data) =>
        submit({
          name: String(data.get('name')).trim(),
          discriminator: String(data.get('discriminator')).trim(),
          teamId: String(data.get('team')) || null,
          mixCategory:
            data.get('mixCategory') === 'girl' ? 'girl' : data.get('mixCategory') === 'boy' ? 'boy' : null,
        })
      }
    >
      <label>
        Navn
        <input name="name" defaultValue={athlete?.name ?? ''} required maxLength={200} autoComplete="off" />
      </label>
      <label>
        Kendetegn ved navnesammenfald
        <input
          name="discriminator"
          defaultValue={athlete?.discriminator ?? ''}
          maxLength={160}
          placeholder="Fx årgang eller træningsgruppe"
        />
      </label>
      <label>
        Hold
        <select name="team" defaultValue={athlete?.teamId ?? initialTeamId ?? ''}>
          <option value="">Uden hold</option>
          {teams
            .filter((team) => !team.archived)
            .map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Kategori til mix-opstilling
        <select name="mixCategory" defaultValue={athlete?.mixCategory ?? ''}>
          <option value="">Ikke angivet</option>
          <option value="girl">Pige</option>
          <option value="boy">Dreng</option>
        </select>
      </label>
      {athlete && (
        <p className="muted">
          Færdigheder bevares ved flytning. Eksisterende omgangspladser og reserver bliver stående med en
          advarsel. Rytmeoverblikket følger straks medlemsændringen i kladden.
        </p>
      )}
    </ActionForm>
  );
}

export function AthleteInspector({
  workspace,
  change,
  writable,
  athleteId,
  close,
  initialRegistrationId,
  removed,
}: DataProps & {
  athleteId: string;
  close: () => void;
  initialRegistrationId?: string | undefined;
  removed?: () => void;
}) {
  const athlete = workspace.athletes.find((item) => item.id === athleteId)!;
  const team = workspace.teams.find((item) => item.id === athlete.teamId);
  const resolved = team && registry.resolve(team.rulesetBinding);
  const rulePackage = resolved?.status === 'known' ? resolved.rulePackage : null;
  const [mode, setMode] = useState<'list' | 'profile' | 'new' | 'execution'>('list');
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(
    initialRegistrationId ?? null,
  );
  const [removing, setRemoving] = useState<string | null>(null);
  const [removingAthlete, setRemovingAthlete] = useState(false);
  const [feedback, setFeedback] = useState('');
  const addSkillButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (feedback) addSkillButton.current?.focus();
  }, [feedback]);
  const removedRegistration = workspace.athleteSkills.find((item) => item.id === removing);
  const removedDefinition = workspace.skills.find((item) => item.id === removedRegistration?.skillId);
  const references = planReferences(workspace);
  const usedReferences = references.filter((item) => item.entry.athleteSkillId === removing);
  const athleteReferences = references.filter((item) => item.entry.athleteId === athleteId);
  const usedPlaces = removing ? usedReferences.length : 0;
  const athletePlaces = removingAthlete ? athleteReferences.length : 0;
  const registration = workspace.athleteSkills.find((item) => item.id === selectedRegistration);
  const registrations = workspace.athleteSkills.filter(
    (item) => item.athleteId === athleteId && (!item.archived || item.id === selectedRegistration),
  );
  const [registrationContext, setRegistrationContext] = useState('');
  const chosenPackage =
    rulePackage ??
    (athlete.teamId === null
      ? (registry
          .list()
          .find(
            (item) => `${item.manifest.rulesetId}:${item.manifest.packageVersion}` === registrationContext,
          ) ?? null)
      : null);
  return (
    <Dialog wide title={athlete.name} close={close}>
      <div className={`inspector-meta ${mode === 'new' || mode === 'execution' ? 'editor-meta' : ''}`}>
        <Avatar name={athlete.name} />
        <div>
          <strong>{team?.name ?? 'Uden hold'}</strong>
          <small>
            {athlete.discriminator || 'Gymnastprofil'}
            {athlete.archived ? ' · Fjernet' : ''}
          </small>
        </div>
      </div>
      {athlete.archived && (
        <p className="notice">
          Gymnasten er fjernet fra gymnastlisten. Vælg en anden gymnast på de berørte pladser i springplanen.
        </p>
      )}
      {athlete.teamId === null && (
        <label>
          Regelgrundlag for registrering
          <select
            value={registrationContext}
            onChange={(event) => setRegistrationContext(event.target.value)}
          >
            <option value="">Vælg regelpakke for D og fundament</option>
            {registry.list().map((item) => (
              <option
                key={`${item.manifest.rulesetId}:${item.manifest.packageVersion}`}
                value={`${item.manifest.rulesetId}:${item.manifest.packageVersion}`}
              >
                {item.manifest.name} · {item.manifest.packageVersion}
              </option>
            ))}
          </select>
        </label>
      )}
      {mode === 'profile' ? (
        <>
          <ReferenceSummary workspace={workspace} references={athleteReferences} />
          <button className="quiet" onClick={() => setMode('list')}>
            ← Tilbage til færdigheder
          </button>
          <AthleteForm
            teams={workspace.teams}
            athlete={athlete}
            submit={(data) => {
              let updated = updateAthlete(workspace, athleteId, data);
              if (athlete.teamId !== data.teamId) updated = moveAthlete(updated, athleteId, data.teamId);
              change(updated);
              setMode('list');
            }}
          />
        </>
      ) : mode === 'new' || mode === 'execution' ? (
        <>
          <button className="quiet" onClick={() => setMode('list')}>
            ← Tilbage til færdigheder
          </button>
          {chosenPackage && (
            <SkillEditor
              workspace={workspace}
              athleteId={athleteId}
              rulePackage={chosenPackage}
              openExisting={(id) => {
                setSelectedRegistration(id);
                setMode('list');
              }}
              registration={mode === 'execution' ? registration : undefined}
              save={(updated) => {
                change(updated);
                setMode('list');
                setSelectedRegistration(null);
              }}
            />
          )}
        </>
      ) : (
        <>
          <div className="actions">
            <button
              className="quiet"
              disabled={!writable || athlete.archived}
              onClick={() => setMode('profile')}
            >
              Redigér gymnast
            </button>
            <button
              ref={addSkillButton}
              disabled={!writable || athlete.archived || !chosenPackage}
              onClick={() => {
                setFeedback('');
                setMode('new');
              }}
            >
              <Icon name="plus" />
              Tilføj færdighed
            </button>
            <button
              className="quiet danger"
              disabled={!writable || athlete.archived}
              onClick={() => setRemovingAthlete(true)}
            >
              Fjern gymnast
            </button>
          </div>
          {feedback && (
            <p role="status" className="muted">
              {feedback}
            </p>
          )}
          {!chosenPackage && (
            <p className="notice">
              Holdets præcise regelpakke er ikke installeret. Kunnen bevares; regelkoblingen kan ikke vurderes
              her.
            </p>
          )}
          {registration?.archived && (
            <section className="unavailable-skill">
              <button className="repertoire-row" disabled>
                {springDisplayName(
                  workspace.skills.find((item) => item.id === registration.skillId)!,
                  chosenPackage,
                )}
                <span>Fjernet</span>
              </button>
              <p className="notice">
                Færdigheden er fjernet fra gymnasten. Tilføj den igen fra listen for at bruge den.
              </p>
              <Assessment
                workspace={workspace}
                registration={registration}
                team={team}
                explicitPackage={chosenPackage}
                writable={false}
                save={change}
              />
              <button className="quiet danger" disabled>
                Fjern færdighed
              </button>
            </section>
          )}
          <SkillRepertoire
            workspace={workspace}
            athleteId={athleteId}
            rulePackage={chosenPackage}
            selectedId={selectedRegistration}
            select={setSelectedRegistration}
            details={(item) => {
              const skill = workspace.skills.find((definition) => definition.id === item.skillId)!;
              const evaluation =
                skill.discipline !== 'rhythm' ? chosenPackage?.evaluateSkill(skill, item) : null;
              return (
                <>
                  <Assessment
                    key={`${item.id}:${item.updatedAt}`}
                    workspace={workspace}
                    registration={item}
                    team={team}
                    explicitPackage={chosenPackage}
                    writable={writable && !athlete.archived}
                    save={change}
                  />
                  {evaluation && (
                    <details>
                      <summary>Beregningsgrundlag</summary>
                      <Decision value={evaluation.difficulty} />
                      <SkillBreakdown evaluation={evaluation} />
                      <SourceLinks sources={evaluation.explanation.sources} rulePackage={chosenPackage!} />
                      {evaluation.explanation.notes.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </details>
                  )}
                  <div className="actions">
                    <button
                      className="quiet"
                      disabled={!writable || !chosenPackage || athlete.archived}
                      onClick={() => setMode('execution')}
                    >
                      Redigér præcis udførelse
                    </button>
                    <button
                      className="quiet danger"
                      disabled={!writable || athlete.archived}
                      onClick={() => setRemoving(item.id)}
                    >
                      Fjern færdighed
                    </button>
                  </div>
                </>
              );
            }}
          />
          {!registrations.length && (
            <Empty>Ingen færdigheder. Registrér komplette udførelser; stabilitet sættes særskilt.</Empty>
          )}
        </>
      )}
      {removingAthlete && (
        <Dialog title="Fjern gymnast" close={() => setRemovingAthlete(false)}>
          <p>
            Fjern <strong>{athlete.name}</strong>
            {athlete.discriminator ? ` (${athlete.discriminator})` : ''} fra gymnastlisten?
          </p>
          {athletePlaces > 0 && (
            <p className="notice">
              Gymnasten er valgt på {athletePlaces} {athletePlaces === 1 ? 'plads' : 'pladser'} i
              springplanen. Der skal vælges en anden gymnast på disse pladser.
            </p>
          )}
          <ReferenceSummary workspace={workspace} references={athleteReferences} />
          <p className="muted">
            Gymnastens registrerede færdigheder bevares, og holdets aktive overblik opdateres.
          </p>
          <div className="actions">
            <button className="quiet" onClick={() => setRemovingAthlete(false)}>
              Annuller
            </button>
            <button
              className="danger"
              disabled={!writable}
              onClick={() => {
                change(setArchived(workspace, 'athletes', athleteId, true));
                (removed ?? close)();
              }}
            >
              Fjern gymnast
            </button>
          </div>
        </Dialog>
      )}
      {removedRegistration && removedDefinition && (
        <Dialog title="Fjern færdighed" close={() => setRemoving(null)}>
          <p>
            Fjern <strong>{springDisplayName(removedDefinition, chosenPackage)}</strong> fra {athlete.name}?
          </p>
          {usedPlaces > 0 && (
            <p className="notice">
              Færdigheden bruges på {usedPlaces} {usedPlaces === 1 ? 'plads' : 'pladser'} i springplanen. Der
              skal vælges en anden færdighed på disse pladser.
            </p>
          )}
          <ReferenceSummary workspace={workspace} references={usedReferences} />
          <p className="muted">Du kan tilføje færdigheden igen fra listen.</p>
          {dependentRegistrations(workspace, removedRegistration.id).length > 0 && (
            <div className="notice">
              <p>Disse færdigheder følger kilden og får en anden gyldig kilde eller bliver Ikke vurderet:</p>
              <ul>
                {dependentRegistrations(workspace, removedRegistration.id).map((item) => (
                  <li key={item.id}>
                    {springDisplayName(
                      workspace.skills.find((skill) => skill.id === item.skillId)!,
                      chosenPackage,
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="actions">
            <button className="quiet" onClick={() => setRemoving(null)}>
              Annuller
            </button>
            <button
              className="danger"
              disabled={!writable}
              onClick={() => {
                change(setArchived(workspace, 'athleteSkills', removedRegistration.id, true));
                setRemoving(null);
                setSelectedRegistration(null);
                setFeedback(
                  `${springDisplayName(removedDefinition, chosenPackage)} er fjernet fra gymnasten.`,
                );
              }}
            >
              Fjern færdighed
            </button>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}

function Assessment({
  workspace,
  registration,
  team,
  writable,
  save,
  explicitPackage,
}: {
  workspace: Workspace;
  registration: AthleteSkill;
  team: Team | undefined;
  writable: boolean;
  save: (workspace: Workspace) => void;
  explicitPackage?: RulePackage | null;
}) {
  const [own, setOwn] = useState(registration.assessmentOrigin.kind === 'own');
  const [sourceChoice, setSourceChoice] = useState('');
  const [value, setValue] = useState<Stability | null>(registration.stability);
  const resolved = team && registry.resolve(team.rulesetBinding);
  const assessmentPackage =
    resolved?.status === 'known' ? resolved.rulePackage : !team ? explicitPackage : null;
  const context = assessmentPackage ? springInheritanceContext(assessmentPackage) : undefined;
  const sourceId =
    registration.assessmentOrigin.kind === 'inherited' ? registration.assessmentOrigin.sourceId : null;
  const source = workspace.athleteSkills.find((item) => item.id === sourceId);
  const candidates = workspace.inheritanceRelations
    .filter((item) => item.targetId === registration.id)
    .flatMap((relation) => {
      const item = workspace.athleteSkills.find((candidate) => candidate.id === relation.sourceId)!;
      const definition = workspace.skills.find((skill) => skill.id === item.skillId)!;
      const target = workspace.skills.find((skill) => skill.id === registration.skillId)!;
      return !item.archived && context?.accepts(relation, definition, target) ? [{ item, definition }] : [];
    });
  const [date, setDate] = useState(registration.assessedAt ?? new Date().toISOString().slice(0, 10));
  const needsSourceChoice =
    candidates.length > 0 &&
    candidates.every(({ definition, item }) => context?.difficulty(definition, item) === null);
  return (
    <ActionForm
      disabled={!writable || registration.archived}
      submit={(data) => {
        const installed = explicitPackage ?? registry.list()[0]!;
        const binding = team?.rulesetBinding ?? {
          rulesetId: installed.manifest.rulesetId,
          packageVersion: installed.manifest.packageVersion,
          ageGroup: installed.profiles[0]!.ageGroup,
          teamType: installed.profiles[0]!.teamType,
        };
        const input = {
          stability: value,
          assessedAt: value === null ? null : date,
          note: String(data.get('note')),
        };
        const environment = {
          id: newEntityId,
          now: () => new Date().toISOString(),
          ...(context ? { inheritance: context } : {}),
        };
        const next = own ? setOwnAssessment(workspace, registration.id, input, environment) : workspace;
        save(confirmRuleReview(next, registration.id, binding, input, environment));
      }}
      label="Opdatér vurdering"
    >
      <fieldset disabled={!writable || registration.archived}>
        <div className="assessment-origin">
          <strong>
            {registration.assessmentOrigin.kind === 'own'
              ? 'Egen vurdering'
              : source
                ? `Arvet fra ${springDisplayName(
                    workspace.skills.find((item) => item.id === source.skillId)!,
                    assessmentPackage,
                  )}`
                : 'Mangler arvekilde'}
          </strong>
          {registration.assessmentOrigin.kind === 'inherited' && (
            <button type="button" className="quiet" onClick={() => setOwn(true)} aria-pressed={own}>
              Egen vurdering
            </button>
          )}
          {candidates.length > 0 && (
            <>
              {needsSourceChoice && (
                <label>
                  Arvekilde ved ukendt D
                  <select value={sourceChoice} onChange={(event) => setSourceChoice(event.target.value)}>
                    <option value="">Automatisk · laveste kendte D</option>
                    {candidates.map(({ item, definition }) => (
                      <option key={item.id} value={item.id}>
                        {springDisplayName(definition, assessmentPackage)} ·{' '}
                        {item.stability ?? 'Ikke vurderet'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                className="quiet"
                disabled={needsSourceChoice && !sourceChoice}
                onClick={() =>
                  save(
                    followAssessment(
                      workspace,
                      registration.id,
                      {
                        id: newEntityId,
                        now: () => new Date().toISOString(),
                        ...(context ? { inheritance: context } : {}),
                      },
                      sourceChoice || undefined,
                    ),
                  )
                }
              >
                Følg igen
              </button>
            </>
          )}
        </div>
        <fieldset disabled={!own}>
          <StabilityControl value={value} onChange={setValue} />
          <label>
            Vurderingsdato
            <input
              type="date"
              value={date}
              required={value !== null}
              disabled={value === null}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </fieldset>
        <label>
          Trænernote
          <textarea name="note" defaultValue={registration.note} maxLength={2000} />
        </label>
        {registration.reviewRequiredFor.length > 0 && (
          <p className="notice">
            Regelkrav er ændret. Kontrollér udførelsen; denne vurdering bekræfter kun holdets aktuelle
            kobling.
          </p>
        )}
        <p className="muted">
          Registreret: {formatStability(registration.stability)}
          {registration.assessedAt ? ` · ${registration.assessedAt}` : ''}
        </p>
      </fieldset>
    </ActionForm>
  );
}

function ReferenceSummary({
  workspace,
  references,
}: {
  workspace: Workspace;
  references: ReturnType<typeof planReferences>;
}) {
  if (!references.length) return null;
  const reserves = references.filter((item) => item.kind === 'reserve').length;
  const executing = references.length - reserves;
  return (
    <div className="reference-summary">
      <p>
        {executing} udførende {executing === 1 ? 'plads' : 'pladser'} og {reserves}{' '}
        {reserves === 1 ? 'reserveplads' : 'reservepladser'}. Referencerne bevares.
      </p>
      <ul>
        {references.map((item) => (
          <li key={item.entry.id}>
            {workspace.teams.find((team) => team.id === item.teamId)?.name} ·{' '}
            {item.discipline === 'tumbling' ? 'Bane' : 'Trampet'} · {item.scenarioName} ·{' '}
            {item.roundIndex + 1}. omgang · {item.kind === 'reserve' ? 'Reserve' : 'Udførende'}
          </li>
        ))}
      </ul>
    </div>
  );
}
