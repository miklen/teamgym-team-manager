import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION, WORKSPACE_FORMAT, workspaceSchema, skillIdentity } from '@teamgym/domain';
import { DK_V1, DK_V2, REG_V1 } from '@teamgym/rules';
import { springLibrary } from '../apps/web/src/spring-library';

const packages = [DK_V1, DK_V2, REG_V1];

/** Public data only: no workspace, account, token or trainer identity enters this builder. */
export function aiReferenceData() {
  const structure = {
    format: WORKSPACE_FORMAT,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    jsonSchema: z.toJSONSchema(workspaceSchema, { target: 'draft-2020-12' }),
  };
  const catalog = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    packages: packages.map((rulePackage) => ({
      manifest: {
        rulesetId: rulePackage.manifest.rulesetId,
        packageVersion: rulePackage.manifest.packageVersion,
        name: rulePackage.manifest.name,
      },
      profiles: rulePackage.profiles.map(({ ageGroup, teamType, label, counting, extra }) => ({ ageGroup, teamType, label, counting, extra })),
      participants: rulePackage.springRules.participants,
      springCatalog: rulePackage.springCatalog.map(({ referenceId, name, officialCode, status, issueId, execution, aliases, startRole }) => ({
        referenceId, name, officialCode, status, issueId, execution, aliases, startRole,
      })),
      rhythmCatalog: rulePackage.rhythmCatalog.map(({ id, officialCode, name, category, options, mirrorAllowed, commonFacingRequired }) => ({
        id, officialCode, name, category, options, mirrorAllowed, commonFacingRequired,
      })),
      practicalSprings: springLibrary(rulePackage, { skills: [] }).map(({ id, group, aliases, definition }) => ({
        recipeId: id,
        group,
        aliases,
        executionIdentity: skillIdentity(definition),
        definition,
      })),
    })),
    inheritanceCatalog: { id: 'spring-foundation', currentVersion: '2' },
  };
  return { structure, catalog };
}
