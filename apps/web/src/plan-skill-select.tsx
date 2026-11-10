import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, FocusEvent, KeyboardEvent, ReactNode } from 'react';
import type { Stability } from '@teamgym/domain';
import { SpringDirectionFilter, directionCounts } from './spring-direction-filter';
import { matchesDirection } from './spring-picker-model';
import type { SpringDirectionFilter as DirectionFilter, SpringPurity } from './spring-picker-model';
import './spring-plan.css';

export function PlanDifficulty({ value, spotted }: { value: string | null; spotted?: string | undefined }) {
  if (spotted && value)
    return (
      <span
        className="plan-difficulty spotted"
        role="img"
        aria-label={`Sværhed: Egen D ${value}, bidrag med planlagt kraftig hjælp ${spotted}`}
        title={`Egen D ${value} · halveret af planlagt kraftig hjælp: ${spotted}`}
      >
        <s>{value}</s>
        {spotted}
      </span>
    );
  return (
    <span
      className="plan-difficulty"
      role="img"
      aria-label={`Sværhed: ${value ?? 'Uafklaret'}`}
      title={`Sværhed (D): ${value ?? 'Uafklaret'}`}
    >
      {value ?? 'Uafklaret'}
    </span>
  );
}

export function PlanSafety({ value }: { value: Stability | null }) {
  return (
    <span
      className={`plan-safety safety-${value ?? 'none'}`}
      role="img"
      aria-label={`Sikkerhed: ${value === null ? 'Ikke vurderet' : `${value} af 5`}`}
      title={value === null ? 'Ikke vurderet' : `Sikkerhed: ${value}/5`}
    >
      <span className="safety-bars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <i key={step} className={value !== null && step <= value ? 'filled' : ''} />
        ))}
      </span>
      <span aria-hidden="true">{value === null ? '—' : `${value}/5`}</span>
    </span>
  );
}

/** Afledt brugsoplysning for en springidentitet i scenariet; gemmes aldrig. */
export interface PlanSkillUsage {
  tone: 'warning' | 'neutral';
  text: string;
  spoken: string;
}

export interface PlanSkillOption {
  id: string;
  name: string;
  direction: string;
  difficulty: string | null;
  stability: Stability | null;
  /** Antal andre aktive gymnaster på holdet, der kan springet. Afledt, gemmes ikke. */
  known?: number;
  /** Holdtilstand: ledige gymnaster med springet og dem, der allerede står i omgangen. */
  team?: PlanTeamRoster;
  /** Yderligere søgetekst, fx andre navne i identitetsgruppen. */
  search?: string;
  usage?: PlanSkillUsage[];
  /** Ren retning efter C-RETNING; bruges kun af retningsfilteret. */
  purity?: SpringPurity;
}

/** Sikkerhedskolonnen for et spring uden gymnast. Teksten bærer betydningen. */
export function PlanNoAthlete() {
  return <span className="plan-no-athlete">Ingen gymnast</span>;
}

/** Navne på gymnaster, der kan et holdspring: ledige og dem, der allerede står i omgangen. Afledt. */
export interface PlanTeamRoster {
  free: string[];
  placed: string[];
}

const ROSTER_FACES = 4;

/** Tekst til skærmlæsere; den visuelle stak er skjult. */
export function rosterSpoken({ free, placed }: PlanTeamRoster) {
  const total = free.length + placed.length;
  const who = `${total} ${total === 1 ? 'gymnast' : 'gymnaster'} kan`;
  return placed.length
    ? `${who}, ${free.length} ${free.length === 1 ? 'ledig' : 'ledige'}, ${placed.length} står allerede i omgangen`
    : who;
}

/**
 * Holdets dækning af et spring som en stak initialer: fyldte for ledige, stiplede spøgelser for gymnaster,
 * der allerede står i omgangen. Teksten »2 ledige af 4« bærer betydningen uden farve.
 */
