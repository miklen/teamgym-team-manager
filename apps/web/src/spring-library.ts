import {
  canonicalJson,
  chooseInheritanceSource,
  confirmConnection,
  hasTwistDistributionChoice,
  newEntityId,
  reconcileInheritance,
  registerAthleteSkill,
  relationKey,
  setOwnAssessment,
  skillIdentity,
  skillNeedsTwistDistribution,
  validateWorkspace,
} from '@teamgym/domain';
import type {
  ElementExecution,
  InheritanceContext,
  SkillDefinition,
  Stability,
  Workspace,
} from '@teamgym/domain';
import { DK_V2 } from '@teamgym/rules';
import type { RulePackage } from '@teamgym/rules';
import { legacySpringNames } from './spring-legacy-names';
import { springName } from './spring-names';
import { canStartFloorSeries, knownSeries } from './spring-connections';
import { restoreRemovedSkill } from './restore-skill';

export type SpringDefinition = Exclude<SkillDefinition, { discipline: 'rhythm' }>;
export interface SpringChoice {
  id: string;
  group: string;
  aliases: string[];
  definition: SpringDefinition;
  own: boolean;
  /** Svarer til en færdighed i arbejdsrummet og vises derfor altid i listen. */
  fromWorkspace?: boolean;
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

function executionKey(skill: SpringDefinition) {
  return `${skill.discipline}:${canonicalJson(skill.discipline === 'tumbling' ? skill.elements : skill.jump)}`;
}

/** Sammenligning af navne uden tegnsætning, grader og store bogstaver. */
export function normalizeSpringName(text: string) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase('da-DK')
    .replace(/[\u2010-\u2015\u2212-]/g, ' ')
    .replace(/[°()·→,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const automaticNameCache = new WeakMap<RulePackage, Map<string, Set<string>>>();

/** Navne som appen tidligere selv har givet netop denne udførelse. */
function automaticNames(skill: SpringDefinition, rulePackage: RulePackage): Set<string> {
  let byKey = automaticNameCache.get(rulePackage);
  if (!byKey) automaticNameCache.set(rulePackage, (byKey = new Map()));
  const key = executionKey(skill);
  let names = byKey.get(key);
  if (!names) {
    names = new Set(
      [
        ...legacySpringNames(skill, rulePackage),
        ...(builtinSprings(rulePackage).handwritten.get(key) ?? []),
      ].map(normalizeSpringName),
    );
    byKey.set(key, names);
  }
  return names;
}

/** Vis kendte automatiske navne i den fælles grammatik; bevar egne navne og de gemte data. */
export function springDisplayName(
  skill: SkillDefinition,
  rulePackage: RulePackage | null | undefined,
): string {
  if (skill.discipline === 'rhythm') return skill.name;
  const current = springName(skill);
  const stored = normalizeSpringName(skill.name);
  if (stored === normalizeSpringName(current)) return current;
  const rules = rulePackage ?? DK_V2;
  // Katalogets navne er skrevet uden skruefordeling; et sådant navn følger springet, når fordelingen er valgt.
  return automaticNames(skill, rules).has(stored) || automaticNames(withoutTwistChoice(skill), rules).has(stored)
    ? current
    : skill.name;
}

function withoutTwistChoice(skill: SpringDefinition): SpringDefinition {
  const clear = (element: ElementExecution) =>
    hasTwistDistributionChoice(element) ? { ...element, twistDistribution: [] } : element;
  return skill.discipline === 'trampet'
    ? { ...skill, jump: clear(skill.jump) }
    : { ...skill, elements: skill.elements.map(clear) };
}

interface BuiltinSprings {
  choices: SpringChoice[];
  identities: string[];
  handwritten: Map<string, string[]>;
}
const builtinCache = new WeakMap<RulePackage, BuiltinSprings>();

/** Indbyggede opskrifter pr. regelpakke; navne følger den fælles grammatik, gamle navne er aliaser. */
function builtinSprings(rulePackage: RulePackage): BuiltinSprings {
  const cached = builtinCache.get(rulePackage);
  if (cached) return cached;
  const choices: SpringChoice[] = [];
  const identities: string[] = [];
  const handwritten = new Map<string, string[]>();
  const seen = new Map<string, SpringChoice>();
  function add(choice: SpringChoice) {
    if (choice.definition.discipline === 'tumbling' && !canStartFloorSeries(choice.definition.elements))
      return;
    const previousName = choice.definition.name;
    const key = executionKey(choice.definition);
    handwritten.set(key, [...(handwritten.get(key) ?? []), previousName]);
    choice.definition.name = springName(choice.definition);
    if (normalizeSpringName(previousName) !== normalizeSpringName(choice.definition.name))
      choice.aliases.push(previousName);
    const identity = rulePackage.evaluateSkill(choice.definition).identity;
    const previous = seen.get(identity);
    if (previous) {
      previous.aliases.push(choice.definition.name, ...choice.aliases);
      return;
    }
    seen.set(identity, choice);
    choices.push(choice);
    identities.push(identity);
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
      sharedConnectionApproval: null,
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
    ['a3-b-17', 'dobbelt strakt salto', 'dobbeltbaglænder DB strakt'],
    ['a3-b-18', 'dobbelt lukket 1/1 (360°)', 'DB hel full-in'],
    ['a3-b-19', 'dobbelt lukket 2/1 (720°)', 'DB dobbeltskrue'],
    ['a3-b-20', 'dobbelt strakt 1/1 (360°)', 'DB strakt hel'],
    ['a3-b-21', 'dobbelt strakt 2/1 (720°)', 'DB strakt dobbeltskrue'],
    ['a3-b-22', 'dobbelt strakt 3/1 (1080°)', 'DB strakt trippelskrue'],
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
    ['a3-f-19', 'dobbelt lukket salto', 'dobbeltforlænder DF'],
    ['a3-f-20', 'dobbelt hoftebøjet salto', 'dobbeltforlænder DF hofte'],
    ['a3-f-21', 'dobbelt strakt salto', 'dobbeltforlænder DF strakt'],
    ['a3-f-22', 'dobbelt lukket 1/2 (180°)', 'DF halvskrue'],
    ['a3-f-23', 'dobbelt lukket 1½ (540°)', 'DF halvanden skrue'],
    ['a3-f-24', 'dobbelt hoftebøjet 1/2 (180°)', 'DF hofte halvskrue'],
    ['a3-f-25', 'dobbelt strakt 1/2 (180°)', 'DF strakt halvskrue'],
    ['a3-f-26', 'dobbelt strakt 1½ (540°)', 'DF strakt halvanden skrue'],
    ['a3-f-27', 'dobbelt strakt 2½ (900°)', 'DF strakt to og en halv skrue'],
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
    ['a3-f-14', 'Strakt 1/1 (360°)'],
  ] as const) {
    if (startId !== 'a3-f-14')
      series(`${startId}-wheel`, `${startName} – vejrmølle`, [startId, 'a3-f-01'], 'Forlæns', ['salto mølle']);
    series(`${startId}-r`, `${startName} – rondat`, [startId, 'a3-b-01'], 'Blandede');
    // Efter rondat følger både flik og whipback med samme afslutninger.
    for (const [leadId, leadName] of [
      ['rf', 'flik'],
      ['rw', 'whipback'],
    ] as const) {
      const lead = [startId, 'a3-b-01', leadId === 'rf' ? 'a3-b-02' : 'a3-b-03'];
      series(`${startId}-${leadId}`, `${startName} – rondat – ${leadName}`, lead, 'Blandede');
      for (const [endId, endName, alias] of backEnds)
        series(
          `${startId}-${leadId}-${endId}`,
          `${startName} – rondat – ${leadName} – ${endName}`,
          [...lead, endId!],
          'Blandede',
          [alias!],
        );
    }
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
    // Kraftspring og flyvespring har samme efterfølgere, også efter en startsalto.
    ['ofs', 'Lukket salto – flyvespring', ['a3-f-04', 'a3-f-03']],
    ['pfs', 'Hoftebøjet salto – flyvespring', ['a3-f-06', 'a3-f-03']],
    ['sfs', 'Strakt – flyvespring', ['a3-f-08', 'a3-f-03']],
    ['fh', 'Strakt 1/1 (360°) – kraftspring', ['a3-f-14', 'a3-f-02']],
    ['ffs', 'Strakt 1/1 (360°) – flyvespring', ['a3-f-14', 'a3-f-03']],
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
          name: entry.name,
          archived: false,
          discipline: 'tumbling',
          elements: [structuredClone(entry.execution)],
          connection: { kind: 'standard', transitions: [] },
          sharedConnectionApproval: null,
        }
      : {
          id: `common-${entry.referenceId}`,
          name: entry.name,
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
  const result = { choices, identities, handwritten };
  builtinCache.set(rulePackage, result);
  return result;
}

/** Opskrifter til registrering, ikke nye reglementskoder eller automatisk gymnastkunnen. */
export function springLibrary(
  rulePackage: RulePackage,
  workspace: Pick<Workspace, 'skills'>,
): SpringChoice[] {
  const builtin = builtinSprings(rulePackage);
  const choices = builtin.choices.map((choice) => ({
    ...choice,
    aliases: [...choice.aliases],
    definition: structuredClone(choice.definition),
  }));
  const seen = new Map(builtin.identities.map((identity, index) => [identity, choices[index]!]));
  function add(choice: SpringChoice) {
    if (choice.definition.discipline === 'tumbling' && !canStartFloorSeries(choice.definition.elements))
      return;
    const identity = rulePackage.evaluateSkill(choice.definition).identity;
    if (seen.has(identity)) return;
    seen.set(identity, choice);
    choices.push(choice);
  }
  // Samme arbejdsrums færdighedsdefinitioner er biblioteket, også efter gem/genåbn.
  // Registreringer, vurderinger og forbindelsesbekræftelser deles aldrig mellem gymnaster.
  for (const definition of workspace.skills) {
    if (definition.discipline === 'rhythm' || definition.archived) continue;
    const identity = rulePackage.evaluateSkill(definition).identity;
    const previous = seen.get(identity);
    if (previous) {
      previous.aliases.push(previous.definition.name, definition.name);
      previous.definition = {
        ...structuredClone(definition),
        name: springDisplayName(definition, rulePackage),
      };
      previous.fromWorkspace = true;
      continue;
    }
    add({
      id: `own-${definition.id}`,
      definition: { ...structuredClone(definition), name: springDisplayName(definition, rulePackage) },
      group: 'Egne spring',
      aliases: [],
      own: true,
      fromWorkspace: true,
    });
  }
  return choices;
}

export { matchesSpring, springSearchRank } from './spring-search';

/** Kun præcise begyndelser af den valgte serie; aldrig færre skruer eller nye forbindelser. */
export function shorterSeries(skill: SpringDefinition): SpringDefinition[] {
  if (skill.discipline !== 'tumbling') return [];
  return skill.elements.slice(0, -1).map((_, index) => {
    const elements = structuredClone(skill.elements.slice(0, index + 1));
    return {
      ...skill,
      id: newEntityId(),
      name: springName({ ...skill, elements }),
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
  const definitions = [skill, ...(includeShorter ? shorterSeries(skill) : [])];
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
export const FOUNDATION_CATALOG = { id: 'spring-foundation', version: '3' } as const;
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
  const result = shorterSeries(skill).map((definition) => ({
    definition,
    relationId: 'exact-prefix',
    unresolved: false,
  }));
  const add = (definition: SpringDefinition, relationId: string, unresolved = false) => {
    definition.name = springName(definition);
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

/** Aftalte forlæns udviklingskæder; kun seriens afslutning udskiftes. */
function forwardFoundationSteps(skill: SpringDefinition, rulePackage: RulePackage): FoundationEntry[] {
  const jump = skill.discipline === 'trampet' ? skill.jump : skill.elements.at(-1);
  if (
    !jump ||
    jump.family !== 'salto' ||
    jump.direction !== 'forward' ||
    jump.apparatus !== (skill.discipline === 'trampet' ? 'trampet' : 'floor') ||
    jump.takeoff !== 'two-feet' ||
    jump.landing !== 'feet' ||
    canonicalJson(jump.variant) !== '{}'
  )
    return [];
  const result: FoundationEntry[] = [];
  const add = (execution: ElementExecution, relationId: string, unresolved = false) => {
    const definition: SpringDefinition =
      skill.discipline === 'trampet'
        ? { ...structuredClone(skill), id: newEntityId(), jump: structuredClone(execution) }
        : {
            ...structuredClone(skill),
            id: newEntityId(),
            elements: [...structuredClone(skill.elements.slice(0, -1)), structuredClone(execution)],
          };
    definition.name = springName(definition);
    result.push({ definition, relationId, unresolved });
  };
  const single =
    jump.rotationQuarterTurns === 4 &&
    jump.bodyPositions.length === 1 &&
    [1, 3, 5, 7].includes(jump.twistsHalfTurns) &&
    (jump.twistDistribution.length === 0 ||
      canonicalJson(jump.twistDistribution) === canonicalJson([jump.twistsHalfTurns])) &&
    (jump.twistsHalfTurns === 1 || jump.bodyPositions[0] === 'straight');
  const double =
    jump.rotationQuarterTurns === 8 &&
    jump.bodyPositions.length === 2 &&
    [0, 1].includes(jump.twistsHalfTurns) &&
    (jump.twistDistribution.length === 0 ||
      (jump.twistDistribution.length === 2 &&
        jump.twistDistribution.reduce((a, b) => a + b, 0) === jump.twistsHalfTurns));
  if (!single && !double) return [];
  const positions = ['tuck', 'pike', 'straight'] as const;
  // Dobbeltsalto giver alle tre enkeltsaltoer; 180° giver også de tre baranipositioner.
  const maxPosition = double ? 2 : positions.indexOf(jump.bodyPositions[0]!);
  for (const position of positions.slice(0, maxPosition + 1))
    for (const twists of [0, 1]) {
      if (single && twists === 1 && position === jump.bodyPositions[0] && jump.twistsHalfTurns === 1)
        continue;
      if (double && twists > jump.twistsHalfTurns) continue;
      const execution = rulePackage.springCatalog.find(
        (entry) =>
          entry.status === 'allowed' &&
          entry.execution.family === 'salto' &&
          entry.execution.apparatus === jump.apparatus &&
          entry.execution.direction === jump.direction &&
          entry.execution.rotationQuarterTurns === 4 &&
          entry.execution.twistsHalfTurns === twists &&
          canonicalJson(entry.execution.bodyPositions) === canonicalJson([position]) &&
          entry.execution.takeoff === jump.takeoff &&
          entry.execution.landing === jump.landing &&
          canonicalJson(entry.execution.variant) === '{}',
      )?.execution;
      if (execution) add(execution, 'forward-salto-foundation');
    }
  if (single && jump.bodyPositions[0] === 'straight')
    for (const twists of [3, 5])
      if (twists < jump.twistsHalfTurns)
        add(
          { ...structuredClone(jump), twistsHalfTurns: twists, twistDistribution: [twists] },
          'forward-twist-chain',
        );
  if (double) {
    if (jump.twistsHalfTurns === 1)
      add({ ...structuredClone(jump), twistsHalfTurns: 0, twistDistribution: [] }, 'double-without-twist');
    if (canonicalJson(jump.bodyPositions) === '["pike","pike"]') {
      const tucked = { ...structuredClone(jump), bodyPositions: ['tuck', 'tuck'] as const };
      // Bevar en kendt fordeling. Et nyt 180°-barn uden fordeling kræver afklaring.
      add(
        { ...tucked, bodyPositions: [...tucked.bodyPositions] },
        'double-pike-tuck',
        jump.twistsHalfTurns === 1 && jump.twistDistribution.length !== 2,
      );
      if (jump.twistsHalfTurns === 1)
        add(
          { ...tucked, bodyPositions: [...tucked.bodyPositions], twistsHalfTurns: 0, twistDistribution: [] },
          'double-pike-tuck-without-twist',
        );
    }
  }
  return result;
}

/** Tidligere versioner bevarer deres præcise matrix og relations-id'er. */
export function springFoundation(
  skill: SpringDefinition,
  rulePackage: RulePackage,
  version: string = FOUNDATION_CATALOG.version,
): FoundationEntry[] {
  if (version === '1') return foundationSteps(skill, rulePackage, false);
  if (!['2', '3'].includes(version)) return [];
  const result: FoundationEntry[] = [];
  const seen = new Set([skillIdentity(skill)]);
  const steps = (definition: SpringDefinition) => [
    ...foundationSteps(definition, rulePackage, true),
    ...(version === '3' ? forwardFoundationSteps(definition, rulePackage) : []),
  ];
  const pending = steps(skill);
  for (let index = 0; index < pending.length; index++) {
    const entry = pending[index]!;
    const identity = skillIdentity(entry.definition);
    if (seen.has(identity)) continue;
    seen.add(identity);
    result.push(entry);
    if (!entry.unresolved)
      for (const child of steps(entry.definition))
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
      ['1', '2', '3'].includes(relation.catalogVersion) &&
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
  /** Direkte valgt flersalto, hvor træneren endnu ikke har valgt hvor skruen sker. */
  needsTwist: boolean;
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
      sourceName: source ? springDisplayName(source.selection.definition, rulePackage) : '',
      sourceIdentity: source?.identity ?? null,
      stability: explicit
        ? explicit.stability
        : options.ownAssessments?.has(identity)
          ? options.ownAssessments.get(identity)!
          : own
            ? previous!.stability
            : (source?.stability ?? null),
      excluded,
      unresolved: !explicit && (!!entry?.unresolved || skillNeedsTwistDistribution(row.definition)),
      ownAssessment: !!explicit || !!own,
      needsSource: !explicit && !own && !excluded && !source,
      needsTwist: !!explicit && skillNeedsTwistDistribution(explicit.definition),
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
  if (plan.some((entry) => !entry.excluded && (entry.unresolved || entry.needsSource || entry.needsTwist)))
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
