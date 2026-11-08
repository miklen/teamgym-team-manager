import { canonicalJson } from '@teamgym/domain';
import type { ElementExecution } from '@teamgym/domain';
import type { SpringDefinition } from './spring-library';
import {
  capitalize,
  isSaltoFamily,
  saltoRotations,
  seriesLabels,
  springElementLabel,
  springName,
} from './spring-names';

/** En plads i kæden: elementtype og evt. præcis variant. */
export interface ChainPick {
  kind: string;
  variant?: string;
}
export type ChainSlot = number | 'ending';
export interface ChainState {
  slots: readonly (ChainPick | null)[];
  ending: ChainPick | null;
}
export const EMPTY_CHAIN: ChainState = { slots: [], ending: null };

interface SlotValue {
  kind: string;
  label: string;
  variant: string;
  variantLabel: string;
}

const BODY = { tuck: 'lukket', pike: 'hoftebøjet', straight: 'strakt' } as const;

function elementKind(element: ElementExecution): [string, string] {
  if (element.family !== 'salto')
    return [element.family, capitalize(springElementLabel(element, { expected: null }).split(' · ')[0]!)];
  const rotations = saltoRotations(element);
  const positions = element.bodyPositions.filter((position, index, all) => all.indexOf(position) === index);
  const body = positions.map((position) => BODY[position]).join('/');
  const label =
    rotations === 1 ? `${body} salto` : rotations === 2 ? `dobbelt ${body}` : `${rotations}-dobbelt ${body}`;
  return [`salto:${rotations}:${positions.join('+')}`, capitalize(label)];
}

function trampetKind(jump: ElementExecution, slot: number): [string, string] | null {
  if (slot === 0)
    return jump.apparatus === 'pegasus' ? ['pegasus', 'Med redskab'] : ['trampet', 'Uden redskab'];
  if (slot !== 1) return null;
  if (jump.family === 'tsukahara') return ['tsukahara', 'Tsukahara'];
  if (['handspring-vault', 'overslag-salto', 'cartwheel-vault'].includes(jump.family))
    return ['overslag', 'Overslag'];
  if (isSaltoFamily(jump.family))
    return saltoRotations(jump) === 1
      ? ['single', 'Enkelt salto']
      : saltoRotations(jump) === 2
        ? ['double', 'Dobbelt salto']
        : ['other', 'Øvrige saltoer'];
  return ['other', 'Øvrige spring'];
}

/** Pladsens værdi: bane bruger elementet på pladsen; trampet bruger redskab og springtype. */
export function chainSlotValue(definition: SpringDefinition, slot: ChainSlot): SlotValue | null {
  if (definition.discipline === 'trampet') {
    if (slot === 'ending') return null;
    const kind = trampetKind(definition.jump, slot);
    if (!kind) return null;
    // Redskabet har ingen varianter; springtypen præciseres til det enkelte spring.
    return slot === 0
      ? { kind: kind[0], label: kind[1], variant: kind[0], variantLabel: kind[1] }
      : {
          kind: kind[0],
          label: kind[1],
          variant: canonicalJson(definition.jump),
          variantLabel: springName(definition),
        };
  }
  const index = slot === 'ending' ? definition.elements.length - 1 : slot;
  const element = definition.elements[index];
  if (!element) return null;
  const [kind, label] = elementKind(element);
  return {
    kind,
    label,
    variant: canonicalJson(element),
    variantLabel: capitalize(seriesLabels(definition.elements)[index]!),
  };
}

function matchesPick(definition: SpringDefinition, slot: ChainSlot, pick: ChainPick | null) {
  if (!pick) return true;
  const value = chainSlotValue(definition, slot);
  return !!value && value.kind === pick.kind && (!pick.variant || value.variant === pick.variant);
}

export function matchesChain(definition: SpringDefinition, state: ChainState, skip?: ChainSlot) {
  return (
    state.slots.every((pick, index) => index === skip || matchesPick(definition, index, pick)) &&
    (skip === 'ending' || matchesPick(definition, 'ending', state.ending))
  );
}

export function chainSlotCount(definition: SpringDefinition) {
  return definition.discipline === 'trampet' ? 2 : definition.elements.length;
}

const isSalto = (element: ElementExecution | undefined) => element?.family === 'salto';

/**
 * Trænergodkendt tabel over næsten umulige indbyggede serier (brugertest 1. november 2026); alt andet er åbent.
 * De bygges i stedet med Byg selv. Kun visning: påvirker hverken D, gyldighed eller fundament.
 */
