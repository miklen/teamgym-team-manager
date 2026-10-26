import { Fraction } from './fraction';
import { canonicalJson, skillIdentity } from './identity';
import type { AthleteSkill, InheritanceRelation, SkillDefinition, Workspace } from './schema';

export interface InheritanceContext {
  difficulty(skill: SkillDefinition, registration?: AthleteSkill): Fraction | null;
  accepts(relation: InheritanceRelation, source: SkillDefinition, target: SkillDefinition): boolean;
  fingerprint: string;
}
export interface InheritanceCandidate {
  id: string;
  identity: string;
  stability: AthleteSkill['stability'];
  difficulty: Fraction | null;
}
/** Fælles kildevalg for preview og vedligehold. Ukendt D bliver aldrig nul. */
export function chooseInheritanceSource<T extends InheritanceCandidate>(
  candidates: readonly T[],
  existingId?: string | null,
  chosenId?: string | null,
): T | undefined {
  const known = candidates.filter((item) => item.difficulty !== null);
  if (!known.length)
    return (
      candidates.find((item) => item.id === chosenId) ?? candidates.find((item) => item.id === existingId)
    );
  return [...known].sort(
    (a, b) =>
      a.difficulty!.compare(b.difficulty!) ||
      (a.stability ?? 0) - (b.stability ?? 0) ||
      a.identity.localeCompare(b.identity, 'en') ||
      a.id.localeCompare(b.id, 'en'),
  )[0];
}

/** Muterer kun den isolerede kladde. Opretter aldrig nye børn eller relationer. */
export function reconcileInheritance(
  copy: Workspace,
  context?: InheritanceContext,
  now = copy.updatedAt,
): void {
  const skills = new Map(copy.skills.map((item) => [item.id, item]));
  const registrations = new Map(copy.athleteSkills.map((item) => [item.id, item]));
  // Udførelsesskift ugyldiggør tidligere accepterede identiteter; id-genbrug er ikke samtykke.
  copy.inheritanceRelations = copy.inheritanceRelations.filter((relation) => {
    const source = registrations.get(relation.sourceId);
    const target = registrations.get(relation.targetId);
    return (
      source &&
      target &&
      skillIdentity(skills.get(source.skillId)!) === relation.sourceIdentity &&
      skillIdentity(skills.get(target.skillId)!) === relation.targetIdentity
    );
  });
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(registration: AthleteSkill) {
    if (visited.has(registration.id)) return;
    if (visiting.has(registration.id)) throw new Error('Arverelationer må ikke danne en cyklus.');
    visiting.add(registration.id);
    const relations = copy.inheritanceRelations.filter((item) => item.targetId === registration.id);
    for (const relation of relations) visit(registrations.get(relation.sourceId)!);
    const origin = registration.assessmentOrigin;
    if (
      origin.kind === 'inherited' &&
      origin.sourceChoice &&
      !relations.some((relation) => relation.sourceId === origin.sourceChoice!.sourceId)
    )
      origin.sourceChoice = null;
    if (origin.kind === 'inherited' && !registration.archived) {
      const target = skills.get(registration.skillId)!;
      const excluded = copy.inheritanceExclusions.some(
        (item) => item.athleteId === registration.athleteId && item.targetIdentity === skillIdentity(target),
      );
      const candidates = excluded
        ? []
        : relations.flatMap((relation) => {
            const source = registrations.get(relation.sourceId)!;
            const definition = skills.get(source.skillId)!;
            if (
              source.archived ||
              definition.archived ||
              source.athleteId !== registration.athleteId ||
              (context && !context.accepts(relation, definition, target))
            )
              return [];
            return [
              {
                id: source.id,
                identity: skillIdentity(definition),
                stability: source.stability,
                difficulty: context?.difficulty(definition, source) ?? null,
                registration: source,
              },
            ];
          });
      const source = chooseInheritanceSource(
        candidates,
        origin.sourceId,
        origin.sourceChoice?.sourceId,
      )?.registration;
      const next = { ...origin, sourceId: source?.id ?? null };
      if (
        (source?.stability ?? null) !== registration.stability ||
        (source?.assessedAt ?? null) !== registration.assessedAt ||
        origin.sourceId !== next.sourceId
      )
        registration.updatedAt = now;
      registration.assessmentOrigin = next;
      registration.stability = source?.stability ?? null;
      registration.assessedAt = source?.assessedAt ?? null;
    }
    visiting.delete(registration.id);
    visited.add(registration.id);
  }
  for (const registration of copy.athleteSkills) visit(registration);
}

export function dependentRegistrations(workspace: Workspace, sourceId: string): AthleteSkill[] {
  const ids = new Set(
    workspace.inheritanceRelations.filter((item) => item.sourceId === sourceId).map((item) => item.targetId),
  );
  return workspace.athleteSkills.filter(
    (item) => ids.has(item.id) && !item.archived && item.assessmentOrigin.kind === 'inherited',
  );
}

export function relationKey(relation: InheritanceRelation) {
  return canonicalJson(relation);
}
