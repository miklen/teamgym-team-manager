import { useState } from 'react';
import { formatStability } from '@teamgym/domain';
import type { Stability } from '@teamgym/domain';
import { filterRhythmRows } from '@teamgym/rules';
import type { RhythmCell, RhythmRow } from '@teamgym/rules';
import type { DataProps } from './athletes';
import { AthleteInspector } from './athletes';
import { Dialog, Empty, SourceLinks } from './components';
import { registry } from './rules';
import { SkillEditor, variantText } from './skill-editor';
import { hasRuleUncertainty, rhythmUncertaintyIds, RuleUncertainty, UncertaintyMark } from './rule-uncertainty';

const cellLabels = {
  missing: 'Mangler færdighed',
  'not-assessed': 'Ikke vurderet',
  assessed: 'Vurderet',
  unresolved: 'Ukendt regelkobling',
  review: 'Kræver revurdering',
};
export function RhythmPage({ workspace, change, writable, teamId }: DataProps & { teamId: string }) {
  const team = workspace.teams.find((item) => item.id === teamId)!;
  const resolved = registry.resolve(team.rulesetBinding);
  const [mode, setMode] = useState<'all' | 'common' | 'partial'>('all');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [threshold, setThreshold] = useState<Stability | null>(null);
  const [selected, setSelected] = useState<{ row: RhythmRow; cell: RhythmCell } | null>(null);
  const [details, setDetails] = useState<RhythmRow | null>(null);
  const rows = resolved.status === 'known' ? resolved.rulePackage.rhythm(workspace, teamId, threshold) : [];
  const filtered = filterRhythmRows(rows, { mode, category, search, threshold });
  const athletes = workspace.athletes.filter((item) => item.teamId === teamId && !item.archived);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Rytmefællesnævnere</h1>
          <p className="page-description">
            {team.name}. {athletes.length} aktive gymnaster.
          </p>
        </div>
      </div>
      <p>
        Individuel kunnen efter præcis udførelse. Gruppeelementer, koreografi og fuld rytmekarakter indgår
        ikke.
      </p>
      <div className="toolbar">
        <label>
          Visning
          <select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
            <option value="all">Alle momenter</option>
            <option value="common">Fælles for alle</option>
            <option value="partial">Delvist dækkede</option>
          </select>
        </label>
        <label>
          Kategori
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Alle kategorier</option>
            {[
              ...new Set(
                resolved.status === 'known'
                  ? resolved.rulePackage.rhythmCatalog.map((item) => item.category)
                  : [],
              ),
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Søg moment
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Navn, kode eller krav"
          />
        </label>
        <label>
          Alle med mindst stabilitet
          <select
            value={threshold ?? ''}
            onChange={(event) =>
              setThreshold(event.target.value ? (Number(event.target.value) as Stability) : null)
            }
          >
            <option value="">Ingen tærskel</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="matrix-legend">
        <span>— Mangler</span>
        <span>○ Ikke vurderet</span>
        <span>↻ Revurdering</span>
        <span>1–5 Vurderet</span>
      </div>
      {resolved.status !== 'known' ? (
        <Empty>Holdets præcise regelpakke er ikke installeret. Registreringer og vurderinger bevares.</Empty>
      ) : !athletes.length ? (
        <Empty>Holdet er tomt. Tilføj gymnaster i kartoteket; et tomt hold kan ingen fælles momenter.</Empty>
      ) : !filtered.length ? (
        <Empty>Ingen momenter opfylder filtrene. Alle gymnaster skal opfylde tærsklen hver for sig.</Empty>
      ) : (
        <>
          <div
            className="matrix-scroll"
            tabIndex={0}
            aria-label="Rytmematrix, rul vandret for flere gymnaster"
          >
            <table className="rhythm-matrix">
              <thead>
                <tr>
                  <th scope="col">Moment og udførelse</th>
                  <th scope="col">Dækning</th>
                  {athletes.map((athlete) => (
                    <th key={athlete.id} scope="col">
                      {athlete.name}
                      {athlete.discriminator && <small>{athlete.discriminator}</small>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">
                      <button className="moment-name" onClick={() => setDetails(row)}>
                        <strong>{row.moment.name} {hasRuleUncertainty(rhythmUncertaintyIds(row.moment, row.variant)) && <UncertaintyMark />}</strong>
                        <small>
                          {row.moment.officialCode} · {row.moment.value} · {row.moment.category}
                        </small>
                        <small>{variantText(row.variant)}</small>
                      </button>
                    </th>
                    <td>
                      <strong>{row.summary.coverage}</strong>
                      <small>{row.summary.ratingCoverage} vurderet</small>
                      <small>
                        Gns. {formatStability(row.summary.mean)} · min. {row.summary.minimum ?? '—'}
                      </small>
                      <button className="quiet" onClick={() => setDetails(row)}>
                        Se mangler
                      </button>
                    </td>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.athleteId}
                        className={`cell-${cell.state} ${cell.stability !== null && cell.stability <= 2 ? 'cell-low' : ''}`}
                      >
                        <button
                          aria-label={`${cell.athleteName}, ${row.moment.name}: ${cellLabels[cell.state]}${cell.stability === null ? '' : ` ${cell.stability}/5`}`}
                          onClick={() => setSelected({ row, cell })}
                        >
                          {cell.state === 'assessed'
                            ? cell.stability
                            : cell.state === 'missing'
                              ? '—'
                              : cell.state === 'not-assessed'
                                ? '○'
                                : '↻'}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rhythm-compact">
            {filtered.map((row) => (
              <section key={row.key}>
                <button className="moment-name" onClick={() => setDetails(row)}>
                  <strong>{row.moment.name} {hasRuleUncertainty(rhythmUncertaintyIds(row.moment, row.variant)) && <UncertaintyMark />}</strong>
                  <small>
                    {row.moment.officialCode} · {row.moment.value} · {variantText(row.variant)}
                  </small>
                </button>
                <p>
                  {row.summary.coverage} kan · {row.summary.ratingCoverage} vurderet · gns.{' '}
                  {formatStability(row.summary.mean)} · min. {row.summary.minimum ?? '—'}
                </p>
                <details>
                  <summary>Gymnaster og vurderinger</summary>
                  <ul className="compact-cells">
                    {row.cells.map((cell) => (
                      <li key={cell.athleteId}>
                        <button className="entity-link" onClick={() => setSelected({ row, cell })}>
                          <span>{cell.athleteName}</span>
                          <span>
                            {cell.state === 'assessed' ? `${cell.stability}/5` : cellLabels[cell.state]}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              </section>
            ))}
          </div>
        </>
      )}
      {details && resolved.status === 'known' && (
        <Dialog
          title={`${details.moment.officialCode} · ${details.moment.name}`}
          close={() => setDetails(null)}
        >
          <RuleUncertainty ids={rhythmUncertaintyIds(details.moment, details.variant)} />
          <p>{details.moment.specificRequirement}</p>
          <p>{variantText(details.variant)}</p>
          <dl>
            <dt>Kan momentet</dt>
            <dd>{details.summary.coverage}</dd>
            <dt>Vurderet</dt>
            <dd>{details.summary.ratingCoverage}</dd>
            <dt>Gennemsnit og minimum</dt>
            <dd>
              {formatStability(details.summary.mean)} · {details.summary.minimum ?? '—'}
            </dd>
          </dl>
          {[
            ['Mangler færdighed', details.summary.missingNames],
            ['Mangler vurdering', details.summary.unassessedNames],
            ['Lav stabilitet (1–2)', details.summary.lowNames],
            ['Kræver revurdering', details.summary.reviewNames],
          ].map(([label, names]) => (
            <p key={String(label)}>
              <strong>{label}:</strong> {(names as string[]).join(', ') || 'Ingen'}
            </p>
          ))}
          <details>
            <summary>Alle udførelseskrav</summary>
            {[
              ...details.moment.generalRequirements,
              ...details.moment.categoryRequirements,
              ...details.moment.rowRequirements,
            ].map((text) => (
              <p key={text}>{text}</p>
            ))}
          </details>
          <SourceLinks sources={[details.moment.source]} rulePackage={resolved.rulePackage} />
        </Dialog>
      )}
      {selected &&
        resolved.status === 'known' &&
        (selected.cell.registrationId ? (
          <AthleteInspector
            key={selected.cell.registrationId}
            workspace={workspace}
            change={change}
            writable={writable}
            athleteId={selected.cell.athleteId}
            initialRegistrationId={selected.cell.registrationId}
            close={() => setSelected(null)}
          />
        ) : (
          <Dialog
            wide
            title={`${selected.cell.athleteName} · Tilføj rytmemoment`}
            close={() => setSelected(null)}
          >
            {writable ? (
              <SkillEditor
                workspace={workspace}
                athleteId={selected.cell.athleteId}
                rulePackage={resolved.rulePackage}
                openExisting={(id) =>
                  setSelected({ ...selected, cell: { ...selected.cell, registrationId: id } })
                }
                initialDiscipline="rhythm"
                initialMoment={selected.row.moment}
                save={(updated) => {
                  change(updated);
                  setSelected(null);
                }}
              />
            ) : (
              <p>Færdigheden mangler. Denne konto har kun læseadgang.</p>
            )}
          </Dialog>
        ))}
    </>
  );
}
