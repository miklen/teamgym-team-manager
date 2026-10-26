import {
  canonicalJson,
  chooseInheritanceSource,
  confirmConnection,
  newEntityId,
  reconcileInheritance,
  registerAthleteSkill,
  relationKey,
  setOwnAssessment,
  skillIdentity,
  validateWorkspace,
} from '@teamgym/domain';
import type {
  ElementExecution,
  InheritanceContext,
  SkillDefinition,
  Stability,
  Workspace,
} from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { canStartFloorSeries, knownSeries } from './spring-connections';
import { restoreRemovedSkill } from './restore-skill';

export type SpringDefinition = Exclude<SkillDefinition, { discipline: 'rhythm' }>;
export interface SpringChoice {
  id: string;
  group: string;
  aliases: string[];
  definition: SpringDefinition;
  own: boolean;
}

/** Rækkefølgen gælder saltoerne i serien, ikke tilløb eller gymnastens løberetning. */
export function springDirectionText(skill: SkillDefinition): string {
  if (skill.discipline === 'rhythm') return '';
  const elements = (skill.discipline === 'tumbling' ? skill.elements : [skill.jump]).filter((item) =>
    ['salto', 'overslag-salto', 'tsukahara'].includes(item.family),
  );
  if (!elements.length) return '';
  const directions = elements.map((item) =>
    item.direction === 'backward' ? 'baglæns' : item.direction === 'forward' ? 'forlæns' : 'sidelæns',
  );
  return `${elements.length === 1 ? 'Salto' : 'Saltoer'}: ${directions.join(' → ')}`;
}

export function springElementName(
  element: ElementExecution,
  rulePackage: RulePackage,
  catalogName?: string,
): string {
  const record = rulePackage.springCatalog.find(
    (item) => JSON.stringify(item.execution) === JSON.stringify(element),
  );
  const direction =
    element.direction === 'backward' ? 'baglæns' : element.direction === 'forward' ? 'forlæns' : 'sidelæns';
  if (element.family === 'salto') {
    const body = element.bodyPositions
      .map((position) => ({ tuck: 'lukket', pike: 'hoftebøjet', straight: 'strakt' })[position])
      .join(' → ');
    const rotation =
      element.rotationQuarterTurns === 8 ? 'dobbelt ' : element.rotationQuarterTurns === 12 ? 'trippel ' : '';
    const rudy =
      element.direction === 'forward' &&
      element.rotationQuarterTurns === 4 &&
      body === 'strakt' &&
      element.twistsHalfTurns === 3;
    const salto = record?.startRole || catalogName?.endsWith(' start') ? 'startsalto' : 'salto';
    const name = `${rudy ? 'Rudy · ' : ''}${rotation}${body} ${salto} ${element.twistsHalfTurns * 180}° (${direction})${element.twistDistribution.length > 1 ? ` · ${element.twistDistribution.map((value) => `${value * 180}°`).join(' + ')}` : ''}`;
    return name.charAt(0).toLocaleUpperCase('da-DK') + name.slice(1);
  }
  return record
    ? `${(catalogName ?? record.name).replace(/\b(180|360|540|720|900|1080|1260|1440)(?!\d|°)/g, '$1°')}${['overslag-salto', 'tsukahara'].includes(element.family) ? ` (${direction})` : ''}`
    : `${element.family} · ${direction} · ${element.rotationQuarterTurns / 4} rotation · ${element.twistsHalfTurns * 180}°`;
}

export function springSeriesName(elements: readonly ElementExecution[], rulePackage: RulePackage): string {
  const fixed: Record<string, string> = {
    roundoff: 'rondat',
    flic: 'flik',
    handspring: 'kraftspring',
    flyspring: 'flyvespring',
    whipback: 'whipback',
    cartwheel: 'vejrmølle',
  };
  const name = elements
    .map((element) => {
      if (fixed[element.family]) return fixed[element.family];
      if (
        element.family === 'salto' &&
        element.rotationQuarterTurns === 4 &&
        element.bodyPositions.length === 1 &&
        element.bodyPositions[0] === 'straight'
      ) {
        if (element.direction === 'forward')
          return (
            (
              {
                0: 'strakt',
                1: 'barani',
                2: 'forlæns helskrue',
                3: 'rudy',
                4: 'forlæns dobbeltskrue',
                5: 'randy',
              } as Record<number, string>
            )[element.twistsHalfTurns] ?? springElementName(element, rulePackage)
          );
        if (element.direction === 'backward')
          return (
            (
              {
                0: 'strakt baglæns',
                1: 'baglæns halvskrue',
                2: 'helskrue',
                3: 'baglæns 1½ skrue',
                4: 'dobbeltskrue',
              } as Record<number, string>
            )[element.twistsHalfTurns] ?? springElementName(element, rulePackage)
          );
      }
      return springElementName(element, rulePackage).replace(/ start/, '');
    })
    .join(' – ');
  return name.charAt(0).toLocaleUpperCase('da-DK') + name.slice(1);
}

