import { useState } from 'react';
import type { ReactNode } from 'react';
import type { AthleteSkill, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { points } from './components';
import { springDirectionText } from './spring-library';
import { skillOverview } from './skill-overview';
import type { SkillOverviewRow } from './skill-overview';
import { variantText } from './skill-editor';

export function SkillRepertoire({
  workspace,
  athleteId,
  rulePackage,
  selectedId,
  select,
  details,
}: {
  workspace: Workspace;
  athleteId: string;
  rulePackage: RulePackage | null;
  selectedId: string | null;
  select: (id: string | null) => void;
  details: (registration: AthleteSkill) => ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const rows = skillOverview(workspace, athleteId, rulePackage);
  const names = { tumbling: 'Bane', trampet: 'Trampet', rhythm: 'Rytme' };
  const matches = (row: SkillOverviewRow) =>
    `${row.definition.name} ${springDirectionText(row.definition)} ${row.family}`
      .toLocaleLowerCase('da-DK')
      .includes(query.toLocaleLowerCase('da-DK'));
  const groups = [
    ...new Set(
      rows
        .filter((row) => discipline === 'all' || row.definition.discipline === discipline)
        .map((row) => `${row.definition.discipline}|${row.family}`),
    ),
  ];
  const render = (row: SkillOverviewRow, depth = 0): ReactNode => {
    const children = rows.filter((item) => item.parentId === row.registration.id);
    const open =
      !!query ||
      expanded.has(row.registration.id) !== rows.length < 9 ||
      children.some((child) => child.registration.id === selectedId);
    const item = row.registration;
    const origin = item.assessmentOrigin;
    const source =
      origin.kind === 'inherited'
        ? workspace.athleteSkills.find((candidate) => candidate.id === origin.sourceId)
        : undefined;
    const sourceName = source && workspace.skills.find((skill) => skill.id === source.skillId)?.name;
    return (
      <li key={item.id} className={depth ? 'repertoire-item is-child' : 'repertoire-item'}>
        <div className="repertoire-line">
          {children.length > 0 ? (
            <button
              className="family-toggle quiet"
              aria-label={`${open ? 'Skjul' : 'Vis'} fundament for ${row.definition.name}`}
              aria-expanded={open}
              onClick={() =>
                setExpanded((previous) => {
                  const next = new Set(previous);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                })
              }
            >
              {open ? '−' : '+'}
            </button>
          ) : (
            <span className="family-spacer" />
          )}
          <button
            className="repertoire-row"
            aria-label={`${row.definition.name} D: ${row.difficulty ? points(row.difficulty) : 'Uafklaret'} ${springDirectionText(row.definition)} ${item.stability === null ? 'Ikke vurderet' : `${item.stability}/5`}`}
            aria-expanded={selectedId === item.id}
            onClick={() => select(selectedId === item.id ? null : item.id)}
          >
            <span className="repertoire-name">
              <strong>{row.definition.name}</strong>
              <small>
                {row.definition.discipline === 'rhythm'
                  ? variantText(row.definition.variant)
                  : springDirectionText(row.definition)}
              </small>
              <small className="origin-text">
                {origin.kind === 'own'
                  ? 'Egen vurdering'
                  : sourceName
                    ? `Arvet fra ${sourceName}`
                    : 'Mangler arvekilde'}
              </small>
            </span>
            <span className="repertoire-d">
              <span className="mobile-label">D </span>
              {row.definition.discipline === 'rhythm'
                ? (rulePackage?.bindRhythm(row.definition).moment?.value.replace('.', ',') ?? 'Uafklaret')
                : row.difficulty
                  ? points(row.difficulty)
                  : 'Uafklaret'}
            </span>
            <span className="repertoire-safety">
              <strong className={item.stability === null ? 'safety-value unrated' : 'safety-value'}>
                {item.stability === null ? 'Ikke vurderet' : `${item.stability}/5`}
              </strong>
              <small>{item.assessedAt ?? 'Ingen vurderingsdato'}</small>
            </span>
            <span className="row-arrow" aria-hidden="true">
              {selectedId === item.id ? '−' : '↗'}
            </span>
          </button>
        </div>
        {selectedId === item.id && <div className="repertoire-editor">{details(item)}</div>}
        {open && children.length > 0 && (
          <ul className="repertoire-children">{children.map((child) => render(child, depth + 1))}</ul>
        )}
      </li>
    );
  };
  return (
    <section className="repertoire" aria-label="Gymnastens færdigheder">
      <div className="repertoire-toolbar">
        <label>
          Find færdighed
          <input
            type="search"
            placeholder="Søg spring, moment eller familie"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          Disciplin
          <select value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
            <option value="all">Alle discipliner · {rows.length}</option>
            {Object.entries(names).map(([key, name]) => (
              <option key={key} value={key}>
                {name} · {rows.filter((row) => row.definition.discipline === key).length}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="repertoire-columns" aria-hidden="true">
        <span>Færdighed & ophav</span>
        <span>Egen D</span>
        <span>Sikkerhed & dato</span>
      </div>
      {groups.map((key) => {
        const group = rows.filter((row) => `${row.definition.discipline}|${row.family}` === key);
        if (query && !group.some(matches)) return null;
        const ids = new Set(group.map((row) => row.registration.id));
        const roots = group.filter((row) => !row.parentId || !ids.has(row.parentId));
        return (
          <details
            className="repertoire-family"
            key={`${key}|${!!query}`}
            open={!!query || rows.length < 25 || group.some((row) => row.registration.id === selectedId)}
          >
            <summary>
              <span>
                {names[group[0]!.definition.discipline]}
                <strong>{group[0]!.family}</strong>
              </span>
              <span className="family-count">{group.length} færdigheder</span>
            </summary>
            <ul className="repertoire-list">{roots.map((row) => render(row))}</ul>
          </details>
        );
      })}
      {query && !rows.some(matches) && <p className="empty">Ingen færdigheder matcher din søgning.</p>}
    </section>
  );
}
