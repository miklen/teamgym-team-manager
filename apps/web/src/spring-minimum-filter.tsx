import { useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Fraction, formatPoints } from '@teamgym/domain';

const preferenceKey = 'teamgym-team-manager.spring-plan.minimum-d';

export function passesSpringMinimum(difficulty: Fraction | null, minimum: Fraction | null): boolean {
  return minimum === null || (difficulty !== null && difficulty.compare(minimum) >= 0);
}

export function useSpringMinimum() {
  const [minimum, setMinimum] = useState(() => {
    try {
      const saved = window.localStorage.getItem(preferenceKey);
      if (!saved) return null;
      const value = Fraction.from(saved.replace(',', '.').replace(/^\./, '0.').replace(/\.$/, ''));
      return value.compare(0) >= 0 ? value : null;
    } catch {
      return null;
    }
  });

  const change = (value: Fraction | null) => {
    setMinimum(value);
    try {
      if (value === null) window.localStorage.removeItem(preferenceKey);
      else window.localStorage.setItem(preferenceKey, value.toString());
    } catch {
      // Filteret virker stadig i den åbne vælger, hvis browseren afviser lagring.
    }
  };

  return [minimum, change] as const;
}

export function SpringMinimumFilter({
  minimum,
  difficulties,
  shown,
  total,
  onChange,
  unknownOnly = false,
}: {
  minimum: Fraction | null;
  difficulties: readonly (Fraction | null)[];
  shown: number;
  total: number;
  onChange: (value: Fraction | null) => void;
  unknownOnly?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLLabelElement>(null);
  const known = difficulties.filter((value) => value !== null);
  const levels = [...new Map(known.map((value) => [value.toString(), value])).values()]
    .sort((a, b) => a.compare(b));
  const lowest = levels[0];
  const highest = levels.at(-1);
  const steps = [null, ...levels];
  // En husket grænse over udvalget kan sænkes direkte til det højeste tilgængelige D.
  if (minimum && highest && minimum.compare(highest) > 0) steps.push(minimum);
  const index = minimum === null || unknownOnly ? 0 : Math.max(0, steps.findIndex(
    (step) => step !== null && step.compare(minimum) >= 0,
  ));
  const threshold = minimum ? formatPoints(minimum) : null;
  const valueText = unknownOnly ? 'Ukendt D' : threshold === null ? 'Alle værdier' : `Mindst ${threshold}`;
  return (
    <div className="spring-minimum-filter" data-active={minimum !== null && !unknownOnly}>
      <div className="spring-minimum-heading">
        <label htmlFor={lowest ? id : undefined} ref={heading} tabIndex={-1}>Minimum D</label>
        <span className="spring-minimum-value">
          {unknownOnly || threshold === null ? valueText : `≥ ${threshold}`}
        </span>
        {minimum && !unknownOnly && (
          <button
            type="button"
            className="quiet"
            aria-label="Ryd minimum D"
            onClick={() => {
              onChange(null);
              (input.current ?? heading.current)?.focus();
            }}
          >
            Ryd
          </button>
        )}
      </div>
      {lowest && highest ? (
        <div className="spring-minimum-axis">
          <span aria-hidden="true">{formatPoints(lowest)}</span>
          <input
            ref={input}
            id={id}
            type="range"
            min={0}
            max={steps.length - 1}
            value={index}
            disabled={unknownOnly}
            aria-valuetext={valueText}
            aria-describedby={`${id}-count`}
            style={{ '--minimum-position': `${100 * index / (steps.length - 1)}%` } as CSSProperties}
            onChange={(event) => {
              event.stopPropagation();
              onChange(steps[event.target.valueAsNumber] ?? null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
          />
          <span aria-hidden="true">{formatPoints(highest)}</span>
        </div>
      ) : <p className="spring-minimum-unavailable">Ingen kendte D-værdier</p>}
      <p className="spring-minimum-count" id={`${id}-count`} role="status">
        <strong>{shown} af {total} spring vises</strong>
        {' · '}{total - shown} skjult af D
      </p>
    </div>
  );
}