export function PlanRoster({ free, placed }: PlanTeamRoster) {
  const total = free.length + placed.length;
  const faces = [
    ...free.map((name) => ({ name, free: true })),
    ...placed.map((name) => ({ name, free: false })),
  ];
  const shown = total > ROSTER_FACES ? faces.slice(0, ROSTER_FACES - 1) : faces;
  const rest = faces.slice(shown.length);
  return (
    <span className="plan-roster" aria-hidden="true">
      <span className="plan-roster-faces">
        {shown.map((face, index) => (
          <i
            key={`${face.free}:${face.name}:${index}`}
            className={face.free ? 'is-free' : 'is-placed'}
            style={{ '--i': index } as CSSProperties}
            title={`${face.name} · ${face.free ? 'ledig' : 'står allerede i omgangen'}`}
          >
            {initials(face.name)}
          </i>
        ))}
        {rest.length > 0 && (
          <i
            className={`is-more${rest.some((face) => face.free) ? '' : ' is-placed'}`}
            style={{ '--i': shown.length } as CSSProperties}
            title={rest
              .map((face) => `${face.name} · ${face.free ? 'ledig' : 'står allerede i omgangen'}`)
              .join('\n')}
          >
            +{rest.length}
          </i>
        )}
      </span>
      <span className="plan-roster-text">
        <b>{free.length}</b> {free.length === 1 ? 'ledig' : 'ledige'}
        {placed.length > 0 && ` af ${total}`}
      </span>
    </span>
  );
}

function UsageMarks({ usage }: { usage: PlanSkillUsage[] | undefined }) {
  if (!usage?.length) return null;
  return (
    <span className="plan-usage-line">
      {usage.map((item) => (
        <span key={`${item.tone}:${item.text}`} className={`plan-usage is-${item.tone}`}>
          {item.tone === 'warning' && (
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 1.2 11 10.4H1z" />
              <path d="M6 4.6v2.6M6 8.7v.1" />
            </svg>
          )}
          {item.text}
        </span>
      ))}
    </span>
  );
}

const spokenUsage = (usage: PlanSkillUsage[] | undefined) =>
  usage?.length ? `, ${usage.map((item) => item.spoken).join(', ')}` : '';

/** Fælles åbning, søgning og tastatur for appens søgbare lister. Fokus bliver i søgefeltet. */
function useSearchList() {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  useLayoutEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useLayoutEffect(() => {
    if (open) root.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active, query]);
  return {
    root,
    trigger,
    search,
    open,
    setOpen,
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setActive(0);
    },
    active,
    setActive,
    show: (start: number) => {
      setQuery('');
      setActive(Math.max(0, start));
      setOpen(true);
    },
    close: () => {
      setOpen(false);
      trigger.current?.focus();
    },
    rootProps: {
      ref: root,
      onBlur: (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      },
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      },
    },
    triggerKeyDown: (start: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setQuery('');
        setActive(Math.max(0, start));
        setOpen(true);
      }
    },
    searchKeyDown:
      (count: number, choose: (index: number) => void) => (event: KeyboardEvent<HTMLInputElement>) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(event.key)) return;
        event.preventDefault();
        const current = Math.min(active, count - 1);
        if (event.key === 'ArrowDown') setActive(Math.min(count - 1, current + 1));
        if (event.key === 'ArrowUp') setActive(Math.max(0, current - 1));
        if (event.key === 'Home') setActive(0);
        if (event.key === 'End') setActive(count - 1);
        if (event.key === 'Enter' && current >= 0) choose(current);
      },
  };
}

