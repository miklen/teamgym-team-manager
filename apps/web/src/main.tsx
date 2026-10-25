import { useEffect, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createWorkspace } from '@teamgym/domain';
import { pickGoogleResource, prepareGoogle } from '@teamgym/drive';
import { Athletes } from './athletes';
import { ActionForm, Dialog, Empty } from './components';
import { RhythmPage } from './rhythm';
import { registry } from './rules';
import {
  configured,
  connection,
  downloadCopy,
  downloadDraft,
  googleConfig,
  restoreConnection,
  workspaceSession,
} from './runtime';
import { SpringPage } from './spring';
import { RulesPage, Teams } from './teams';
import './style.css';

const saveLabels = {
  loading: 'Indlæser',
  unchanged: 'Uændret',
  changed: 'Lokale ændringer',
  saving: 'Gemmer…',
  saved: 'Gemt',
  conflict: 'Konflikt · kladde bevaret',
  error: 'Fejl · kladde bevaret',
};
function App() {
  const auth = useSyncExternalStore(connection.subscribe, connection.snapshot);
  const data = useSyncExternalStore(workspaceSession.subscribe, workspaceSession.snapshot);
  const [route, setRoute] = useState(location.hash || '#/arbejdsrum');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(false);
  const [creating, setCreating] = useState(false);
  const [remember, setRemember] = useState(true);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [observedAccount, setObservedAccount] = useState<string | null>(null);
  useEffect(() => {
    void restoreConnection();
    const hash = () => setRoute(location.hash || '#/arbejdsrum');
    window.addEventListener('hashchange', hash);
    const before = (event: BeforeUnloadEvent) => {
      if (workspaceSession.dirty() || workspaceSession.snapshot().state === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const focus = () => {
      if (connection.snapshot().status === 'connected') void workspaceSession.checkRemote();
    };
    window.addEventListener('beforeunload', before);
    window.addEventListener('focus', focus);
    return () => {
      window.removeEventListener('hashchange', hash);
      window.removeEventListener('beforeunload', before);
      window.removeEventListener('focus', focus);
    };
  }, []);
  useEffect(() => {
    if (auth.status === 'disconnected') {
      if (workspaceSession.dirty()) setRecovery(workspaceSession.exportDraft());
      setSettings(false);
      workspaceSession.clear();
      setObservedAccount(null);
      return;
    }
    if (auth.status !== 'connected' || !auth.account) return;
    if (observedAccount && observedAccount !== auth.account.permissionId) {
      if (workspaceSession.dirty()) setRecovery(workspaceSession.exportDraft());
      workspaceSession.clear();
    }
    setObservedAccount(auth.account.permissionId);
    if (workspaceSession.snapshot().loaded) {
      void workspaceSession.checkRemote();
      return;
    }
    const fileFromLink = /^#\/arbejdsrum\/([\w-]+)/.exec(location.hash)?.[1];
    const fileId = fileFromLink ?? auth.file?.id;
    if (fileId) void workspaceSession.open(fileId);
  }, [auth.status, auth.account, auth.file?.id, observedAccount]);
  async function run(action: () => Promise<void>) {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Handlingen kunne ikke gennemføres.');
    } finally {
      setBusy(false);
    }
  }
  async function loadScripts() {
    await run(async () => {
      await prepareGoogle();
      setReady(true);
    });
  }
  function confirmDiscard() {
    return (
      !workspaceSession.dirty() ||
      window.confirm(
        'Din ugemte kladde bliver kasseret. Eksportér den først, hvis den skal bevares. Fortsæt?',
      )
    );
  }
  async function chooseFile() {
    await run(async () => {
      if (!confirmDiscard()) return;
      const fileId = await pickGoogleResource(googleConfig, connection.getToken(), false);
      if (!fileId) return;
      await workspaceSession.open(fileId, true);
      const loaded = workspaceSession.snapshot().loaded;
      if (loaded?.basis.fileId === fileId) {
        await connection.rememberFile(loaded.metadata);
        location.hash = `#/arbejdsrum/${fileId}`;
      }
    });
  }
  const workspace = data.draft;
  const fileId = data.loaded?.basis.fileId;
  const match = /\/hold\/([^/]+)(?:\/([^/]+))?/.exec(route);
  const teamId =
    match?.[1] && workspace?.teams.some((team) => team.id === match[1])
      ? match[1]
      : (workspace?.teams.find((team) => !team.archived)?.id ?? '');
  const team = workspace?.teams.find((item) => item.id === teamId);
  const page = route.endsWith('/gymnaster') ? 'gymnaster' : (match?.[2] ?? 'arbejdsrum');
  const writable = !!data.loaded?.metadata.writable && !team?.archived && auth.status === 'connected';
  function navigate(page: string, id = teamId) {
    location.hash =
      page === 'arbejdsrum' ? `#/arbejdsrum/${fileId}` : `#/arbejdsrum/${fileId}/hold/${id}/${page}`;
  }
  const binding = team && registry.resolve(team.rulesetBinding);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Gå til indhold
      </a>
      <header className="app-header">
        <a className="brand" href={fileId ? `#/arbejdsrum/${fileId}` : '#/arbejdsrum'}>
          <span aria-hidden="true">T</span>TeamGym Team Manager
        </a>
        <div className="header-actions">
          <span className="connection-state">
            {auth.status === 'connected'
              ? auth.account?.name
              : auth.status === 'expired'
                ? 'Google-adgang udløbet'
                : 'Intet arbejdsrum åbent'}
          </span>
          {workspace && (
            <button
              className={`save-state state-${data.state}`}
              disabled={
                data.state === 'saving' ||
                !data.loaded?.metadata.writable ||
                auth.status !== 'connected' ||
                (!workspaceSession.dirty() && data.state !== 'error')
              }
              onClick={() => void workspaceSession.save()}
            >
              {saveLabels[data.state]}
              {data.state === 'changed' ? ' · Gem på Drive' : ''}
            </button>
          )}
          <button className="quiet" onClick={() => setSettings(true)}>
            Arbejdsrum
          </button>
        </div>
      </header>
      {workspace && (
        <div className="workspace-bar">
          <label>
            Aktuelt hold
            <select
              value={teamId}
              onChange={(event) => navigate(page === 'arbejdsrum' ? 'spring' : page, event.target.value)}
            >
              {!teamId && <option value="">Intet hold</option>}
              {workspace.teams
                .filter((item) => !item.archived || item.id === teamId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.archived ? ' · arkiveret' : ''}
                  </option>
                ))}
            </select>
          </label>
          <span>
            {binding?.status === 'known'
              ? `${binding.profile.label} · ${team?.rulesetBinding.rulesetId} ${team?.rulesetBinding.packageVersion}`
              : team
                ? 'Ukendt regelpakke · data bevaret'
                : 'Opret det første hold'}
          </span>
          <nav aria-label="Hovednavigation">
            {[
              ['arbejdsrum', 'Hold'],
              ['gymnaster', 'Gymnaster'],
              ['spring', 'Springplan'],
              ['rytme', 'Rytme'],
              ['reglement', 'Reglement'],
            ].map(([key, label]) => (
              <a
                key={key}
                aria-current={page === key ? 'page' : undefined}
                href={
                  key === 'arbejdsrum'
                    ? `#/arbejdsrum/${fileId}`
                    : `#/arbejdsrum/${fileId}/hold/${teamId}/${key}`
                }
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        {(error || data.message || auth.message) && (
          <div className="notice" role="status">
            {error && <p>{error}</p>}
            {auth.message && <p>{auth.message}</p>}
            {data.message && <p>{data.message}</p>}
            {workspace && (
              <div className="actions">
                <button className="quiet" onClick={downloadDraft}>
                  Eksportér lokal kladde
                </button>
                {data.loaded && (
                  <button
                    className="quiet"
                    disabled={busy || data.state === 'saving' || auth.status !== 'connected'}
                    onClick={() => {
                      if (confirmDiscard()) void workspaceSession.open(data.loaded!.basis.fileId, true);
                    }}
                  >
                    Indlæs nyeste fil
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {auth.status === 'expired' && (
          <section className="reconnect">
            <p>Kladden er i denne side. Genforbind for at kontrollere filversion og fortsætte.</p>
            {!ready ? (
              <button disabled={busy || !configured} onClick={() => void loadScripts()}>
                Klargør Google
              </button>
            ) : (
              <button onClick={() => void connection.connect(remember)}>Fortsæt med Google</button>
            )}
          </section>
        )}
        {!workspace ? (
          <>
            <p className="eyebrow">Arbejdsrum</p>
            <h1>Holdets fælles planlægning</h1>
            <p className="intro">Hold, gymnaster og opstillinger i én fælles fil på Google Drive.</p>
            <section className="connect-surface">
              <h2>{auth.status === 'connected' ? 'Åbn holdets arbejdsrum' : 'Forbind din Google-konto'}</h2>
              <p>
                {auth.status === 'connected'
                  ? 'Vælg den fælles JSON-fil, eller opret et nyt arbejdsrum i en mappe, du vælger.'
                  : 'Du vælger selv, hvilken fil appen får adgang til. Hver træner bruger sin egen konto.'}
              </p>
              {!configured && (
                <p className="notice">
                  Google-konfiguration mangler i denne udgave. Konfigurér det offentlige client-id,
                  projektnummer og browsernøglen ved bygning.
                </p>
              )}
              {auth.status === 'connected' ? (
                <div className="actions">
                  <button disabled={busy || !ready} onClick={() => void chooseFile()}>
                    Vælg eksisterende arbejdsrum
                  </button>
                  <button disabled={busy || !ready} className="quiet" onClick={() => setCreating(true)}>
                    Opret arbejdsrum
                  </button>
                  {!ready && (
                    <button disabled={busy || !configured} onClick={() => void loadScripts()}>
                      Klargør filvælger
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                    />
                    Husk Google-forbindelsen på denne enhed
                  </label>
                  {!ready ? (
                    <button disabled={busy || !configured} onClick={() => void loadScripts()}>
                      Klargør Google-forbindelse
                    </button>
                  ) : (
                    <button
                      disabled={busy || auth.status === 'connecting'}
                      onClick={() => void connection.connect(remember)}
                    >
                      Fortsæt med Google
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        ) : page === 'arbejdsrum' ? (
          <Teams
            workspace={workspace}
            change={(next) => workspaceSession.edit(next)}
            writable={!!data.loaded?.metadata.writable && auth.status === 'connected'}
            select={(id) => navigate('spring', id)}
          />
        ) : page === 'gymnaster' ? (
          <Athletes
            key={teamId}
            workspace={workspace}
            change={(next) => workspaceSession.edit(next)}
            writable={!!data.loaded?.metadata.writable && auth.status === 'connected'}
            selectedTeamId={teamId}
          />
        ) : !team ? (
          <Empty>Vælg eller opret et hold først.</Empty>
        ) : page === 'rytme' ? (
          <RhythmPage
            key={teamId}
            workspace={workspace}
            change={(next) => workspaceSession.edit(next)}
            writable={writable}
            teamId={teamId}
          />
        ) : page === 'reglement' ? (
          <RulesPage
            key={teamId}
            workspace={workspace}
            change={(next) => workspaceSession.edit(next)}
            writable={writable}
            teamId={teamId}
          />
        ) : (
          <SpringPage
            key={teamId}
            workspace={workspace}
            change={(next) => workspaceSession.edit(next)}
            writable={writable}
            teamId={teamId}
          />
        )}
        {workspace && !data.loaded?.metadata.writable && (
          <p className="notice">
            Læsetilstand · denne konto må se og analysere filen, men kan ikke redigere.
          </p>
        )}
      </main>
      <footer>
        <span>{data.loaded?.metadata.name ?? 'TeamGym Team Manager'}</span>
        <span>
          {workspace
            ? `Revision ${data.loaded?.workspace.revision} · kladde kun i denne side`
            : 'Personlig Google-adgang · fælles Drive-fil'}
        </span>
      </footer>
      {settings && (
        <Dialog title="Arbejdsrum og forbindelse" close={() => setSettings(false)}>
          <p>{auth.account ? `${auth.account.name} · ${auth.account.email}` : 'Ingen konto forbundet.'}</p>
          <p>
            {auth.remembered
              ? 'Forbindelsen huskes indtil Googles token udløber.'
              : 'Forbindelsen huskes ikke efter lukning.'}
          </p>
          {data.loaded && (
            <>
              <p>
                <strong>{data.loaded.metadata.name}</strong>
              </p>
              <p>
                Fil-id: <code>{data.loaded.basis.fileId}</code>
              </p>
              <p>
                Mappe:{' '}
                {data.loaded.metadata.folderIds.map((id) => (
                  <a
                    key={id}
                    href={`https://drive.google.com/drive/folders/${id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {id}
                  </a>
                ))}
              </p>
              <p>
                Version: {data.loaded.basis.version} ·{' '}
                {data.loaded.metadata.writable ? 'Skriveadgang' : 'Læseadgang'}
              </p>
              <label>
                Link til arbejdsrummet
                <input
                  readOnly
                  value={`${location.origin}${location.pathname}#/arbejdsrum/${fileId}`}
                  onFocus={(event) => event.target.select()}
                />
              </label>
              <p className="muted">
                Linket giver ingen adgang i sig selv. Nye trænere vælger filen gennem appens Google-filvælger.
              </p>
              <button className="quiet" onClick={downloadDraft}>
                Eksportér kladden
              </button>
            </>
          )}
          {auth.status === 'connected' && (
            <div className="actions">
              {!ready ? (
                <button disabled={busy} onClick={() => void loadScripts()}>
                  Klargør filvælger
                </button>
              ) : (
                <>
                  <button disabled={busy || data.state === 'saving'} onClick={() => void chooseFile()}>
                    Vælg anden fil
                  </button>
                  <button
                    disabled={busy || data.state === 'saving'}
                    onClick={() => {
                      if (confirmDiscard()) setCreating(true);
                    }}
                  >
                    Opret arbejdsrum
                  </button>
                </>
              )}
            </div>
          )}
          <div className="actions">
            <button
              className="quiet"
              disabled={busy}
              onClick={() => {
                if (confirmDiscard())
                  void run(async () => {
                    workspaceSession.clear();
                    await connection.disconnect();
                    setSettings(false);
                  });
              }}
            >
              Afbryd forbindelse / skift konto
            </button>
            <button
              className="quiet"
              disabled={busy || auth.status !== 'connected'}
              onClick={() => {
                if (
                  confirmDiscard() &&
                  window.confirm('Tilbagekald appens Google-adgang? Nyt samtykke kan blive nødvendigt.')
                )
                  void run(async () => {
                    workspaceSession.clear();
                    await connection.disconnect(true);
                    setSettings(false);
                  });
              }}
            >
              Tilbagekald Google-adgang
            </button>
          </div>
          <p className="muted">
            Afbrydelse rydder lokal adgang og arbejdsdata i appens faner. En allerede afsendt upload kan
            stadig være gennemført.
          </p>
        </Dialog>
      )}
      {recovery && (
        <Dialog title="Kladde fra afbrudt forbindelse" close={() => {}} dismissible={false}>
          <p>
            Forbindelsen blev afbrudt eller kontoen ændret. Arbejdsrummet er lukket, og kladden er isoleret i
            denne side. Eksportér den før kassation, hvis arbejdet skal bevares.
          </p>
          <div className="actions">
            <button
              onClick={() => {
                downloadCopy(recovery);
                setRecovery(null);
              }}
            >
              Eksportér og luk kladden
            </button>
            <button className="quiet" onClick={() => setRecovery(null)}>
              Kassér kladden
            </button>
          </div>
        </Dialog>
      )}
      {creating && (
        <Dialog title="Opret arbejdsrum på Drive" close={() => setCreating(false)}>
          <ActionForm
            disabled={busy}
            label="Vælg mappe og opret JSON-fil"
            submit={(form) => {
              const name = String(form.get('name'));
              void run(async () => {
                const folder = await pickGoogleResource(googleConfig, connection.getToken(), true);
                if (!folder) return;
                const loaded = await connection.client().create(folder, name, createWorkspace());
                workspaceSession.adopt(loaded);
                await connection.rememberFile(loaded.metadata);
                location.hash = `#/arbejdsrum/${loaded.basis.fileId}`;
                setCreating(false);
                setSettings(false);
              });
            }}
          >
            <label>
              Arbejdsrummets navn
              <input name="name" required maxLength={160} placeholder="Fx TeamGym sæson 2026" />
            </label>
            <p className="muted">
              Der oprettes én ny JSON-fil i den valgte mappe. Eksisterende dokumenter ændres ikke.
            </p>
          </ActionForm>
        </Dialog>
      )}
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Appens rod mangler.');
createRoot(root).render(<App />);
