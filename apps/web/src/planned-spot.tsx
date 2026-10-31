import { useEffect, useId, useRef, useState } from 'react';
import { formatPoints, plannedSpotState } from '@teamgym/domain';
import type { SourceReference, SpotGrade } from '@teamgym/domain';
import type {
  DisciplineEvaluation,
  ParticipantEvaluation,
  RoundEvaluation,
  RulePackage,
  SpotRate,
} from '@teamgym/rules';
import { points, SourceLinks, statusText } from './components';
import { springElementName } from './spring-library';
import './planned-spot.css';

const GRADES: readonly SpotGrade[] = ['support', 'assist', 'heavy'];
const FALLBACK_LABELS: Record<SpotGrade, string> = {
  support: 'Let støtte',
  assist: 'Hjælp til udførelse',
  heavy: 'Kraftig hjælp i svæv/landing',
};

export function spotGradeLabel(grade: SpotGrade, rulePackage: RulePackage) {
  return rulePackage.spotRates?.find((rate) => rate.grade === grade)?.label ?? FALLBACK_LABELS[grade];
}

function rateConsequence(rate: SpotRate | null) {
  if (!rate) return 'Konsekvens uafklaret';
  return `E −${formatPoints(rate.executionDeduction)}${rate.halvesDifficulty ? ' · D halveres' : ' · D uændret'}`;
}

function elementLabel(participant: ParticipantEvaluation, index: number, rulePackage: RulePackage) {
  const skill = participant.skill;
  if (skill?.discipline !== 'tumbling') return '';
  const element = skill.elements[index];
  if (!element) return '';
  const value = participant.evaluation?.elementValues[index]?.value.value;
  return `${index + 1}. ${springElementName(element, rulePackage)}${value ? ` · ${points(value)}` : ''}`;
}

export type SpotChange = { grade: SpotGrade; elementIndex?: number } | null;

const SHORT_LABELS: Record<SpotGrade, string> = { support: 'Let', assist: 'Hjælp', heavy: 'Kraftig' };

function shortConsequence(rate: SpotRate | null) {
  if (!rate) return 'Uafklaret';
  const value = formatPoints(rate.executionDeduction).replace(/(,\d)0+$/, '$1');
  return `E −${value}${rate.halvesDifficulty ? ' · ½ D' : ''}`;
}

/**
 * Pladsens planlagte modtagning: én chip i værktøjslinjen og et kompakt valg.
 * Ét tryk vælger og lukker; piletaster flytter valget uden at lukke. Ændringer går gennem domænekommandoer via `onChange`.
 */
