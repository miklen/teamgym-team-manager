import { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 1;
export const WORKSPACE_FORMAT = 'teamgym-team-manager';
export const idSchema = z.string().min(1).max(200).regex(/^[\w:.-]+$/);
const nameSchema = z.string().min(1).max(200).refine((value) => value.trim().length > 0);
const timestampSchema = z.iso.datetime({ offset: true });
export const dateSchema = z.iso.date().refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
export const stabilitySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export type Stability = z.infer<typeof stabilitySchema>;

export const rulesetBindingSchema = z.strictObject({
  rulesetId: idSchema,
  packageVersion: z.string().min(1).max(80),
  ageGroup: z.string().min(1).max(80),
  teamType: z.string().min(1).max(80),
});
export type RulesetBinding = z.infer<typeof rulesetBindingSchema>;

export const elementExecutionSchema = z.strictObject({
  family: idSchema,
  direction: z.enum(['forward', 'backward', 'sideways']),
  rotationQuarterTurns: z.number().int().min(0).max(32),
  bodyPositions: z.array(z.enum(['tuck', 'pike', 'straight'])).min(1).max(8),
  twistsHalfTurns: z.number().int().min(0).max(100),
  twistDistribution: z.array(z.number().int().min(0).max(100)).max(8),
  apparatus: z.enum(['floor', 'trampet', 'pegasus']),
  takeoff: z.enum(['one-foot', 'two-feet', 'hands']),
  landing: z.enum(['feet', 'hands', 'seated', 'other']),
  variant: z.record(z.string(), z.union([z.string(), z.number().finite(), z.boolean()])),
}).superRefine((element, context) => {
  if (element.twistDistribution.length && element.twistDistribution.reduce((sum, value) => sum + value, 0) !== element.twistsHalfTurns) {
    context.addIssue({ code: 'custom', message: 'Skruefordeling skal svare til samlet skrueantal.', path: ['twistDistribution'] });
  }
});
export type ElementExecution = z.infer<typeof elementExecutionSchema>;

const skillFields = { id: idSchema, name: nameSchema, archived: z.boolean() };
export const skillDefinitionSchema = z.discriminatedUnion('discipline', [
  z.strictObject({
    ...skillFields,
    discipline: z.literal('tumbling'),
    elements: z.array(elementExecutionSchema).min(1).max(30),
    connection: z.strictObject({ kind: z.enum(['standard', 'custom']), transitions: z.array(z.string().min(1).max(200)).max(29) }),
  }),
  z.strictObject({ ...skillFields, discipline: z.literal('trampet'), jump: elementExecutionSchema }),
  z.strictObject({
    ...skillFields,
    discipline: z.literal('rhythm'),
    momentId: idSchema,
    variant: z.record(z.string(), z.union([z.string(), z.number().finite(), z.boolean()])),
  }),
]).superRefine((skill, context) => {
  if (skill.discipline === 'tumbling' && skill.connection.transitions.length !== skill.elements.length - 1) {
    context.addIssue({ code: 'custom', message: 'Hver elementovergang skal være beskrevet.', path: ['connection', 'transitions'] });
  }
});
export type SkillDefinition = z.infer<typeof skillDefinitionSchema>;
export type Discipline = SkillDefinition['discipline'];
export type SpringDiscipline = Exclude<Discipline, 'rhythm'>;

export const teamSchema = z.strictObject({ id: idSchema, name: nameSchema, archived: z.boolean(), rulesetBinding: rulesetBindingSchema });
export const athleteSchema = z.strictObject({
  id: idSchema, name: nameSchema, discriminator: z.string().max(160), teamId: idSchema.nullable(), archived: z.boolean(),
  mixCategory: z.enum(['girl', 'boy']).nullable(),
});
export const athleteSkillSchema = z.strictObject({
  id: idSchema, athleteId: idSchema, skillId: idSchema, archived: z.boolean(), stability: stabilitySchema.nullable(),
  assessedAt: dateSchema.nullable(), updatedAt: timestampSchema, note: z.string().max(2000),
  connectionConfirmation: z.strictObject({ executionIdentity: z.string().min(1), confirmedAt: timestampSchema, note: z.string().min(1).max(2000) }).nullable(),
  reviewRequiredFor: z.array(z.string().min(1)).max(100),
}).superRefine((registration, context) => {
  if ((registration.stability === null) !== (registration.assessedAt === null)) {
    context.addIssue({ code: 'custom', message: 'En stabilitetsvurdering skal have vurderingsdato; ikke vurderet har ingen vurderingsdato.', path: ['assessedAt'] });
  }
});
export const roundEntrySchema = z.strictObject({ id: idSchema, athleteId: idSchema, athleteSkillId: idSchema.nullable(), role: z.enum(['counting', 'extra']) });
export const roundSchema = z.strictObject({ id: idSchema, entries: z.array(roundEntrySchema).max(100) });
export const routinePlanSchema = z.strictObject({
  id: idSchema, teamId: idSchema, bindingFingerprint: z.string().min(1),
  tumbling: z.tuple([roundSchema, roundSchema, roundSchema]),
  trampet: z.tuple([roundSchema, roundSchema, roundSchema]),
});
export const workspaceSchema = z.strictObject({
  format: z.literal(WORKSPACE_FORMAT), schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  workspaceId: idSchema, revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), updatedAt: timestampSchema,
  recentOperations: z.array(z.strictObject({ id: idSchema, payloadHash: z.string().regex(/^[a-f0-9]{64}$/), revision: z.number().int().nonnegative(), savedAt: timestampSchema })).max(30),
  teams: z.array(teamSchema), athletes: z.array(athleteSchema), skills: z.array(skillDefinitionSchema),
  athleteSkills: z.array(athleteSkillSchema), plans: z.array(routinePlanSchema),
});

export type Workspace = z.infer<typeof workspaceSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Athlete = z.infer<typeof athleteSchema>;
export type AthleteSkill = z.infer<typeof athleteSkillSchema>;
export type RoundEntry = z.infer<typeof roundEntrySchema>;
export type Round = z.infer<typeof roundSchema>;
export type RoutinePlan = z.infer<typeof routinePlanSchema>;
