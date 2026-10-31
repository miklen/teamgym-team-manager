import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { Stability } from '@teamgym/domain';
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

export interface PlanSkillOption {
  id: string;
  name: string;
  direction: string;
  difficulty: string | null;
  stability: Stability | null;
}

/** Sikkerhedskolonnen for et spring uden gymnast. Teksten bærer betydningen. */
export function PlanNoAthlete() {
  return <span className="plan-no-athlete">Ingen gymnast</span>;
}

/**
 * Søgbart springvalg. Fokus bliver i søgefeltet, og piletaster vælger den aktive række.
 * I katalogtilstand vælges et spring uden gymnast: sikkerhed erstattes af Ingen gymnast, og pladsen kan ikke gemmes uden spring.
 */
export function PlanSkillSelect({
  options,
  initialValue,
  onChange,
  catalog = false,
}: {
  options: PlanSkillOption[];
  initialValue: string;
  onChange?: ((id: string) => void) | undefined;
  catalog?: boolean;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(
    options.some((option) => option.id === initialValue) ? initialValue : '',
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const selected = options.find((option) => option.id === value);
  const words = query.toLocaleLowerCase('da').split(/\s+/).filter(Boolean);
  const filtered = options.filter((option) =>
    words.every((word) => `${option.name} ${option.direction}`.toLocaleLowerCase('da').includes(word)),
  );
  const rows: (PlanSkillOption | null)[] = query.trim() || catalog ? filtered : [null, ...filtered];
  const activeIndex = Math.min(active, rows.length - 1);
  const choose = (option: PlanSkillOption | null) => {
    setValue(option?.id ?? '');
    onChange?.(option?.id ?? '');
    setOpen(false);
    trigger.current?.focus();
  };
  const show = () => {
    setQuery('');
    setActive(Math.max(0, options.findIndex((option) => option.id === value) + 1));
    setOpen(true);
  };
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
  }, [open, activeIndex, query]);
  return (
    <div
      ref={root}
      className="plan-skill-select"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <span id={`${id}-label`} className="plan-skill-label">
        Spring
      </span>
      <input type="hidden" name="skill" value={value} />
      <button
        ref={trigger}
        type="button"
        className="plan-skill-trigger"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show();
          }
        }}
      >
        <span id={`${id}-value`} className="plan-choice-name">
          <strong>{selected?.name ?? 'Vælg spring'}</strong>
          <small>{selected?.direction || (catalog ? (selected ? '' : `${options.length} spring i kataloget`) : `${options.length} registrerede spring`)}</small>
        </span>
        {selected && (
          <span className="plan-choice-numbers">
            <PlanDifficulty value={selected.difficulty} />
            {catalog ? <PlanNoAthlete /> : <PlanSafety value={selected.stability} />}
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
              ref={search}
              type="search"
              role="combobox"
              aria-label={catalog ? 'Søg i springkataloget' : 'Søg registrerede spring'}
              placeholder={catalog ? 'Søg i kataloget…' : 'Søg spring…'}
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(event.key)) {
                  event.preventDefault();
                  if (event.key === 'ArrowDown') setActive(Math.min(rows.length - 1, activeIndex + 1));
                  if (event.key === 'ArrowUp') setActive(Math.max(0, activeIndex - 1));
                  if (event.key === 'Home') setActive(0);
                  if (event.key === 'End') setActive(rows.length - 1);
                  if (event.key === 'Enter' && activeIndex >= 0) choose(rows[activeIndex]!);
                }
              }}
            />
          </div>
          <div className="plan-option-columns" aria-hidden="true">
            <span>Spring</span>
            <span>D</span>
            <span>{catalog ? 'Gymnast' : 'Sikkerhed'}</span>
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
                    ? `${option.name}${option.direction ? `, ${option.direction}` : ''}, D ${option.difficulty ?? 'Uafklaret'}, ${catalog ? 'ingen gymnast' : `sikkerhed ${option.stability === null ? 'Ikke vurderet' : `${option.stability}/5`}`}`
                    : 'Vælg senere · ufuldstændig plads'
                }
                data-active={index === activeIndex}
                className="plan-skill-option"
                onPointerMove={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                <span className="plan-choice-name">
                  <strong>{option?.name ?? 'Vælg senere'}</strong>
                  <small>{option?.direction || (option ? '' : 'Gem pladsen uden spring')}</small>
                </span>
                {option ? (
                  <PlanDifficulty value={option.difficulty} />
                ) : (
                  <span className="plan-option-placeholder" aria-hidden="true">
                    —
                  </span>
                )}
                {catalog ? <PlanNoAthlete /> : <PlanSafety value={option?.stability ?? null} />}
                <span className="plan-option-check" aria-hidden="true">
                  {(option?.id ?? '') === value ? '✓' : ''}
                </span>
              </li>
            ))}
          </ul>
          {rows.length === 0 && (
            <p className="plan-options-empty" role="status">
              {catalog ? 'Ingen spring i kataloget matcher.' : 'Ingen registrerede spring matcher.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
