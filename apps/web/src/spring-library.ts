import { confirmConnection, newEntityId, registerAthleteSkill, updateAssessment } from '@teamgym/domain';
import type { ElementExecution, SkillDefinition, Stability, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { knownSeries } from './spring-connections';

export type SpringDefinition = Exclude<SkillDefinition, { discipline: 'rhythm' }>;
export interface SpringChoice {
  id: string;
  group: string;
  aliases: string[];
  definition: SpringDefinition;
  own: boolean;
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
  return record
    ? `${catalogName ?? record.name}${element.family === 'salto' ? ` (${direction})` : ''}`
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
  // Enkeltelementer og komplette trampetspring fra det eksisterende kildekatalog.
  for (const entry of rulePackage.springCatalog) {
    if (entry.status === 'forbidden') continue;
    const floor = entry.execution.apparatus === 'floor';
    const direction = entry.execution.direction === 'backward' ? 'baglæns' : 'forlæns';
    const definition: SpringDefinition = floor
      ? {
          id: `common-${entry.referenceId}`,
          name: `${entry.name}${entry.execution.family === 'salto' ? ` ${direction}` : ''}`,
          archived: false,
          discipline: 'tumbling',
          elements: [structuredClone(entry.execution)],
          connection: { kind: 'standard', transitions: [] },
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
      group: floor ? 'Grundspring' : entry.execution.apparatus === 'pegasus' ? 'Med redskab' : 'Uden redskab',
      aliases: [...entry.aliases, entry.officialCode],
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

export function matchesSpring(choice: SpringChoice, query: string) {
  const normalize = (text: string) =>
    text.toLocaleLowerCase('da-DK').replace(/[–—-]/g, ' ').replace(/\s+/g, ' ').trim();
  const text = normalize([choice.definition.name, choice.group, ...choice.aliases].join(' '));
  return normalize(query)
    .split(' ')
    .every((part) => text.includes(part));
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
/** Et direkte valg har forrang for arv; fælles begyndelser samles uafhængigt af klikrækkefølge. */
export function springRegistrationPlan(
  selections: readonly SpringSelection[],
  rulePackage: RulePackage,
  includeShorter: boolean,
) {
  type Planned = SpringSelection & { explicit: boolean; sourceName: string };
  const planned = new Map<string, Planned>();
  const sources = new Map<string, SpringSelection>();
  for (const selection of selections) {
    if (!includeShorter) continue;
    for (const definition of shorterSeries(selection.definition, rulePackage)) {
      const key = rulePackage.evaluateSkill(definition).identity;
      const previous = planned.get(key);
      const source = sources.get(key);
      const currentD = rulePackage.evaluateSkill(selection.definition).difficulty.value;
      const previousD = source && rulePackage.evaluateSkill(source.definition).difficulty.value;
      const comparison = !source
        ? -1
        : currentD && previousD
          ? currentD.compare(previousD)
          : currentD
            ? -1
            : previousD
              ? 1
              : 0;
      // Ved samme D vælges den laveste sikkerhed; rækkefølgen af markeringer har ingen betydning.
      const tieWins = comparison === 0 && (selection.stability ?? 0) < (source?.stability ?? 0);
      if (!previous || comparison < 0 || tieWins) {
        planned.set(key, {
          ...selection,
          definition,
          explicit: false,
          sourceName: selection.definition.name,
        });
        sources.set(key, selection);
      }
    }
  }
  for (const selection of selections)
    planned.set(rulePackage.evaluateSkill(selection.definition).identity, {
      ...selection,
      explicit: true,
      sourceName: selection.definition.name,
    });
  return [...planned.values()];
}

/** Ét samlet kladderesultat. Ingen vurdering eller bekræftelse hentes fra en anden gymnast. */
export function registerSpringBatch(
  workspace: Workspace,
  athleteId: string,
  selections: readonly SpringSelection[],
  rulePackage: RulePackage,
  options: { includeShorter: boolean; assessedAt: string },
) {
  let result = workspace;
  const plan = springRegistrationPlan(selections, rulePackage, options.includeShorter);
  for (const entry of plan) {
    const added = registerSpring(result, athleteId, entry.definition, rulePackage, false, null);
    result = added.workspace;
    const registration = result.athleteSkills.find((item) => item.id === added.registrationId)!;
    if (registration.archived) continue;
    const definition = result.skills.find((item) => item.id === registration.skillId)!;
    if (
      entry.confirmed &&
      definition.discipline === 'tumbling' &&
      rulePackage.evaluateSkill(definition, registration).connection === 'unverified'
    ) {
      result = confirmConnection(
        result,
        registration.id,
        entry.confirmationNote ||
          `Træneren har markeret, at gymnasten kan udføre hele serien uden mellemtrin: ${definition.name}.`,
      );
    }
    // Et tomt felt på en længere serie fjerner ikke en tidligere vurdering af dens begyndelse.
    if (!entry.explicit && entry.stability === null && registration.stability !== null) continue;
    result = updateAssessment(result, registration.id, {
      stability: entry.stability,
      assessedAt: entry.stability === null ? null : options.assessedAt,
      note: registration.note,
    });
  }
  return result;
}
