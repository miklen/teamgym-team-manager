import { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 5;
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
export const athleteSkillV1Schema = z.strictObject({
  id: idSchema, athleteId: idSchema, skillId: idSchema, archived: z.boolean(), stability: stabilitySchema.nullable(),
  assessedAt: dateSchema.nullable(), updatedAt: timestampSchema, note: z.string().max(2000),
  connectionConfirmation: z.strictObject({ executionIdentity: z.string().min(1), confirmedAt: timestampSchema, note: z.string().min(1).max(2000) }).nullable(),
  reviewRequiredFor: z.array(z.string().min(1)).max(100),
}).superRefine((registration, context) => {
  if ((registration.stability === null) !== (registration.assessedAt === null)) {
    context.addIssue({ code: 'custom', message: 'En stabilitetsvurdering skal have vurderingsdato; ikke vurderet har ingen vurderingsdato.', path: ['assessedAt'] });
  }
});
export const roundEntryV3Schema = z.strictObject({ id: idSchema, athleteId: idSchema, athleteSkillId: idSchema.nullable(), role: z.enum(['counting', 'extra']) });
export const spotGradeSchema = z.enum(['support', 'assist', 'heavy']);
export type SpotGrade = z.infer<typeof spotGradeSchema>;
/** Planlagt modtagning er en trænerbeslutning på pladsen; `skillId` er springet, den blev planlagt for. */
export const plannedSpotSchema = z.strictObject({ grade: spotGradeSchema, skillId: idSchema, elementIndex: z.number().int().nonnegative().max(29).nullable() });
export type PlannedSpot = z.infer<typeof plannedSpotSchema>;
export const roundEntryV4Schema = roundEntryV3Schema.safeExtend({ plannedSpot: plannedSpotSchema.nullable() });
/** En ambition er en plads uden gymnast med et planlagt spring; en besat plads har aldrig et planlagt spring. */
export const roundEntrySchema = z.strictObject({
  id: idSchema, athleteId: idSchema.nullable(), athleteSkillId: idSchema.nullable(), role: z.enum(['counting', 'extra']),
  plannedSpot: plannedSpotSchema.nullable(), plannedSkillId: idSchema.nullable(),
}).superRefine((entry, context) => {
  if ((entry.athleteId === null) === (entry.plannedSkillId === null)) {
    context.addIssue({ code: 'custom', message: 'En plads har enten en gymnast eller et planlagt spring.', path: ['plannedSkillId'] });
  }
  if (entry.athleteId === null && (entry.athleteSkillId !== null || entry.plannedSpot !== null)) {
    context.addIssue({ code: 'custom', message: 'En ambition har hverken registrering eller modtagning.', path: ['athleteSkillId'] });
  }
});
export const roundV2Schema = z.strictObject({ id: idSchema, entries: z.array(roundEntryV3Schema).max(100) });
export const routinePlanV2Schema = z.strictObject({
  id: idSchema, teamId: idSchema, bindingFingerprint: z.string().min(1),
  tumbling: z.tuple([roundV2Schema, roundV2Schema, roundV2Schema]),
  trampet: z.tuple([roundV2Schema, roundV2Schema, roundV2Schema]),
});
export const reserveEntrySchema = z.strictObject({ id: idSchema, athleteId: idSchema, athleteSkillId: idSchema.nullable() });
export const roundV3Schema = z.strictObject({ id: idSchema, entries: z.array(roundEntryV3Schema).max(100), reserves: z.array(reserveEntrySchema) });
export const roundV4Schema = z.strictObject({ id: idSchema, entries: z.array(roundEntryV4Schema).max(100), reserves: z.array(reserveEntrySchema) });
export const roundSchema = z.strictObject({ id: idSchema, entries: z.array(roundEntrySchema).max(100), reserves: z.array(reserveEntrySchema) });
const scenarioName = nameSchema.refine((value) => value === value.trim());
export const scenarioV3Schema = z.strictObject({ id: idSchema, name: scenarioName, rounds: z.tuple([roundV3Schema, roundV3Schema, roundV3Schema]) });
export const scenarioV4Schema = z.strictObject({ id: idSchema, name: scenarioName, rounds: z.tuple([roundV4Schema, roundV4Schema, roundV4Schema]) });
export const scenarioSchema = z.strictObject({ id: idSchema, name: scenarioName, rounds: z.tuple([roundSchema, roundSchema, roundSchema]) });
export const routinePlanV3Schema = z.strictObject({
  id: idSchema, teamId: idSchema, bindingFingerprint: z.string().min(1),
  tumbling: z.array(scenarioV3Schema).min(1), trampet: z.array(scenarioV3Schema).min(1),
});
export const routinePlanV4Schema = z.strictObject({
  id: idSchema, teamId: idSchema, bindingFingerprint: z.string().min(1),
  tumbling: z.array(scenarioV4Schema).min(1), trampet: z.array(scenarioV4Schema).min(1),
});
export const routinePlanSchema = z.strictObject({
  id: idSchema, teamId: idSchema, bindingFingerprint: z.string().min(1),
  tumbling: z.array(scenarioSchema).min(1), trampet: z.array(scenarioSchema).min(1),
});
export const assessmentOriginSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('own') }),
  z.strictObject({ kind: z.literal('inherited'), sourceId: idSchema.nullable(),
    sourceChoice: z.strictObject({ sourceId: idSchema, context: z.string().min(1) }).nullable() }),
]);
export const athleteSkillSchema = athleteSkillV1Schema.safeExtend({ assessmentOrigin: assessmentOriginSchema });
export const inheritanceRelationSchema = z.strictObject({
  sourceId: idSchema, targetId: idSchema, sourceIdentity: z.string().min(1), targetIdentity: z.string().min(1),
  catalogId: idSchema, catalogVersion: z.string().min(1), relationId: idSchema,
});
export const inheritanceExclusionSchema = z.strictObject({ athleteId: idSchema, targetIdentity: z.string().min(1) });
const workspaceFields = {
  format: z.literal(WORKSPACE_FORMAT),
  workspaceId: idSchema, revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), updatedAt: timestampSchema,
  recentOperations: z.array(z.strictObject({ id: idSchema, payloadHash: z.string().regex(/^[a-f0-9]{64}$/), revision: z.number().int().nonnegative(), savedAt: timestampSchema })).max(30),
  teams: z.array(teamSchema), athletes: z.array(athleteSchema), skills: z.array(skillDefinitionSchema),
};
export const workspaceV1Schema = z.strictObject({ ...workspaceFields, plans: z.array(routinePlanV2Schema), schemaVersion: z.literal(1), athleteSkills: z.array(athleteSkillV1Schema) });
export const workspaceV2Schema = z.strictObject({ ...workspaceFields, plans: z.array(routinePlanV2Schema), schemaVersion: z.literal(2),
  athleteSkills: z.array(athleteSkillSchema), inheritanceRelations: z.array(inheritanceRelationSchema), inheritanceExclusions: z.array(inheritanceExclusionSchema) });
