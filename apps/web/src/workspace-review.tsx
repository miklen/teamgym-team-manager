import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { MergeLocation, WorkspaceChange, MergeConflict, MergeSide } from '@teamgym/domain';
import { Icon } from './ui';
import { Dialog } from './components';
import { downloadDraft, workspaceSession } from './runtime';
import './workspace-review.css';

const labels: Record<string, string> = {
  id: 'Identitet',
  name: 'Navn',
  archived: 'Arkiveret',
  stability: 'Sikkerhed',
  assessedAt: 'Vurderingsdato',
  assessmentOrigin: 'Vurderingsophav',
  kind: 'Type',
  own: 'Egen vurdering',
  inherited: 'Arvet vurdering',
  sourceId: 'Arvekilde',
  sourceChoice: 'Valgt kilde',
  context: 'Valggrundlag',
  note: 'Note',
  athleteId: 'Gymnast',
  skillId: 'Spring',
  athleteSkillId: 'Valgt spring',
  role: 'Rolle',
  counting: 'Tællende',
  extra: 'Ekstra',
  entries: 'Deltagere',
  reserves: 'Reserver',
  rounds: 'Omgange',
  tumbling: 'Bane',
  trampet: 'Trampet',
  rhythm: 'Rytme',
  teamId: 'Hold',
  discriminator: 'Kendetegn',
  mixCategory: 'Mixkategori',
  girl: 'Pige',
  boy: 'Dreng',
  rulesetBinding: 'Regelgrundlag',
  rulesetId: 'Reglement',
  packageVersion: 'Pakkeversion',
  ageGroup: 'Aldersgruppe',
  teamType: 'Holdtype',
  bindingFingerprint: 'Planens regelgrundlag',
  reviewRequiredFor: 'Kræver revurdering',
  connectionConfirmation: 'Forbindelsesbekræftelse',
  executionIdentity: 'Præcis udførelse',
  confirmedAt: 'Bekræftet den',
  discipline: 'Disciplin',
  jump: 'Springudførelse',
  elements: 'Elementer',
  connection: 'Forbindelse',
  standard: 'Standard',
  custom: 'Egen forbindelse',
  transitions: 'Overgange',
  momentId: 'Rytmemoment',
  variant: 'Variant',
  family: 'Springfamilie',
  direction: 'Retning',
  rotationQuarterTurns: 'Kvartrotationer',
  twistsHalfTurns: 'Halve skruer',
  twistDistribution: 'Skruefordeling',
  bodyPositions: 'Kropspositioner',
  apparatus: 'Redskab',
  takeoff: 'Afsæt',
  landing: 'Landing',
  backward: 'Bagud',
  forward: 'Fremad',
  sideways: 'Sidelæns',
  tuck: 'Lukket',
  pike: 'Hoftebøjet',
  straight: 'Strakt',
  floor: 'Gulv',
  pegasus: 'Pegasus',
  feet: 'Fødder',
  hands: 'Hænder',
  'two-feet': 'To fødder',
  'one-foot': 'Én fod',
  sourceIdentity: 'Kildens udførelse',
  targetIdentity: 'Målets udførelse',
  targetId: 'Målregistrering',
  catalogId: 'Katalog',
  catalogVersion: 'Katalogversion',
  relationId: 'Accepteret relation',
};
function locationText(location: MergeLocation) {
  return [
    location.team,
    location.athlete,
    location.discipline && (labels[location.discipline] ?? location.discipline),
    location.skill,
    location.scenario,
    location.round && `${location.round}. omgang`,
  ]
    .filter(Boolean)
    .join(' · ');
}
function Value({ value, names }: { value: unknown; names: Map<string, string> }) {
  if (value === undefined) return <span className="muted">Findes ikke</span>;
  if (value === null) return <span className="muted">Ingen / ikke vurderet</span>;
  if (typeof value === 'object' && 'stability' in value && 'assessedAt' in value) {
    const assessment = value as {
      stability: number | null;
      assessedAt: string | null;
      assessmentOrigin?: { kind: string; sourceId?: string | null };
    };
    return (
      <div className="review-assessment">
        <div>
          <strong>{assessment.stability ?? '—'}</strong>
          <span>{assessment.stability === null ? 'Ikke vurderet' : 'af 5 · sikkerhed'}</span>
        </div>
        <p>
          {assessment.assessedAt
            ? new Intl.DateTimeFormat('da-DK', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
              }).format(new Date(assessment.assessedAt + 'T00:00:00Z'))
            : 'Ingen vurderingsdato'}
        </p>
        <small>
          {assessment.assessmentOrigin?.kind === 'inherited'
            ? 'Følger ' + (names.get(assessment.assessmentOrigin.sourceId ?? '') ?? 'en anden vurdering')
            : 'Egen vurdering'}
        </small>
      </div>
    );
  }
  if (typeof value === 'boolean') return <span>{value ? 'Ja' : 'Nej'}</span>;
  if (Array.isArray(value))
    return value.length ? (
      <ol>
        {value.map((item, i) => (
          <li key={i}>
            <Value value={item} names={names} />
          </li>
        ))}
      </ol>
    ) : (
      <span className="muted">Tom liste</span>
    );
  if (typeof value === 'object')
    return (
      <dl>
        {Object.entries(value)
          .filter(([key]) => !['id', 'updatedAt', 'recentOperations'].includes(key))
          .map(([key, item]) => (
            <div key={key}>
              <dt>{labels[key] ?? key}</dt>
              <dd>
                <Value value={item} names={names} />
              </dd>
            </div>
          ))}
      </dl>
    );
  let text = String(value);
  // Rækkefølgen bruger samlingsnøgler; vis scenariets navn i stedet for nøglens JSON.
  try {
    const key = JSON.parse(text) as unknown;
    if (Array.isArray(key) && key.length === 1 && typeof key[0] === 'string') text = key[0];
  } catch {
    /* Almindelig brugertekst. */
  }
  return <span>{names.get(text) ?? labels[text] ?? (value === '' ? 'Tom tekst' : text)}</span>;
}
const changeKind = (change: WorkspaceChange) =>
  change.kind === 'added' ? 'Tilføjet' : change.kind === 'removed' ? 'Fjernet' : 'Ændret';
