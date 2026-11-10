import type { CSSProperties } from 'react';
import type { SpringDirectionFilter as Filter, SpringPurity } from './spring-picker-model';
import './spring-plan.css';

const OPTIONS: { value: Filter; label: string; hint: string }[] = [
  { value: 'all', label: 'Alle', hint: 'Alle retninger' },
  { value: 'forward', label: 'Forlæns', hint: 'Alle elementer går forlæns; tæller som ren forlæns i C' },
  { value: 'backward', label: 'Baglæns', hint: 'Alle elementer går baglæns; tæller som ren baglæns i C' },
];

/** Antal pr. retning ud fra de øvrige filtre. Afledt ved visning. */
export function directionCounts(purities: readonly SpringPurity[]): Record<Filter, number> {
  return {
    all: purities.length,
    forward: purities.filter((item) => item === 'forward').length,
    backward: purities.filter((item) => item === 'backward').length,
  };
}

/** Visningsfilter for banespring: Alle, ren forlæns eller ren baglæns. Gemmes aldrig. */
export function SpringDirectionFilter({
  value,
  onChange,
  counts,
  keepFocus = false,
}: {
  value: Filter;
  onChange: (value: Filter) => void;
  counts: Record<Filter, number>;
  /** Behold fokus i et tilhørende søgefelt ved klik. */
  keepFocus?: boolean;
}) {
  const index = OPTIONS.findIndex((option) => option.value === value);
  return (
    <div
      className="spring-direction-filter"
      role="group"
      aria-label="Retning"
      style={{ '--direction-index': index } as CSSProperties}
    >
      <span className="spring-direction-thumb" aria-hidden="true" />
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          aria-label={`${option.label}, ${counts[option.value]} spring`}
          title={option.hint}
          onMouseDown={keepFocus ? (event) => event.preventDefault() : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          <span className="spring-direction-count" aria-hidden="true">
            {counts[option.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
