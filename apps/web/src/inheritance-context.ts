import { bindingFingerprint, reconcileInheritance, validateWorkspace } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import { registry } from './rules';
import { springInheritanceContext } from './spring-library';
import type { VersionChangePreview } from '@teamgym/rules';

export function reconcileVersionPreview(preview: VersionChangePreview): VersionChangePreview {
  const workspace = reconcileWorkspace(preview.workspace);
  const resolved = registry.resolve(preview.newBinding);
  if (resolved.status !== 'known') throw new Error('Regelpakken til sammenligning findes ikke.');
  return {
    ...preview,
    workspace,
    after: {
      tumbling: resolved.rulePackage.analyze(workspace, preview.teamId, 'tumbling'),
      trampet: resolved.rulePackage.analyze(workspace, preview.teamId, 'trampet'),
      rhythm: resolved.rulePackage.rhythm(workspace, preview.teamId),
    },
  };
}

/** Den aktuelle holdbinding styrer rangering; en manglende pakke får ingen fallback. */
export function reconcileWorkspace(workspace: Workspace): Workspace {
  const copy = structuredClone(workspace);
  const contexts = new Map(
    copy.athletes.map((athlete) => {
      const team = copy.teams.find((item) => item.id === athlete.teamId);
      const resolved = team && registry.resolve(team.rulesetBinding);
      return [
        athlete.id,
        resolved?.status === 'known'
          ? springInheritanceContext(resolved.rulePackage, bindingFingerprint(team!.rulesetBinding))
          : null,
      ] as const;
    }),
  );
  // Afstem samlet, men slå konteksten op for den registrering der faktisk vurderes.
  reconcileInheritance(
    copy,
    {
      fingerprint: 'current-team-bindings',
      difficulty: (skill, registration) =>
        registration ? (contexts.get(registration.athleteId)?.difficulty(skill, registration) ?? null) : null,
      accepts: (relation, source, target) => {
        const registration = copy.athleteSkills.find((item) => item.id === relation.sourceId)!;
        const context = contexts.get(registration.athleteId);
        // Uden aktuel pakke bevares kun den allerede gyldige kilde. Ingen ny kataloganvendelse.
        return context
          ? context.accepts(relation, source, target)
          : copy.athleteSkills.some(
              (item) =>
                item.id === relation.targetId &&
                item.assessmentOrigin.kind === 'inherited' &&
                item.assessmentOrigin.sourceId === relation.sourceId,
            );
      },
    },
    new Date().toISOString(),
  );
  return validateWorkspace(copy);
}
