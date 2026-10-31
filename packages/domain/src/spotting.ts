import type { AthleteSkill, PlannedSpot, RoundEntry } from './schema';

export type PlannedSpotState = 'none' | 'active' | 'reset';

/** Afledt gyldighed: en modtagning gælder kun, mens registreringen stadig peger på det spring, den blev planlagt for. */
export function plannedSpotState(entry: Pick<RoundEntry, 'athleteSkillId' | 'plannedSpot'>, registration: Pick<AthleteSkill, 'id' | 'skillId'> | undefined): PlannedSpotState {
  if (!entry.plannedSpot) return 'none';
  return registration && registration.id === entry.athleteSkillId && registration.skillId === entry.plannedSpot.skillId ? 'active' : 'reset';
}

export function activePlannedSpot(entry: Pick<RoundEntry, 'athleteSkillId' | 'plannedSpot'>, registration: Pick<AthleteSkill, 'id' | 'skillId'> | undefined): PlannedSpot | null {
  return plannedSpotState(entry, registration) === 'active' ? entry.plannedSpot : null;
}
