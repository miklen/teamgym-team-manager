import { z } from 'zod';
import { workspaceSchema } from './schema';
import type {
  Workspace,
  Team,
  Athlete,
  AthleteSkill,
  SkillDefinition,
  ElementExecution,
  Round,
  RoundEntry,
  ReserveEntry,
  Scenario,
  RoutinePlan,
  RulesetBinding,
  InheritanceRelation,
} from './schema';

export type MergeRole = 'identity' | 'value' | 'atomic' | 'collection' | 'ordered' | 'derived' | 'metadata';
export interface MergePolicy {
  role: MergeRole;
  label: string;
  group?: string;
  fields?: Record<string, MergePolicy>;
  groups?: Record<string, readonly string[]>;
  element?: MergePolicy;
  items?: MergePolicy[];
  variants?: MergePolicy[];
  discriminator?: string;
  variantTags?: readonly string[];
  record?: MergePolicy;
  key?: string[];
  ordered?: boolean;
}
type Fields<T> = { [K in keyof T]-?: MergePolicy };
const value = (label: string, group?: string): MergePolicy => ({
  role: 'value',
  label,
  ...(group ? { group } : {}),
});
const identity = (): MergePolicy => ({ role: 'identity', label: 'Identitet' });
const metadata = (label: string): MergePolicy => ({ role: 'metadata', label });
const object = <T>(label: string, fields: Fields<T>, role: MergeRole = 'value'): MergePolicy => ({
  role,
  label,
  fields,
});
const list = (label: string, element: MergePolicy, key?: string[], ordered = false): MergePolicy => ({
  role: key ? 'collection' : 'ordered',
  label,
  element,
  ...(key ? { key } : {}),
  ordered,
});
const primitiveUnion: MergePolicy = {
  role: 'atomic',
  label: 'Variantværdi',
  variants: [value('Tekst'), value('Tal'), value('Ja/nej')],
};
const variant: MergePolicy = { role: 'atomic', label: 'Udførelsesvarianter', record: primitiveUnion };
const binding = object<RulesetBinding>(
  'Regelgrundlag',
  {
    rulesetId: identity(),
    packageVersion: value('Pakkeversion'),
    ageGroup: value('Aldersgruppe'),
    teamType: value('Holdtype'),
  },
  'atomic',
);
const execution = object<ElementExecution>(
  'Udførelse',
  {
    family: value('Springfamilie'),
    direction: value('Retning'),
    rotationQuarterTurns: value('Rotation'),
    bodyPositions: list('Kropspositioner', value('Position')),
    twistsHalfTurns: value('Skruer'),
    twistDistribution: list('Skruefordeling', value('Halve skruer')),
    apparatus: value('Redskab'),
    takeoff: value('Afsæt'),
    landing: value('Landing'),
    variant,
  },
  'atomic',
);
const skillBase = {
  id: identity(),
  name: value('Springnavn'),
  archived: value('Arkiveret'),
  discipline: identity(),
};
const skillVariants = {
  tumbling: {
    ...object<Extract<SkillDefinition, { discipline: 'tumbling' }>>('Bane', {
      ...skillBase,
      elements: { ...list('Udførelse', execution), group: 'execution' },
      connection: {
        ...object('Forbindelse', {
          kind: value('Forbindelsestype'),
          transitions: list('Overgange', value('Overgang')),
        }),
        group: 'execution',
      },
    }),
    groups: { execution: ['elements', 'connection'] },
  },
  trampet: object<Extract<SkillDefinition, { discipline: 'trampet' }>>('Trampet', {
    ...skillBase,
    jump: execution,
  }),
  rhythm: {
    ...object<Extract<SkillDefinition, { discipline: 'rhythm' }>>('Rytme', {
      ...skillBase,
      momentId: { ...identity(), group: 'execution' },
      variant: { ...variant, group: 'execution' },
    }),
    groups: { execution: ['momentId', 'variant'] },
  },
} satisfies Record<SkillDefinition['discipline'], MergePolicy>;
const skills: MergePolicy = {
  role: 'value',
  label: 'Spring',
  discriminator: 'discipline',
  variantTags: Object.keys(skillVariants),
  variants: Object.values(skillVariants),
};
const entry = object<RoundEntry>('Udførende', {
  id: identity(),
  athleteId: identity(),
  athleteSkillId: value('Valgt spring'),
  role: value('Rolle'),
  // Grad, element og springreference er én beslutning; deltagerlisten forbliver atomisk.
  plannedSpot: object<NonNullable<RoundEntry['plannedSpot']>>(
    'Planlagt modtagning',
    { grade: value('Modtagningsgrad'), skillId: value('Modtaget spring'), elementIndex: value('Modtaget element') },
    'atomic',
  ),
});
const reserve = object<ReserveEntry>('Reserve', {
  id: identity(),
  athleteId: identity(),
  athleteSkillId: value('Valgt spring'),
});
const round = object<Round>('Omgang', {
  id: identity(),
  entries: list('Deltagere', entry),
  reserves: list('Reserver', reserve),
});
const scenario = object<Scenario>('Scenarie', {
  id: identity(),
  name: value('Scenarienavn'),
  rounds: { role: 'collection', label: 'Omgange', key: ['id'], items: [round, round, round] },
});
const originVariants = {
  own: object<Extract<AthleteSkill['assessmentOrigin'], { kind: 'own' }>>('Egen vurdering', {
    kind: identity(),
  }),
  inherited: object<Extract<AthleteSkill['assessmentOrigin'], { kind: 'inherited' }>>('Arvet vurdering', {
    kind: identity(),
    sourceId: { role: 'derived', label: 'Aktiv kilde' },
    sourceChoice: object('Kildevalg', { sourceId: identity(), context: value('Valggrundlag') }, 'atomic'),
  }),
} satisfies Record<AthleteSkill['assessmentOrigin']['kind'], MergePolicy>;
const origin: MergePolicy = {
  role: 'atomic',
  label: 'Vurderingsophav',
  discriminator: 'kind',
  variantTags: Object.keys(originVariants),
  variants: Object.values(originVariants),
};
const stability: MergePolicy = {
  ...value('Sikkerhed', 'assessment'),
  variants: [1, 2, 3, 4, 5].map(() => value('Sikkerhed')),
};
export const workspaceMergePolicy = object<Workspace>('Arbejdsrum', {
  format: identity(),
  schemaVersion: identity(),
  workspaceId: identity(),
  revision: metadata('Revision'),
  updatedAt: metadata('Gemt den'),
  recentOperations: {
    ...list(
      'Gemmeoperationer',
      object('Operation', {
        id: identity(),
        payloadHash: metadata('Hash'),
        revision: metadata('Revision'),
        savedAt: metadata('Gemt den'),
      }),
    ),
    role: 'metadata',
  },
  teams: list(
    'Hold',
    object<Team>('Hold', {
      id: identity(),
      name: value('Holdnavn'),
      archived: value('Arkiveret'),
      rulesetBinding: binding,
    }),
    ['id'],
  ),
  athletes: list(
    'Gymnaster',
    object<Athlete>('Gymnast', {
      id: identity(),
      name: value('Navn'),
      discriminator: value('Kendetegn'),
      teamId: value('Hold'),
      archived: value('Arkiveret'),
      mixCategory: value('Mixkategori'),
    }),
    ['id'],
  ),
  skills: list('Spring', skills, ['id']),
  athleteSkills: list(
    'Vurderinger',
    {
      ...object<AthleteSkill>('Registrering', {
        id: identity(),
        athleteId: identity(),
        skillId: value('Spring'),
        archived: value('Arkiveret'),
        stability,
        assessedAt: value('Vurderingsdato', 'assessment'),
        assessmentOrigin: { ...origin, group: 'assessment' },
        updatedAt: metadata('Registrering opdateret'),
        note: value('Note'),
        connectionConfirmation: object(
          'Forbindelsesbekræftelse',
          { executionIdentity: identity(), confirmedAt: value('Bekræftet den'), note: value('Begrundelse') },
          'atomic',
        ),
        reviewRequiredFor: list('Kræver revurdering', value('Regelgrundlag')),
      }),
      groups: { assessment: ['stability', 'assessedAt', 'assessmentOrigin'] },
    },
    ['id'],
  ),
  plans: list(
    'Planer',
    object<RoutinePlan>('Plan', {
      id: identity(),
      teamId: identity(),
      bindingFingerprint: value('Planens regelgrundlag'),
      tumbling: list('Bane', scenario, ['id'], true),
      trampet: list('Trampet', scenario, ['id'], true),
    }),
    ['id'],
  ),
  inheritanceRelations: list(
    'Arverelationer',
    object<InheritanceRelation>(
      'Arverelation',
      {
        sourceId: identity(),
        targetId: identity(),
        sourceIdentity: identity(),
        targetIdentity: identity(),
        catalogId: identity(),
        catalogVersion: value('Katalogversion'),
        relationId: identity(),
      },
      'atomic',
    ),
    ['sourceId', 'targetId', 'catalogId', 'relationId'],
  ),
  inheritanceExclusions: list(
    'Fravalg af arv',
    object<Workspace['inheritanceExclusions'][number]>(
      'Fravalg',
      { athleteId: identity(), targetIdentity: identity() },
      'atomic',
    ),
    ['athleteId', 'targetIdentity'],
  ),
});

