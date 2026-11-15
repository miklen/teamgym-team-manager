import { formatPoints, plannedSpotState } from '@teamgym/domain';
import type { SpringDiscipline, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import type { EvaluationStatus } from '@teamgym/domain';
import { springDirectionText, springDisplayName } from './spring-library';
import { springElementInSeries } from './spring-names';

export interface PdfRow {
  number: number;
  role: 'Ekstra' | 'Tællende' | 'Reserve';
  athlete: string;
  spring: string;
  direction: string;
  reception: string;
  warning: string;
}

export interface PdfRound {
  title: string;
  status: string;
  difficulty: PdfScore;
  starters: PdfRow[];
  reserves: PdfRow[];
}

export interface PdfScore {
  value: string | null;
  status: string;
}

export interface ScenarioPdfModel {
  team: string;
  discipline: string;
  scenario: string;
  exportedAt: Date;
  unsaved: boolean;
  ruleWarning: string;
  difficulty: PdfScore;
  composition: PdfScore;
  rounds: PdfRound[];
}

export interface ScenarioPdfInput {
  workspace: Workspace;
  teamId: string;
  discipline: SpringDiscipline;
  scenarioId: string;
  rulePackage: RulePackage | null;
  exportedAt: Date;
  unsaved: boolean;
}

/** Ren visningsprojektion: identiteter og rækkefølge læses fra ét snapshot. */
export function projectScenarioPdf(input: ScenarioPdfInput): ScenarioPdfModel {
  const { workspace, teamId, discipline, scenarioId, rulePackage } = input;
  const team = workspace.teams.find((item) => item.id === teamId);
  const plan = workspace.plans.find((item) => item.teamId === teamId);
  const scenario = plan?.[discipline].find((item) => item.id === scenarioId);
  if (!team || !plan || !scenario) throw new Error('Det valgte scenarie findes ikke længere. Vælg scenariet igen.');

  const names = new Map<string, number>();
  for (const athlete of workspace.athletes) names.set(athlete.name, (names.get(athlete.name) ?? 0) + 1);
  const nameFor = (id: string | null) => {
    if (id === null) return 'Mangler gymnast';
    const athlete = workspace.athletes.find((item) => item.id === id);
    if (!athlete) return 'Gymnast findes ikke';
    return names.get(athlete.name)! > 1 || athlete.discriminator
      ? `${athlete.name}${athlete.discriminator ? ` · ${athlete.discriminator}` : ` · ${athlete.id}`}`
      : athlete.name;
  };
  const evaluation = rulePackage?.analyze(workspace, teamId, discipline, scenarioId);
  const score = (value: { toString(): string } | null | undefined, status?: EvaluationStatus): PdfScore => ({
    value: value ? formatPoints(value.toString()) : null,
    status: status === 'known' ? 'Beregnet'
      : status === 'incomplete' ? 'Ufuldstændig'
      : status === 'invalid' ? 'Ikke anvendelig'
      : status === 'unresolved' ? 'Uafklaret'
      : 'Regelpakke mangler',
  });
  const rounds = scenario.rounds.map((round, index): PdfRound => {
    const rowFor = (entry: (typeof round.entries)[number] | (typeof round.reserves)[number], number: number, role: PdfRow['role']): PdfRow => {
      const athlete = entry.athleteId === null ? null : workspace.athletes.find((item) => item.id === entry.athleteId);
      const registration = entry.athleteSkillId
        ? workspace.athleteSkills.find((item) => item.id === entry.athleteSkillId)
        : undefined;
      const validRegistration = registration && athlete && registration.athleteId === athlete.id && !registration.archived;
      const skillId = 'plannedSkillId' in entry && entry.plannedSkillId ? entry.plannedSkillId : validRegistration ? registration.skillId : null;
      const skill = workspace.skills.find((item) => item.id === skillId && item.discipline === discipline && !item.archived);
      const spring = skill ? (rulePackage ? springDisplayName(skill, rulePackage) : skill.name) : skillId ? 'Spring findes ikke' : 'Spring mangler';
      const direction = skill ? springDirectionText(skill) : '';
      let reception = '';
      if ('plannedSpot' in entry && entry.plannedSpot) {
        if (plannedSpotState(entry, validRegistration ? registration : undefined) === 'reset')
          reception = 'Modtagning nulstillet: planlæg igen';
        else {
          const labels = { support: 'Let støtte', assist: 'Hjælp til udførelse', heavy: 'Kraftig hjælp i svæv/landing' };
          reception = labels[entry.plannedSpot.grade];
          if (entry.plannedSpot.grade === 'heavy' && skill?.discipline === 'tumbling' && entry.plannedSpot.elementIndex !== null)
            reception += ` · ${entry.plannedSpot.elementIndex + 1}. ${springElementInSeries(skill.elements, entry.plannedSpot.elementIndex)}`;
        }
      }
      const warnings = [
        entry.athleteId === null ? 'Mangler gymnast' : !athlete ? 'Gymnast findes ikke' : athlete.archived || athlete.teamId !== teamId ? 'Gymnast er ikke aktiv på holdet' : '',
        !skill ? spring : '',
        reception.startsWith('Modtagning nulstillet') ? reception : '',
      ].filter(Boolean);
      return { number, role, athlete: nameFor(entry.athleteId), spring, direction, reception, warning: warnings.join(' · ') };
    };
    const starters = round.entries.map((entry, offset) => rowFor(entry, offset + 1, entry.role === 'extra' ? 'Ekstra' : 'Tællende'));
    const reserves = round.reserves.map((entry, offset) => rowFor(entry, offset + 1, 'Reserve'));
    const state = evaluation?.rounds[index]?.status;
    const missing = [...starters, ...reserves].some((row) => row.warning);
    const status = !rulePackage
      ? `${missing || !starters.length ? 'Planen er ikke klar · ' : ''}Regelgyldighed ikke kontrolleret`
      : state === 'invalid' ? 'Ugyldig omgang'
      : state !== 'known' || missing || !starters.length ? 'Planen er ikke klar'
      : 'Planlagt';
    const result = evaluation?.rounds[index];
    return { title: `${index + 1}. ${index === 0 ? 'Holdomgang' : 'omgang'}`, status,
      difficulty: score(result?.panelD, result?.difficulty.status), starters, reserves };
  });
  return {
    team: team.name,
    discipline: discipline === 'tumbling' ? 'Bane' : 'Trampet',
    scenario: scenario.name,
    exportedAt: input.exportedAt,
    unsaved: input.unsaved,
    ruleWarning: rulePackage ? '' : 'Holdets præcise regelpakke mangler. Regelgyldighed er ikke kontrolleret.',
    difficulty: score(evaluation?.panelD, evaluation?.difficulty.status),
    composition: score(evaluation?.composition.panel, evaluation?.composition.status),
    rounds,
  };
}