/** Opskrifter til registrering, ikke nye reglementskoder eller automatisk gymnastkunnen. */
export function springLibrary(
  rulePackage: RulePackage,
  workspace: Pick<Workspace, 'skills'>,
): SpringChoice[] {
  const choices: SpringChoice[] = [];
  const seen = new Map<string, SpringChoice>();
  function add(choice: SpringChoice) {
    if (choice.definition.discipline === 'tumbling' && !canStartFloorSeries(choice.definition.elements))
      return;
    choice.aliases.push(
      choice.definition.discipline === 'tumbling'
        ? springSeriesName(choice.definition.elements, rulePackage)
        : springElementName(choice.definition.jump, rulePackage),
    );
    const identity = rulePackage.evaluateSkill(choice.definition).identity;
    const previous = seen.get(identity);
    if (previous) {
      previous.aliases.push(choice.definition.name, ...choice.aliases);
      return;
    }
    seen.set(identity, choice);
    choices.push(choice);
  }
  function series(id: string, name: string, references: string[], group: string, aliases: string[] = []) {
    const records = references.map((reference) =>
      rulePackage.springCatalog.find((item) => item.referenceId === reference),
    );
    if (records.some((record) => !record || record.status !== 'allowed')) return;
    const definition: SpringDefinition = {
      id: `common-${id}`,
      name,
      archived: false,
      discipline: 'tumbling',
      elements: records.map((record) => structuredClone(record!.execution)),
      connection: { kind: 'standard', transitions: references.slice(1).map(() => 'direct') },
    };
    if (!knownSeries(definition.elements)) {
      definition.connection.kind = 'custom';
    }
    add({ id: definition.id, definition, group, aliases, own: false });
  }

  // Et afgrænset sæt velkendte indgange og afslutninger; ingen fri krydsning af elementer.
  const backEnds = [
    ['a3-b-04', 'lukket salto', 'lukket'],
    ['a3-b-05', 'hoftebøjet salto', 'hofte'],
    ['a3-b-06', 'strakt salto', 'strakt'],
    ['a3-b-10', 'strakt 1/2 (180°)', 'halvskrue'],
    ['a3-b-11', 'strakt 1/1 (360°)', 'helskrue hel'],
    ['a3-b-12', 'strakt 1½ (540°)', 'halvanden skrue 1.5'],
    ['a3-b-13', 'strakt 2/1 (720°)', 'dobbeltskrue 2/2'],
    ['a3-b-15', 'dobbelt lukket salto', 'dobbeltbaglænder DB'],
    ['a3-b-16', 'dobbelt hoftebøjet salto', 'dobbeltbaglænder DB hofte'],
  ];
  const frontEnds = [
    ['a3-f-04', 'lukket salto', 'lukket'],
    ['a3-f-06', 'hoftebøjet salto', 'hofte'],
    ['a3-f-08', 'strakt salto', 'strakt'],
    ['a3-f-13', 'barani (strakt 180°)', 'halvskrue 1/2'],
    ['a3-f-14', 'strakt 1/1 (360°)', 'helskrue'],
    ['a3-f-16', 'rudy (strakt 540°)', 'rudi halvanden skrue 1½'],
    ['a3-f-17', 'strakt 2/1 (720°)', 'dobbeltskrue'],
    ['a3-f-18', 'randy (strakt 900°)', 'randolph 2½'],
  ];
  // Hyppigste juniorserie først, også når søgningen er tom.
  series('rf-full', 'Rondat – flik – strakt 1/1 (360°)', ['a3-b-01', 'a3-b-02', 'a3-b-11'], 'Baglæns', [
    'rondat-flik-1/1',
    'flik hel',
    'helskrue',
    'RF1/1',
  ]);
  series('h-barani', 'Kraftspring – barani (strakt 180°)', ['a3-f-02', 'a3-f-13'], 'Forlæns', [
    'kraft barani',
  ]);
  series(
    'sh-barani',
    'Strakt – kraftspring – barani (strakt 180°)',
    ['a3-f-08', 'a3-f-02', 'a3-f-13'],
    'Forlæns',
    ['strakt kraft barani'],
  );
  for (const [leadId, leadName, lead] of [
    ['rf', 'Rondat – flik', ['a3-b-01', 'a3-b-02']],
    ['rff', 'Rondat – flik – flik', ['a3-b-01', 'a3-b-02', 'a3-b-02']],
    ['rw', 'Rondat – whipback', ['a3-b-01', 'a3-b-03']],
    ['rfw', 'Rondat – flik – whipback', ['a3-b-01', 'a3-b-02', 'a3-b-03']],
  ] as const) {
    series(leadId, leadName, [...lead], 'Baglæns');
    for (const [endId, endName, alias] of backEnds) {
      series(`${leadId}-${endId}`, `${leadName} – ${endName}`, [...lead, endId!], 'Baglæns', [alias!]);
    }
  }
  for (const [endId, endName, alias] of backEnds.slice(0, 7)) {
    series(`r-${endId}`, `Rondat – ${endName}`, ['a3-b-01', endId!], 'Baglæns', [alias!]);
  }
  // To saltoer efter rondat, med eller uden flik: retninger er udtrykkelige i hvert valg.
  for (const [leadId, leadName, lead] of [
    ['r', 'Rondat', ['a3-b-01']],
    ['rf', 'Rondat – flik', ['a3-b-01', 'a3-b-02']],
  ] as const) {
    for (const [firstId, firstName] of backEnds.slice(0, 3)) {
      for (let body = 0; body < 3; body++) {
        for (const [direction, endings] of [
          ['baglæns', backEnds.slice(0, 3)],
          ['forlæns', frontEnds.slice(0, 3)],
        ] as const) {
          const [lastId, lastName] = endings[body]!;
          series(
            `${leadId}-${firstId}-${lastId}`,
            `${leadName} – ${firstName} baglæns – ${lastName} ${direction}`,
            [...lead, firstId!, lastId!],
            direction === 'baglæns' ? 'Baglæns' : 'Blandede',
            ['rondat salto salto', direction === 'baglæns' ? 'baglænder baglænder' : 'baglænder forlænder'],
          );
        }
      }
    }
  }
  for (const [startId, startName] of [
    ['a3-f-04', 'Lukket salto'],
    ['a3-f-06', 'Hoftebøjet salto'],
    ['a3-f-08', 'Strakt'],
  ] as const) {
    series(`${startId}-r`, `${startName} – rondat`, [startId, 'a3-b-01'], 'Blandede');
    series(`${startId}-rf`, `${startName} – rondat – flik`, [startId, 'a3-b-01', 'a3-b-02'], 'Blandede');
    for (const [endId, endName, alias] of backEnds)
      series(
        `${startId}-rf-${endId}`,
        `${startName} – rondat – flik – ${endName}`,
        [startId, 'a3-b-01', 'a3-b-02', endId!],
        'Blandede',
        [alias!],
      );
  }
  for (const [startId, startName] of [
    ['a3-f-10', 'Lukket barani'],
    ['a3-f-12', 'Hoftebøjet barani'],
    ['a3-f-13', 'Barani'],
    ['a3-f-16', 'Rudy'],
  ] as const) {
    for (const [leadId, leadName] of [
      ['a3-b-02', 'flik'],
      ['a3-b-03', 'whipback'],
    ] as const) {
      series(`${startId}-${leadId}`, `${startName} – ${leadName}`, [startId, leadId], 'Blandede');
      for (const [endId, endName, alias] of backEnds)
        series(
          `${startId}-${leadId}-${endId}`,
          `${startName} – ${leadName} – ${endName}`,
          [startId, leadId, endId!],
          'Blandede',
          [alias!],
        );
    }
  }
  for (const [leadId, leadName, lead] of [
    ['h', 'Kraftspring', ['a3-f-02']],
    ['fs', 'Flyvespring', ['a3-f-03']],
    ['oh', 'Lukket salto – kraftspring', ['a3-f-04', 'a3-f-02']],
    ['ph', 'Hoftebøjet salto – kraftspring', ['a3-f-06', 'a3-f-02']],
    ['sh', 'Strakt – kraftspring', ['a3-f-08', 'a3-f-02']],
  ] as const) {
    series(leadId, leadName, [...lead], 'Forlæns');
    for (const [endId, endName, alias] of frontEnds) {
      series(`${leadId}-${endId}`, `${leadName} – ${endName}`, [...lead, endId!], 'Forlæns', [
        alias!,
        leadName.replace('spring', ''),
      ]);
    }
  }
  // Selvstændige spring med indgang samt komplette trampetspring. Alle elementer bevares i Byg selv.
  for (const entry of rulePackage.springCatalog) {
    if (entry.status === 'forbidden') continue;
    const floor = entry.execution.apparatus === 'floor';
    const definition: SpringDefinition = floor
      ? {
          id: `common-${entry.referenceId}`,
          name:
            entry.execution.family === 'salto' ? springElementName(entry.execution, rulePackage) : entry.name,
          archived: false,
          discipline: 'tumbling',
          elements: [structuredClone(entry.execution)],
          connection: { kind: 'standard', transitions: [] },
        }
      : {
          id: `common-${entry.referenceId}`,
          name: springElementName(entry.execution, rulePackage),
          archived: false,
          discipline: 'trampet',
          jump: structuredClone(entry.execution),
        };
    add({
      id: definition.id,
      definition,
      group: floor
        ? entry.execution.direction === 'backward'
          ? 'Baglæns'
          : 'Forlæns'
        : entry.execution.apparatus === 'pegasus'
          ? 'Med redskab'
          : 'Uden redskab',
      aliases: [
        ...entry.aliases,
        entry.name,
        entry.officialCode,
        ...(entry.execution.family === 'salto' &&
        entry.execution.direction === 'forward' &&
        entry.execution.rotationQuarterTurns === 4 &&
        entry.execution.bodyPositions.length === 1 &&
        entry.execution.twistsHalfTurns === 3 &&
        entry.execution.bodyPositions[0] === 'straight'
          ? ['rudy', 'rudi']
          : []),
      ],
      own: false,
    });
  }
  // Samme arbejdsrums færdighedsdefinitioner er biblioteket, også efter gem/genåbn.
  // Registreringer, vurderinger og forbindelsesbekræftelser deles aldrig mellem gymnaster.
  for (const definition of workspace.skills) {
    if (definition.discipline === 'rhythm' || definition.archived) continue;
    const identity = rulePackage.evaluateSkill(definition).identity;
    const previous = seen.get(identity);
    if (previous) {
      previous.aliases.push(previous.definition.name, definition.name);
      previous.definition = structuredClone(definition);
      continue;
    }
    add({
      id: `own-${definition.id}`,
      definition: structuredClone(definition),
      group: 'Egne spring',
      aliases: [],
      own: true,
    });
  }
  return choices;
}

