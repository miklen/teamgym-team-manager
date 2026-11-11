import { useId } from 'react';
import type { CSSProperties } from 'react';
import { canonicalJson, twistDistributionOptions } from '@teamgym/domain';
import type { ElementExecution } from '@teamgym/domain';
import { capitalize, twistSplitName } from './spring-names';
import './twist-split.css';

const POSITION = { tuck: 'lukket', pike: 'hoftebøjet', straight: 'strakt' } as const;
const degrees = (halfTurns: number) => `${halfTurns * 180}°`;

/**
 * Vælg hvor skruen sker i hver salto. Hver mulighed er en hel fordeling, så valget altid summer til springets skrue.
 * Fordelingen er en del af springets identitet; uden valg kan springet ikke gemmes.
 */
export function TwistSplit({
  element,
  label,
  onChange,
}: {
  element: ElementExecution;
  /** Elementets navn, når en serie har flere dobbeltspring. */
  label?: string | undefined;
  onChange: (distribution: number[]) => void;
}) {
  const name = useId();
  const saltos = element.bodyPositions.length;
  const total = element.twistsHalfTurns;
  const options = twistDistributionOptions(saltos, total);
  const current =
    element.twistDistribution.length === saltos ? canonicalJson(element.twistDistribution) : null;
  return (
    <fieldset className={`twist-split${current ? '' : ' is-open'}`}>
      <legend>
        <span className="twist-split-title">Hvor sker skruen?</span>
        <span className="twist-split-context">
          {label ? `${label} · ` : ''}
          {degrees(total)} på {element.bodyPositions.map((position) => POSITION[position]).join(' – ')}
        </span>
      </legend>
      <div className="twist-split-options" style={{ '--count': options.length } as CSSProperties}>
        {options.map((distribution) => {
          const value = canonicalJson(distribution);
          const title = capitalize(twistSplitName(distribution));
          const spoken = distribution
            .map((part, index) => `${index + 1}. salto ${degrees(part)}`)
            .join(', ');
          return (
            <label key={value} className="twist-split-option" data-checked={current === value}>
              <input
                type="radio"
                name={name}
                value={value}
                checked={current === value}
                aria-label={`${title}: ${spoken}`}
                onChange={() => onChange(distribution)}
              />
              <span className="twist-split-figure" aria-hidden="true">
                {distribution.map((part, index) => (
                  <span key={index} className="twist-split-salto">
                    <SaltoRing halfTurns={part} />
                    <small>{degrees(part)}</small>
                  </span>
                ))}
              </span>
              <span className="twist-split-name" aria-hidden="true">
                {title}
              </span>
            </label>
          );
        })}
      </div>
      {!current && (
        <p className="twist-split-hint" role="status">
          Vælg fordelingen. In og out er forskellige spring.
        </p>
      )}
    </fieldset>
  );
}

const RADII = [13.5, 9.25, 5];

/** Én ring er én hel skrue (360°); hver ekstra omgang tegnes som en ny ring indenfor. */
function SaltoRing({ halfTurns }: { halfTurns: number }) {
  const laps = halfTurns / 2;
  const rings = Math.max(1, Math.ceil(laps));
  return (
    <svg viewBox="0 0 34 34" className="twist-split-ring">
      {RADII.slice(0, rings).map((radius, lap) => {
        const circumference = 2 * Math.PI * radius;
        const share = Math.min(1, Math.max(0, laps - lap));
        return (
          <g key={lap}>
            <circle cx="17" cy="17" r={radius} className="twist-split-track" />
            {share > 0 && (
              <circle
                cx="17"
                cy="17"
                r={radius}
                className="twist-split-arc"
                strokeDasharray={share >= 1 ? undefined : `${circumference * share} ${circumference}`}
                transform="rotate(-90 17 17)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
