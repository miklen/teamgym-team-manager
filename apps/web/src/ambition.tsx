import { useId, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { changeAmbitionSkill, skillIdentity } from '@teamgym/domain';
import type { ElementExecution, Round, RoundEntry, SpringDiscipline, Workspace } from '@teamgym/domain';
import { ambitionCandidates, ambitionEnvironment } from '@teamgym/rules';
import type { AmbitionCandidate, RulePackage, TeamProfile } from '@teamgym/rules';
import { ActionForm, points } from './components';
import { PlanDifficulty, PlanSafety } from './plan-skill-select';
import { springDirectionText, springDisplayName } from './spring-library';
import type { SpringDefinition } from './spring-library';
import { AmbitionSpringPicker } from './ambition-spring-picker';
import { SkillEditor } from './skill-editor';
import './ambition.css';

export type SlotMode = 'athlete' | 'ambition';

/** Hvad dialogen beder springplanen om; domænekommandoerne udføres samlet i én ændring. */
export type AmbitionRequest =
  | { kind: 'add'; definition: SpringDefinition; role: RoundEntry['role']; count: number; approvalNote: string | null }
  | { kind: 'update'; entryId: string; definition: SpringDefinition | null; role: RoundEntry['role']; athleteSkillId: string | null; approvalNote: string | null };

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

function RoleField({ value, onChange }: { value: RoundEntry['role']; onChange?: ((role: RoundEntry['role']) => void) | undefined }) {
  return (
    <label>
      Rolle
      <select name="role" defaultValue={value} onChange={(event) => onChange?.(event.target.value as RoundEntry['role'])}>
        <option value="counting">Tællende</option>
        <option value="extra">Ekstra · først · indgår ikke i D/C/stabilitet</option>
      </select>
    </label>
  );
}

const roleOf = (data: FormData): RoundEntry['role'] => (data.get('role') === 'extra' ? 'extra' : 'counting');
const missingSpring = 'En ambition kræver et spring. Vælg springet i kataloget.';

/** Ny ambition: springet vælges i disciplinens katalog. */
export function AmbitionCreateForm({ workspace, teamId, discipline, rulePackage, round, profile, writable, request, formRef, onDirty }: {
  workspace: Workspace; teamId: string; discipline: SpringDiscipline; rulePackage: RulePackage; round: Round; profile: TeamProfile; writable: boolean;
  request: (value: AmbitionRequest) => void; formRef?: RefObject<HTMLFormElement | null> | undefined; onDirty?: (() => void) | undefined;
}) {
  const [selected, setSelected] = useState<SpringDefinition | null>(null);
  const [building, setBuilding] = useState<ElementExecution[] | null>(null);
  const [approvalNote, setApprovalNote] = useState<string | null>(null);
  const [role, setRole] = useState<RoundEntry['role']>('counting');
  const [count, setCount] = useState(1);
  const capacity = Math.max(0, (role === 'counting' ? profile.counting : profile.extra) - round.entries.filter((entry) => entry.role === role).length);
  const chosenCount = Math.min(count, capacity);
  if (building !== null) return <div className="ambition-form">
    <button type="button" className="quiet" onClick={() => setBuilding(null)}>← Tilbage til springvalg</button>
    <SkillEditor key={JSON.stringify(building)} workspace={workspace} athleteId="" rulePackage={rulePackage} save={() => {}} openExisting={() => {}} initialDiscipline={discipline} initialElements={building} onDefinition={(definition, approve, note) => {
      if (definition.discipline === 'rhythm') throw new Error('Vælg et bane- eller trampetspring.');
      setSelected(definition);
      setApprovalNote(approve ? note : null);
      setBuilding(null);
      onDirty?.();
    }} />
  </div>;
  return (
    <ActionForm
      formRef={formRef}
      className="ambition-form"
      disabled={!writable}
      submit={(data) => {
        if (!selected) throw new Error(missingSpring);
        if (chosenCount < 1) throw new Error('Der er ingen ledige pladser i den valgte rolle.');
        request({ kind: 'add', definition: selected, role: roleOf(data), count: chosenCount, approvalNote });
      }}
    >
      <fieldset disabled={!writable} onChange={onDirty}>
        <div className="ambition-intro">
          <span className="ambition-mark" aria-hidden="true">+</span>
          <p>Planlæg springet nu. Pladsen tæller med i D og C og besættes, når en gymnast kan springet.</p>
        </div>
        <AmbitionSpringPicker workspace={workspace} rulePackage={rulePackage} discipline={discipline} teamId={teamId} selected={selected} approvalNote={approvalNote} onSelect={(definition) => { setSelected(definition); setApprovalNote(null); onDirty?.(); }} onBuild={setBuilding} />
        <RoleField value="counting" onChange={(next) => { setRole(next); setCount(1); onDirty?.(); }} />
        <label>Antal nye pladser
          <select name="count" value={chosenCount} onChange={(event) => { setCount(Number(event.target.value)); onDirty?.(); }}>
            {Array.from({ length: capacity }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <p className="ambition-count-preview" role="status">{chosenCount} {role === 'counting' ? 'tællende' : 'ekstra'} {chosenCount === 1 ? 'plads' : 'pladser'} føjes til i rækkefølge efter de eksisterende {role === 'counting' ? 'tællende' : 'ekstra'} pladser. Ingen gymnast vælges.</p>
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
  const planned = workspace.skills.find((skill) => skill.id === entry.plannedSkillId);
  const current = planned && planned.discipline !== 'rhythm' ? planned : null;
  const [changing, setChanging] = useState(false);
  const [replacement, setReplacement] = useState<SpringDefinition | null>(null);
  const [building, setBuilding] = useState<ElementExecution[] | null>(null);
  const [approvalNote, setApprovalNote] = useState<string | null>(null);
  const [selected, setSelected] = useState('');
  const groupId = useId();
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
  }, [workspace, rulePackage, teamId, round, entry.id, replacement]);
  const matches = candidates.filter((item) => item.status === 'match');
  const others = candidates.filter((item) => item.status !== 'match');
  const evaluated = shown ? rulePackage.evaluateSkill(shown) : null;
  const pending = shown?.discipline === 'tumbling' && approvalNote ? { ...shown, sharedConnectionApproval: { executionIdentity: skillIdentity(shown), approvedAt: new Date().toISOString(), note: approvalNote } } : shown;
  const difficulty = pending ? rulePackage.evaluateSkill(pending).difficulty.value : null;
  const name = (candidate: AmbitionCandidate) => `${candidate.athlete.name}${candidate.athlete.discriminator ? ` · ${candidate.athlete.discriminator}` : ''}`;
  if (building !== null) return <div className="ambition-form">
    <button type="button" className="quiet" onClick={() => setBuilding(null)}>← Tilbage til ambitionen</button>
    <SkillEditor key={JSON.stringify(building)} workspace={workspace} athleteId="" rulePackage={rulePackage} save={() => {}} openExisting={() => {}} initialDiscipline={discipline} initialElements={building} onDefinition={(definition, approve, note) => {
      if (definition.discipline === 'rhythm') throw new Error('Vælg et bane- eller trampetspring.');
      setReplacement(definition);
      setApprovalNote(approve ? note : null);
      setBuilding(null);
      setSelected('');
      onDirty?.();
    }} />
  </div>;
  return (
    <ActionForm
      formRef={formRef}
      className="ambition-form"
      disabled={!writable}
      submit={(data) => {
        const athleteSkillId = String(data.get('ambition-athlete') ?? '') || null;
        request({ kind: 'update', entryId: entry.id, definition: replacement, role: roleOf(data), athleteSkillId, approvalNote });
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
            <AmbitionSpringPicker workspace={workspace} rulePackage={rulePackage} discipline={discipline} teamId={teamId} selected={shown} approvalNote={approvalNote} onSelect={(definition) => { setReplacement(definition); setApprovalNote(null); setSelected(''); onDirty?.(); }} onBuild={setBuilding} />
          </div>
        ) : (
          <button type="button" className="quiet ambition-change-toggle" onClick={() => setChanging(true)}>
            Skift spring
          </button>
        )}
        {shown?.discipline === 'tumbling' && shown.elements.length > 1 && evaluated?.connection === 'unverified' && !shown.sharedConnectionApproval && <section className="connection-review">
          <p className="notice" role="status">Forbindelsen er uafklaret. Træneren kan godkende netop denne kæde for arbejdsrummet.</p>
          <label className="check"><input type="checkbox" checked={approvalNote !== null} onChange={(event) => { setApprovalNote(event.target.checked ? '' : null); onDirty?.(); }} />Godkend den præcise forbindelse for hele arbejdsrummet</label>
          {approvalNote !== null && <label>Fælles begrundelse for forbindelsen<textarea value={approvalNote} onChange={(event) => { setApprovalNote(event.target.value); onDirty?.(); }} required maxLength={2000} /></label>}
        </section>}
        {shown?.discipline === 'tumbling' && (shown.sharedConnectionApproval || approvalNote) && <p className="muted" role="status">Trænerbekræftet forbindelse{approvalNote ? ' ved gemning' : ''}.</p>}
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
