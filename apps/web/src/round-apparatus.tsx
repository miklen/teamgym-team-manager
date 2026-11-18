import { useMemo, useState } from 'react';
import { roundApparatus, skillNeedsTwistDistribution, switchRoundApparatus, trampetApparatus, workspacePayload } from '@teamgym/domain';
import type { ApparatusChange, Round, SkillDefinition, TrampetApparatus, Workspace } from '@teamgym/domain';
import { ambitionEnvironment } from '@teamgym/rules';
import type { RulePackage, TeamProfile } from '@teamgym/rules';
import { ActionForm, Dialog, points, statusText } from './components';
import { spotGradeLabel } from './planned-spot';
import { listedSpring } from './spring-chain-model';
import { springDisplayName, springLibrary } from './spring-library';

export const apparatusName: Record<TrampetApparatus, string> = { trampet: 'Uden Pegasus', pegasus: 'Med Pegasus' };

export function apparatusRestriction(workspace: Workspace, round: Round, entryId?: string) {
  const { type, placements } = roundApparatus(workspace, round.entries);
  const locked = type === 'mixed' ? placements.get(entryId ?? '') : type;
  return {
    allows: (skill: SkillDefinition) => type === null || (locked != null && trampetApparatus(skill) === locked),
    message: type === 'mixed' ? 'Omgangen har en gammel blanding. Brug Skift redskab til at vælge én type for hele omgangen.'
      : locked ? `Omgangen er ${locked === 'pegasus' ? 'med' : 'uden'} Pegasus. Spring af den anden type kan vælges via Skift redskab.` : '',
  };
}