const subjectName = (change: WorkspaceChange) =>
  change.path.at(-1) === 'name' &&
  typeof (change.source === 'local' ? change.local : change.remote) === 'string'
    ? String(change.source === 'local' ? change.local : change.remote)
    : (change.location.athlete ??
      change.location.scenario ??
      change.location.skill ??
      change.location.team ??
      'Fælles arbejdsrum');

function changeLabel(change: WorkspaceChange) {
  return change.location.label === 'Vurdering, dato og ophav' ? 'Vurdering' : change.location.label;
}
function ChangeRow({
  change,
  names,
  side,
}: {
  change: WorkspaceChange;
  names: Map<string, string>;
  side?: MergeSide;
}) {
  return (
    <section className="review-change">
      <h4 className="sr-only">
        {changeKind(change)} · {changeLabel(change)}
      </h4>
      <span className="review-change-kind">{changeKind(change)}</span>
      {side ? (
        <Value value={side === 'local' ? change.local : change.remote} names={names} />
      ) : (
        <div className="review-versions">
          {(
            [
              ['Før', change.before],
              ['Min udgave', change.local],
              ['Filens udgave', change.remote],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <h5>{label}</h5>
              <Value value={value} names={names} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
interface ReviewItem {
  id: string;
  changes: WorkspaceChange[];
  conflict?: MergeConflict;
  consequence?: boolean;
}

export function WorkspaceReview({ applied }: { applied: () => void }) {
  const data = useSyncExternalStore(workspaceSession.subscribe, workspaceSession.snapshot);
  const review = data.review;
  const [filter, setFilter] = useState('all');
  const [visibleUnresolved, setVisibleUnresolved] = useState(new Set<string>());
  const [team, setTeam] = useState('all');
  const [area, setArea] = useState('all');
  const [activeId, setActiveId] = useState('');
  const alert = useRef<HTMLParagraphElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      review?.status === 'stale' ||
      review?.status === 'error' ||
      (review?.result?.status === 'blocked' && !review.result.conflicts.length)
    )
      alert.current?.focus();
  }, [review?.status, review?.result?.status, review?.result?.conflicts.length]);
  if (!review) return null;
  const result = review.result;
  const unresolved = result?.conflicts.filter((conflict) => !review.choices[conflict.id]) ?? [];
  const conflictChanges = new Set(result?.conflicts.flatMap((conflict) => [...conflict.changeIds]) ?? []);
  const changes = new Map(result?.changes.map((change) => [change.id, change]) ?? []);
  const names = new Map<string, string>();
  function collect(value: unknown) {
    if (!value || typeof value !== 'object') return;
    if ('id' in value && typeof value.id === 'string' && 'name' in value)
      names.set(value.id, String(value.name));
    for (const child of Object.values(value)) collect(child);
  }
  collect(data.loaded?.workspace);
  collect(data.draft);
  for (const workspace of [data.loaded?.workspace, data.draft])
    if (workspace)
      for (const registration of workspace.athleteSkills) {
        const athlete = workspace.athletes.find((item) => item.id === registration.athleteId);
        const skill = workspace.skills.find((item) => item.id === registration.skillId);
        names.set(
          registration.id,
          (athlete?.name ?? 'Gymnast') +
            (athlete?.discriminator ? ' · ' + athlete.discriminator : '') +
            ' · ' +
            (skill?.name ?? 'Spring'),
        );
      }
  for (const change of result?.changes ?? []) {
    collect(change.before);
    collect(change.remote);
  }
  const items: ReviewItem[] = [
    ...(result?.conflicts.map((conflict) => ({
      id: conflict.id,
      conflict,
      changes: conflict.changeIds.map((id) => changes.get(id)!),
    })) ?? []),
    ...(result?.changes
      .filter((change) => !conflictChanges.has(change.id))
      .map((change) => ({ id: change.id, changes: [change] })) ?? []),
    ...(result?.consequences.map((change) => ({ id: change.id, changes: [change], consequence: true })) ??
      []),
  ];
  const visible = items.filter(
    (item) =>
      (filter === 'all' ||
        (filter === 'conflicts' && item.conflict) ||
        (filter === 'unresolved' && visibleUnresolved.has(item.id))) &&
      item.changes.some(
        (change) =>
          (team === 'all' || change.location.teamId === team) && (area === 'all' || change.path[0] === area),
      ),
  );
  const active = visible.find((item) => item.id === activeId) ?? visible[0];
  const selected = active?.conflict ? review.choices[active.id] : undefined;
  const teams = [
    ...new Map(
      result?.changes.flatMap((change) =>
        change.location.teamId
          ? [[change.location.teamId, change.location.team ?? 'Fjernet hold'] as const]
          : [],
      ),
    ).entries(),
  ];
  const remoteCount = result?.changes.filter((change) => change.source !== 'local').length ?? 0;
  const completedCount = (result?.conflicts.length ?? 0) - unresolved.length;
  function findUnresolved() {
    setVisibleUnresolved(new Set(unresolved.map((conflict) => conflict.id)));
    setFilter('unresolved');
    setTeam('all');
    setArea('all');
    setActiveId(unresolved[0]?.id ?? '');
    requestAnimationFrame(() =>
      detail.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus(),
    );
  }
  function nextUnresolved() {
    const next = unresolved.find((item) => item.id !== active?.id);
    if (next) {
      setFilter('all');
      setTeam('all');
      setArea('all');
      setActiveId(next.id);
      requestAnimationFrame(() => detail.current?.focus());
    }
  }
  function restartReview() {
    setFilter('all');
    setTeam('all');
    setArea('all');
    setActiveId('');
    void workspaceSession.beginReview();
  }
  return (
    <Dialog
      title="Gennemgå ændringer"
      className="workspace-review-dialog"
      wide
      close={() => workspaceSession.cancelReview()}
    >
      <div className="review-overview">
        <div className="review-overview-copy">
          <span className="review-eyebrow">FÆLLES ARBEJDSRUM</span>
          <p>
            {review.status === 'loading'
              ? 'Vi henter de seneste ændringer fra Drive.'
              : unresolved.length
                ? 'Vælg, hvad du vil beholde.'
                : result?.status === 'valid'
                  ? 'Klar til at samle dine ændringer.'
                  : 'Dine ændringer er bevaret.'}
          </p>
        </div>
        {result && (
          <div className="review-summary" aria-live="polite">
            <span>
              <strong>{remoteCount}</strong> ændringer i filen
            </span>
            <span className={unresolved.length ? 'review-needs-choice' : 'review-resolved'}>
              {unresolved.length ? (
                unresolved.length + ' mangler dit valg'
              ) : (
                <>
                  <Icon name="check" /> Ingen uafgjorte valg
                </>
              )}
            </span>
            {!!result.conflicts.length && (
              <span
                className="review-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={result.conflicts.length}
                aria-valuenow={completedCount}
                aria-label={completedCount + ' af ' + result.conflicts.length + ' valg truffet'}
              >
                <span style={{ width: (completedCount / result.conflicts.length) * 100 + '%' }} />
              </span>
            )}
          </div>
        )}
      </div>
      {review.message && (
        <p
          ref={alert}
          tabIndex={-1}
          role={review.status === 'loading' || review.status === 'applying' ? 'status' : 'alert'}
          className={
            'review-message ' +
            (review.status === 'loading' || review.status === 'applying' ? 'review-message-loading' : '')
          }
        >
          {review.message}
        </p>
      )}
      {result && (
        <div className="review-filters">
          <label>
            Vis
            <select
              value={filter}
              onChange={(e) => {
                setVisibleUnresolved(new Set(unresolved.map((conflict) => conflict.id)));
                setFilter(e.target.value);
              }}
            >
              <option value="all">Alle ændringer</option>
              <option value="conflicts">Kræver et valg</option>
              <option value="unresolved">Mangler mit valg</option>
            </select>
          </label>
          <label>
            Hold
            <select value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="all">Alle hold</option>
              {teams.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Område
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="all">Alle områder</option>
              {[
                ['teams', 'Hold'],
                ['athletes', 'Gymnaster'],
                ['skills', 'Spring'],
                ['athleteSkills', 'Vurderinger'],
                ['plans', 'Planer'],
                ['inheritanceRelations', 'Arv'],
                ['inheritanceExclusions', 'Fravalg af arv'],
              ].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {!!unresolved.length && (
            <button className="quiet review-find" onClick={findUnresolved}>
              Find uafgjorte konflikter <span aria-hidden="true">↓</span>
            </button>
          )}
        </div>
      )}
      <div className="review-workspace">
        {result ? (
          <>
            <nav
              className="review-index"
              aria-label="Ændringer til gennemgang"
              onKeyDown={(event) => {
                const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('.review-item')];
                const current = buttons.indexOf(event.target as HTMLButtonElement);
                if (current < 0) return;
                const next =
                  event.key === 'ArrowDown'
                    ? Math.min(current + 1, buttons.length - 1)
                    : event.key === 'ArrowUp'
                      ? Math.max(current - 1, 0)
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? buttons.length - 1
                          : -1;
                if (next < 0) return;
                event.preventDefault();
                setActiveId(visible[next]!.id);
                requestAnimationFrame(() => buttons[next]?.focus());
              }}
            >
              <div className="review-index-heading">
                <span>Ændringer</span>
                <span>{visible.length}</span>
              </div>
              {!visible.length && <p className="review-empty-list">Ingen ændringer passer til filtrene.</p>}
              {visible.map((item) => (
                <button
                  key={item.id}
                  className={
                    'review-item ' + (item.conflict && !review.choices[item.id] ? 'review-item-pending' : '')
                  }
                  aria-current={active?.id === item.id ? 'true' : undefined}
                  tabIndex={active?.id === item.id ? 0 : -1}
                  onClick={() => setActiveId(item.id)}
                >
                  <span className="review-item-mark" aria-hidden="true">
                    {item.conflict && !review.choices[item.id] ? (
                      '!'
                    ) : (
                      <Icon name={item.conflict ? 'check' : 'arrow'} />
                    )}
                  </span>
                  <span className="review-item-text">
                    <strong>{subjectName(item.changes[0]!)}</strong>
                    <span>
                      {item.consequence
                        ? 'Følgevirkning'
                        : item.changes.length > 1
                          ? item.changes.length + ' sammenhængende ændringer'
                          : changeLabel(item.changes[0]!)}
                    </span>
                  </span>
                  <span className="review-item-status">
                    {item.conflict
                      ? review.choices[item.id]
                        ? 'Valgt'
                        : 'Vælg'
                      : changeKind(item.changes[0]!)}
                  </span>
                </button>
              ))}
            </nav>
            <div className="review-detail" ref={detail} tabIndex={-1} key={active?.id ?? 'empty'}>
              {active ? (
                <>
                  <div className="review-detail-heading">
                    <span className="review-eyebrow">
                      {active.conflict
                        ? selected
                          ? 'DU HAR VALGT'
                          : 'KRÆVER DIT VALG'
                        : active.consequence
                          ? 'FØLGEVIRKNING'
                          : 'SAMLES AUTOMATISK'}
                    </span>
                    <h3>{subjectName(active.changes[0]!)}</h3>
                    {locationText(active.changes[0]!.location) !== subjectName(active.changes[0]!) && (
                      <p className="review-location">{locationText(active.changes[0]!.location)}</p>
                    )}
                    <p>
                      {active.changes.length > 1
                        ? 'Disse ændringer hører sammen og vælges som én helhed.'
                        : changeLabel(active.changes[0]!)}
                    </p>
                  </div>
                  {active.conflict ? (
                    <div className="review-conflicts">
                      <fieldset data-unresolved={!selected} disabled={review.status !== 'ready'}>
                        <legend className="sr-only">Vælg den udgave, du vil beholde</legend>
                        <div className="review-choice">
                          {(['local', 'remote'] as const).map((side) => (
                            <label
                              key={side}
                              className={'review-option ' + (selected === side ? 'is-selected' : '')}
                            >
                              <span className="review-option-heading">
                                <input
                                  type="radio"
                                  aria-label={side === 'local' ? 'Min udgave' : 'Filens udgave'}
                                  name={active.id}
                                  value={side}
                                  checked={selected === side}
                                  onChange={() =>
                                    workspaceSession.chooseReview({ ...review.choices, [active.id]: side })
                                  }
                                />
                                <span>{side === 'local' ? 'Min udgave' : 'Filens udgave'}</span>
                                {selected === side && <Icon name="check" />}
                              </span>
                              <span className="review-option-content">
                                {active.changes.map((change) => (
                                  <span className="review-option-field" key={change.id}>
                                    <span className="review-field-label">{changeLabel(change)}</span>
                                    {active.changes.length > 1 && (
                                      <span className="review-location">{locationText(change.location)}</span>
                                    )}
                                    <Value
                                      value={side === 'local' ? change.local : change.remote}
                                      names={names}
                                    />
                                  </span>
                                ))}
                              </span>
                              <span className="review-option-footer">
                                {selected === side
                                  ? 'Denne udgave beholdes'
                                  : side === 'local'
                                    ? 'Behold min udgave'
                                    : 'Behold filens udgave'}
                              </span>
                            </label>
                          ))}
                        </div>
                        <details className="review-base" open>
                          <summary>Før ændringerne</summary>
                          {active.changes.map((change) => (
                            <div key={change.id}>
                              <span className="review-field-label">{changeLabel(change)}</span>
                              <Value value={change.before} names={names} />
                            </div>
                          ))}
                        </details>
                        <p className="review-reason">{active.conflict.reason}</p>
                        {selected && !!unresolved.length && (
                          <button className="quiet review-next" onClick={nextUnresolved}>
                            Næste valg <Icon name="arrow" />
                          </button>
                        )}
                      </fieldset>
                    </div>
                  ) : (
                    <>
                      <p className="review-auto-note" role="status">
                        <Icon name="check" />
                        {active.consequence
                          ? 'Vurderingen følger automatisk de valgte ændringer.'
                          : 'Disse ændringer passer sammen.'}
                      </p>
                      {active.changes.map((change) => (
                        <ChangeRow key={change.id} change={change} names={names} />
                      ))}
                    </>
                  )}
                </>
              ) : (
                <div className="review-empty">
                  <span className="review-empty-icon">
                    <Icon name="check" />
                  </span>
                  <h3>{items.length ? 'Ingen ændringer i denne visning' : 'Alt er ajour'}</h3>
                  <p>
                    {items.length
                      ? 'Vælg et andet filter for at se flere ændringer.'
                      : 'Din visning og filen på Drive er ens.'}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="review-empty">
            <span className={'review-empty-icon ' + (review.status === 'loading' ? 'is-loading' : '')}>
              <Icon name="cloud" />
            </span>
            <h3>{review.status === 'loading' ? 'Henter ændringer…' : 'Gennemgangen kunne ikke åbnes'}</h3>
            <p>
              {review.status === 'loading'
                ? 'Dine egne ændringer bliver her imens.'
                : 'Prøv igen, eller download en kopi af dine ændringer.'}
            </p>
          </div>
        )}
      </div>
      {result?.status === 'blocked' && !unresolved.length && (
        <p role="alert" ref={review.message ? undefined : alert} tabIndex={-1} className="review-message">
          {result.diagnostics.join(' ')}
        </p>
      )}
      <div className="review-actions" role="group" aria-label="Afslut gennemgang">
        <div className="review-secondary-actions">
          <button className="quiet" onClick={() => workspaceSession.cancelReview()}>
            Annuller
          </button>
          <button className="quiet review-download" onClick={downloadDraft}>
            Download en kopi
          </button>
        </div>
        <div className="review-primary-action">
          <span>
            {!data.loaded?.metadata.writable
              ? 'Du har kun læseadgang'
              : unresolved.length
                ? 'Træf alle valg for at fortsætte'
                : 'Du gemmer på Drive bagefter'}
          </span>
          {review.status === 'stale' || review.status === 'error' ? (
            <button onClick={restartReview}>Gennemgå igen</button>
          ) : (
            <button
              disabled={
                review.status !== 'ready' || result?.status !== 'valid' || !data.loaded?.metadata.writable
              }
              onClick={() =>
                void workspaceSession.applyReview().then((success) => {
                  if (success) applied();
                })
              }
            >
              Brug disse ændringer <Icon name="arrow" />
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
