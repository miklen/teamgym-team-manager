import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SpringDiscipline, Workspace } from '@teamgym/domain';
import { Empty, points } from './components';
import { registry } from './rules';
import { stabilityGroup, teamProfile } from './team-profile-model';
import type { FocusPoint, ProfileLine, ProfileRow, TeamProfile } from './team-profile-model';
import './team-profile.css';

const disciplineNames: Record<SpringDiscipline, string> = { tumbling: 'Bane', trampet: 'Trampet' };

function statusLabel(row: ProfileRow): string {
  switch (row.status) {
    case 'ready':
      return 'Klar';
    case 'fragile':
      return 'Skrøbelig · ingen margin';
    case 'unassessed':
      return `Mangler vurdering · ${row.unassessed}`;
    case 'unstable':
      return `Ustabil · ${row.low} ${row.low === 1 ? 'lav' : 'lave'}`;
    case 'close':
      return 'Tæt på · mangler 1';
    default:
      return '';
  }
}

function statusSentence(row: ProfileRow, n: number): string {
  switch (row.status) {
    case 'ready':
      return `${row.safe} er sikre – mindst én mere end de ${n}, en holdomgang kræver.`;
    case 'fragile':
      return `Præcis ${n} er sikre. Der er ingen margin, hvis én mangler.`;
    case 'unassessed':
      return `${row.can} kan springet, ${row.safe} er sikre, og ${row.unassessed} er ikke vurderet endnu.`;
    case 'unstable':
      return `${row.can} kan springet, men kun ${row.safe} er sikre. ${row.low} har lav sikkerhed.`;
    case 'close':
      return `${row.can} kan springet. Der mangler 1 for at nå ${n}.`;
    default:
      return `${row.can} kan springet. En holdomgang kræver ${n}.`;
  }
}

function rowDescription(row: ProfileRow): string {
  const status = statusLabel(row);
  return [
    row.name,
    `D ${points(row.difficulty)}`,
    `${row.can} kan`,
    `${row.safe} sikre`,
    `${row.low} lave`,
    `${row.unassessed} ikke vurderet`,
    ...(status ? [status] : []),
  ].join(', ');
}

const lineId = (index: number) => `profil-linje-${index}`;
const initials = (value: string) =>
  value
    .split(/\s+/)
    .filter((part) => /\p{L}/u.test(part[0] ?? ''))
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function DotBand({ row, profile, highlight }: { row: ProfileRow; profile: TeamProfile; highlight: string | null }) {
  const slots = Array.from({ length: profile.cap }, (_, index) => {
    const athlete = row.athletes[index];
    if (athlete)
      return (
        <i
          key={index}
          className={`dot dot-${stabilityGroup(athlete.stability)}${highlight === athlete.athleteId ? ' is-highlight' : ''}`}
          style={{ '--i': index } as CSSProperties}
        />
      );
    return (
      <i
        key={index}
        className={index < profile.n ? 'dot dot-empty' : 'dot dot-none'}
        style={{ '--i': index } as CSSProperties}
      />
    );
  });
  return (
    <span className={`dot-band${highlight ? ' is-highlighting' : ''}`} aria-hidden="true">
      {slots.slice(0, profile.n)}
      <b className="n-line" />
      {slots.slice(profile.n)}
      <span className="dot-overflow">{row.can > profile.cap ? `+${row.can - profile.cap}` : ''}</span>
    </span>
  );
}

