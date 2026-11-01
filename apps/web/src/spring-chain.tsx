import { useRef } from 'react';
import type { CSSProperties } from 'react';
import type { SpringDefinition } from './spring-library';
import { chainOptions, chainPickLabel, setChainPick } from './spring-chain-model';
import type { ChainSlot, ChainState } from './spring-chain-model';
import './spring-chain.css';

const TRAMPET_SLOTS = ['Redskab', 'Springtype'];

function slotName(discipline: 'tumbling' | 'trampet', slot: ChainSlot) {
  if (slot === 'ending') return 'Slutter med';
  if (discipline === 'trampet') return TRAMPET_SLOTS[slot]!;
  return slot === 0 ? 'Første spring' : `${slot + 1}. spring`;
}

export function SpringChain({
  discipline,
  definitions,
  labels,
  state,
  change,
  active,
  setActive,
}: {
  discipline: 'tumbling' | 'trampet';
  /** Kandidater efter søgning og minimum-D; kædens antal regnes herfra. */
  definitions: readonly SpringDefinition[];
  /** Hele disciplinens bibliotek; giver etiketter til valg uden match. */
  labels: readonly SpringDefinition[];
  state: ChainState;
  change: (next: ChainState) => void;
  active: ChainSlot | null;
  setActive: (slot: ChainSlot | null) => void;
}) {
  const tray = useRef<HTMLDivElement>(null);
  const chain = useRef<HTMLOListElement>(null);
  const maxSlots = discipline === 'trampet' ? TRAMPET_SLOTS.length : Infinity;
  const visible = (slot: ChainSlot, at: ChainState = state) => chainOptions(definitions, at, slot);
  const last = Math.max(state.slots.length, typeof active === 'number' ? active : 0);
  const numbered = Array.from({ length: Math.min(last + 1, maxSlots) }, (_, index) => index).filter(
    (slot) => slot < state.slots.length || slot === active || visible(slot).length > 0,
  );
  const slots: ChainSlot[] = discipline === 'tumbling' ? [...numbered, 'ending'] : numbered;
  const pickAt = (slot: ChainSlot) => (slot === 'ending' ? state.ending : (state.slots[slot] ?? null));
  const focusTray = () =>
    requestAnimationFrame(() => {
      chain.current
        ?.querySelector('.chain-node.is-active')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      tray.current
        ?.querySelector<HTMLButtonElement>('.chain-tile[aria-pressed="true"], .chain-tile')
        ?.focus();
    });
  const open = (slot: ChainSlot) => {
    setActive(active === slot ? null : slot);
    if (active !== slot) focusTray();
  };
  /** Gå videre til næste plads; er der intet at vælge dér, lukkes bakken, så listen står frem. */
  const advance = (slot: ChainSlot, next: ChainState = state) => {
    if (slot === 'ending' || slot + 1 >= maxSlots) return;
    if (visible(slot + 1, next).length === 0) {
      setActive(null);
      return;
    }
    setActive(slot + 1);
    focusTray();
  };
  const options = active === null ? [] : visible(active);
  const current = active === null ? null : pickAt(active);
  const chosen = current ? options.find((option) => option.kind === current.kind) : undefined;
  const max = Math.max(1, ...options.map((option) => option.count));
  return (
    <div className="spring-chain" data-discipline={discipline}>
      <div className="chain-bar">
        <ol ref={chain} className="chain-nodes" aria-label="Kæde">
          {slots.map((slot) => {
            const pick = pickAt(slot);
            const name = slotName(discipline, slot);
            const label = pick ? chainPickLabel(labels, slot, pick) : null;
            return (
              <li
                key={slot}
                className={`chain-node ${pick ? 'is-filled' : ''} ${active === slot ? 'is-active' : ''} ${slot === 'ending' ? 'is-ending' : ''}`}
              >
                <button
                  type="button"
                  className="chain-node-main"
                  aria-expanded={active === slot}
                  aria-label={`${name}: ${label ?? 'alle'}`}
                  onClick={() => open(slot)}
                >
                  <span className="chain-node-index" aria-hidden="true">
                    {slot === 'ending' ? '⋯' : slot + 1}
                  </span>
                  <span className="chain-node-text">
                    <small>{name}</small>
                    <span>{label ?? (slot === 'ending' ? 'Valgfri' : 'Vælg')}</span>
                  </span>
                </button>
                {pick && (
                  <button
                    type="button"
                    className="chain-node-clear"
                    aria-label={`Ryd ${name}: ${label}`}
                    onClick={() => {
                      change(setChainPick(state, slot, null));
                      setActive(slot);
                      requestAnimationFrame(() => {
                        const nodes = chain.current?.querySelectorAll<HTMLButtonElement>('.chain-node-main');
                        nodes?.[slots.indexOf(slot)]?.focus();
                      });
                    }}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {active !== null && (
        <div
          ref={tray}
          className="chain-tray"
          role="group"
          aria-label={`Valg til ${slotName(discipline, active)}`}
        >
          {options.length === 0 ? (
            <p className="chain-empty">Ingen spring passer her med de øvrige valg.</p>
          ) : (
            <div className="chain-tiles">
              {options.map((option) => {
                const count = option.count;
                const selected = current?.kind === option.kind;
                return (
                  <button
                    key={option.kind}
                    type="button"
                    className="chain-tile"
                    aria-pressed={selected}
                    aria-label={`${option.label}, ${count} spring`}
                    style={{ '--share': count / max } as CSSProperties}
                    onClick={() => {
                      if (selected) {
                        change(setChainPick(state, active, null));
                        return;
                      }
                      const next = setChainPick(state, active, { kind: option.kind });
                      change(next);
                      if (option.variants.length <= 1) advance(active, next);
                    }}
                  >
                    <span className="chain-tile-label">{option.label}</span>
                    <span className="chain-tile-count" aria-hidden="true">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {chosen && chosen.variants.length > 1 && (
            <div className="chain-variants" role="group" aria-label={`Varianter af ${chosen.label}`}>
              <button
                type="button"
                className="chain-variant"
                aria-pressed={!current?.variant}
                onClick={() => change(setChainPick(state, active, { kind: chosen.kind }))}
              >
                Alle {chosen.label.toLocaleLowerCase('da-DK')}
              </button>
              {chosen.variants.map((variant) => (
                <button
                  key={variant.key}
                  type="button"
                  className="chain-variant"
                  aria-pressed={current?.variant === variant.key}
                  aria-label={`${variant.label}, ${variant.count} spring`}
                  onClick={() => {
                    const next = setChainPick(state, active, { kind: chosen.kind, variant: variant.key });
                    change(next);
                    advance(active, next);
                  }}
                >
                  {variant.label}
                  <span aria-hidden="true">{variant.count}</span>
                </button>
              ))}
            </div>
          )}
          {active !== 'ending' && active + 1 < maxSlots && (
            <div className="chain-tray-foot">
              <button type="button" className="quiet chain-next" onClick={() => advance(active)}>
                {current ? 'Næste spring' : 'Spring pladsen over'} <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