function normalizeSpringSearch(text: string) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase('da-DK')
    .replace(/[\u2010-\u2015\u2212-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Navnets begyndelse og sammenhængende ord prioriteres før løse ord på tværs af serien. */
export function springSearchRank(choice: SpringChoice, query: string): number | null {
  const needle = normalizeSpringSearch(query);
  if (!needle) return 0;
  const name = normalizeSpringSearch(choice.definition.name);
  const aliases = choice.aliases.map(normalizeSpringSearch);
  const text = [name, normalizeSpringSearch(choice.group), ...aliases].join(' ');
  if (!needle.split(' ').every((part) => text.includes(part))) return null;
  if (name === needle) return 0;
  if (name.startsWith(`${needle} `)) return 1;
  if (aliases.includes(needle)) return 2;
  if (aliases.some((alias) => alias.startsWith(`${needle} `))) return 3;
  if (name.includes(needle)) return 4;
  if (aliases.some((alias) => alias.includes(needle))) return 5;
  return 6;
}

export function matchesSpring(choice: SpringChoice, query: string) {
  return springSearchRank(choice, query) !== null;
}

/** Kun præcise begyndelser af den valgte serie; aldrig færre skruer eller nye forbindelser. */
export function shorterSeries(skill: SpringDefinition, rulePackage: RulePackage): SpringDefinition[] {
  if (skill.discipline !== 'tumbling') return [];
  return skill.elements.slice(0, -1).map((_, index) => {
    const elements = structuredClone(skill.elements.slice(0, index + 1));
    const name = springSeriesName(elements, rulePackage);
    return {
      ...skill,
      id: newEntityId(),
      name,
      elements,
      connection: { ...skill.connection, transitions: skill.connection.transitions.slice(0, index) },
    };
  });
}

export function registerSpring(
  workspace: Workspace,
  athleteId: string,
  skill: SpringDefinition,
  rulePackage: RulePackage,
  includeShorter: boolean,
  confirmation: string | null,
) {
  let result = workspace;
  let registrationId = '';
  const definitions = [skill, ...(includeShorter ? shorterSeries(skill, rulePackage) : [])];
  for (const definition of definitions) {
    const identity = rulePackage.evaluateSkill(definition).identity;
    const existing = result.athleteSkills.find(
      (item) =>
        item.athleteId === athleteId &&
        result.skills.some(
          (candidate) =>
            candidate.id === item.skillId &&
            candidate.discipline !== 'rhythm' &&
            rulePackage.evaluateSkill(candidate).identity === identity,
        ),
    );
    if (existing) {
      registrationId ||= existing.id;
      continue;
    }
    const reusable = result.skills.find(
      (candidate) =>
        candidate.discipline !== 'rhythm' && rulePackage.evaluateSkill(candidate).identity === identity,
    );
    const added = registerAthleteSkill(result, athleteId, reusable ?? { ...definition, id: newEntityId() });
    result = added.workspace;
    registrationId ||= added.athleteSkillId;
    const registered = result.skills.find(
      (candidate) =>
        candidate.id === result.athleteSkills.find((item) => item.id === added.athleteSkillId)!.skillId,
    )!;
    if (confirmation && registered.discipline === 'tumbling' && registered.connection.kind === 'custom') {
      result = confirmConnection(result, added.athleteSkillId, confirmation);
    }
  }
  return { workspace: result, registrationId };
}

export interface SpringSelection {
  definition: SpringDefinition;
  stability: Stability | null;
  confirmed: boolean;
  confirmationNote?: string;
}
export const FOUNDATION_CATALOG = { id: 'spring-foundation', version: '2' } as const;
export interface FoundationEntry {
  definition: SpringDefinition;
  relationId: string;
  unresolved: boolean;
}

/** Det afgrænsede trænerkatalog. Ingen generalisering ud fra D. */
function foundationSteps(
  skill: SpringDefinition,
  rulePackage: RulePackage,
  withoutEntry: boolean,
): FoundationEntry[] {
  const result = shorterSeries(skill, rulePackage).map((definition) => ({
    definition,
    relationId: 'exact-prefix',
    unresolved: false,
  }));
  const add = (definition: SpringDefinition, relationId: string, unresolved = false) => {
    definition.name =
      definition.discipline === 'tumbling'
        ? springSeriesName(definition.elements, rulePackage)
        : springElementName(definition.jump, rulePackage);
    if (!result.some((item) => skillIdentity(item.definition) === skillIdentity(definition)))
      result.push({ definition, relationId, unresolved });
  };
  if (
    withoutEntry &&
    skill.discipline === 'tumbling' &&
    skill.elements[0]?.family === 'salto' &&
    skill.elements.length > 1
  ) {
    const first = skill.elements[0];
    const elements = structuredClone(skill.elements.slice(1));
    const knownEntry = rulePackage.springCatalog.some(
      (entry) => entry.status === 'allowed' && canonicalJson(entry.execution) === canonicalJson(first),
    );
    if (
      knownEntry &&
      first.apparatus === 'floor' &&
      first.direction === 'forward' &&
      canStartFloorSeries(elements)
    ) {
      add(
        {
          ...structuredClone(skill),
          id: newEntityId(),
          elements,
          connection: { ...skill.connection, transitions: skill.connection.transitions.slice(1) },
        },
        'without-entry-salto',
      );
    }
  }
  if (skill.discipline === 'tumbling' && skill.elements.length === 3) {
    const [r, f, last] = skill.elements;
    if (
      r?.family === 'roundoff' &&
      f?.family === 'flic' &&
      last?.family === 'salto' &&
      last.direction === 'backward' &&
      last.rotationQuarterTurns === 4 &&
      canonicalJson(last.bodyPositions) === '["straight"]' &&
      last.twistsHalfTurns === 2 &&
      [r, f, last].every((element) =>
        rulePackage.springCatalog.some(
          (entry) => entry.status === 'allowed' && canonicalJson(entry.execution) === canonicalJson(element),
        ),
      )
    ) {
      for (const position of ['tuck', 'pike', 'straight'] as const) {
        const execution = rulePackage.springCatalog.find(
          (entry) =>
            entry.status === 'allowed' &&
            entry.execution.family === 'salto' &&
            entry.execution.apparatus === 'floor' &&
            entry.execution.direction === 'backward' &&
            entry.execution.rotationQuarterTurns === 4 &&
            entry.execution.twistsHalfTurns === 0 &&
            canonicalJson(entry.execution.bodyPositions) === canonicalJson([position]),
        )?.execution;
        if (execution)
          add(
            {
              ...structuredClone(skill),
              id: newEntityId(),
              elements: [structuredClone(r), structuredClone(f), structuredClone(execution)],
            },
            'full-twist-positions',
          );
      }
    }
  }
  if (skill.discipline === 'trampet') {
    const jump = skill.jump;
    if (
      jump.family === 'salto' &&
      jump.direction === 'forward' &&
      jump.apparatus === 'trampet' &&
      jump.takeoff === 'two-feet' &&
      jump.landing === 'feet' &&
      jump.twistsHalfTurns === 3 &&
      canonicalJson(jump.variant) === '{}'
    ) {
      if (jump.rotationQuarterTurns === 4 && canonicalJson(jump.bodyPositions) === '["straight"]') {
        for (const position of ['tuck', 'pike', 'straight'] as const)
          for (const twists of [0, 1]) {
            const execution = rulePackage.springCatalog.find(
              (entry) =>
                entry.status === 'allowed' &&
                entry.execution.family === 'salto' &&
                entry.execution.apparatus === 'trampet' &&
                entry.execution.direction === 'forward' &&
                entry.execution.rotationQuarterTurns === 4 &&
                entry.execution.twistsHalfTurns === twists &&
                canonicalJson(entry.execution.bodyPositions) === canonicalJson([position]) &&
                entry.execution.takeoff === jump.takeoff &&
                entry.execution.landing === jump.landing,
            )?.execution;
            if (execution)
              add(
                { ...structuredClone(skill), id: newEntityId(), jump: structuredClone(execution) },
                'rudy-foundation',
              );
          }
      }
      if (jump.rotationQuarterTurns === 8 && jump.bodyPositions.length === 2) {
        const precise =
          jump.twistDistribution.length === 2 && jump.twistDistribution.reduce((a, b) => a + b, 0) === 3;
        add(
          {
            ...structuredClone(skill),
            id: newEntityId(),
            jump: {
              ...structuredClone(jump),
              twistsHalfTurns: 1,
              twistDistribution: precise ? jump.twistDistribution.map((value) => value % 2) : [],
            },
          },
          'double-540-180',
          !precise,
        );
      }
    }
  }
  return result;
}

/** Version 1 bevares præcist. Version 2 lukker fundamentet under fjernelse af en indgangssalto. */
export function springFoundation(
  skill: SpringDefinition,
  rulePackage: RulePackage,
  version: string = FOUNDATION_CATALOG.version,
): FoundationEntry[] {
  if (version === '1') return foundationSteps(skill, rulePackage, false);
  if (version !== '2') return [];
  const result: FoundationEntry[] = [];
  const seen = new Set([skillIdentity(skill)]);
  const pending = foundationSteps(skill, rulePackage, true);
  for (let index = 0; index < pending.length; index++) {
    const entry = pending[index]!;
    const identity = skillIdentity(entry.definition);
    if (seen.has(identity)) continue;
    seen.add(identity);
    result.push(entry);
    if (!entry.unresolved)
      for (const child of foundationSteps(entry.definition, rulePackage, true))
        pending.push({ ...child, relationId: `${entry.relationId}:${child.relationId}` });
  }
  return result;
}

export function springInheritanceContext(
  rulePackage: RulePackage,
  fingerprint = `${rulePackage.manifest.rulesetId}:${rulePackage.manifest.packageVersion}`,
): InheritanceContext {
  return {
    fingerprint,
    difficulty: (skill, registration) =>
      skill.discipline === 'rhythm' ? null : rulePackage.evaluateSkill(skill, registration).difficulty.value,
    accepts: (relation, source, target) =>
      relation.catalogId === FOUNDATION_CATALOG.id &&
      ['1', '2'].includes(relation.catalogVersion) &&
      source.discipline !== 'rhythm' &&
      springFoundation(source, rulePackage, relation.catalogVersion).some(
        (entry) =>
          !entry.unresolved &&
          entry.relationId === relation.relationId &&
          skillIdentity(entry.definition) === skillIdentity(target),
      ),
  };
}

export interface FoundationOptions {
  following?: readonly string[];
  excluded?: readonly string[];
  ownAssessments?: ReadonlyMap<string, Stability | null>;
  sourceChoices?: ReadonlyMap<string, string>;
  workspace?: Workspace;
  athleteId?: string;
}
export interface PlannedSpring extends SpringSelection {
  explicit: boolean;
  sourceName: string;
  sourceIdentity: string | null;
  excluded: boolean;
  unresolved: boolean;
  ownAssessment: boolean;
  needsSource: boolean;
  relations: { sourceIdentity: string; relationId: string }[];
}
/** Samme deterministiske plan bruges af visning og registrering. */
export function springRegistrationPlan(
  selections: readonly SpringSelection[],
  rulePackage: RulePackage,
  includeShorter: boolean,
  options: FoundationOptions = {},
): PlannedSpring[] {
  const direct = new Map(selections.map((item) => [skillIdentity(item.definition), item]));
  const rows = new Map<
    string,
    {
      definition: SpringDefinition;
      candidates: { selection: SpringSelection; relationId: string; unresolved: boolean }[];
    }
  >();
  if (includeShorter)
    for (const selection of selections)
      for (const entry of springFoundation(selection.definition, rulePackage)) {
        const identity = skillIdentity(entry.definition);
        const row = rows.get(identity) ?? { definition: entry.definition, candidates: [] };
        row.candidates.push({ selection, relationId: entry.relationId, unresolved: entry.unresolved });
        rows.set(identity, row);
      }
  for (const [identity, selection] of direct)
    if (!rows.has(identity)) rows.set(identity, { definition: selection.definition, candidates: [] });
  const context = springInheritanceContext(rulePackage);
  for (const relation of options.workspace?.inheritanceRelations ?? []) {
    const row = rows.get(relation.targetIdentity);
    if (
      !row ||
      row.candidates.some((item) => skillIdentity(item.selection.definition) === relation.sourceIdentity)
    )
      continue;
    const registration = options.workspace!.athleteSkills.find(
      (item) => item.id === relation.sourceId && item.athleteId === options.athleteId && !item.archived,
    );
    const definition =
      registration &&
      options.workspace!.skills.find((item) => item.id === registration.skillId && !item.archived);
    if (
      !registration ||
      !definition ||
      definition.discipline === 'rhythm' ||
      !context.accepts(relation, definition, row.definition)
    )
      continue;
    row.candidates.push({
      selection: direct.get(relation.sourceIdentity) ?? {
        definition,
        stability: registration.stability,
        confirmed: !!registration.connectionConfirmation,
      },
      relationId: relation.relationId,
      unresolved: false,
    });
  }
  return [...rows].map(([identity, row]) => {
    const explicit = direct.get(identity);
    const previous = options.workspace?.athleteSkills.find(
      (item) =>
        item.athleteId === options.athleteId &&
        options.workspace!.skills.some(
          (skill) => skill.id === item.skillId && skillIdentity(skill) === identity,
        ),
    );
    const candidates = row.candidates.map((item) => ({
      ...item,
      id: skillIdentity(item.selection.definition),
      identity: skillIdentity(item.selection.definition),
      stability: item.selection.stability,
      difficulty: rulePackage.evaluateSkill(item.selection.definition).difficulty.value,
    }));
    const previousSourceId =
      previous?.assessmentOrigin.kind === 'inherited' ? previous.assessmentOrigin.sourceId : null;
    const previousSource = options.workspace?.athleteSkills.find((item) => item.id === previousSourceId);
    const previousIdentity =
      previousSource &&
      skillIdentity(options.workspace!.skills.find((item) => item.id === previousSource.skillId)!);
    const source = chooseInheritanceSource(
      candidates,
      previousIdentity,
      options.sourceChoices?.get(identity),
    );
    const fallback = candidates.slice().sort((a, b) => a.identity.localeCompare(b.identity, 'en'))[0];
    const entry = source ?? fallback;
    const own =
      options.ownAssessments?.has(identity) ||
      (!options.following?.includes(identity) &&
        !previous?.archived &&
        previous?.assessmentOrigin.kind === 'own');
    const excluded =
      !explicit &&
      (options.excluded?.includes(identity) ??
        (!!previous?.archived ||
          !!options.workspace?.inheritanceExclusions.some(
            (item) => item.athleteId === options.athleteId && item.targetIdentity === identity,
          )));
    return {
      ...(explicit ?? entry?.selection ?? { definition: row.definition, stability: null, confirmed: false }),
      definition: explicit?.definition ?? row.definition,
      explicit: !!explicit,
      sourceName: source?.selection.definition.name ?? '',
      sourceIdentity: source?.identity ?? null,
      stability: explicit
        ? explicit.stability
        : options.ownAssessments?.has(identity)
          ? options.ownAssessments.get(identity)!
          : own
            ? previous!.stability
            : (source?.stability ?? null),
      excluded,
      unresolved: !explicit && !!entry?.unresolved,
      ownAssessment: !!explicit || !!own,
      needsSource: !explicit && !own && !excluded && !source,
      relations: candidates
        .filter((item) => !item.unresolved)
        .map((item) => ({ sourceIdentity: item.identity, relationId: item.relationId })),
    };
  });
}

/** Acceptér hele kladden atomisk. Kun direkte valg bliver kandidatparents. */
export function registerSpringBatch(
  workspace: Workspace,
  athleteId: string,
  selections: readonly SpringSelection[],
  rulePackage: RulePackage,
  options: FoundationOptions & { includeShorter: boolean; assessedAt: string },
) {
  let result = structuredClone(workspace);
  const plan = springRegistrationPlan(selections, rulePackage, options.includeShorter, {
    ...options,
    workspace,
    athleteId,
  });
  if (plan.some((entry) => !entry.excluded && (entry.unresolved || entry.needsSource)))
    throw new Error(
      'Afklar skruefordeling eller vælg en arvekilde før registrering. Du kan også fravælge fundamentet.',
    );
  const ids = new Map(
    result.athleteSkills
      .filter((item) => item.athleteId === athleteId && !item.archived)
      .map((item) => [skillIdentity(result.skills.find((skill) => skill.id === item.skillId)!), item.id]),
  );
  for (const entry of [...plan].sort((a, b) => Number(b.explicit) - Number(a.explicit))) {
    const identity = skillIdentity(entry.definition);
    if (entry.excluded) {
      if (
        !result.inheritanceExclusions.some(
          (item) => item.athleteId === athleteId && item.targetIdentity === identity,
        )
      )
        result.inheritanceExclusions.push({ athleteId, targetIdentity: identity });
      continue;
    }
    if (entry.explicit || options.excluded?.includes(identity) === false)
      result.inheritanceExclusions = result.inheritanceExclusions.filter(
        (item) => item.athleteId !== athleteId || item.targetIdentity !== identity,
      );
    const added = registerSpring(result, athleteId, entry.definition, rulePackage, false, null);
    result = added.workspace;
    let registration = result.athleteSkills.find((item) => item.id === added.registrationId)!;
    if (registration.archived) {
      if (!entry.explicit && options.excluded === undefined) continue;
      result = restoreRemovedSkill(result, registration.id);
      registration = result.athleteSkills.find((item) => item.id === registration.id)!;
    }
    ids.set(identity, registration.id);
    const definition = result.skills.find((item) => item.id === registration.skillId)!;
    if (
      entry.confirmed &&
      definition.discipline === 'tumbling' &&
      rulePackage.evaluateSkill(definition, registration).connection === 'unverified'
    ) {
      result = confirmConnection(
        result,
        registration.id,
        entry.confirmationNote || `Træneren bekræfter hele serien uden mellemtrin: ${definition.name}.`,
      );
    }
    const existing = workspace.athleteSkills.find((item) => item.id === registration.id && !item.archived);
    if (entry.explicit || options.ownAssessments?.has(identity)) {
      result = setOwnAssessment(result, registration.id, {
        stability: entry.stability,
        assessedAt: entry.stability === null ? null : options.assessedAt,
        note: registration.note,
      });
    } else if (
      !existing ||
      existing.assessmentOrigin.kind === 'inherited' ||
      options.following?.includes(identity)
    ) {
      result.athleteSkills.find((item) => item.id === registration.id)!.assessmentOrigin = {
        kind: 'inherited',
        sourceId: null,
        sourceChoice: null,
      };
    }
  }
  for (const entry of plan) {
    if (entry.excluded) continue;
    const targetId = ids.get(skillIdentity(entry.definition));
    if (!targetId) continue;
    for (const relation of entry.relations) {
      const sourceId = ids.get(relation.sourceIdentity);
      if (!sourceId || sourceId === targetId) continue;
      const accepted = {
        sourceId,
        targetId,
        sourceIdentity: relation.sourceIdentity,
        targetIdentity: skillIdentity(entry.definition),
        catalogId: FOUNDATION_CATALOG.id,
        catalogVersion: FOUNDATION_CATALOG.version,
        relationId: relation.relationId,
      };
      if (
        !result.inheritanceRelations.some(
          (item) =>
            relationKey(item) === relationKey(accepted) ||
            (item.sourceId === sourceId &&
              item.targetId === targetId &&
              item.relationId === accepted.relationId &&
              springInheritanceContext(rulePackage).accepts(
                item,
                result.skills.find(
                  (skill) =>
                    skill.id ===
                    result.athleteSkills.find((registration) => registration.id === sourceId)!.skillId,
                )!,
                entry.definition,
              )),
        )
      )
        result.inheritanceRelations.push(accepted);
    }
    const chosenIdentity = options.sourceChoices?.get(skillIdentity(entry.definition));
    const chosenId = chosenIdentity && ids.get(chosenIdentity);
    const registration = result.athleteSkills.find((item) => item.id === targetId)!;
    if (registration.assessmentOrigin.kind === 'inherited' && chosenId)
      registration.assessmentOrigin.sourceChoice = {
        sourceId: chosenId,
        context: springInheritanceContext(rulePackage).fingerprint,
      };
  }
  reconcileInheritance(result, springInheritanceContext(rulePackage), new Date().toISOString());
  return validateWorkspace(result);
}
