import { useState } from 'react';
import {
  confirmRuleReview,
  createAthlete,
  formatStability,
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
  points,
  SkillBreakdown,
  SourceLinks,
  StabilityControl,
  statusText,
} from './components';
import { registry } from './rules';
import { SkillEditor, variantText } from './skill-editor';

export interface DataProps {
  workspace: Workspace;
  change: (workspace: Workspace) => void;
  writable: boolean;
}
export function Athletes({
  workspace,
  change,
  writable,
  selectedTeamId,
}: DataProps & { selectedTeamId: string }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(selectedTeamId || 'all');
  const [archived, setArchivedFilter] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const athletes = workspace.athletes.filter(
    (athlete) =>
      athlete.archived === archived &&
      (filter === 'all' || (filter === 'none' ? athlete.teamId === null : athlete.teamId === filter)) &&
      `${athlete.name} ${athlete.discriminator}`
        .toLocaleLowerCase('da-DK')
        .includes(search.toLocaleLowerCase('da-DK')),
  );
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">Kartotek · {athletes.length} gymnaster</p>
          <h1>Gymnaster</h1>
        </div>
        <button disabled={!writable} onClick={() => setCreating(true)}>
          Tilføj gymnast
        </button>
      </div>
      <div className="toolbar">
        <label>
          Søg gymnast
          <input
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
        <label className="check">
          <input
            type="checkbox"
            checked={archived}
            onChange={(event) => setArchivedFilter(event.target.checked)}
          />
          Vis arkiverede
        </label>
      </div>
      {!athletes.length ? (
        <Empty>Ingen gymnaster passer til filteret. Tilføj en gymnast, eller justér filtrene.</Empty>
      ) : (
        <ul className="entity-list">
          {athletes.map((athlete) => (
            <li key={athlete.id}>
              <button className="entity-link" onClick={() => setSelected(athlete.id)}>
                <span>
                  <strong>{athlete.name}</strong>
                  <small>
                    {athlete.discriminator || 'Intet kendetegn'} ·{' '}
                    {workspace.teams.find((team) => team.id === athlete.teamId)?.name ?? 'Uden hold'}
                  </small>
                </span>
                <span>
                  {
                    workspace.athleteSkills.filter((item) => item.athleteId === athlete.id && !item.archived)
                      .length
                  }{' '}
                  færdigheder <b aria-hidden="true">↗</b>
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
          Færdigheder bevares ved flytning. Eksisterende omgangspladser bliver stående med en advarsel.
          Rytmeoverblikket følger straks medlemsændringen i kladden.
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
}: DataProps & { athleteId: string; close: () => void; initialRegistrationId?: string | undefined }) {
  const athlete = workspace.athletes.find((item) => item.id === athleteId)!;
  const team = workspace.teams.find((item) => item.id === athlete.teamId);
  const resolved = team && registry.resolve(team.rulesetBinding);
  const rulePackage = resolved?.status === 'known' ? resolved.rulePackage : null;
  const [mode, setMode] = useState<'list' | 'profile' | 'new' | 'execution'>('list');
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(
    initialRegistrationId ?? null,
  );
  const [showArchived, setShowArchived] = useState(false);
  const registration = workspace.athleteSkills.find((item) => item.id === selectedRegistration);
  const registrations = workspace.athleteSkills.filter(
    (item) => item.athleteId === athleteId && item.archived === showArchived,
  );
  const chosenPackage = rulePackage ?? (athlete.teamId === null ? registry.list()[0]! : null);
  return (
    <Dialog wide title={athlete.name} close={close}>
      <div className="inspector-meta">
        {athlete.discriminator} · {team?.name ?? 'Uden hold'}
        {athlete.archived ? ' · Arkiveret' : ''}
      </div>
      {mode === 'profile' ? (
        <>
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
                setShowArchived(workspace.athleteSkills.find((item) => item.id === id)!.archived);
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
            <button disabled={!writable || athlete.archived} onClick={() => setMode('profile')}>
              Redigér gymnast
            </button>
            <button
              className="quiet"
              disabled={!writable}
              onClick={() => {
                if (
                  athlete.archived ||
                  window.confirm(
                    'Arkivér gymnasten? Færdigheder bevares, og valgte omgangspladser markeres utilgængelige indtil gennemgang.',
                  )
                )
                  change(setArchived(workspace, 'athletes', athleteId, !athlete.archived));
              }}
            >
              {athlete.archived ? 'Genaktivér gymnast' : 'Arkivér gymnast'}
            </button>
            <button disabled={!writable || athlete.archived || !chosenPackage} onClick={() => setMode('new')}>
              Tilføj færdighed
            </button>
          </div>
          {!chosenPackage && (
            <p className="notice">
              Holdets præcise regelpakke er ikke installeret. Kunnen bevares; regelkoblingen kan ikke vurderes
              her.
            </p>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            Vis arkiverede færdigheder
          </label>
          {(['tumbling', 'trampet', 'rhythm'] as const).map((discipline) => (
            <section key={discipline} className="skill-section">
              <h3>
                {discipline === 'tumbling'
                  ? 'Bane · komplette serier'
                  : discipline === 'trampet'
                    ? 'Trampet · komplette spring'
                    : 'Rytme · individuelle momenter'}
              </h3>
              {registrations
                .filter(
                  (item) =>
                    workspace.skills.find((skill) => skill.id === item.skillId)?.discipline === discipline,
                )
                .map((item) => {
                  const skill = workspace.skills.find((skill) => skill.id === item.skillId)!;
                  const evaluation =
                    skill.discipline !== 'rhythm' ? chosenPackage?.evaluateSkill(skill, item) : null;
                  const rhythm = skill.discipline === 'rhythm' ? chosenPackage?.bindRhythm(skill) : null;
                  return (
                    <div className="skill-row" key={item.id}>
                      <button
                        className="entity-link"
                        onClick={() =>
                          setSelectedRegistration(selectedRegistration === item.id ? null : item.id)
                        }
                      >
                        <span>
                          <strong>{skill.name}</strong>
                          <small>
                            {rhythm
                              ? `${rhythm.moment?.officialCode ?? 'Ukendt kode'} · ${variantText(rhythm.variant)}`
                              : evaluation
                                ? `${evaluation.connection === 'unverified' ? 'Forbindelse kræver bekræftelse · ' : ''}D: ${evaluation.difficulty.value ? points(evaluation.difficulty.value) : statusText[evaluation.difficulty.status]}`
                                : 'Regelkobling uafklaret'}
                          </small>
                        </span>
                        <span>{item.stability === null ? 'Ikke vurderet' : `${item.stability}/5`}</span>
                      </button>
                      {selectedRegistration === item.id && (
                        <>
                          <Assessment
                            workspace={workspace}
                            registration={item}
                            team={team}
                            writable={writable}
                            save={change}
                          />
                          {evaluation && (
                            <details>
                              <summary>Beregningsgrundlag</summary>
                              <Decision value={evaluation.difficulty} />
                              <SkillBreakdown evaluation={evaluation} />
                              <SourceLinks
                                sources={evaluation.explanation.sources}
                                rulePackage={chosenPackage!}
                              />
                              {evaluation.explanation.notes.map((note) => (
                                <p key={note}>{note}</p>
                              ))}
                            </details>
                          )}
                          <div className="actions">
                            <button
                              className="quiet"
                              disabled={!writable || !chosenPackage || athlete.archived || item.archived}
                              onClick={() => setMode('execution')}
                            >
                              Redigér præcis udførelse
                            </button>
                            <button
                              className="quiet"
                              disabled={!writable}
                              onClick={() =>
                                change(setArchived(workspace, 'athleteSkills', item.id, !item.archived))
                              }
                            >
                              {item.archived ? 'Genaktivér færdighed' : 'Arkivér færdighed'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </section>
          ))}
          {!registrations.length && (
            <Empty>
              Ingen {showArchived ? 'arkiverede ' : ''}færdigheder. Registrér komplette udførelser; stabilitet
              sættes særskilt.
            </Empty>
          )}
        </>
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
}: {
  workspace: Workspace;
  registration: AthleteSkill;
  team: Team | undefined;
  writable: boolean;
  save: (workspace: Workspace) => void;
}) {
  const [value, setValue] = useState<Stability | null>(registration.stability);
  const [date, setDate] = useState(registration.assessedAt ?? new Date().toISOString().slice(0, 10));
  return (
    <ActionForm
      disabled={!writable || registration.archived}
      submit={(data) => {
        const installed = registry.list()[0]!;
        const binding = team?.rulesetBinding ?? {
          rulesetId: installed.manifest.rulesetId,
          packageVersion: installed.manifest.packageVersion,
          ageGroup: installed.profiles[0]!.ageGroup,
          teamType: installed.profiles[0]!.teamType,
        };
        save(
          confirmRuleReview(workspace, registration.id, binding, {
            stability: value,
            assessedAt: value === null ? null : date,
            note: String(data.get('note')),
          }),
        );
      }}
      label="Opdatér vurdering"
    >
      <fieldset disabled={!writable || registration.archived}>
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
