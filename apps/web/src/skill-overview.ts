import { chooseInheritanceSource, skillIdentity } from '@teamgym/domain';
import type { AthleteSkill, Fraction, SkillDefinition, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { springInheritanceContext } from './spring-library';

export function skillFamily(skill: SkillDefinition, rulePackage?: RulePackage | null): string {
  if (skill.discipline === 'rhythm')
    return (
      rulePackage?.rhythmCatalog.find((item) => item.id === skill.momentId)?.category ??
      'Øvrige rytmemomenter'
    );
  if (skill.discipline === 'trampet') {
    const jump = skill.jump;
    const apparatus = jump.apparatus === 'pegasus' ? 'Med redskab' : 'Uden redskab';
    const family =
      jump.family === 'salto'
        ? jump.rotationQuarterTurns === 8
          ? 'Dobbelt salto'
          : jump.rotationQuarterTurns === 4
            ? 'Enkelt salto'
            : 'Øvrige saltoer'
        : jump.family === 'tsukahara'
          ? 'Tsukahara'
          : 'Overslag og øvrige spring';
    return `${apparatus} · ${family}`;
  }
  const first = skill.elements[0];
  if (first?.family === 'roundoff')
    return skill.elements[1]?.family === 'flic'
      ? 'Rondat-flik'
      : skill.elements[1]?.family === 'whipback'
        ? 'Rondat-whipback'
        : 'Rondat direkte';
  if (first?.family === 'handspring') return 'Kraftspring';
  if (first?.family === 'flyspring') return 'Flyvespring';
  if (first?.family === 'whipback') return 'Whipback';
  if (first?.family === 'salto')
    return `Startsalto · ${first.direction === 'backward' ? 'baglæns' : 'forlæns'}`;
  return 'Øvrige egne spring';
}
export interface SkillOverviewRow {
  identity: string;
  registration: AthleteSkill;
  definition: SkillDefinition;
  difficulty: Fraction | null;
  parentId: string | null;
  family: string;
}
/** Én identitet, én placering; egen vurdering er uafhængig af træets placering. */
export function skillOverview(
  workspace: Workspace,
  athleteId: string,
  rulePackage?: RulePackage | null,
): SkillOverviewRow[] {
  const skills = new Map(workspace.skills.map((item) => [item.id, item]));
  const registrations = workspace.athleteSkills.filter(
    (item) => item.athleteId === athleteId && !item.archived && !skills.get(item.skillId)?.archived,
  );
  const context = rulePackage && springInheritanceContext(rulePackage);
  const rows = registrations.map((registration): SkillOverviewRow => {
    const definition = skills.get(registration.skillId)!;
    return {
      identity: skillIdentity(definition),
      registration,
      definition,
      difficulty: context?.difficulty(definition, registration) ?? null,
      family: skillFamily(definition, rulePackage),
      parentId: null,
    };
  });
  const byId = new Map(rows.map((row) => [row.registration.id, row]));
  for (const row of rows) {
    const candidates = workspace.inheritanceRelations
      .filter(
        (relation) =>
          relation.targetId === row.registration.id &&
          (!context ||
            context.accepts(
              relation,
              skills.get(workspace.athleteSkills.find((item) => item.id === relation.sourceId)!.skillId)!,
              row.definition,
            )),
      )
      .flatMap((relation) => {
        const source = byId.get(relation.sourceId);
        return source
          ? [
              {
                id: source.registration.id,
                identity: source.identity,
                stability: source.registration.stability,
                difficulty: source.difficulty,
              },
            ]
          : [];
      });
    const origin = row.registration.assessmentOrigin;
    row.parentId =
      chooseInheritanceSource(candidates, origin.kind === 'inherited' ? origin.sourceId : null)?.id ?? null;
  }
  function root(row: SkillOverviewRow): SkillOverviewRow {
    return row.parentId ? root(byId.get(row.parentId)!) : row;
  }
  for (const row of rows) row.family = root(row).family;
  return rows;
}
