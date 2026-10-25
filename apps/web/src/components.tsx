import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { formatPoints, STABILITY_ANCHORS } from '@teamgym/domain';
import type { SourceReference, Stability } from '@teamgym/domain';
import type { Fraction } from '@teamgym/domain';
import type { NumericDecision, RulePackage, SpringSkillEvaluation } from '@teamgym/rules';

export function SkillBreakdown({ evaluation }: { evaluation: SpringSkillEvaluation }) {
  return (
    <ol className="calculation-elements">
      {evaluation.elementValues.map((element, index) => (
        <li key={index}>
          Element {index + 1}: <Decision value={element.value} />
          <small>
            {element.value.status !== 'known'
              ? 'Bidraget kan ikke fastlægges sikkert'
              : evaluation.explanation.countedElementIds.includes(element.identity) &&
                  evaluation.elementValues.findIndex((item) => item.identity === element.identity) === index
                ? 'Medregnet i D'
                : 'Udeladt: gentagelse eller udenfor D-grundlaget'}
          </small>
        </li>
      ))}
    </ol>
  );
}

export const statusText = {
  known: 'Beregnet',
  incomplete: 'Ufuldstændig',
  invalid: 'Ikke anvendelig',
  unresolved: 'Uafklaret',
};
export function points(value: Fraction | null | undefined) {
  return value ? formatPoints(value) : '—';
}
const issueLabels: Record<string, string> = {
  'REQUIRES-OBSERVATION': 'Kræver observation',
  'UNKNOWN-ELEMENT': 'Ukendt springvariant',
  'UNKNOWN-VARIANT': 'Ukendt udførelsesvariant',
  'DK-TRIPLE-FORBIDDEN': 'Trippelrotation er ikke tilladt',
  'TWIST-PLACEMENT': 'Skrueplacering kræver gennemgang',
  'ELEMENT-EXECUTION': 'Udførelsen er ikke gyldig',
  'ELEMENT-DIRECTION': 'Retningen passer ikke til springet',
  'ELEMENT-TAKEOFF': 'Afsættet passer ikke til springet',
};
const alternativeLabels: Record<string, string> = {
  table: 'Tabel',
  formula: 'Formel',
  literal: 'Ordlydsspor',
  example: 'Eksempelspor',
};
export function Decision({ value }: { value: NumericDecision }) {
  return (
    <span className={`decision ${value.status}`}>
      <strong>{value.value ? points(value.value) : statusText[value.status]}</strong>
      {value.value === null && (
        <small>
          Kendt del: {points(value.knownSubtotal)}
          {value.issues.length
            ? ` · ${value.issues.map((issue) => (/^Q\d+$/.test(issue) ? issue : (issueLabels[issue] ?? 'Kræver reglementsgennemgang'))).join(', ')}`
            : ''}
        </small>
      )}
      {Object.entries(value.alternatives).map(([key, amount]) => (
        <small key={key}>
          {alternativeLabels[key] ?? key}: {points(amount)}
        </small>
      ))}
    </span>
  );
}
export function SourceLinks({
  sources,
  rulePackage,
}: {
  sources: readonly SourceReference[];
  rulePackage: RulePackage;
}) {
  return (
    <span className="sources">
      {sources.map((source, index) => {
        const file = rulePackage.manifest.sources.find((item) => item.id === source.sourceId);
        return (
          <a
            key={index}
            href={
              file
                ? `${import.meta.env.BASE_URL}sources/${file.file.split(/[\\/]/).at(-1)}${source.page ? `#page=${source.page}` : ''}`
                : '#/reglement'
            }
            target="_blank"
            rel="noreferrer"
          >
            {source.sourceId} {source.section}
            {source.page ? ` · s. ${source.page}` : ''}
          </a>
        );
      })}
    </span>
  );
}
export function Dialog({
  title,
  children,
  close,
  wide = false,
  dismissible = true,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
  dismissible?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      className={wide ? 'wide' : ''}
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) close();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        {dismissible && (
          <button type="button" className="quiet" onClick={close} aria-label="Luk dialog">
            Luk ×
          </button>
        )}
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function StabilityControl({
  value,
  onChange,
  disabled = false,
}: {
  value: Stability | null;
  onChange: (value: Stability | null) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="stability" disabled={disabled}>
      <legend>Stabilitet</legend>
      <div className="scale">
        <label>
          <input type="radio" name="stability" checked={value === null} onChange={() => onChange(null)} />
          Ikke vurderet
        </label>
        {STABILITY_ANCHORS.map((anchor, index) => (
          <label key={anchor} title={anchor}>
            <input
              type="radio"
              name="stability"
              checked={value === index + 1}
              onChange={() => onChange((index + 1) as Stability)}
            />
            <b>{index + 1}</b>
          </label>
        ))}
      </div>
      <p className="muted">
        {value === null ? 'Ingen vurdering registreret.' : `${value}: ${STABILITY_ANCHORS[value - 1]}`}
      </p>
      <details>
        <summary>Se skalaens fem ankre</summary>
        <ol>
          {STABILITY_ANCHORS.map((anchor) => (
            <li key={anchor}>{anchor}</li>
          ))}
        </ol>
      </details>
    </fieldset>
  );
}
export function ActionForm({
  children,
  submit,
  label = 'Anvend i kladde',
  disabled = false,
}: {
  children: ReactNode;
  submit: (data: FormData) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [error, setError] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        try {
          submit(new FormData(event.currentTarget));
          setError('');
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Kontrollér oplysningerne.');
        }
      }}
    >
      {children}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <div className="actions">
        <button disabled={disabled} type="submit">
          {label}
        </button>
      </div>
    </form>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