const matchesWords = (query: string, text: string) => {
  const haystack = text.toLocaleLowerCase('da');
  return query
    .toLocaleLowerCase('da')
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

/**
 * Søgbart springvalg. Fokus bliver i søgefeltet, og piletaster vælger den aktive række.
 * I katalogtilstand vælges et spring uden gymnast: sikkerhed erstattes af Ingen gymnast, og pladsen kan ikke gemmes uden spring.
 * I holdtilstand er rækkerne holdets springidentiteter med antal ledige gymnaster; valget gemmes ikke, før en gymnast er valgt.
 */
export function PlanSkillSelect({
  options,
  initialValue,
  onChange,
  catalog = false,
  team = false,
  empty,
  fade = false,
  direction,
}: {
  options: PlanSkillOption[];
  initialValue: string;
  onChange?: ((id: string) => void) | undefined;
  catalog?: boolean;
  team?: boolean;
  /** Tomtilstand, når der slet ingen muligheder er. */
  empty?: ReactNode;
  /** Krydsfade ved skift mellem holdets og gymnastens liste. */
  fade?: boolean;
  /** Retningsfilter for banespring; tilstanden ejes af formularen, så den overlever skift af liste. */
  direction?: { value: DirectionFilter; change: (value: DirectionFilter) => void } | undefined;
}) {
  const id = useId();
  const list = useSearchList();
  const { query, open } = list;
  const [value, setValue] = useState(
    options.some((option) => option.id === initialValue) ? initialValue : '',
  );
  const selected = options.find((option) => option.id === value);
  const searched = options.filter((option) =>
    matchesWords(query, `${option.name} ${option.direction} ${option.search ?? ''}`),
  );
  const directionFilter = direction?.value ?? 'all';
  const filtered = searched.filter((option) => matchesDirection(option.purity, directionFilter));
  const rows: (PlanSkillOption | null)[] = query.trim() || catalog || team ? filtered : [null, ...filtered];
  const activeIndex = Math.min(list.active, rows.length - 1);
  const offset = catalog || team ? 0 : 1;
  const start = options.findIndex((option) => option.id === value) + offset;
  const choose = (option: PlanSkillOption | null) => {
    setValue(option?.id ?? '');
    onChange?.(option?.id ?? '');
    list.close();
  };
  const subject = catalog ? 'i kataloget' : team ? 'på holdet' : 'registrerede';
  return (
    <div
      {...list.rootProps}
      className={`plan-skill-select${fade ? ' is-fading' : ''}`}
      data-mode={team ? 'team' : catalog ? 'catalog' : 'athlete'}
    >
      <span id={`${id}-label`} className="plan-skill-label">
        Spring
      </span>
      {!team && <input type="hidden" name="skill" value={value} />}
      <button
        ref={list.trigger}
        type="button"
        className="plan-skill-trigger"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? list.setOpen(false) : list.show(start))}
        onKeyDown={list.triggerKeyDown(start)}
      >
        <span id={`${id}-value`} className="plan-choice-name">
          <strong>{selected?.name ?? 'Vælg spring'}</strong>
          <small>
            {selected
              ? selected.direction
              : catalog
                ? `${options.length} spring i kataloget`
                : team
                  ? `${options.length} spring på holdet`
                  : `${options.length} registrerede spring`}
          </small>
          <UsageMarks usage={selected?.usage} />
        </span>
        {selected && (
          <span className="plan-choice-numbers">
            <PlanDifficulty value={selected.difficulty} />
            {catalog ? (
              <PlanNoAthlete />
            ) : team && selected.team ? (
              <PlanRoster {...selected.team} />
            ) : (
              <PlanSafety value={selected.stability} />
            )}
          </span>
        )}
        <span className={`plan-select-chevron ${open ? 'is-open' : ''}`} aria-hidden="true">
          ⌄
        </span>
      </button>
      {open && (
        <div className="plan-skill-menu">
          <div className="plan-skill-search">
            <input
              ref={list.search}
              type="search"
              role="combobox"
              aria-label={
                catalog ? 'Søg i springkataloget' : team ? 'Søg i holdets spring' : 'Søg registrerede spring'
              }
              placeholder={catalog ? 'Søg i kataloget…' : team ? 'Søg i holdets spring…' : 'Søg spring…'}
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
              value={query}
              onChange={(event) => list.setQuery(event.target.value)}
              onKeyDown={list.searchKeyDown(rows.length, (index) => choose(rows[index]!))}
            />
            {direction && (
              <SpringDirectionFilter
                keepFocus
                value={direction.value}
                counts={directionCounts(searched.map((option) => option.purity ?? null))}
                onChange={(next) => {
                  direction.change(next);
                  list.setActive(0);
                }}
              />
            )}
          </div>
          <div className="plan-option-columns" aria-hidden="true">
            <span>Spring</span>
            <span>D</span>
            <span>{catalog ? 'Gymnast' : team ? 'Holdet' : 'Sikkerhed'}</span>
          </div>
          <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="plan-skill-options">
            {rows.map((option, index) => (
              <li
                id={`${id}-option-${index}`}
                key={option?.id ?? 'empty'}
                role="option"
                aria-selected={(option?.id ?? '') === value}
                aria-label={
                  option
                    ? `${option.name}${option.direction ? `, ${option.direction}` : ''}${option.known ? `, kendt af ${option.known} på holdet` : ''}, D ${option.difficulty ?? 'Uafklaret'}, ${
                        catalog
                          ? 'ingen gymnast'
                          : team && option.team
                            ? rosterSpoken(option.team)
                            : `sikkerhed ${option.stability === null ? 'Ikke vurderet' : `${option.stability}/5`}`
                      }${spokenUsage(option.usage)}`
                    : 'Vælg senere · ufuldstændig plads'
                }
                data-active={index === activeIndex}
                className="plan-skill-option"
                onPointerMove={() => list.setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                <span className="plan-choice-name">
                  <strong>{option?.name ?? 'Vælg senere'}</strong>
                  <small>
                    {option?.direction || (option ? '' : 'Gem pladsen uden spring')}
                    {option?.known ? (
                      <span className="team-known">Kendt af {option.known} på holdet</span>
                    ) : null}
                  </small>
                  <UsageMarks usage={option?.usage} />
                </span>
                {option ? (
                  <PlanDifficulty value={option.difficulty} />
                ) : (
                  <span className="plan-option-placeholder" aria-hidden="true">
                    —
                  </span>
                )}
                {catalog ? (
                  <PlanNoAthlete />
                ) : team && option?.team ? (
                  <PlanRoster {...option.team} />
                ) : (
                  <PlanSafety value={option?.stability ?? null} />
                )}
                <span className="plan-option-check" aria-hidden="true">
                  {(option?.id ?? '') === value ? '✓' : ''}
                </span>
              </li>
            ))}
          </ul>
          {(rows.length === 0 || (directionFilter !== 'all' && filtered.length === 0)) &&
            (options.length === 0 && empty ? (
              <div className="plan-options-empty" role="status">
                {empty}
              </div>
            ) : (
              <p className="plan-options-empty" role="status">
                {directionFilter !== 'all' && searched.length > 0
                  ? `Ingen rene ${directionFilter === 'forward' ? 'forlæns' : 'baglæns'} spring ${subject === 'registrerede' ? 'registreret' : subject}${query.trim() ? ' matcher søgningen' : ''}.`
                  : `Ingen ${subject === 'registrerede' ? 'registrerede spring' : `spring ${subject}`} matcher.`}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}

export const WHOLE_TEAM = 'team';

export interface PlanAthleteOption {
  id: string;
  name: string;
  detail: string;
  /** Sikkerhed for det valgte holdspring; udeladt, når intet spring er valgt. */
  stability?: Stability | null;
}

/**
 * Søgbart gymnastvalg i samme sprog som springvalget. Første række er Hele holdet.
 * Med et valgt holdspring er listen indsnævret til de ledige gymnaster, der kan springet.
 */
export function PlanAthleteSelect({
  options,
  value,
  onChange,
  free,
  placed = [],
  skillName,
}: {
  options: PlanAthleteOption[];
  value: string;
  onChange: (id: string) => void;
  /** Navne på ledige gymnaster i omgangen. */
  free: string[];
  /** Navne på gymnaster, der kan det valgte holdspring, men allerede står i omgangen. */
  placed?: string[];
  /** Navnet på det valgte holdspring, når listen er indsnævret. */
  skillName: string | null;
}) {
  const id = useId();
  const list = useSearchList();
  const { query, open } = list;
  const narrowed = skillName !== null;
  const selected = options.find((option) => option.id === value);
  const filtered = options.filter((option) => matchesWords(query, `${option.name} ${option.detail}`));
  const rows: (PlanAthleteOption | null)[] = query.trim() ? filtered : [null, ...filtered];
  const activeIndex = Math.min(list.active, rows.length - 1);
  const start = value === WHOLE_TEAM ? 0 : options.findIndex((option) => option.id === value) + 1;
  const choose = (option: PlanAthleteOption | null) => {
    onChange(option?.id ?? WHOLE_TEAM);
    list.close();
  };
  const freeText = `${free.length} ${free.length === 1 ? 'ledig gymnast' : 'ledige gymnaster'}`;
  const roster: PlanTeamRoster = narrowed
    ? { free: options.map((option) => option.name), placed }
    : { free, placed: [] };
  const prompt = value === WHOLE_TEAM && narrowed;
  return (
    <div {...list.rootProps} className="plan-skill-select plan-athlete-select">
      <span id={`${id}-label`} className="plan-skill-label">
        Gymnast
      </span>
      <button
        ref={list.trigger}
        type="button"
        className={`plan-skill-trigger plan-athlete-trigger${prompt ? ' is-prompting' : ''}`}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? list.setOpen(false) : list.show(start))}
        onKeyDown={list.triggerKeyDown(start)}
      >
        {prompt && <span className="plan-sheen" key={skillName} aria-hidden="true" />}
        <span className={`plan-avatar${value === WHOLE_TEAM ? ' is-team' : ''}`} aria-hidden="true">
          {value === WHOLE_TEAM ? <TeamGlyph /> : initials(selected?.name ?? '')}
        </span>
        <span id={`${id}-value`} className="plan-choice-name">
          <strong>{value === WHOLE_TEAM ? 'Hele holdet' : (selected?.name ?? 'Vælg gymnast')}</strong>
          <small
            key={prompt ? `prompt:${skillName}` : 'plain'}
            className={prompt ? 'plan-prompt' : undefined}
          >
            {value === WHOLE_TEAM
              ? narrowed
                ? `${options.length} ${options.length === 1 ? 'ledig kan' : 'ledige kan'} springet · vælg én`
                : freeText
              : selected?.detail || 'Gymnast'}
          </small>
        </span>
        {selected?.stability !== undefined && value !== WHOLE_TEAM && (
          <span className="plan-choice-numbers">
            <PlanSafety value={selected.stability} />
          </span>
        )}
        <span className={`plan-select-chevron ${open ? 'is-open' : ''}`} aria-hidden="true">
          ⌄
        </span>
      </button>
      {open && (
        <div className="plan-skill-menu">
          <div className="plan-skill-search">
            <input
              ref={list.search}
              type="search"
              role="combobox"
              aria-label="Søg gymnaster"
              placeholder="Søg gymnast…"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
              value={query}
              onChange={(event) => list.setQuery(event.target.value)}
              onKeyDown={list.searchKeyDown(rows.length, (index) => choose(rows[index]!))}
            />
          </div>
          {narrowed && (
            <div className="plan-option-columns plan-athlete-columns" aria-hidden="true">
              <span>Kan {skillName}</span>
              <span>Sikkerhed</span>
            </div>
          )}
          <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="plan-skill-options">
            {rows.map((option, index) => {
              const chosen = (option?.id ?? WHOLE_TEAM) === value;
              return (
                <li
                  id={`${id}-option-${index}`}
                  key={option?.id ?? WHOLE_TEAM}
                  role="option"
                  aria-selected={chosen}
                  aria-label={
                    option
                      ? `${option.name}${option.detail ? `, ${option.detail}` : ''}${
                          option.stability !== undefined
                            ? `, sikkerhed ${option.stability === null ? 'Ikke vurderet' : `${option.stability}/5`}`
                            : ''
                        }`
                      : `Hele holdet, ${narrowed ? rosterSpoken(roster) : freeText}`
                  }
                  data-active={index === activeIndex}
                  className={`plan-skill-option plan-athlete-option${option ? '' : ' is-team'}`}
                  onPointerMove={() => list.setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  <span className={`plan-avatar${option ? '' : ' is-team'}`} aria-hidden="true">
                    {option ? initials(option.name) : <TeamGlyph />}
                  </span>
                  <span className="plan-choice-name">
                    <strong>{option?.name ?? 'Hele holdet'}</strong>
                    <small>
                      {option ? option.detail : narrowed ? 'Se alle, der kan springet' : 'Vælg spring først'}
                    </small>
                  </span>
                  {option ? (
                    option.stability !== undefined ? (
                      <PlanSafety value={option.stability} />
                    ) : (
                      <span />
                    )
                  ) : (
                    <PlanRoster {...roster} />
                  )}
                  <span className="plan-option-check" aria-hidden="true">
                    {chosen ? '✓' : ''}
                  </span>
                </li>
              );
            })}
          </ul>
          {rows.length === 0 && (
            <p className="plan-options-empty" role="status">
              {options.length ? 'Ingen gymnaster matcher.' : 'Ingen ledige aktive gymnaster.'}
            </p>
          )}
          {narrowed && placed.length > 0 && (
            <p className="plan-roster-note">
              <span className="plan-roster-faces" aria-hidden="true">
                {placed.slice(0, ROSTER_FACES).map((name, index) => (
                  <i key={`${name}:${index}`} className="is-placed" style={{ '--i': index } as CSSProperties}>
                    {initials(name)}
                  </i>
                ))}
              </span>
              <span>
                <b>{listNames(placed)}</b> kan også springet, men står allerede i omgangen.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function listNames(names: string[]) {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} og ${names.at(-1)}` : (names[0] ?? '');
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toLocaleUpperCase('da'))
    .join('');
}

function TeamGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="7" cy="7.5" r="2.6" />
      <circle cx="13.5" cy="7.5" r="2.1" />
      <path d="M2.6 16c.6-2.6 2.3-4 4.4-4s3.8 1.4 4.4 4M11.6 12.3c.6-.3 1.2-.4 1.9-.4 1.8 0 3.2 1.2 3.7 3.4" />
    </svg>
  );
}