export function ApparatusSwitchDialog({ workspace, planId, teamId, scenarioId, round, roundNumber, rulePackage, profile, writable, change, close }: {
  workspace: Workspace;
  planId: string;
  teamId: string;
  scenarioId: string;
  round: Round;
  roundNumber: number;
  rulePackage: RulePackage;
  profile: TeamProfile;
  writable: boolean;
  change: (workspace: Workspace) => void;
  close: () => void;
}) {
  const [basis] = useState(() => workspacePayload(workspace));
  const [initial] = useState(() => roundApparatus(workspace, round.entries));
  const [target, setTarget] = useState<TrampetApparatus>(initial.type === 'pegasus' ? 'trampet' : 'pegasus');
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const stale = workspacePayload(workspace) !== basis;
  const definitions = useMemo(() => springLibrary(rulePackage, workspace)
    .filter((item) => listedSpring(item) && !item.definition.archived && trampetApparatus(item.definition) === target && !skillNeedsTwistDistribution(item.definition))
    .map((item) => ({ key: item.id, definition: item.definition })), [rulePackage, workspace, target]);
  const affected = round.entries.flatMap((entry, index) => {
    const type = initial.placements.get(entry.id);
    if (!type || type === target) return [];
    const registration = workspace.athleteSkills.find((item) => item.id === entry.athleteSkillId);
    const oldSkill = workspace.skills.find((item) => item.id === (entry.plannedSkillId ?? registration?.skillId));
    const athlete = workspace.athletes.find((item) => item.id === entry.athleteId);
    const options: { key: string; label: string; change: ApparatusChange }[] = [];
    if (entry.athleteId === null) {
      for (const { key, definition } of definitions) options.push({ key, label: springDisplayName(definition, rulePackage), change: { kind: 'ambition', definition } });
      options.push({ key: 'remove', label: 'Fjern ambitionspladsen', change: { kind: 'remove-ambition' } });
    } else {
      for (const item of workspace.athleteSkills) {
        if (item.athleteId !== entry.athleteId || item.archived) continue;
        const skill = workspace.skills.find((candidate) => candidate.id === item.skillId);
        if (skill?.discipline === 'trampet' && !skill.archived && trampetApparatus(skill) === target && rulePackage.evaluateSkill(skill, item).validity === 'known') {
          options.push({ key: item.id, label: springDisplayName(skill, rulePackage), change: { kind: 'registration', registrationId: item.id } });
        }
      }
      options.push({ key: 'later', label: 'Vælg spring senere', change: { kind: 'later' } });
    }
    return [{ entry, index, oldSkill, athlete, options }];
  });
  const choices = Object.fromEntries(affected.flatMap(({ entry, options }) => {
    const found = options.find((item) => item.key === chosen[entry.id]);
    return found ? [[entry.id, found.change]] : [];
  }));
  const commit = () => switchRoundApparatus(workspace, planId, scenarioId, round.id, target, choices, basis, ambitionEnvironment(rulePackage));
  let comparison = null;
  let error = '';
  if (!stale && affected.length && Object.keys(choices).length === affected.length) {
    try {
      comparison = [rulePackage.analyze(workspace, teamId, 'trampet', scenarioId), rulePackage.analyze(commit(), teamId, 'trampet', scenarioId)];
    } catch (problem) {
      error = problem instanceof Error ? problem.message : 'Forhåndsvisningen kunne ikke beregnes.';
    }
  }
  return <Dialog title="Skift redskab" className="apparatus-switch" close={close}>
    <p>{roundNumber}. omgang · {initial.type === 'mixed' ? 'Blandet redskab' : initial.type ? apparatusName[initial.type] : 'Intet valgt redskab'}</p>
    {initial.type === 'mixed' ? <label>Nyt redskab
      <select value={target} onChange={(event) => { setTarget(event.target.value === 'pegasus' ? 'pegasus' : 'trampet'); setChosen({}); }}>
        <option value="pegasus">{apparatusName.pegasus}</option><option value="trampet">{apparatusName.trampet}</option>
      </select>
    </label> : <p>Nyt redskab · <strong>{apparatusName[target]}</strong></p>}
    <ActionForm disabled={!writable || !comparison} label="Bekræft redskabsskift" submit={() => { change(commit()); close(); }}
      secondaryAction={<button type="button" className="quiet" onClick={close}>Annuller</button>}>
      <fieldset className="apparatus-choices" disabled={!writable || stale}>
        <legend>Spring der skal ændres</legend>
        {affected.map(({ entry, index, oldSkill, athlete, options }) => <label key={entry.id} className="apparatus-choice">
          <strong>{index + 1}. {athlete ? [athlete.name, athlete.discriminator].filter(Boolean).join(' · ') : 'Ambition'}</strong>
          <small>Nuværende spring · {oldSkill ? springDisplayName(oldSkill, rulePackage) : 'Ukendt'}</small>
          <select aria-label={`Nyt spring på plads ${index + 1}`} value={chosen[entry.id] ?? ''} onChange={(event) => setChosen({ ...chosen, [entry.id]: event.target.value })}>
            <option value="">Vælg en ændring</option>
            {options.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
          {entry.plannedSpot && <small className="spot-removed">Modtagning bortfalder · {spotGradeLabel(entry.plannedSpot.grade, rulePackage)}</small>}
        </label>)}
      </fieldset>
      {stale && <p role="alert">Data er ændret siden forhåndsvisningen. Åbn Skift redskab igen.</p>}
      {error && <p role="alert">{error}</p>}
      {comparison && <div className="comparison apparatus-comparison" aria-label="Konsekvenser for scenariet">
        {comparison.map((analysis, index) => {
          const missing = analysis.rounds.reduce((total, item) => total + item.entries.filter((entry) => entry.status !== 'known').length + Math.max(0, profile.counting - item.counting.length), 0);
          return <div key={index}><h3>{index === 0 ? 'Før' : 'Efter'}</h3>
            <p>D {analysis.panelD === null && 'kendt delsum '}{points(analysis.panelD ?? analysis.difficulty.knownSubtotal)} · {statusText[analysis.difficulty.status]}</p>
            <p>C {analysis.composition.panel === null && 'kendt delsum '}{points(analysis.composition.panel ?? analysis.composition.knownSubtotal)} · {statusText[analysis.composition.status]}</p>
            <p>{missing} manglende eller uafklarede pladser</p>
          </div>;
        })}
      </div>}
    </ActionForm>
  </Dialog>;
}