function Row({
  row,
  profile,
  highlight,
  index,
  surpassed,
  active,
  pulsing,
  open,
}: {
  row: ProfileRow;
  profile: TeamProfile;
  highlight: string | null;
  index: number;
  surpassed: boolean;
  active: boolean;
  pulsing: boolean;
  open: (row: ProfileRow, button: HTMLButtonElement) => void;
}) {
  const involved = !highlight || row.athletes.some((athlete) => athlete.athleteId === highlight);
  return (
    <li
      className={[
        'profile-row',
        `status-${row.status ?? 'muted'}`,
        surpassed && 'is-surpassed',
        active && 'is-active',
        pulsing && 'is-pulsing',
        highlight && !involved && 'is-uninvolved',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--row': index } as CSSProperties}
    >
      <button
        type="button"
        data-identity={row.identity}
        aria-label={rowDescription(row)}
        aria-expanded={active}
        onClick={(event) => open(row, event.currentTarget)}
      >
        <span className="row-name">{row.name}</span>
        <span className="row-d">{points(row.difficulty)}</span>
        <DotBand row={row} profile={profile} highlight={highlight} />
        <span className="row-status">
          {row.status && row.status !== 'ready' && row.status !== 'close' && (
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 1 9.2 8.6H.8Z" />
            </svg>
          )}
          {statusLabel(row)}
        </span>
      </button>
    </li>
  );
}

function Waterline({
  profile,
  highlight,
  selected,
  open,
}: {
  profile: TeamProfile;
  highlight: string | null;
  selected: string | null;
  open: (row: ProfileRow) => void;
}) {
  const level = profile.level.tops[0]?.identity;
  const height = (count: number) => Math.min(count, profile.cap) / profile.cap;
  const shown = profile.lines.flatMap((line) => line.visible);
  const carried = shown.filter((row) => row.can >= profile.n).length;
  return (
    <section className="waterline" aria-labelledby="vandstand-titel">
      <header>
        <span className="summary-label" id="vandstand-titel">
          Vandstand
        </span>
        <p>
          <strong>{carried}</strong> af {shown.length} spring rager over vandlinjen og kan bære en holdomgang med{' '}
          {profile.n}.
        </p>
      </header>
      <div
        className={`waterline-chart${highlight ? ' is-highlighting' : ''}`}
        style={{ '--water': height(profile.n) } as CSSProperties}
        aria-hidden="true"
      >
        <div className="water">
          <svg className="wave" viewBox="0 0 240 12" preserveAspectRatio="none">
            <path d="M0 6 Q30 0 60 6 T120 6 T180 6 T240 6 V12 H0Z" />
          </svg>
        </div>
        <span className="waterline-n">N {profile.n}</span>
        <div className="waterline-groups">
          {profile.lines.map((line) => (
            <div key={line.family} className="wl-group" style={{ flexGrow: Math.max(line.visible.length, 1) }}>
              <div className="wl-bars">
                {[...line.visible].reverse().map((row, index) => {
                  const involved = highlight && row.athletes.some((athlete) => athlete.athleteId === highlight);
                  return (
                    <div
                      key={row.identity}
                      className={[
                        'wl-bar',
                        `status-${row.status ?? 'muted'}`,
                        row.can >= profile.n && 'is-carried',
                        selected === row.identity && 'is-selected',
                        involved && 'is-involved',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ '--h': height(row.can), '--i': index } as CSSProperties}
                      onClick={() => open(row)}
                    >
                      <span className="wl-stack">
                        <i className="wl-unassessed" style={{ flexGrow: row.unassessed }} />
                        <i className="wl-low" style={{ flexGrow: row.low }} />
                        <i className="wl-safe" style={{ flexGrow: row.safe }} />
                      </span>
                      {row.status === 'close' && <span className="wl-ghost" />}
                      {level === row.identity && <span className="wl-flag">Niveau</span>}
                      <span className="wl-tip">
                        <strong>{row.name}</strong>
                        <span>
                          D {points(row.difficulty)} · {row.can} kan
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <span className="wl-label">{line.family}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Distribution({ line }: { line: ProfileLine }) {
  const { safe, low, unassessed } = line.distribution;
  return (
    <span
      className="line-distribution"
      role="img"
      aria-label={`${safe} sikre, ${low} lave og ${unassessed} ikke vurderet i linjen`}
    >
      <i className="seg-safe" style={{ flexGrow: safe }} />
      <i className="seg-low" style={{ flexGrow: low }} />
      <i className="seg-unassessed" style={{ flexGrow: unassessed }} />
    </span>
  );
}

function Detail({
  row,
  profile,
  highlight,
  setHighlight,
  close,
}: {
  row: ProfileRow;
  profile: TeamProfile;
  highlight: string | null;
  setHighlight: (id: string | null) => void;
  close: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), [row.identity]);
  const name = new Map(profile.athletes.map((athlete) => [athlete.id, athlete.name]));
  const groups = [
    ['Sikre', row.athletes.filter((item) => stabilityGroup(item.stability) === 'safe')],
    ['Lave', row.athletes.filter((item) => stabilityGroup(item.stability) === 'low')],
    ['Ikke vurderet', row.athletes.filter((item) => item.stability === null)],
  ] as const;
  const known = new Set(row.athletes.map((item) => item.athleteId));
  const missing = profile.athletes.filter((athlete) => !known.has(athlete.id));
  return (
    <aside className="profile-detail" role="dialog" aria-modal="false" aria-labelledby="profil-detalje-titel">
      <header>
        <div>
          <small>
            {row.family} · {row.direction}
          </small>
          <h2 id="profil-detalje-titel" tabIndex={-1} ref={heading}>
            {row.name}
          </h2>
        </div>
        <button type="button" className="quiet" onClick={close}>
          Luk
        </button>
      </header>
      <dl className="detail-facts">
        <div>
          <dt>D</dt>
          <dd>{points(row.difficulty)}</dd>
        </div>
        <div>
          <dt>Kan</dt>
          <dd>{row.can}</dd>
        </div>
        <div>
          <dt>Krav</dt>
          <dd>{profile.n}</dd>
        </div>
      </dl>
      <p className={`detail-status status-${row.status ?? 'muted'}`}>
        {row.status && <strong>{statusLabel(row).split(' · ')[0]}. </strong>}
        {statusSentence(row, profile.n)}
      </p>
      {highlight && (
        <p className="detail-highlight" role="status">
          <span>
            <strong>{name.get(highlight)}</strong> er fremhævet på tværs af profilen
          </span>
          <button type="button" className="quiet" onClick={() => setHighlight(null)}>
            Ophæv
          </button>
        </p>
      )}
      {groups.map(([title, athletes]) =>
        athletes.length ? (
          <section key={title} className="detail-group">
            <h3>
              {title} <span>{athletes.length}</span>
            </h3>
            <ul>
              {athletes.map((item) => (
                <li key={item.athleteId}>
                  <button
                    type="button"
                    className={`athlete-chip chip-${stabilityGroup(item.stability)}`}
                    aria-pressed={highlight === item.athleteId}
                    onClick={() => setHighlight(highlight === item.athleteId ? null : item.athleteId)}
                  >
                    <i aria-hidden="true" />
                    {name.get(item.athleteId)}
                    {item.stability !== null && <span>{item.stability}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
      {missing.length > 0 && (
        <section className="detail-group">
          <h3>
            Kan ikke endnu <span>{missing.length}</span>
          </h3>
          <ul className="missing-list">
            {missing.map((athlete) => (
              <li key={athlete.id}>{athlete.name}</li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

export function TeamProfilePage({
  workspace,
  teamId,
  openAthletes,
}: {
  workspace: Workspace;
  teamId: string;
  openAthletes: () => void;
}) {
  const team = workspace.teams.find((item) => item.id === teamId)!;
  const resolved = registry.resolve(team.rulesetBinding);
  const rulePackage = resolved.status === 'known' ? resolved.rulePackage : null;
  const [discipline, setDiscipline] = useState<SpringDiscipline>('tumbling');
  const profile = useMemo(
    () => (rulePackage ? teamProfile(workspace, teamId, discipline, rulePackage) : null),
    [workspace, teamId, discipline, rulePackage],
  );
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [pulse, setPulse] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState(0);
  const [drawing, setDrawing] = useState(true);
  const returnFocus = useRef<string | null>(null);

  useEffect(() => {
    setDrawing(true);
    const timer = window.setTimeout(() => setDrawing(false), 1100);
    return () => window.clearTimeout(timer);
  }, [discipline]);

  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(() => setPulse(null), 1300);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  const rows = profile?.lines.flatMap((line) => [...line.rows, ...line.unknown]) ?? [];
  const selectedRow = rows.find((row) => row.identity === selected) ?? null;

  function closeDetail() {
    setSelected(null);
    setHighlight(null);
    const identity = returnFocus.current;
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(`.profile-row button[data-identity="${CSS.escape(identity ?? '')}"]`)?.focus(),
    );
  }

  useEffect(() => {
    if (!selectedRow) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      if (highlight) setHighlight(null);
      else closeDetail();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function switchDiscipline(next: SpringDiscipline) {
    if (next === discipline) return;
    setDiscipline(next);
    setExpanded(new Set());
    setSelected(null);
    setHighlight(null);
    setActiveLine(0);
  }

  const jumping = useRef(0);

  function showLine(index: number) {
    jumping.current = Date.now();
    setActiveLine(index);
    document
      .getElementById(lineId(index))
      ?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  useEffect(() => {
    if (!profile?.lines.length) return;
    const onScroll = () => {
      if (Date.now() - jumping.current < 900) return;
      let current = 0;
      profile.lines.forEach((_, index) => {
        const top = document.getElementById(lineId(index))?.getBoundingClientRect().top ?? Infinity;
        if (top < 160) current = index;
      });
      setActiveLine(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [profile]);

  function open(row: ProfileRow, button: HTMLButtonElement | null) {
    returnFocus.current = row.identity;
    if (button) returnFocus.current = button.dataset.identity ?? row.identity;
    if (selected !== row.identity) setHighlight(null);
    setSelected(row.identity);
  }

  function followFocus(point: FocusPoint) {
    if (!profile) return;
    const index = profile.lines.findIndex((line) => line.family === point.family);
    if (index < 0) return;
    setActiveLine(index);
    const row = point.identity ? rows.find((item) => item.identity === point.identity) : null;
    setPulse(point.identity ?? `line:${point.family}`);
    requestAnimationFrame(() => {
      const target = row
        ? document.querySelector(`.profile-row button[data-identity="${CSS.escape(row.identity)}"]`)
        : document.getElementById(lineId(index));
      target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
    if (row) open(row, null);
  }

  const head = (
    <div className="page-title profile-title">
      <div>
        <h1>Holdprofil</h1>
        <p className="page-description">
          {team.name}. {profile?.athletes.length ?? 0} aktive gymnaster
          {profile ? ` · holdomgang med ${profile.n} tællende` : ''}.
        </p>
      </div>
      <div className="tabs" aria-label="Springdisciplin">
        {(['tumbling', 'trampet'] as const).map((item) => (
          <button key={item} type="button" aria-pressed={discipline === item} onClick={() => switchDiscipline(item)}>
            {disciplineNames[item]}
          </button>
        ))}
      </div>
    </div>
  );
  const toAthletes = (
    <button type="button" className="quiet profile-link" onClick={openAthletes}>
      Gå til Gymnaster
    </button>
  );
  if (!profile)
    return (
      <>
        {head}
        <Empty>Holdets regelpakke er ukendt, så profilen kan ikke beregnes. Data er bevaret.</Empty>
      </>
    );
  if (!profile.athletes.length)
    return (
      <>
        {head}
        <div className="profile-empty">
          <p>Holdet har ingen aktive gymnaster endnu. Profilen bygger på gymnasternes registrerede spring.</p>
          {toAthletes}
        </div>
      </>
    );
  const name = new Map(profile.athletes.map((athlete) => [athlete.id, athlete.name]));
  const involvedCount = highlight
    ? rows.filter((row) => row.athletes.some((athlete) => athlete.athleteId === highlight)).length
    : 0;
  return (
    <div
      className={`team-profile${drawing ? ' is-drawing' : ''}${selectedRow ? ' has-detail' : ''}`}
      style={{ '--n': profile.n, '--slots': profile.cap } as CSSProperties}
    >
      {head}
      {!profile.lines.length ? (
        <div className="profile-empty">
          <p>
            Ingen registrerede {disciplineNames[discipline].toLowerCase()}spring endnu. Registrér spring under
            Gymnaster, så viser profilen holdets trapper.
          </p>
          {toAthletes}
        </div>
      ) : (
        <>
          <Waterline
            key={`vandstand-${discipline}`}
            profile={profile}
            highlight={highlight}
            selected={selected}
            open={(row) => open(row, null)}
          />
          <section className="profile-summary" aria-label="Holdets niveau og fokus">
            <div className="profile-level">
              <span className="summary-label">Niveau</span>
              {profile.level.tops.length ? (
                <ol>
                  {profile.level.tops.map((row) => (
                    <li key={row.identity}>
                      <strong>{row.name}</strong> <span>{points(row.difficulty)}</span>
                    </li>
                  ))}
                  {profile.level.openLines > 0 && (
                    <li className="level-open">
                      {profile.level.openLines} {profile.level.openLines === 1 ? 'linje' : 'linjer'} tæt på næste trin
                    </li>
                  )}
                </ol>
              ) : (
                <p>
                  Ingen spring er Klar endnu. Klar kræver mindst {profile.n + 1} sikre.
                  {toAthletes}
                </p>
              )}
            </div>
            {profile.focus.length > 0 && (
              <div className="profile-focus">
                <span className="summary-label">Fokus</span>
                <ol>
                  {profile.focus.map((point) => (
                    <li key={`${point.kind}:${point.identity ?? point.family}`}>
                      <button type="button" className={`focus-${point.kind}`} onClick={() => followFocus(point)}>
                        {point.text}
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
          {highlight && (
            <p className="profile-highlight" role="status" key={highlight}>
              <span className="highlight-mark" aria-hidden="true">
                {initials(name.get(highlight) ?? '')}
              </span>
              <span className="highlight-text">
                <small>Fremhæver</small>
                <strong>{name.get(highlight)}</strong>
              </span>
              <span className="highlight-count">
                {involvedCount} spring
              </span>
              <button
                type="button"
                className="highlight-clear"
                aria-label="Ophæv fremhævning"
                onClick={() => setHighlight(null)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 7l10 10M17 7 7 17" />
                </svg>
              </button>
            </p>
          )}
          <div className="line-tabs" role="group" aria-label="Springlinjer">
            {profile.lines.map((line, index) => (
              <button
                key={line.family}
                type="button"
                aria-pressed={activeLine === index}
                aria-controls={lineId(index)}
                onClick={() => showLine(index)}
              >
                {line.family}
              </button>
            ))}
          </div>
          <div className="profile-lines" key={`linjer-${discipline}`}>
            {profile.lines.map((line, lineIndex) => {
              const open_ = expanded.has(line.family);
              const shown = open_ ? line.rows : line.visible;
              return (
                <section
                  key={line.family}
                  id={lineId(lineIndex)}
                  className={`profile-line${pulse === `line:${line.family}` ? ' is-pulsing' : ''}`}
                  aria-labelledby={`${lineId(lineIndex)}-titel`}
                >
                  <header>
                    <h2 id={`${lineId(lineIndex)}-titel`}>{line.family}</h2>
                    <Distribution line={line} />
                  </header>
                  <ol className="profile-rows">
                    {shown.map((row, index) => (
                      <Row
                        key={row.identity}
                        row={row}
                        profile={profile}
                        highlight={highlight}
                        index={index}
                        surpassed={line.hidden.includes(row)}
                        active={selected === row.identity}
                        pulsing={pulse === row.identity}
                        open={open}
                      />
                    ))}
                  </ol>
                  {line.hidden.length > 0 && (
                    <button
                      type="button"
                      className="quiet line-toggle"
                      aria-expanded={open_}
                      onClick={() =>
                        setExpanded((current) => {
                          const next = new Set(current);
                          if (open_) next.delete(line.family);
                          else next.add(line.family);
                          return next;
                        })
                      }
                    >
                      {open_ ? `Skjul ${line.hidden.length} lettere` : `+${line.hidden.length} lettere`}
                    </button>
                  )}
                  {line.unknown.length > 0 && (
                    <div className="unknown-d">
                      <h3>Uden kendt D</h3>
                      <ol className="profile-rows">
                        {line.unknown.map((row, index) => (
                          <Row
                            key={row.identity}
                            row={row}
                            profile={profile}
                            highlight={highlight}
                            index={shown.length + index}
                            surpassed={false}
                            active={selected === row.identity}
                            pulsing={pulse === row.identity}
                            open={open}
                          />
                        ))}
                      </ol>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          <p className="profile-legend" aria-hidden="true">
            <span>
              <i className="dot dot-safe" /> Sikker 3–5
            </span>
            <span>
              <i className="dot dot-low" /> Lav 1–2
            </span>
            <span>
              <i className="dot dot-unassessed" /> Ikke vurderet
            </span>
            <span>
              <i className="dot dot-empty" /> Mangler til {profile.n}
            </span>
          </p>
        </>
      )}
      {selectedRow && (
        <Detail
          row={selectedRow}
          profile={profile}
          highlight={highlight}
          setHighlight={setHighlight}
          close={closeDetail}
        />
      )}
    </div>
  );
}
