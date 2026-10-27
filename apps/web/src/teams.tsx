import { useState } from 'react';
import { createTeam, renameTeam } from '@teamgym/domain';
import type { RulesetBinding } from '@teamgym/domain';
import { applyVersionChange, previewVersionChange } from '@teamgym/rules';
import { reconcileVersionPreview } from './inheritance-context';
import type { VersionChangePreview } from '@teamgym/rules';
import type { DataProps } from './athletes';
import { ActionForm, Decision, Dialog, Empty, points, SourceLinks, statusText } from './components';
import { registry } from './rules';
import { Avatar, Icon } from './ui';

export function Teams({
  workspace,
  change,
  writable,
  select,
}: DataProps & { select: (teamId: string) => void }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const teams = workspace.teams.filter((team) => !team.archived);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Hold</h1>
          <p className="page-description">Vælg et hold, og fortsæt planlægningen.</p>
        </div>
        <button disabled={!writable} onClick={() => setCreating(true)}>
          <Icon name="plus" />
          Opret hold
        </button>
      </div>
      {!teams.length ? (
        <Empty>Opret det første hold. Hvert hold får sit eget reglement og seks omgange.</Empty>
      ) : (
        <ul className="entity-list team-list">
          {teams.map((team) => {
            const resolved = registry.resolve(team.rulesetBinding);
            return (
              <li key={team.id}>
                <button className="entity-link" onClick={() => select(team.id)}>
                  <Avatar name={team.name} team />
                  <span className="entity-copy">
                    <strong>{team.name}</strong>
                    <small>
                      {resolved.status === 'known'
                        ? `${resolved.profile.label} · ${resolved.rulePackage.manifest.name} ${team.rulesetBinding.packageVersion}`
                        : `Ukendt regelpakke ${team.rulesetBinding.rulesetId}@${team.rulesetBinding.packageVersion}`}
                    </small>
                  </span>
                  <span className="entity-stat">
                    {
                      workspace.athletes.filter((athlete) => athlete.teamId === team.id && !athlete.archived)
                        .length
                    }{' '}
                    gymnaster <Icon name="arrow" />
                  </span>
                </button>
                <button
                  className="quiet"
                  aria-label={`Redigér hold ${team.name}`}
                  disabled={!writable}
                  onClick={() => setEditing(team.id)}
                >
                  Redigér
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {creating && (
        <Dialog title="Opret hold" close={() => setCreating(false)}>
          <NewTeam
            submit={(name, binding) => {
              change(createTeam(workspace, name, binding));
              setCreating(false);
            }}
          />
        </Dialog>
      )}
      {editing && (
        <Dialog title="Redigér hold" close={() => setEditing(null)}>
          <ActionForm
            submit={(data) => {
              change(renameTeam(workspace, editing, String(data.get('name')).trim()));
              setEditing(null);
            }}
          >
            <label>
              Holdnavn
              <input
                name="name"
                required
                maxLength={200}
                defaultValue={workspace.teams.find((team) => team.id === editing)!.name}
              />
            </label>
          </ActionForm>
          <p className="muted">Reglement og profil ændres med forhåndsvisning på holdets reglementside.</p>
        </Dialog>
      )}
    </>
  );
}
function NewTeam({ submit }: { submit: (name: string, binding: RulesetBinding) => void }) {
  const packages = registry.list();
  const [packageKey, setPackage] = useState(
    `${packages[0]!.manifest.rulesetId}@${packages[0]!.manifest.packageVersion}`,
  );
  const selected = packages.find(
    (item) => `${item.manifest.rulesetId}@${item.manifest.packageVersion}` === packageKey,
  )!;
  return (
    <ActionForm
      submit={(data) => {
        const profile = selected.profiles.find(
          (item) => `${item.ageGroup}:${item.teamType}` === data.get('profile'),
        )!;
        submit(String(data.get('name')).trim(), {
          rulesetId: selected.manifest.rulesetId,
          packageVersion: selected.manifest.packageVersion,
          ageGroup: profile.ageGroup,
          teamType: profile.teamType,
        });
      }}
    >
      <label>
        Holdnavn
        <input name="name" required maxLength={200} />
      </label>
      <label>
        Regelpakke
        <select value={packageKey} onChange={(event) => setPackage(event.target.value)}>
          {packages.map((item) => (
            <option
              key={item.manifest.packageVersion}
              value={`${item.manifest.rulesetId}@${item.manifest.packageVersion}`}
            >
              {item.manifest.name} · {item.manifest.packageVersion}
            </option>
          ))}
        </select>
      </label>
      <label>
        Holdprofil
        <select key={packageKey} name="profile" defaultValue="junior:girls">
          {selected.profiles.map((item) => (
            <option key={`${item.ageGroup}:${item.teamType}`} value={`${item.ageGroup}:${item.teamType}`}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </ActionForm>
  );
}

export function RulesPage({ workspace, change, writable, teamId }: DataProps & { teamId: string }) {
  const team = workspace.teams.find((item) => item.id === teamId)!;
  const resolved = registry.resolve(team.rulesetBinding);
  const packages = registry.list();
  const [target, setTarget] = useState(
    `${team.rulesetBinding.rulesetId}@${team.rulesetBinding.packageVersion}`,
  );
  const selected = packages.find(
    (item) => `${item.manifest.rulesetId}@${item.manifest.packageVersion}` === target,
  );
  const [preview, setPreview] = useState<VersionChangePreview | null>(null);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Reglement</h1>
          <p className="page-description">{team.name}. Regelpakke, profil og kildegrundlag.</p>
        </div>
      </div>
      <p>
        Aktuelt:{' '}
        <strong>
          {team.rulesetBinding.rulesetId}@{team.rulesetBinding.packageVersion}
        </strong>{' '}
        ·{' '}
        {resolved.status === 'known'
          ? resolved.profile.label
          : `${team.rulesetBinding.ageGroup}/${team.rulesetBinding.teamType} · Ikke installeret`}
      </p>
      {resolved.status !== 'known' && (
        <p className="notice">
          Bindingen bevares præcist. Installér den krævede pakke for at beregne eller sammenligne; andre hold
          med kendte pakker kan fortsat bruges.
        </p>
      )}
      <section className="rules-settings">
        <h2>Skift pakke eller profil</h2>
        <ActionForm
          disabled={!writable || resolved.status !== 'known'}
          label="Vis før og efter"
          submit={(data) => {
            if (!selected) throw new Error('Vælg en installeret pakke.');
            const profile = selected.profiles.find(
              (item) => `${item.ageGroup}:${item.teamType}` === data.get('profile'),
            )!;
            setPreview(
              reconcileVersionPreview(
                previewVersionChange(
                  workspace,
                  teamId,
                  {
                    rulesetId: selected.manifest.rulesetId,
                    packageVersion: selected.manifest.packageVersion,
                    ageGroup: profile.ageGroup,
                    teamType: profile.teamType,
                  },
                  registry,
                ),
              ),
            );
          }}
        >
          <fieldset disabled={!writable || resolved.status !== 'known'}>
            <label>
              Installeret regelpakke
              <select value={target} onChange={(event) => setTarget(event.target.value)}>
                {!selected && <option value={target}>{target} · Ikke installeret</option>}
                {packages.map((item) => (
                  <option
                    key={`${item.manifest.rulesetId}@${item.manifest.packageVersion}`}
                    value={`${item.manifest.rulesetId}@${item.manifest.packageVersion}`}
                  >
                    {item.manifest.name} · {item.manifest.packageVersion}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Holdprofil
              <select
                name="profile"
                key={target}
                defaultValue={`${team.rulesetBinding.ageGroup}:${team.rulesetBinding.teamType}`}
              >
                {selected?.profiles.map((item) => (
                  <option
                    key={`${item.ageGroup}:${item.teamType}`}
                    value={`${item.ageGroup}:${item.teamType}`}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        </ActionForm>
      </section>
      {resolved.status === 'known' && (
        <>
          <section>
            <h2>Kilder og version</h2>
            <p>
              {resolved.rulePackage.manifest.officialEdition} · {resolved.rulePackage.manifest.season}
            </p>
            <p>{resolved.rulePackage.manifest.changeDescription}</p>
            <ul className="source-list">
              {resolved.rulePackage.manifest.sources.map((source) => (
                <li key={source.id}>
                  <SourceLinks
                    rulePackage={resolved.rulePackage}
                    sources={[
                      {
                        sourceId: source.id,
                        section:
                          (
                            {
                              H: 'Bedømmelsesreglement',
                              'A1.1': 'Rytme · oversigt over sværheder',
                              A3: 'Bane · basisværdier',
                              A4: 'Trampet · basisværdier',
                              A5: 'Genkendelse af elementer',
                              A6: 'Generelle fejl og fradrag',
                            } as Record<string, string>
                          )[source.id] ?? source.edition,
                      },
                    ]}
                  />
                  <a href={source.officialUrl} target="_blank" rel="noreferrer">
                    Officiel kilde
                  </a>
                  <details className="source-details">
                    <summary>Versionsdetaljer</summary>
                    <small>{source.edition}</small>
                    <small>SHA-256: {source.sha256}</small>
                  </details>
                </li>
              ))}
            </ul>
            <details>
              <summary>Algoritmeversioner</summary>
              <dl>
                {Object.entries(resolved.rulePackage.manifest.algorithms).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </section>
          <section>
            <h2>Kendt tvivl</h2>
            {resolved.rulePackage.knownIssues.map((issue) => (
              <details key={issue.id}>
                <summary>
                  {issue.id} · {issue.title}
                </summary>
                <p>{issue.detail}</p>
                <SourceLinks sources={issue.sources} rulePackage={resolved.rulePackage} />
              </details>
            ))}
          </section>
        </>
      )}
      {preview && (
        <Dialog wide title="Før og efter regelskift" close={() => setPreview(null)}>
          <p>
            Kun {team.name} ændres. Gymnaster og færdigheder bevares. {preview.reviews.length} vurderinger
            kræver gennemgang.
          </p>
          {(['tumbling', 'trampet'] as const).flatMap((discipline) =>
            preview.before[discipline].map((before, index) => {
              const after = preview.after[discipline][index]!;
              return (
                <section key={before.scenarioId}>
                  <h3>
                    {discipline === 'tumbling' ? 'Bane' : 'Trampet'} · {before.name}
                  </h3>
                  <div className="comparison">
                    <div>
                      Før · D <Decision value={before.evaluation.difficulty} />
                      <p>C {points(before.evaluation.composition.panel)}</p>
                    </div>
                    <div>
                      Efter · D <Decision value={after.evaluation.difficulty} />
                      <p>C {points(after.evaluation.composition.panel)}</p>
                    </div>
                  </div>
                  {before.evaluation.rounds.flatMap((round, roundIndex) =>
                    round.reserves.map((reserve, reserveIndex) => {
                      const next = after.evaluation.rounds[roundIndex]!.reserves[reserveIndex]!;
                      return (
                        <p key={reserve.entry.id}>
                          {roundIndex + 1}. omgang · {reserveIndex + 1}. reserve · {reserve.athleteName}: D{' '}
                          {points(reserve.originalD.value)} → {points(next.originalD.value)} ·{' '}
                          {statusText[reserve.status]} → {statusText[next.status]}
                        </p>
                      );
                    }),
                  )}
                </section>
              );
            }),
          )}
          <p>
            Fælles rytmemomenter: {preview.before.rhythm.filter((row) => row.summary.common).length} →{' '}
            {preview.after.rhythm.filter((row) => row.summary.common).length}
          </p>
          <details>
            <summary>Anvendelighed pr. registrering</summary>
            <ul>
              {preview.applicability.map((item) => (
                <li key={item.registrationId}>
                  {
                    workspace.athletes.find(
                      (athlete) =>
                        athlete.id ===
                        workspace.athleteSkills.find((skill) => skill.id === item.registrationId)?.athleteId,
                    )?.name
                  }
                  : {statusText[item.before as keyof typeof statusText] ?? item.before} →{' '}
                  {statusText[item.after as keyof typeof statusText] ?? item.after}
                </li>
              ))}
            </ul>
          </details>
          <ActionForm
            submit={() => {
              change(applyVersionChange(workspace, preview));
              setPreview(null);
            }}
            label="Opdater"
          >
            <p className="muted">Annullering ændrer ingen data. Gem derefter arbejdsrummet på Drive.</p>
          </ActionForm>
          <button className="quiet" onClick={() => setPreview(null)}>
            Annuller
          </button>
        </Dialog>
      )}
    </>
  );
}