export function springListExclusion(definition: SpringDefinition): string | null {
  if (definition.discipline !== 'tumbling') return null;
  const elements = definition.elements;
  if (isSalto(elements[0]) && saltoRotations(elements[0]!) >= 2) return 'Start med dobbeltsalto';
  for (let index = 1; index < elements.length; index++) {
    const previous = elements[index - 1]!;
    const element = elements[index]!;
    if (
      isSalto(previous) &&
      previous.direction === 'forward' &&
      isSalto(element) &&
      element.direction === 'backward'
    )
      return 'Baglæns salto direkte efter forlæns salto';
  }
  return null;
}

/** Egne og arbejdsrummets serier vises altid; indbyggede kun uden for tabellen. */
export function listedSpring(choice: { definition: SpringDefinition; fromWorkspace?: boolean }) {
  return choice.fromWorkspace === true || springListExclusion(choice.definition) === null;
}

export interface ChainVariant {
  key: string;
  label: string;
  count: number;
}
export interface ChainOption {
  kind: string;
  label: string;
  count: number;
  variants: ChainVariant[];
}

/** Valg på en plads under alle øvrige pladsers valg, med antal spring for hvert valg. */
export function chainOptions(
  definitions: readonly SpringDefinition[],
  state: ChainState,
  slot: ChainSlot,
): ChainOption[] {
  const options = new Map<string, ChainOption & { variantMap: Map<string, ChainVariant> }>();
  for (const definition of definitions) {
    if (!matchesChain(definition, state, slot)) continue;
    const value = chainSlotValue(definition, slot);
    if (!value) continue;
    let option = options.get(value.kind);
    if (!option) {
      option = { kind: value.kind, label: value.label, count: 0, variants: [], variantMap: new Map() };
      options.set(value.kind, option);
    }
    let variant = option.variantMap.get(value.variant);
    if (!variant) {
      variant = { key: value.variant, label: value.variantLabel, count: 0 };
      option.variantMap.set(value.variant, variant);
    }
    option.count++;
    variant.count++;
  }
  return [...options.values()]
    .map(({ variantMap, ...option }) => ({ ...option, variants: [...variantMap.values()] }))
    .sort((a, b) => b.count - a.count);
}

/** Etiket for en valgt plads; et valg, der ikke længere findes, vises med sin nøgle. */
export function chainPickLabel(
  definitions: readonly SpringDefinition[],
  slot: ChainSlot,
  pick: ChainPick,
): string {
  for (const definition of definitions) {
    const value = chainSlotValue(definition, slot);
    if (value?.kind !== pick.kind) continue;
    if (!pick.variant) return value.label;
    if (value.variant === pick.variant) return value.variantLabel;
  }
  return pick.variant ?? pick.kind;
}

export function setChainPick(state: ChainState, slot: ChainSlot, pick: ChainPick | null): ChainState {
  if (slot === 'ending') return { ...state, ending: pick };
  const slots = [...state.slots];
  while (slots.length <= slot) slots.push(null);
  slots[slot] = pick;
  while (slots.length && slots.at(-1) === null) slots.pop();
  return { ...state, slots };
}

export function chainIsEmpty(state: ChainState) {
  return state.slots.length === 0 && !state.ending;
}

/**
 * Elementer, som Byg selv kan starte fra: kædens pladser forfra, så længe hver plads peger på ét
 * præcist element (valgt variant eller den eneste i biblioteket). En præcis slutning tilføjes til sidst.
 */
export function chainPrefill(definitions: readonly SpringDefinition[], state: ChainState): ElementExecution[] {
  const matching = definitions.filter((definition) => matchesChain(definition, state));
  const concrete = (slot: ChainSlot, pick: ChainPick | null) => {
    if (!pick) return null;
    if (pick.variant) return pick.variant;
    const variants = new Set(
      matching.flatMap((definition) => {
        const value = chainSlotValue(definition, slot);
        return value?.kind === pick.kind ? [value.variant] : [];
      }),
    );
    return variants.size === 1 ? [...variants][0]! : null;
  };
  if (definitions.some((definition) => definition.discipline === 'trampet')) {
    const jump = concrete(1, state.slots[1] ?? null);
    return jump ? [JSON.parse(jump) as ElementExecution] : [];
  }
  const elements: string[] = [];
  for (const [slot, pick] of state.slots.entries()) {
    const variant = concrete(slot, pick);
    if (!variant) break;
    elements.push(variant);
  }
  const ending = concrete('ending', state.ending);
  if (ending && elements.length > 0 && elements.at(-1) !== ending && elements.length === state.slots.length) elements.push(ending);
  return elements.map((variant) => JSON.parse(variant) as ElementExecution);
}
