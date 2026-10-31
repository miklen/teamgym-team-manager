import { useId, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { changeAmbitionSkill } from '@teamgym/domain';
import type { Round, RoundEntry, SpringDiscipline, Workspace } from '@teamgym/domain';
import { ambitionCandidates, ambitionEnvironment } from '@teamgym/rules';
import type { AmbitionCandidate, RulePackage, TeamProfile } from '@teamgym/rules';
import { ActionForm, points } from './components';
import { PlanDifficulty, PlanSafety, PlanSkillSelect } from './plan-skill-select';
import type { PlanSkillOption } from './plan-skill-select';
import { springDirectionText, springDisplayName, springLibrary } from './spring-library';
import type { SpringDefinition } from './spring-library';
import './ambition.css';

export type SlotMode = 'athlete' | 'ambition';

/** Hvad dialogen beder springplanen om; domænekommandoerne udføres samlet i én ændring. */
export type AmbitionRequest =
  | { kind: 'add'; definition: SpringDefinition; role: RoundEntry['role'] }
  | { kind: 'update'; entryId: string; definition: SpringDefinition | null; role: RoundEntry['role']; athleteSkillId: string | null };

/** Segmenteret valg mellem gymnast og ambition. Native radioknapper giver piletaster og skærmlæser gratis. */
export function SlotModeSwitch({ value, onChange, disabled }: { value: SlotMode; onChange: (mode: SlotMode) => void; disabled?: boolean }) {
  const name = useId();
  return (
    <fieldset className="slot-mode" data-mode={value} disabled={disabled}>
      <legend className="sr-only">Hvem står på pladsen?</legend>
      <span className="slot-mode-thumb" aria-hidden="true" />
      <label>
        <input type="radio" name={name} checked={value === 'athlete'} onChange={() => onChange('athlete')} />
        <span>Gymnast</span>
      </label>
      <label>
        <input type="radio" name={name} checked={value === 'ambition'} onChange={() => onChange('ambition')} />
        <span>Ingen gymnast endnu</span>
      </label>
    </fieldset>
  );
}

function catalogChoices(workspace: Workspace, rulePackage: RulePackage, discipline: SpringDiscipline) {
  return springLibrary(rulePackage, workspace).filter((choice) => choice.definition.discipline === discipline);
}

function catalogOption(definition: SpringDefinition, id: string, rulePackage: RulePackage): PlanSkillOption {
  const difficulty = rulePackage.evaluateSkill(definition).difficulty.value;
  return {
    id,
    name: springDisplayName(definition, rulePackage),
    direction: springDirectionText(definition),
    difficulty: difficulty ? points(difficulty) : null,
    stability: null,
  };
}

/** Kataloget som valg; en gængs opskrift får et nyt id, så den aldrig kolliderer med arbejdsrummets definitioner. */
function useCatalog(workspace: Workspace, rulePackage: RulePackage, discipline: SpringDiscipline) {
  return useMemo(() => {
    const choices = catalogChoices(workspace, rulePackage, discipline);
    return {
      options: choices.map((choice) => catalogOption(choice.definition, choice.id, rulePackage)),
      definition: (id: string): SpringDefinition | null => {
        const choice = choices.find((item) => item.id === id);
        return choice ? { ...structuredClone(choice.definition), id: choice.own ? choice.definition.id : crypto.randomUUID() } : null;
      },
      idFor: (skill: SpringDefinition) => {
        const identity = rulePackage.evaluateSkill(skill).identity;
        return choices.find((item) => rulePackage.evaluateSkill(item.definition).identity === identity)?.id ?? '';
      },
    };
  }, [workspace, rulePackage, discipline]);
}

function RoleField({ value, onChange }: { value: RoundEntry['role']; onChange?: () => void }) {
  return (
    <label>
      Rolle
      <select name="role" defaultValue={value} onChange={onChange}>
        <option value="counting">Tællende</option>
        <option value="extra">Ekstra · først · indgår ikke i D/C/stabilitet</option>
      </select>
    </label>
  );
}

const roleOf = (data: FormData): RoundEntry['role'] => (data.get('role') === 'extra' ? 'extra' : 'counting');
const missingSpring = 'En ambition kræver et spring. Vælg springet i kataloget.';

/** Ny ambition: springet vælges i disciplinens katalog. */
export function AmbitionCreateForm({ workspace, discipline, rulePackage, writable, request, formRef, onDirty }: {
  workspace: Workspace; discipline: SpringDiscipline; rulePackage: RulePackage; writable: boolean;
  request: (value: AmbitionRequest) => void; formRef?: RefObject<HTMLFormElement | null> | undefined; onDirty?: (() => void) | undefined;
}) {
  const catalog = useCatalog(workspace, rulePackage, discipline);
  return (
    <ActionForm
      formRef={formRef}
      className="ambition-form"
      disabled={!writable}
      submit={(data) => {
        const definition = catalog.definition(String(data.get('skill')));
        if (!definition) throw new Error(missingSpring);
        request({ kind: 'add', definition, role: roleOf(data) });
      }}
    >
      <fieldset disabled={!writable} onChange={onDirty}>
        <div className="ambition-intro">
          <span className="ambition-mark" aria-hidden="true">+</span>
          <p>Planlæg springet nu. Pladsen tæller med i D og C og besættes, når en gymnast kan springet.</p>
        </div>
        <PlanSkillSelect catalog options={catalog.options} initialValue="" onChange={onDirty} />
        <RoleField value="counting" />
      </fieldset>
      {!writable && <p className="notice">Arbejdsrummet har læseadgang. Du kan gennemse valgene, men ikke ændre dem.</p>}
    </ActionForm>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toLocaleUpperCase('da')).join('');
}

/** Åben ambition: springet er fastlåst, og kun gymnaster, der faktisk kan springet, kan vælges. */
export function AmbitionFillForm({ workspace, teamId, discipline, rulePackage, profile, planId, scenarioId, round, entry, writable, request, inspect, formRef, onDirty }: {
  workspace: Workspace; teamId: string; discipline: SpringDiscipline; rulePackage: RulePackage; profile: TeamProfile;
  planId: string; scenarioId: string; round: Round; entry: RoundEntry; writable: boolean;
  request: (value: AmbitionRequest) => void; inspect: (athleteId: string) => void;
  formRef?: RefObject<HTMLFormElement | null> | undefined; onDirty?: (() => void) | undefined;
}) {
  const catalog = useCatalog(workspace, rulePackage, discipline);
  const planned = workspace.skills.find((skill) => skill.id === entry.plannedSkillId);
  const current = planned && planned.discipline !== 'rhythm' ? planned : null;
  const [changing, setChanging] = useState(false);
  const [choiceId, setChoiceId] = useState('');
  const [selected, setSelected] = useState('');
  const groupId = useId();
  const replacement = choiceId ? catalog.definition(choiceId) : null;
  const shown = replacement ?? current;
  // Kandidater beregnes på et forhåndsvist arbejdsrum, så et nyt spring straks viser, hvem der kan det.
  const candidates = useMemo((): AmbitionCandidate[] => {
    if (!replacement) return ambitionCandidates(workspace, rulePackage, teamId, round, entry.id);
    try {
      const preview = changeAmbitionSkill(workspace, planId, discipline, scenarioId, round.id, entry.id, replacement, undefined, profile, ambitionEnvironment(rulePackage));
      const previewRound = preview.plans.find((plan) => plan.id === planId)![discipline].find((item) => item.id === scenarioId)!.rounds.find((item) => item.id === round.id)!;
      return ambitionCandidates(preview, rulePackage, teamId, previewRound, entry.id);
    } catch {
      return [];
    }
  }, [workspace, rulePackage, teamId, round, entry.id, choiceId]);
  const matches = candidates.filter((item) => item.status === 'match');
  const others = candidates.filter((item) => item.status !== 'match');
  const difficulty = shown ? rulePackage.evaluateSkill(shown).difficulty.value : null;
  const name = (candidate: AmbitionCandidate) => `${candidate.athlete.name}${candidate.athlete.discriminator ? ` · ${candidate.athlete.discriminator}` : ''}`;
  return (
    <ActionForm
      formRef={formRef}
      className="ambition-form"
      disabled={!writable}
      submit={(data) => {
        const athleteSkillId = String(data.get('ambition-athlete') ?? '') || null;
        if (choiceId && !replacement) throw new Error(missingSpring);
        request({ kind: 'update', entryId: entry.id, definition: replacement, role: roleOf(data), athleteSkillId });
      }}
    >
      <fieldset disabled={!writable} onChange={onDirty}>
        <div className="ambition-ticket">
          <span className="ambition-mark" aria-hidden="true">+</span>
          <span className="plan-choice-name">
            <small className="ambition-eyebrow">Ambition · {replacement ? 'nyt spring' : 'fastlåst spring'}</small>
            <strong>{shown ? springDisplayName(shown, rulePackage) : 'Springet findes ikke længere'}</strong>
            {shown && springDirectionText(shown) && <small>{springDirectionText(shown)}</small>}
          </span>
          <PlanDifficulty value={difficulty ? points(difficulty) : null} />
        </div>
        {changing ? (
          <div className="ambition-change">
            <PlanSkillSelect
              catalog
              options={catalog.options}
              initialValue={current ? catalog.idFor(current) : ''}
              onChange={(id) => {
                setChoiceId(id);
                setSelected('');
                onDirty?.();
              }}
            />
          </div>
        ) : (
          <button type="button" className="quiet ambition-change-toggle" onClick={() => setChanging(true)}>
            Skift spring
          </button>
        )}
        <div className="ambition-candidates" role="radiogroup" aria-labelledby={`${groupId}-title`}>
          <p id={`${groupId}-title`} className="ambition-candidates-title">Hvem tager pladsen?</p>
          <label className={`candidate-row keep-open${selected === '' ? ' is-selected' : ''}`}>
            <input type="radio" name="ambition-athlete" value="" checked={selected === ''} onChange={() => setSelected('')} />
            <span className="candidate-avatar ghost" aria-hidden="true">+</span>
            <span className="candidate-name">
              <strong>Behold som ambition</strong>
              <small>Pladsen venter, til en gymnast kan springet.</small>
            </span>
          </label>
          <h3 className="candidate-group">
            Kan springet <span>{matches.length}</span>
          </h3>
          {matches.length === 0 && <p className="candidate-empty">Ingen på holdet kan springet endnu.</p>}
          {matches.map((candidate) => (
            <label key={candidate.athlete.id} className={`candidate-row${selected === candidate.registration!.id ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="ambition-athlete"
                value={candidate.registration!.id}
                checked={selected === candidate.registration!.id}
                onChange={() => setSelected(candidate.registration!.id)}
              />
              <span className="candidate-avatar" aria-hidden="true">{initials(candidate.athlete.name)}</span>
              <span className="candidate-name">
                <strong>{name(candidate)}</strong>
              </span>
              <PlanSafety value={candidate.registration!.stability} />
            </label>
          ))}
          {others.length > 0 && (
            <>
              <h3 className="candidate-group">
                Kan ikke endnu <span>{others.length}</span>
              </h3>
              {others.map((candidate) => (
                <div key={candidate.athlete.id} className="candidate-row is-disabled">
                  <label>
                    <input type="radio" name="ambition-athlete" disabled value="" />
                    <span className="candidate-avatar" aria-hidden="true">{initials(candidate.athlete.name)}</span>
                    <span className="candidate-name">
                      <strong>{name(candidate)}</strong>
                      <small>{candidate.reason === 'in-round' ? 'Er allerede med i omgangen' : 'Har ikke springet registreret'}</small>
                    </span>
                  </label>
                  {candidate.reason !== 'in-round' && (
                    <button type="button" className="quiet" aria-label={`Åbn gymnastens færdigheder: ${name(candidate)}`} onClick={() => inspect(candidate.athlete.id)}>
                      Åbn færdigheder
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
        <RoleField value={entry.role} />
      </fieldset>
      <p className="muted">
        Kan springet viser holdets aktive gymnaster med en anvendelig registrering af samme spring, som ikke allerede er med i omgangen.
        Besætter du en anden ambition med samme gymnast, forsvinder gymnasten fra denne plads' tal.
      </p>
      {!writable && <p className="notice">Arbejdsrummet har læseadgang. Du kan gennemse valgene, men ikke ændre dem.</p>}
    </ActionForm>
  );
}

/** Pladsens tekstchips. Teksten bærer betydningen; farven er kun ekstra. */
export function AmbitionReadiness({ canNow }: { canNow: number }) {
  return <span className={`ambition-chip ${canNow ? 'ready' : 'none'}`}>{canNow ? `${canNow} kan nu` : 'Ingen kan endnu'}</span>;
}

export function ambitionLabel(spring: string, canNow: number) {
  return `Ambition: ${spring}, mangler gymnast, ${canNow === 0 ? 'ingen gymnaster kan endnu' : canNow === 1 ? '1 gymnast kan nu' : `${canNow} gymnaster kan nu`}`;
}