export const workspaceV3Schema = z.strictObject({ ...workspaceFields, plans: z.array(routinePlanV3Schema), schemaVersion: z.literal(3),
  athleteSkills: z.array(athleteSkillSchema), inheritanceRelations: z.array(inheritanceRelationSchema), inheritanceExclusions: z.array(inheritanceExclusionSchema) });
export const workspaceV4Schema = z.strictObject({ ...workspaceFields, plans: z.array(routinePlanV4Schema), schemaVersion: z.literal(4),
  athleteSkills: z.array(athleteSkillSchema), inheritanceRelations: z.array(inheritanceRelationSchema), inheritanceExclusions: z.array(inheritanceExclusionSchema) });
export const workspaceSchema = z.strictObject({ ...workspaceFields, plans: z.array(routinePlanSchema), schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  athleteSkills: z.array(athleteSkillSchema), inheritanceRelations: z.array(inheritanceRelationSchema), inheritanceExclusions: z.array(inheritanceExclusionSchema) });
export type WorkspaceV1 = z.infer<typeof workspaceV1Schema>;
export type WorkspaceV2 = z.infer<typeof workspaceV2Schema>;
export type WorkspaceV3 = z.infer<typeof workspaceV3Schema>;
export type WorkspaceV4 = z.infer<typeof workspaceV4Schema>;
export type ReserveEntry = z.infer<typeof reserveEntrySchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type InheritanceRelation = z.infer<typeof inheritanceRelationSchema>;

export type Workspace = z.infer<typeof workspaceSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Athlete = z.infer<typeof athleteSchema>;
export type AthleteSkill = z.infer<typeof athleteSkillSchema>;
export type RoundEntry = z.infer<typeof roundEntrySchema>;
/** Pladsændringer udleder modtagningen fra den eksisterende plads; kun modtagningskommandoerne sætter den.
 * `plannedSkillId` udelades for en plads med gymnast. */
export type RoundEntryInput = Omit<RoundEntry, 'plannedSpot' | 'plannedSkillId'> & { plannedSpot?: PlannedSpot | null; plannedSkillId?: string | null };
export type Round = z.infer<typeof roundSchema>;
export type RoutinePlan = z.infer<typeof routinePlanSchema>;