export function SlotSpot({
  participant,
  athleteLabel,
  rulePackage,
  writable,
  onChange,
}: {
  participant: ParticipantEvaluation;
  athleteLabel: string;
  rulePackage: RulePackage;
  writable: boolean;
  onChange: (value: SpotChange) => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pointer = useRef(false);
  const state = plannedSpotState(participant.entry, participant.registration ?? undefined);
  const canPlan = Boolean(participant.skill && participant.registration);
  const active = participant.plannedSpot;
  const grade = active?.spot.grade ?? null;
  const skill = participant.skill;
  const tumbling = skill?.discipline === 'tumbling';
  const elementIndex = active?.spot.elementIndex ?? null;
  const panelId = `${id}-panel`;
  const rate = grade ? (rulePackage.spotRates?.find((item) => item.grade === grade) ?? null) : null;

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    root.current?.querySelector<HTMLInputElement>('.spot-segments input:checked')?.focus();
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  if (state === 'none' && !canPlan) return null;

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  function choose(value: SpotChange, finished: boolean) {
    onChange(value);
    if (pointer.current && finished) close();
    pointer.current = false;
  }

  const fullLabel = grade ? spotGradeLabel(grade, rulePackage) : '';
  const elementText =
    tumbling && grade === 'heavy' && elementIndex !== null
      ? elementLabel(participant, elementIndex, rulePackage)
      : '';
  const triggerLabel =
    state === 'reset'
      ? `Planlæg modtagning igen for ${athleteLabel}`
      : active
        ? `Planlagt modtagning ${fullLabel}${elementText ? ` · ${elementText}` : ''}${active.counts ? '' : ' · tæller ikke'} for ${athleteLabel}. ${open ? 'Luk valg' : 'Ret'}`
        : `Planlæg modtagning for ${athleteLabel}`;

  return (
    <div
      ref={root}
      className={`slot-spot${open ? ' open' : ''}${state === 'reset' ? ' reset' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      {state === 'reset' && (
        <p className="spot-reset" title="Indgår ikke i D, E-fradrag eller Maks. mulig karakter.">
          <span aria-hidden="true" className="spot-reset-mark">
            ↺
          </span>
          <strong>Modtagning nulstillet: springet er ændret.</strong>
          <span className="sr-only"> Indgår ikke i D, E-fradrag eller Maks. mulig karakter.</span>
          <button
            className="quiet"
            disabled={!writable}
            aria-label={`Fjern nulstillet modtagning for ${athleteLabel}`}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Fjern
          </button>
        </p>
      )}
      {(state !== 'reset' || canPlan) && (
        <button
          ref={trigger}
          type="button"
          className={`spot-trigger${active ? ' active' : ''}${active && !active.counts ? ' idle' : ''}`}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={triggerLabel}
          title={active ? `${fullLabel}${elementText ? ` · ${elementText}` : ''}` : undefined}
          disabled={!writable && !active}
          onClick={() => setOpen(!open)}
        >
          <span className="spot-pill">
            {active ? (
              <>
                <SpotGlyph />
                <span>{SHORT_LABELS[active.spot.grade]}</span>
                {elementText && <span className="spot-pill-element">{elementIndex! + 1}</span>}
                {!active.counts && <span className="spot-pill-detail">tæller ikke</span>}
              </>
            ) : (
              <>
                <SpotGlyph />
                <span className="spot-pill-label">{state === 'reset' ? 'Planlæg igen' : 'Modtagning'}</span>
              </>
            )}
          </span>
        </button>
      )}
      {open && canPlan && (
        <div
          className="spot-popover"
          id={panelId}
          role="group"
          aria-label={`Planlagt modtagning · ${athleteLabel}`}
        >
          <fieldset
            className="spot-grade-field"
            disabled={!writable}
            onPointerDown={() => (pointer.current = true)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              close();
            }}
          >
            <legend className="sr-only">Grad af modtagning</legend>
            <div className="spot-segments">
              <label className="spot-segment">
                <input
                  type="radio"
                  name={`${id}-grade`}
                  checked={grade === null}
                  onChange={() => choose(null, true)}
                />
                <span>Ingen</span>
                <small>—</small>
              </label>
              {GRADES.map((value) => {
                const option = rulePackage.spotRates?.find((item) => item.grade === value) ?? null;
                const label = spotGradeLabel(value, rulePackage);
                return (
                  <label className="spot-segment" key={value} title={`${label} · ${rateConsequence(option)}`}>
                    <input
                      type="radio"
                      name={`${id}-grade`}
                      aria-label={`${label} · ${rateConsequence(option)}`}
                      checked={grade === value}
                      onChange={() => choose({ grade: value }, !(value === 'heavy' && tumbling))}
                    />
                    <span>{SHORT_LABELS[value]}</span>
                    <small>{shortConsequence(option)}</small>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {grade === 'heavy' && skill?.discipline === 'tumbling' && (
            <fieldset
              className="spot-element-field"
              disabled={!writable}
              onPointerDown={() => (pointer.current = true)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                close();
              }}
            >
              <legend>Modtaget element</legend>
              <div className="spot-elements">
                {skill.elements.map((element, index) => (
                  <label key={index} className="spot-element-option">
                    <input
                      type="radio"
                      name={`${id}-element`}
                      aria-label={elementLabel(participant, index, rulePackage)}
                      checked={(elementIndex ?? skill.elements.length - 1) === index}
                      onChange={() => choose({ grade: 'heavy', elementIndex: index }, true)}
                    />
                    <span>{index + 1}</span>
                    <small>{springElementName(element, rulePackage)}</small>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <p className="spot-explanation">
            {grade
              ? rate
                ? rate.explanation
                : 'Regelpakken har ingen kendte satser for modtagning. Konsekvensen vises som uafklaret.'
              : 'En modtagning er en bevidst plan for netop dette spring. Den ændrer ikke gymnastens sikkerhed.'}
            {grade &&
              active &&
              !active.counts &&
              ' Ekstra gymnaster tæller ikke; fradraget indgår ikke i omgangen (A6-08).'}
            {rate && <SourceLinks sources={rate.sources} rulePackage={rulePackage} />}
          </p>
        </div>
      )}
    </div>
  );
}

function SpotGlyph() {
  return (
    <svg className="spot-glyph" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 10.5c2.2 2.6 8.8 2.6 11 0" />
      <path d="M8 2.5v6M5.5 6 8 8.5 10.5 6" />
    </svg>
  );
}

/** Omgangens D-andel, der skyldes planlagt kraftig hjælp. Eksakt forskel, vist med samme præcision som D. */
export function RoundSpotShare({ result }: { result: RoundEvaluation }) {
  const halved = result.counting.some((item) => item.plannedSpot && item.spotD !== item.adjustedD);
  if (!halved) return null;
  const before = result.unspottedDifficulty.value;
  const after = result.difficulty.value;
  return (
    <span className="spot-share">
      {before && after
        ? `(heraf modtagning −${points(before.subtract(after))})`
        : '(heraf modtagning: uafklaret)'}
    </span>
  );
}

/** Omgangens E-loft efter planlagte E-fradrag, på samme linje som D. Ekstra gymnaster vises, men tæller ikke (A6-08). */
export function RoundPlannedExecution({ result }: { result: RoundEvaluation }) {
  const extras = result.entries.filter((item) => item.plannedSpot && !item.plannedSpot.counts).length;
  const { deduction, count, ceiling } = result.plannedExecution;
  if (!count && !extras) return null;
  return (
    <span className="round-execution">
      <span className="round-execution-label">Planlagt E-loft</span>{' '}
      <strong>{ceiling.value ? points(ceiling.value) : statusText[ceiling.status]}</strong>{' '}
      <small>
        E-fradrag {deduction.value ? `−${points(deduction.value)}` : statusText[deduction.status]} · {count}{' '}
        {count === 1 ? 'tællende modtagning' : 'tællende modtagninger'}
        {extras ? ` · ${extras} ekstra tæller ikke` : ''}
      </small>
    </span>
  );
}

/** Kort tekst for Maks. mulig karakter; ugyldig vises som ord, aldrig som tal. */
export function maximumScoreText(evaluation: DisciplineEvaluation) {
  const { maximumScore } = evaluation;
  if (maximumScore.value) return points(maximumScore.value.panelFloor());
  return maximumScore.status === 'invalid' ? 'Ugyldig' : statusText[maximumScore.status];
}

function maximumSources(discipline: DisciplineEvaluation['discipline']): SourceReference[] {
  return [
    { sourceId: 'H', section: '4.6 Disciplinens endelige karakter', page: 13 },
    discipline === 'tumbling'
      ? { sourceId: 'H', section: '9.4 Banens udførelse', page: 35 }
      : { sourceId: 'H', section: '10.4 Trampettens udførelse', page: 44 },
    { sourceId: 'A6', section: '1.7 Støtte og hjælp (A6-07)', page: 5 },
  ];
}

/** Maks. mulig karakter i disciplinoverblikket: et loft, aldrig en forventet karakter. */
export function MaximumScoreMetric({
  evaluation,
  roundIds,
  rulePackage,
  onRound,
}: {
  evaluation: DisciplineEvaluation;
  roundIds: readonly string[];
  rulePackage: RulePackage;
  onRound: (roundId: string) => void;
}) {
  const { maximumScore, spotCost, invalidRoundIds } = evaluation;
  const spots = evaluation.rounds.reduce((sum, round) => sum + round.plannedExecution.count, 0);
  const invalid = maximumScore.status === 'invalid';
  return (
    <div className="maximum-metric">
      <div className="analysis-metric-label">
        <span>
          Maks. mulig karakter<span className="maximum-formula"> · loft</span>
        </span>
        <details className="maximum-about">
          <summary>Om loftet</summary>
          <div className="maximum-about-panel">
            <p>
              C + D + gennemsnitligt E-loft for tre omgange. Hver omgang tæller 10,0 minus sine planlagte
              E-fradrag for modtagning. D medregner planlagt kraftig hjælp. Tallet er et loft og ikke en
              forventet karakter: overdommerfradrag og øvrige E-fradrag kan sænke resultatet yderligere.
            </p>
            <SourceLinks sources={maximumSources(evaluation.discipline)} rulePackage={rulePackage} />
          </div>
        </details>
      </div>
      <strong
        className={`number-change${maximumScore.value ? '' : ' maximum-pending'}`}
        key={maximumScoreText(evaluation)}
      >
        {maximumScoreText(evaluation)}
      </strong>
      <small className={!maximumScore.value && !invalid && spots === 0 ? 'maximum-status-only' : undefined}>
        {invalid && invalidRoundIds.length ? 'Ugyldig omgang i planen' : statusText[maximumScore.status]}
        {!invalid && <span className="maximum-formula"> · C + D + E-loft</span>}
        {spots > 0 && spotCost.value ? ` · modtagning koster ${points(spotCost.value)}` : ''}
        {spots > 0 && !spotCost.value ? ' · modtagningens pris kan ikke beregnes endnu' : ''}
      </small>
      {invalid && invalidRoundIds.length > 0 && (
        <span className="maximum-rounds">
          {invalidRoundIds.map((id) => {
            const index = roundIds.indexOf(id);
            return (
              <button key={id} type="button" className="quiet" onClick={() => onRound(id)}>
                {index + 1}. omgang er ugyldig
              </button>
            );
          })}
        </span>
      )}
    </div>
  );
}
