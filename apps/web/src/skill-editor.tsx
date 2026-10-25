import { useMemo, useState } from 'react';
import {
  confirmConnection,
  canonicalJson,
  newEntityId,
  registerAthleteSkill,
  replaceAthleteSkill,
  skillDefinitionSchema,
  skillIdentity,
} from '@teamgym/domain';
import type {
  AthleteSkill,
  Discipline,
  ElementExecution,
  SkillDefinition,
  Stability,
  Workspace,
} from '@teamgym/domain';
import type { RhythmCatalogEntry, RulePackage } from '@teamgym/rules';
import { ActionForm, Decision, SkillBreakdown, SourceLinks, statusText } from './components';
import {
  registerSpringBatch,
  shorterSeries,
  springLibrary,
  springElementName,
  springSeriesName,
  springDirectionText,
} from './spring-library';
import type { SpringSelection } from './spring-library';
import { SpringPicker } from './spring-picker';
import { restoreRemovedSkill } from './restore-skill';
import {
  canStartFloorSeries,
  knownSeries,
  connectionHint,
  CONNECTION_CATALOG_VERSION,
} from './spring-connections';

const positions = { tuck: 'Lukket', pike: 'Hoftebøjet', straight: 'Strakt' };
const variants: Record<string, string> = {
  'two-feet': 'To fødder',
  'one-foot': 'Én fod',
  'same-foot': 'Samme fod',
  'opposite-foot': 'Modsatte fod',
  together: 'Samlede',
  straddle: 'Spredte',
  seated: 'Siddende',
  left: 'Venstre',
  right: 'Højre',
  forward: 'Fremad',
  backward: 'Bagud',
  sideways: 'Sidelæns',
  standing: 'Stående',
  kneeling: 'Knælende',
  one: 'Én',
  two: 'To',
  tuck: 'Lukket',
  pike: 'Hoftebøjet',
  straight: 'Strakt',
};
const variantLabels: Record<string, string> = {
  legs: 'Ben',
  landing: 'Landing',
  takeoff: 'Afsæt',
  facing: 'Front',
  side: 'Side',
  supportLeg: 'Støtteben',
  handSupport: 'Håndstøtte',
  bodyPosition: 'Kropsposition',
  startOrientation: 'Startretning',
  startLevel: 'Startniveau',
};
export function variantText(variant: Readonly<Record<string, string | number | boolean>>) {
  return Object.entries(variant)
    .map(([key, value]) => `${variantLabels[key] ?? key}: ${variants[String(value)] ?? value}`)
    .join(' · ');
}
export function SkillEditor({
  workspace,
  athleteId,
  rulePackage,
  save,
  openExisting,
  registration,
  initialDiscipline = 'tumbling',
  initialMoment,
}: {
  workspace: Workspace;
  athleteId: string;
  rulePackage: RulePackage;
  save: (workspace: Workspace) => void;
  openExisting: (registrationId: string) => void;
  registration?: AthleteSkill | undefined;
  initialDiscipline?: Discipline;
  initialMoment?: RhythmCatalogEntry | undefined;
}) {
  const original = registration
    ? workspace.skills.find((skill) => skill.id === registration.skillId)
    : undefined;
  const [discipline, setDiscipline] = useState<Discipline>(original?.discipline ?? initialDiscipline);
  const [query, setQuery] = useState('');
  const [building, setBuilding] = useState(!!registration);
  const [selections, setSelections] = useState<SpringSelection[]>([]);
  const [newStability, setNewStability] = useState<Stability | null>(null);
  const [assessedAt, setAssessedAt] = useState(new Date().toISOString().slice(0, 10));
  const batchMode = discipline !== 'rhythm' && !building && !registration;
  const [includeShorter, setIncludeShorter] = useState(true);
  const library = useMemo(() => springLibrary(rulePackage, workspace), [rulePackage, workspace]);
  const [elements, setElements] = useState<ElementExecution[]>(
    original?.discipline === 'tumbling'
      ? structuredClone(original.elements)
      : original?.discipline === 'trampet'
        ? [structuredClone(original.jump)]
        : [],
  );
  const [momentId, setMomentId] = useState(
    original?.discipline === 'rhythm'
      ? original.momentId
      : (initialMoment?.id ?? rulePackage.rhythmCatalog[0]!.id),
  );
  const moment = rulePackage.rhythmCatalog.find((item) => item.id === momentId);
  const [variant, setVariant] = useState<Record<string, string | number | boolean>>(
    original?.discipline === 'rhythm'
      ? original.variant
      : Object.fromEntries(
          (initialMoment ?? rulePackage.rhythmCatalog[0])!.options.map((option) => [
            option.key,
            option.defaultValue,
          ]),
        ),
  );
  const commonSeries = discipline === 'tumbling' && knownSeries(elements);
  const missingEntry = discipline === 'tumbling' && elements.length > 0 && !canStartFloorSeries(elements);
  const custom = discipline === 'tumbling' && elements.length > 1 && !commonSeries;
  const [confirm, setConfirm] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [name, setName] = useState(original?.name ?? '');
  const [advanced, setAdvanced] = useState<number | null>(null);
  const catalog = rulePackage.springCatalog.filter((item) => {
    if (
      discipline === 'tumbling' ? item.execution.apparatus !== 'floor' : item.execution.apparatus === 'floor'
    )
      return false;
    const searchable =
      `${springElementName(item.execution, rulePackage, item.name)} ${springSeriesName([item.execution], rulePackage)} ${item.officialCode} ${item.aliases.join(' ')}`.toLocaleLowerCase(
        'da-DK',
      );
    return query
      .toLocaleLowerCase('da-DK')
      .trim()
      .split(/\s+/)
      .every((part) => searchable.includes(part));
  });
  function definition(): SkillDefinition {
    if (discipline !== 'rhythm' && !building) {
      throw new Error('Vælg spring fra listen.');
    }
    const base = {
      id: newEntityId(),
      name:
        name.trim() ||
        (discipline === 'rhythm'
          ? (moment?.name ?? 'Ukendt moment')
          : springSeriesName(elements, rulePackage)),
      archived: false,
    };
    return skillDefinitionSchema.parse(
      discipline === 'rhythm'
        ? { ...base, discipline, momentId, variant }
        : discipline === 'trampet'
          ? { ...base, discipline, jump: elements[0] }
          : {
              ...base,
              discipline,
              elements,
              connection:
                original?.discipline === 'tumbling' &&
                canonicalJson(original.elements) === canonicalJson(elements)
                  ? structuredClone(original.connection)
                  : {
                      kind: custom ? 'custom' : 'standard',
                      transitions: elements
                        .slice(1)
                        .map(() => (custom ? 'Trænerbeskrevet direkte forbindelse' : 'direct')),
                    },
            },
    );
  }
  let preview: SkillDefinition | null = null;
  try {
    preview = definition();
  } catch {
    /* Formularen forklarer manglende valg. */
  }
  const confirmedPreview: AthleteSkill | undefined =
    preview && (commonSeries || (custom && confirm))
      ? {
          id: 'preview',
          athleteId,
          skillId: preview.id,
          archived: false,
          stability: null,
          assessedAt: null,
          note: '',
          updatedAt: new Date().toISOString(),
          reviewRequiredFor: [],
          connectionConfirmation: {
            executionIdentity: skillIdentity(preview),
            confirmedAt: new Date().toISOString(),
            note:
              confirmation || `Kendte standardovergange (${CONNECTION_CATALOG_VERSION}): ${preview.name}.`,
          },
        }
      : undefined;
  const evaluation =
    preview && preview.discipline !== 'rhythm' ? rulePackage.evaluateSkill(preview, confirmedPreview) : null;
  const shorter = useMemo(
    () =>
      preview && preview.discipline === 'tumbling' && !registration
        ? shorterSeries(preview, rulePackage)
        : [],
    [preview, registration, rulePackage],
  );
  return (
    <ActionForm
      className="skill-editor"
      label={
        registration
          ? 'Opdater'
          : batchMode
            ? `Registrér ${selections.length} spring`
            : selections.length && discipline !== 'rhythm'
              ? `Registrér ${selections.length + 1} spring`
              : 'Registrér færdighed'
      }
      disabled={batchMode ? selections.length === 0 : !preview || missingEntry}
      submit={() => {
        if (batchMode) {
          save(
            registerSpringBatch(workspace, athleteId, selections, rulePackage, {
              includeShorter,
              assessedAt,
            }),
          );
          return;
        }
        if (missingEntry) throw new Error('Tilføj en indgang fra tilløb, fx rondat, før serien registreres.');
        const skill = definition();
        let result: Workspace;
        let registrationId: string;
        if (registration) {
          result = replaceAthleteSkill(workspace, registration.id, skill);
          registrationId = registration.id;
        } else {
          if (skill.discipline !== 'rhythm') {
            save(
              registerSpringBatch(
                workspace,
                athleteId,
                [
                  ...selections,
                  {
                    definition: skill,
                    stability: newStability,
                    confirmed: commonSeries || (custom && confirm),
                    ...(confirmation ? { confirmationNote: confirmation } : {}),
                  },
                ],
                rulePackage,
                { includeShorter, assessedAt },
              ),
            );
            return;
          }
          const normalizedKey = rulePackage.bindRhythm(skill).key;
          const existing =
            normalizedKey &&
            workspace.athleteSkills.find((item) => {
              if (item.athleteId !== athleteId) return false;
              const previous = workspace.skills.find((definition) => definition.id === item.skillId)!;
              if (previous.discipline !== skill.discipline) return false;
              return (
                (previous.discipline === 'rhythm'
                  ? rulePackage.bindRhythm(previous).key
                  : rulePackage.evaluateSkill(previous).identity) === normalizedKey
              );
            });
          if (existing) {
            if (existing.archived) {
              save(restoreRemovedSkill(workspace, existing.id));
              return;
            }
            openExisting(existing.id);
            return;
          }
          const created = registerAthleteSkill(workspace, athleteId, skill);
          if (created.existed) {
            if (workspace.athleteSkills.find((item) => item.id === created.athleteSkillId)?.archived) {
              save(restoreRemovedSkill(workspace, created.athleteSkillId));
              return;
            }
            openExisting(created.athleteSkillId);
            return;
          }
          result = created.workspace;
          registrationId = created.athleteSkillId;
        }
        if (skill.discipline === 'tumbling' && (commonSeries || (custom && confirm)))
          result = confirmConnection(
            result,
            registrationId,
            confirmation ||
              `Standardserien ${skill.name} er registreret på gymnasten (${CONNECTION_CATALOG_VERSION}).`,
          );
        save(result);
      }}
    >
      <label className="discipline-field">
        Disciplin
        <select
          value={discipline}
          disabled={!!registration}
          onChange={(event) => {
            setDiscipline(event.target.value as Discipline);
            setElements([]);
            setName('');
            setQuery('');
            setConfirm(false);
          }}
        >
          <option value="tumbling">Bane</option>
          <option value="trampet">Trampet</option>
          <option value="rhythm">Rytme</option>
        </select>
      </label>
      {(discipline === 'rhythm' || building) && (
        <label>
          Navn på færdighed
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Udfyldes fra dine valg, hvis feltet er tomt"
            maxLength={200}
          />
        </label>
      )}
      {discipline === 'rhythm' ? (
        <>
          <label>
            Moment
            <select
              value={momentId}
              onChange={(event) => {
                const selected = rulePackage.rhythmCatalog.find((item) => item.id === event.target.value)!;
                setMomentId(selected.id);
                setVariant(
                  Object.fromEntries(selected.options.map((option) => [option.key, option.defaultValue])),
                );
              }}
            >
              {!moment && <option value={momentId}>Ukendt kobling: {momentId}</option>}
              {[...new Set(rulePackage.rhythmCatalog.map((item) => item.category))].map((category) => (
                <optgroup key={category} label={category}>
                  {rulePackage.rhythmCatalog
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.officialCode} · {item.name} · {item.value.replace('.', ',')}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          {moment && (
            <>
              <p>{moment.specificRequirement}</p>
              {moment.options.map((option) => (
                <label key={option.key}>
                  {option.label}
                  <select
                    value={String(variant[option.key] ?? option.defaultValue)}
                    onChange={(event) => setVariant({ ...variant, [option.key]: event.target.value })}
                  >
                    {option.values.map((value) => (
                      <option key={value} value={value}>
                        {variants[value] ?? value}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <details>
                <summary>Udførelseskrav og kilde</summary>
                {[
                  ...moment.generalRequirements,
                  ...moment.categoryRequirements,
                  ...moment.rowRequirements,
                ].map((requirement) => (
                  <p key={requirement}>{requirement}</p>
                ))}
                <SourceLinks sources={[moment.source]} rulePackage={rulePackage} />
              </details>
            </>
          )}
        </>
      ) : (
        <>
          {!registration && (
            <div className="segmented" role="group" aria-label="Vælg eller byg spring">
              <button
                type="button"
                aria-pressed={!building}
                onClick={() => {
                  if (building) {
                    setName('');
                    setConfirm(false);
                  }
                  setBuilding(false);
                  setQuery('');
                  setAdvanced(null);
                }}
              >
                Vælg fra listen
              </button>
              <button
                type="button"
                aria-pressed={building}
                onClick={() => {
                  setBuilding(true);
                  setQuery('');
                  setAdvanced(null);
                }}
              >
                Byg selv
              </button>
            </div>
          )}
          {!building && (
            <SpringPicker
              key={discipline}
              library={library}
              discipline={discipline}
              workspace={workspace}
              athleteId={athleteId}
              rulePackage={rulePackage}
              selections={selections}
              change={setSelections}
              includeShorter={includeShorter}
              setIncludeShorter={setIncludeShorter}
              assessedAt={assessedAt}
              setAssessedAt={setAssessedAt}
            />
          )}
          {building && (
            <>
              {!registration && (
                <p className="muted">
                  Når du registrerer springet, bliver det også tilgængeligt i listen på andre gymnaster i
                  arbejdsrummet.
                </p>
              )}
              <h3>
                {discipline === 'tumbling' ? 'Komplet serie i udførelsesrækkefølge' : 'Komplet trampetspring'}
              </h3>
              {preview && elements.length > 0 && (
                <div className="selected-spring" role="status">
                  <h3>Valgt serie</h3>
                  <p>
                    <strong>{preview.name}</strong>
                  </p>
                  {preview.discipline !== 'rhythm' && springDirectionText(preview) && (
                    <small className="spring-directions">{springDirectionText(preview)}</small>
                  )}
                </div>
              )}
              {elements.length === 0 && (
                <p className="empty">
                  Vælg {discipline === 'tumbling' ? 'seriens første element' : 'et spring'} i kataloget.
                </p>
              )}
              <ol className="element-list">
                {elements.map((element, index) => (
                  <li key={index}>
                    <span>{springElementName(element, rulePackage)}</span>
                    {evaluation?.elementValues[index] && (
                      <small>
                        Element-D: <Decision value={evaluation.elementValues[index].value} />
                      </small>
                    )}
                    <button
                      type="button"
                      className="quiet"
                      onClick={() => setAdvanced(advanced === index ? null : index)}
                    >
                      Variant {index + 1}
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      disabled={index === 0}
                      aria-label={`Flyt element ${index + 1} op`}
                      onClick={() => {
                        const copy = [...elements];
                        [copy[index - 1], copy[index]] = [copy[index]!, copy[index - 1]!];
                        setElements(copy);
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      aria-label={`Fjern element ${index + 1}`}
                      onClick={() => setElements(elements.filter((_, position) => position !== index))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>
              {missingEntry && (
                <p className="notice" role="status">
                  Serien mangler en indgang fra tilløb. Tilføj fx rondat før den baglæns salto, flik eller
                  whipback, og flyt indgangen til starten.
                </p>
              )}
              {advanced !== null && elements[advanced] && (
                <ElementVariant
                  value={elements[advanced]}
                  change={(value) =>
                    setElements(elements.map((item, index) => (index === advanced ? value : item)))
                  }
                />
              )}
              <label>
                Søg spring, kode eller alias
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <div className="catalog-results" aria-label="Springkatalog">
                {catalog.map((item) => (
                  <button
                    type="button"
                    className="catalog-option"
                    key={item.referenceId}
                    onClick={() => {
                      setElements(
                        discipline === 'trampet'
                          ? [structuredClone(item.execution)]
                          : [...elements, structuredClone(item.execution)],
                      );
                      setAdvanced(null);
                    }}
                  >
                    <span>
                      {springElementName(item.execution, rulePackage, item.name)}
                      <small>
                        {item.officialCode} · {item.source.sourceId} ·{' '}
                        {item.status === 'allowed'
                          ? 'Kendt variant'
                          : item.status === 'forbidden'
                            ? 'Forbudt i DK'
                            : `Uafklaret ${item.issueId}`}
                      </small>
                    </span>
                    <strong>{item.printedValue.replace('.', ',')}</strong>
                  </button>
                ))}
              </div>
            </>
          )}
          {building && !registration && (
            <div className="form-grid">
              <label>
                Sikkerhed
                <select
                  value={newStability ?? ''}
                  onChange={(event) =>
                    setNewStability(event.target.value ? (Number(event.target.value) as Stability) : null)
                  }
                >
                  <option value="">Ikke vurderet</option>
                  {[1, 2, 3, 4, 5].map((number) => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  ))}
                </select>
              </label>
              {newStability !== null && (
                <label>
                  Vurderingsdato
                  <input
                    type="date"
                    value={assessedAt}
                    required
                    onChange={(event) => setAssessedAt(event.target.value)}
                  />
                </label>
              )}
            </div>
          )}
          {building && custom && evaluation?.connection === 'unverified' && (
            <section className="connection-review">
              <p className="notice">
                {connectionHint(elements) ??
                  'Appen genkender ikke denne sammensætning endnu. Kontrollér elementernes retning og den samlede serie.'}
              </p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(event) => setConfirm(event.target.checked)}
                />
                Gymnasten kan udføre hele serien uden mellemtrin
              </label>
              {confirm && (
                <label>
                  Beskrivelse af forbindelsen
                  <textarea
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                    maxLength={2000}
                  />
                </label>
              )}
            </section>
          )}
          {shorter.length > 0 && (
            <div className="shorter-series">
              <label className="check">
                <input
                  type="checkbox"
                  checked={includeShorter}
                  onChange={(event) => setIncludeShorter(event.target.checked)}
                />
                Medtag kortere serier med samme sikkerhed
              </label>
              {includeShorter && (
                <details>
                  <summary>Medtagne kortere serier ({shorter.length})</summary>
                  <p>Disse registreres også. Dit valgte spring står ovenfor under Valgt serie.</p>
                  <ul>
                    {shorter.map((skill) => (
                      <li key={skill.id}>
                        {skill.name}
                        {newStability !== null ? ` · ${newStability}/5` : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <small>
                De kortere serier arver sikkerheden. Vælges en kortere serie også særskilt, bruges dens egen
                vurdering.
              </small>
            </div>
          )}
          {evaluation && (
            <section className="inline-analysis">
              <h3>Planlagt D</h3>
              <Decision value={evaluation.difficulty} />
              <SkillBreakdown evaluation={evaluation} />
              <p>
                Gyldighed: {missingEntry ? 'Mangler indgang' : statusText[evaluation.validity]} · forbindelse:{' '}
                {evaluation.connection === 'verified'
                  ? 'Kendt'
                  : evaluation.connection === 'invalid'
                    ? 'Ugyldig'
                    : 'Kræver konkret bekræftelse'}
              </p>
              <SourceLinks sources={evaluation.explanation.sources} rulePackage={rulePackage} />
              {evaluation.explanation.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </section>
          )}
        </>
      )}
      {registration && (
        <p className="notice">
          Når den konkrete udførelse ændres, bevares omgangspladserne, og stabilitet og
          forbindelsesbekræftelse skal vurderes på ny.
        </p>
      )}
    </ActionForm>
  );
}

function ElementVariant({
  value,
  change,
}: {
  value: ElementExecution;
  change: (value: ElementExecution) => void;
}) {
  const [distribution, setDistribution] = useState(value.twistDistribution.join(','));
  function update(patch: Partial<ElementExecution>) {
    change({ ...value, ...patch });
  }
  return (
    <fieldset className="variant-fields">
      <legend>Præcis formelvariant</legend>
      <div className="form-grid">
        <label>
          Rotationer
          <select
            value={value.rotationQuarterTurns / 4}
            onChange={(event) => update({ rotationQuarterTurns: Number(event.target.value) * 4 })}
          >
            {[1, 2, 3].map((number) => (
              <option key={number}>{number}</option>
            ))}
          </select>
        </label>
        <label>
          Samlet skrue (grader)
          <input
            type="number"
            min={0}
            max={3600}
            step={180}
            value={value.twistsHalfTurns * 180}
            onChange={(event) =>
              update({ twistsHalfTurns: Number(event.target.value) / 180, twistDistribution: [] })
            }
          />
        </label>
        <label>
          Retning
          <select
            value={value.direction}
            onChange={(event) => update({ direction: event.target.value as ElementExecution['direction'] })}
          >
            <option value="forward">Forlæns</option>
            <option value="backward">Baglæns</option>
            <option value="sideways">Sidelæns</option>
          </select>
        </label>
      </div>
      {value.bodyPositions.map((position, index) => (
        <label key={index}>
          Kropsposition {index + 1}
          <select
            value={position}
            onChange={(event) =>
              update({
                bodyPositions: value.bodyPositions.map((item, position) =>
                  position === index ? (event.target.value as typeof item) : item,
                ),
              })
            }
          >
            {Object.entries(positions).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="actions">
        <button
          type="button"
          className="quiet"
          onClick={() => update({ bodyPositions: [...value.bodyPositions, 'tuck'], twistDistribution: [] })}
        >
          Tilføj salto-kropsposition
        </button>
        <button
          type="button"
          className="quiet"
          disabled={value.bodyPositions.length === 1}
          onClick={() => update({ bodyPositions: value.bodyPositions.slice(0, -1), twistDistribution: [] })}
        >
          Fjern sidste kropsposition
        </button>
      </div>
      <label>
        Skruefordeling pr. salto (antal halve skruer, fx 1,0)
        <input
          value={distribution}
          onChange={(event) => {
            setDistribution(event.target.value);
            const parts = event.target.value.trim() ? event.target.value.split(',').map(Number) : [];
            if (parts.every((number) => Number.isInteger(number) && number >= 0))
              update({ twistDistribution: parts });
          }}
        />
      </label>
      <p className="muted">
        Kropsposition, rotationer og skruefordeling skal passe sammen. Ukendte koblinger forbliver uafklarede;
        der opfindes ingen officiel kode.
      </p>
    </fieldset>
  );
}
