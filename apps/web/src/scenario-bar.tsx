import { useLayoutEffect, useRef, useState } from 'react';
import {
  createScenario,
  duplicateScenario,
  renameScenario,
  deleteScenario,
  suggestScenarioCopyName,
} from '@teamgym/domain';
import type { SpringDiscipline } from '@teamgym/domain';
import type { TeamProfile } from '@teamgym/rules';
import type { DataProps } from './athletes';
import { Dialog } from './components';
import './scenarios.css';

export function ScenarioBar({
  workspace,
  change,
  writable,
  planId,
  discipline,
  scenarioId,
  profile,
  select,
}: DataProps & {
  planId: string;
  discipline: SpringDiscipline;
  scenarioId: string;
  profile: TeamProfile | null;
  select: (id: string) => void;
}) {
  const scenarios = workspace.plans.find((item) => item.id === planId)![discipline];
  const current = scenarios.find((item) => item.id === scenarioId)!;
  const [mode, setMode] = useState<'new' | 'copy' | 'rename' | 'delete' | 'all' | null>(null);
  const [menu, setMenu] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [allOpen, setAllOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pendingSelect = useRef<string | null>(null);
  const initialName = useRef('');
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const fieldId = `scenario-name-${planId}-${discipline}`;
  useLayoutEffect(() => {
    list.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [scenarioId, scenarios.length]);
  useLayoutEffect(() => {
    if (mode === 'new' || mode === 'copy' || mode === 'rename') {
      input.current?.focus({ preventScroll: true });
      input.current?.select();
      form.current?.scrollIntoView({ block: 'center' });
    }
  }, [mode]);
  useLayoutEffect(() => {
    if (!menu) return;
    menuRoot.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRoot.current?.contains(event.target)) setMenu(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [menu]);
  function open(next: typeof mode) {
    lastTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMenu(false);
    if (next === 'all') {
      setAllOpen(true);
      return;
    }
    setError('');
    setMode(next);
    const value =
      next === 'copy'
        ? suggestScenarioCopyName(scenarios, scenarioId)
        : next === 'rename'
          ? current.name
          : '';
    initialName.current = value;
    setName(value);
  }
  function close() {
    setMode(null);
    setError('');
    (lastTrigger.current?.isConnected ? lastTrigger.current : trigger.current)?.focus();
  }
  function requestSelect(id: string) {
    if (mode && ['new', 'copy', 'rename'].includes(mode) && name !== initialName.current) {
      pendingSelect.current = id;
      setLeaving(true);
      return;
    }
    setMode(null);
    select(id);
  }
  return (
    <section className="scenario-bar" aria-label="Scenarier">
      <div className="scenario-heading">
        <span>Scenarier</span>
        {!writable && <small>Læseadgang · ændringer er låst</small>}
      </div>
      <div className="scenario-navigation">
        <div
          className="scenario-scroll"
          role="tablist"
          aria-label={`${discipline === 'tumbling' ? 'Bane' : 'Trampet'}scenarier`}
          ref={list}
          onKeyDown={(event) => {
            const tabs = Array.from(list.current!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
            const index = tabs.indexOf(event.target as HTMLButtonElement);
            if (index < 0) return;
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? tabs.length - 1
                  : event.key === 'ArrowRight'
                    ? (index + 1) % tabs.length
                    : event.key === 'ArrowLeft'
                      ? (index + tabs.length - 1) % tabs.length
                      : null;
            if (next !== null) {
              event.preventDefault();
              tabs[next]?.focus();
            }
          }}
        >
          {scenarios.map((scenario) => (
            <button
              type="button"
              role="tab"
              key={scenario.id}
              id={`scenario-tab-${scenario.id}`}
              aria-controls={`scenario-panel-${planId}-${discipline}`}
              aria-selected={scenario.id === scenarioId}
              tabIndex={scenario.id === scenarioId ? 0 : -1}
              title={scenario.name}
              onClick={() => requestSelect(scenario.id)}
            >
              {scenario.name}
            </button>
          ))}
        </div>
        <div className="scenario-fixed">
          <button className="quiet" disabled={!writable} onClick={() => open('new')}>
            + Nyt
          </button>
          <div
            className="scenario-menu"
            ref={menuRoot}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                setMenu(false);
                trigger.current?.focus();
              }
              if (
                event.key === 'ArrowDown' ||
                event.key === 'ArrowUp' ||
                event.key === 'Home' ||
                event.key === 'End'
              ) {
                const items = Array.from(
                  menuRoot.current!.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'),
                );
                const index = items.indexOf(document.activeElement as HTMLButtonElement);
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? items.length - 1
                      : (index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
                event.preventDefault();
                items[next]?.focus();
              }
            }}
          >
            <button
              ref={trigger}
              className="quiet"
              aria-label={`Menu for ${current.name}`}
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              •••
            </button>
            {menu && (
              <div className="scenario-menu-items" role="menu" aria-label={`Scenarie ${current.name}`}>
                <strong>{current.name}</strong>
                <button role="menuitem" disabled={!writable} onClick={() => open('copy')}>
                  Duplikér
                </button>
                <button role="menuitem" disabled={!writable} onClick={() => open('rename')}>
                  Omdøb
                </button>
                <button
                  role="menuitem"
                  className="danger"
                  disabled={!writable || scenarios.length === 1}
                  onClick={() => open('delete')}
                >
                  Slet
                </button>
                {scenarios.length === 1 && <small>Bevar mindst ét scenarie i hver disciplin.</small>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="scenario-context">
        {profile && <p className="scenario-profile"><span>Holdprofil</span><strong>{profile.label}</strong><span>{profile.counting} tællende + højst {profile.extra} ekstra først</span></p>}
        <button
          className="quiet"
          onClick={() => {
            setQuery('');
            open('all');
          }}
        >
          Alle scenarier ({scenarios.length})
        </button>
      </div>
      <p className="sr-only" role="status">
        {status}
      </p>
      {mode && ['new', 'copy', 'rename'].includes(mode) && (
        <form
          ref={form}
          className="scenario-name-form"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
          onSubmit={(event) => {
            event.preventDefault();
            if (!writable) return;
            try {
              const updated =
                mode === 'new'
                  ? createScenario(workspace, planId, discipline, scenarioId, name)
                  : mode === 'copy'
                    ? duplicateScenario(workspace, planId, discipline, scenarioId, name)
                    : renameScenario(workspace, planId, discipline, scenarioId, name);
              const id =
                mode === 'rename'
                  ? scenarioId
                  : updated.plans.find((item) => item.id === planId)![discipline][
                      scenarios.indexOf(current) + 1
                    ]!.id;
              const selectedId = pendingSelect.current ?? id;
              pendingSelect.current = null;
              change(updated);
              select(selectedId);
              setStatus(`${name.trim()} ${mode === 'rename' ? 'omdøbt' : 'oprettet'}.`);
              setMode(null);
              requestAnimationFrame(() => document.getElementById(`scenario-tab-${selectedId}`)?.focus());
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Kontrollér navnet.');
              requestAnimationFrame(() => {
                input.current?.focus({ preventScroll: true });
                form.current?.scrollIntoView({ block: 'center' });
              });
            }
          }}
        >
          <label htmlFor={fieldId}>
            {mode === 'new' ? 'Nyt scenarie' : mode === 'copy' ? 'Navn på kopi' : 'Scenarienavn'}
          </label>
          <div className="scenario-name-controls">
            <input
              ref={input}
              id={fieldId}
              value={name}
              maxLength={200}
              aria-invalid={!!error}
              aria-describedby={error ? `${fieldId}-error` : undefined}
              onChange={(event) => setName(event.target.value)}
            />
            <button type="submit">{mode === 'rename' ? 'Omdøb' : 'Opret scenarie'}</button>
            <button type="button" className="quiet" onClick={close}>
              Annuller
            </button>
          </div>
          {error && (
            <p id={`${fieldId}-error`} role="alert">
              {error}
            </p>
          )}
        </form>
      )}
      {mode === 'delete' && (
        <Dialog title="Slet scenarie" close={close}>
          <p>
            Slet {current.name} på {discipline === 'tumbling' ? 'bane' : 'trampet'}? Alle tre omgange med
            deltagere og reserver fjernes.
          </p>
          <div className="actions">
            <button className="quiet" onClick={close}>
              Annuller
            </button>
            <button
              className="danger"
              onClick={() => {
                const index = scenarios.indexOf(current);
                const nextId = scenarios[index + 1]?.id ?? scenarios[index - 1]!.id;
                change(deleteScenario(workspace, planId, discipline, scenarioId));
                select(nextId);
                setMode(null);
                setStatus(`${current.name} slettet.`);
                requestAnimationFrame(() => document.getElementById(`scenario-tab-${nextId}`)?.focus());
              }}
            >
              Slet scenarie
            </button>
          </div>
        </Dialog>
      )}
      {allOpen && (
        <Dialog title="Alle scenarier" close={() => setAllOpen(false)}>
          <label>
            Søg scenarier
            <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <ul className="all-scenarios">
            {scenarios
              .filter((item) =>
                item.name.toLocaleLowerCase('da').includes(query.trim().toLocaleLowerCase('da')),
              )
              .map((item) => (
                <li key={item.id}>
                  <button
                    aria-pressed={item.id === scenarioId}
                    onClick={() => {
                      setAllOpen(false);
                      requestSelect(item.id);
                      requestAnimationFrame(() =>
                        document.getElementById(`scenario-tab-${item.id}`)?.focus(),
                      );
                    }}
                  >
                    <span className="scenario-list-check" aria-hidden="true">
                      {item.id === scenarioId ? '✓' : ''}
                    </span>
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
          </ul>
          {!scenarios.some((item) =>
            item.name.toLocaleLowerCase('da').includes(query.trim().toLocaleLowerCase('da')),
          ) && <p>Ingen scenarier matcher søgningen.</p>}
        </Dialog>
      )}
      {leaving && (
        <Dialog
          title="Gem formularændringer?"
          close={() => {
            setLeaving(false);
            pendingSelect.current = null;
          }}
        >
          <p>Navneformularen har ændringer. Opdater ændrer kun den lokale kladde.</p>
          <div className="actions">
            <button
              onClick={() => {
                setLeaving(false);
                form.current?.requestSubmit();
              }}
            >
              Opdater
            </button>
            <button
              className="quiet"
              onClick={() => {
                const id = pendingSelect.current;
                pendingSelect.current = null;
                setLeaving(false);
                close();
                if (id) select(id);
              }}
            >
              Kassér
            </button>
            <button
              className="quiet"
              onClick={() => {
                setLeaving(false);
                pendingSelect.current = null;
              }}
            >
              Bliv
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