/** Sammenholder den eksplicitte politik med det faktiske schema, også inde i atomiske grupper.
 * Ingen schemafelter/uniongrene arver automatisk en dækningsbeslutning fra deres forælder. */
export function checkMergePolicy(policy: MergePolicy = workspaceMergePolicy): string[] {
  const errors: string[] = [];
  function visit(schema: z.ZodType, node: MergePolicy | undefined, path: string) {
    if (!node) {
      errors.push(`${path}: manglende politik`);
      return;
    }
    if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
      visit(schema.unwrap() as z.ZodType, node, path);
      return;
    }
    if (schema instanceof z.ZodObject) {
      if (!node.fields) {
        errors.push(`${path}: objektfelter mangler`);
        return;
      }
      for (const [key, field] of Object.entries(schema.shape))
        visit(field as z.ZodType, node.fields[key], `${path}.${key}`);
      for (const key of Object.keys(node.fields))
        if (!(key in schema.shape)) errors.push(`${path}.${key}: ukendt politikfelt`);
      for (const [group, members] of Object.entries(node.groups ?? {})) {
        if (!members.length || members.some((key) => node.fields![key]?.group !== group))
          errors.push(`${path}: gruppen ${group} mangler et eksplicit medlem`);
      }
      for (const [key, field] of Object.entries(node.fields))
        if (field.group && !node.groups?.[field.group]?.includes(key))
          errors.push(`${path}.${key}: udækket gruppemedlem`);
    } else if (schema instanceof z.ZodArray) visit(schema.element as z.ZodType, node.element, `${path}[]`);
    else if (schema instanceof z.ZodTuple) {
      const items = schema.def.items as z.ZodType[];
      if (items.length !== node.items?.length) errors.push(`${path}: tuplemedlemmer mangler`);
      items.forEach((item, i) => visit(item, node.items?.[i], `${path}[${i}]`));
    } else if (schema instanceof z.ZodUnion) {
      if (schema instanceof z.ZodDiscriminatedUnion && node.discriminator !== schema.def.discriminator)
        errors.push(`${path}: unionens diskriminator mangler`);
      if (schema.options.length !== node.variants?.length) errors.push(`${path}: unionvarianter mangler`);
      schema.options.forEach((item, i) => {
        if (node.discriminator && item instanceof z.ZodObject) {
          const tag = item.shape[node.discriminator];
          if (!(tag instanceof z.ZodLiteral) || !tag.values.has(node.variantTags?.[i]))
            errors.push(`${path}|${i}: variantbetegnelse mangler`);
        }
        visit(item as z.ZodType, node.variants?.[i], `${path}|${i}`);
      });
    } else if (schema instanceof z.ZodRecord)
      visit(schema.valueType as z.ZodType, node.record, `${path}{værdi}`);
    else if (node.fields || node.element || node.items || node.variants || node.record)
      errors.push(`${path}: politik svarer ikke til scalar`);
  }
  visit(workspaceSchema, policy, 'workspace');
  return errors;
}
