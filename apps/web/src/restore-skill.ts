import { setArchived, updateAssessment } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';

/** Et nyt, udtrykkeligt valg genbruger id og note, men kræver en ny vurdering. */
export function restoreRemovedSkill(workspace: Workspace, registrationId: string): Workspace {
  const registration = workspace.athleteSkills.find((item) => item.id === registrationId);
  if (!registration?.archived) return workspace;
  return updateAssessment(setArchived(workspace, 'athleteSkills', registrationId, false), registrationId, {
    stability: null,
    assessedAt: null,
    note: registration.note,
  });
}
