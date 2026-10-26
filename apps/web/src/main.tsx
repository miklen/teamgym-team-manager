import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createWorkspace } from '@teamgym/domain';
import { DriveError, parseDriveLink, pickGoogleResource, prepareGoogle } from '@teamgym/drive';
import type { DriveLink } from '@teamgym/drive';
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
import { Brand, Icon, WelcomeArtwork } from './ui';
import type { IconName } from './ui';
import './style.css';
import './repertoire.css';
import { reconcileWorkspace } from './inheritance-context';

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
  const [googleLoading, setGoogleLoading] = useState(configured);
  const [googleError, setGoogleError] = useState('');
  const [pickerActive, setPickerActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openingLink, setOpeningLink] = useState(false);
  const [folderLink, setFolderLink] = useState('');
  const [remember, setRemember] = useState(true);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const observedAccount = useRef<string | null>(null);
  useEffect(() => {
    if (!configured) return;
    let active = true;
    void prepareGoogle()
      .then(() => {
        if (active) {
          setReady(true);
          setGoogleLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setGoogleLoading(false);
          setGoogleError(error instanceof Error ? error.message : 'Google kunne ikke indlæses.');
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    void restoreConnection()
      .catch((error: unknown) => {
        if (active) setError(error instanceof Error ? error.message : 'Forbindelsen kunne ikke genoprettes.');
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
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
      active = false;
      window.removeEventListener('hashchange', hash);
      window.removeEventListener('beforeunload', before);
      window.removeEventListener('focus', focus);
    };
  }, []);
  useEffect(() => {
    if (auth.status === 'disconnected') {
      if (workspaceSession.dirty()) setRecovery(workspaceSession.exportDraft());
      setSettings(false);
      setOpeningLink(false);
      setCreating(false);
      workspaceSession.clear();
      observedAccount.current = null;
      return;
    }
    if (auth.status !== 'connected' || !auth.account) return;
    if (observedAccount.current && observedAccount.current !== auth.account.permissionId) {
      if (workspaceSession.dirty()) setRecovery(workspaceSession.exportDraft());
      workspaceSession.clear();
    }
    observedAccount.current = auth.account.permissionId;
    if (workspaceSession.snapshot().loaded) {
      void workspaceSession.checkRemote();
      return;
    }
    const fileFromLink = /^#\/arbejdsrum\/([\w-]+)/.exec(location.hash)?.[1];
    const fileId = fileFromLink ?? auth.file?.id;
    if (fileId) void workspaceSession.open(fileId);
  }, [auth.status, auth.account, auth.file?.id]);
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
    setGoogleError('');
    setGoogleLoading(true);
    try {
      await prepareGoogle();
      setReady(true);
    } catch (error) {
      setGoogleError(error instanceof Error ? error.message : 'Google kunne ikke indlæses.');
    } finally {
      setGoogleLoading(false);
    }
  }
  async function chooseGoogleResource(
    folder: boolean,
    target?: { fileId?: string; parentId?: string; includeFolders?: boolean },
  ) {
    // Native showModal gør resten af dokumentet inert, også Googles eksterne iframe.
    // Luk alle app-modaler i samme render, før Picker (og eventuelt cookievalg) vises.
    flushSync(() => setPickerActive(true));
    try {
      return await pickGoogleResource(googleConfig, connection.getToken(), folder, target);
    } finally {
      flushSync(() => setPickerActive(false));
    }
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
      const fileId = await chooseGoogleResource(false);
      if (!fileId) return;
      await workspaceSession.open(fileId, true);
      const loaded = workspaceSession.snapshot().loaded;
      if (loaded?.basis.fileId === fileId) {
        await connection.rememberFile(loaded.metadata);
        location.hash = `#/arbejdsrum/${fileId}`;
      }
    });
  }
  async function linkedMetadata(link: DriveLink, folderOnly = false) {
    const client = connection.client();
    if (link.resourceKey) client.rememberResourceKey(link.id, link.resourceKey);
    try {
      return await client.metadata(link.id);
    } catch (error) {
      if (!(error instanceof DriveError) || ![403, 404].includes(error.status ?? 0)) throw error;
      const selected = await chooseGoogleResource(folderOnly || link.kind === 'folder', {
        fileId: link.id,
        includeFolders: !folderOnly && link.kind === 'unknown',
      });
      if (!selected) return null;
      if (selected !== link.id)
        throw new Error('Google-valget matcher ikke linket. Kontrollér linket, og prøv igen.', {
          cause: error,
        });
      return await client.metadata(link.id);
    }
  }
  async function openDriveLink(link: DriveLink) {
    await run(async () => {
      if (!confirmDiscard()) return;
      let linkedFile = link.id;
      if (link.kind === 'folder') {
        const selected = await chooseGoogleResource(false, { parentId: link.id });
        if (!selected) return;
        linkedFile = selected;
      } else {
        const metadata = await linkedMetadata(link);
        if (!metadata) return;
        if (metadata.mimeType === 'application/vnd.google-apps.folder') {
          const selected = await chooseGoogleResource(false, { parentId: metadata.id });
          if (!selected) return;
          linkedFile = selected;
        }
      }
      if (workspaceSession.snapshot().state === 'saving')
        throw new Error('Vent på gemningen, før du åbner en anden fil.');
      const loaded = await connection.client().read(linkedFile);
      workspaceSession.adopt(loaded);
      await connection.rememberFile(loaded.metadata);
      location.hash = `#/arbejdsrum/${loaded.basis.fileId}`;
      setOpeningLink(false);
      setSettings(false);
    });
  }
  const workspace = data.draft;
  const pendingFileId = /^#\/arbejdsrum\/([\w-]+)/.exec(route)?.[1] ?? auth.file?.id;
  const starting =
    !workspace &&
    (restoring ||
      auth.status === 'connecting' ||
      (auth.status === 'connected' && !!pendingFileId && data.state === 'loading'));
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
    const next =
      page === 'arbejdsrum' ? `#/arbejdsrum/${fileId}` : `#/arbejdsrum/${fileId}/hold/${id}/${page}`;
    location.hash = next;
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'instant' });
  }
  const binding = team && registry.resolve(team.rulesetBinding);
  const navigation: { key: string; label: string; icon: IconName }[] = [
    { key: 'arbejdsrum', label: 'Hold', icon: 'teams' },
    { key: 'gymnaster', label: 'Gymnaster', icon: 'athletes' },
    { key: 'spring', label: 'Springplan', icon: 'spring' },
    { key: 'rytme', label: 'Rytme', icon: 'rhythm' },
    { key: 'reglement', label: 'Reglement', icon: 'rules' },
  ];
  const footerContent = (
    <>
      <span>{data.loaded?.metadata.name ?? 'TeamGym Team Manager'}</span>
      <span>
        {workspace
          ? `Revision ${data.loaded?.workspace.revision} · kladde kun i denne side`
          : 'Personlig Google-adgang · fælles Drive-fil'}
      </span>
    </>
  );
  return (
    <div className={`app-shell ${workspace ? 'has-workspace' : 'welcome-shell'}`}>
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
        {workspace ? (
          <>
            <div className="mobile-brand">
              <Brand href={`#/arbejdsrum/${fileId}`} />
            </div>
            <div className="header-location">
              <span>{page === 'arbejdsrum' ? 'Arbejdsrum' : team?.name}</span>
              <span aria-hidden="true" className="location-divider">
                /
              </span>
              <strong>{navigation.find((item) => item.key === page)?.label ?? 'Springplan'}</strong>
            </div>
          </>
        ) : (
          <Brand href="#/arbejdsrum" />
        )}
        <div className="header-actions">
          <span className="connection-state">
            {starting
              ? 'Forbinder til Google Drive…'
              : auth.status === 'connected'
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
              <Icon name={data.state === 'saved' || data.state === 'unchanged' ? 'check' : 'cloud'} />
              {saveLabels[data.state]}
              {data.state === 'changed' ? ' · Gem på Drive' : ''}
            </button>
          )}
          <button className="quiet" disabled={starting} onClick={() => setSettings(true)}>
            <Icon name="settings" />
            <span>Arbejdsrum</span>
          </button>
        </div>
      </header>
      {workspace && (
        <aside className="workspace-bar">
          <Brand href={`#/arbejdsrum/${fileId}`} />
          <label className="team-switcher">
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
                    {item.archived ? ' · ikke aktivt' : ''}
                  </option>
                ))}
            </select>
          </label>
          <nav aria-label="Hovednavigation">
            {navigation.map(({ key, label, icon }) => (
              <a
                key={key}
                aria-current={page === key ? 'page' : undefined}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                    return;
                  event.preventDefault();
                  navigate(key);
                }}
                href={
                  key === 'arbejdsrum'
                    ? `#/arbejdsrum/${fileId}`
                    : `#/arbejdsrum/${fileId}/hold/${teamId}/${key}`
                }
              >
                <Icon name={icon} />
                {label}
              </a>
            ))}
          </nav>
          <div className="rail-context">
            <Icon name="rules" />
            <div>
              <strong>
                {binding?.status === 'known'
                  ? binding.profile.label
                  : team
                    ? 'Ukendt regelpakke'
                    : 'Intet hold endnu'}
              </strong>
              <small>
                {binding?.status === 'known'
                  ? `${team?.rulesetBinding.rulesetId} ${team?.rulesetBinding.packageVersion}`
                  : team
                    ? 'Data er bevaret'
                    : 'Opret dit første hold'}
              </small>
            </div>
          </div>
          <div className="rail-file">
            <Icon name="cloud" />
            <span>
              {data.loaded?.metadata.name}
              <small>Fælles arbejdsrum på Drive</small>
            </span>
          </div>
        </aside>
      )}
      <main id="main-content" tabIndex={-1}>
        {googleLoading && !ready && !workspace && !starting && (
          <p className="muted" role="status">
            Indlæser Google…
          </p>
        )}
        {googleError && (
          <div className="notice" role="status">
            <p>{googleError}</p>
            <button disabled={googleLoading} onClick={() => void loadScripts()}>
              Prøv Google igen
            </button>
          </div>
        )}
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
        {workspace && (auth.status === 'expired' || auth.status === 'error') && (
          <section className="reconnect">
            <p>Kladden er i denne side. Genforbind for at kontrollere filversion og fortsætte.</p>
            <button
              disabled={!ready || busy || !configured}
              onClick={() => void connection.connect(remember)}
            >
              Forbind til Google Drive
            </button>
          </section>
        )}
        {starting ? (
          <section className="startup-loading" aria-busy="true" aria-label="Indlæser arbejdsrum">
            <div className="startup-emblem" aria-hidden="true">
              <Icon name="cloud" />
            </div>
            <div role="status">
              <h1>{auth.status === 'connected' ? 'Åbner dit arbejdsrum' : 'Forbinder til Google Drive'}</h1>
              <p>
                {auth.status === 'connected'
                  ? 'Henter hold og færdigheder fra din Drive-fil…'
                  : 'Kontrollerer din forbindelse…'}
              </p>
            </div>
          </section>
        ) : !workspace ? (
          <div className="welcome-layout">
            <div className="welcome-content">
              <h1>
                Holdets fælles <br />
                planlægning
              </h1>
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
                    <button
                      disabled={busy || !ready}
                      className="quiet"
                      onClick={() => {
                        setError('');
                        setOpeningLink(true);
                      }}
                    >
                      Åbn fra link
                    </button>
                    <button disabled={busy || !ready} className="quiet" onClick={() => setCreating(true)}>
                      Opret arbejdsrum
                    </button>
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
                    <button
                      disabled={!ready || !configured || busy || auth.status === 'connecting'}
                      onClick={() => void connection.connect(remember)}
                    >
                      <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3-4.5 3-7.6ZM12 22c2.7 0 5-.9 6.8-2.5l-3.4-2.6c-.9.6-2 1-3.4 1a6 6 0 0 1-5.7-4.2H2.8v2.7A10 10 0 0 0 12 22ZM6.3 13.7a6 6 0 0 1 0-3.4V7.6H2.8a10 10 0 0 0 0 8.8l3.5-2.7ZM12 6.1c1.5 0 2.8.5 3.8 1.5l3-2.9A10 10 0 0 0 2.8 7.6l3.5 2.7A6 6 0 0 1 12 6.1Z"
                        />
                      </svg>
                      Forbind til Google Drive
                    </button>
                  </>
                )}
              </section>
            </div>
            <WelcomeArtwork />
          </div>
        ) : page === 'arbejdsrum' ? (
          <Teams
            workspace={workspace}
            change={(next) => workspaceSession.edit(reconcileWorkspace(next))}
            writable={!!data.loaded?.metadata.writable && auth.status === 'connected'}
            select={(id) => navigate('spring', id)}
          />
        ) : page === 'gymnaster' ? (
          <Athletes
            key={teamId}
            workspace={workspace}
            change={(next) => workspaceSession.edit(reconcileWorkspace(next))}
            writable={!!data.loaded?.metadata.writable && auth.status === 'connected'}
          />
        ) : !team ? (
          <Empty>Vælg eller opret et hold først.</Empty>
        ) : page === 'rytme' ? (
          <RhythmPage
            key={teamId}
            workspace={workspace}
            change={(next) => workspaceSession.edit(reconcileWorkspace(next))}
            writable={writable}
            teamId={teamId}
          />
        ) : page === 'reglement' ? (
          <RulesPage
            key={teamId}
            workspace={workspace}
            change={(next) => workspaceSession.edit(reconcileWorkspace(next))}
            writable={writable}
            teamId={teamId}
          />
        ) : (
          <SpringPage
            key={teamId}
            workspace={workspace}
            change={(next) => workspaceSession.edit(reconcileWorkspace(next))}
            writable={writable}
            teamId={teamId}
          />
        )}
        {workspace && !data.loaded?.metadata.writable && (
          <p className="notice">
            Læsetilstand · denne konto må se og analysere filen, men kan ikke redigere.
          </p>
        )}
        {workspace && (
          <footer className="mobile-footer" role="contentinfo">
            {footerContent}
          </footer>
        )}
      </main>
      <footer className="desktop-footer">{footerContent}</footer>
      {data.migration && (
        <Dialog title="Opgradér arbejdsrummet" close={() => workspaceSession.cancelMigration()}>
          <p>
            Filen bruger format 1. Opgradér til format 2 for at arbejde med arvet sikkerhed og personlige
            fravalg.
          </p>
          <p>
            Alle eksisterende vurderinger bevares som egne. Originalen på Drive ændres først, når du vælger
            Gem på Drive. Ældre appudgaver kan ikke åbne format 2.
          </p>
          <div className="actions">
            <button className="quiet" onClick={() => downloadCopy(workspaceSession.exportOriginal())}>
              Eksportér original
            </button>
            <button className="quiet" onClick={() => workspaceSession.cancelMigration()}>
              Annuller
            </button>
            <button
              onClick={() => {
                if (confirmDiscard()) workspaceSession.acceptMigration(true);
              }}
            >
              Opgradér lokal kladde
            </button>
          </div>
        </Dialog>
      )}
      {settings && (
        <Dialog title="Arbejdsrum og forbindelse" suspended={pickerActive} close={() => setSettings(false)}>
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
                Linket giver ingen adgang i sig selv. Brug et Drive-link eller Google-filvælgeren for at åbne
                filen med din egen konto.
              </p>
              <button className="quiet" onClick={downloadDraft}>
                Eksportér kladden
              </button>
            </>
          )}
          {auth.status === 'connected' && (
            <div className="actions">
              <button disabled={!ready || busy || data.state === 'saving'} onClick={() => void chooseFile()}>
                Vælg anden fil
              </button>
              <button
                disabled={!ready || busy || data.state === 'saving'}
                className="quiet"
                onClick={() => {
                  setError('');
                  setOpeningLink(true);
                }}
              >
                Åbn fra link
              </button>
              <button
                disabled={!ready || busy || data.state === 'saving'}
                onClick={() => {
                  if (confirmDiscard()) setCreating(true);
                }}
              >
                Opret arbejdsrum
              </button>
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
        <Dialog
          title="Opret arbejdsrum på Drive"
          suspended={pickerActive}
          dismissible={!busy}
          close={() => setCreating(false)}
        >
          <ActionForm
            disabled={busy}
            label={folderLink.trim() ? 'Opret arbejdsrum i mappen' : 'Vælg mappe og opret JSON-fil'}
            submit={(form) => {
              const name = String(form.get('name'));
              const pasted = String(form.get('folderLink') ?? '').trim();
              const link = pasted ? parseDriveLink(pasted) : null;
              if (link?.kind === 'file')
                throw new Error(
                  'Indsæt et link til mappen. Brug Åbn fra link for at åbne en eksisterende fil.',
                );
              void run(async () => {
                let folder: string | null;
                if (link) {
                  const metadata = await linkedMetadata(link, true);
                  if (!metadata) return;
                  if (metadata.mimeType !== 'application/vnd.google-apps.folder')
                    throw new Error('Linket skal pege på en Google Drive-mappe.');
                  folder = metadata.id;
                } else {
                  folder = await chooseGoogleResource(true);
                }
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
            <fieldset disabled={busy}>
              <label>
                Arbejdsrummets navn
                <input name="name" required maxLength={160} placeholder="Fx TeamGym sæson 2026" />
              </label>
              <label>
                Link til mappe (valgfrit)
                <input
                  name="folderLink"
                  type="url"
                  value={folderLink}
                  onChange={(event) => setFolderLink(event.target.value)}
                  placeholder="https://drive.google.com/drive/folders/…"
                />
              </label>
              <p className="muted">
                Indsæt et mappelink, eller lad feltet være tomt for at vælge mappen i Google.
              </p>
            </fieldset>
            <p className="muted">
              Der oprettes én ny JSON-fil i den valgte mappe. Eksisterende dokumenter ændres ikke.
            </p>
            {busy && <p role="status">Opretter arbejdsrum…</p>}
            {error && (
              <p role="alert" className="notice">
                {error}
              </p>
            )}
          </ActionForm>
        </Dialog>
      )}
      {openingLink && (
        <Dialog
          title="Åbn fra Google Drive-link"
          suspended={pickerActive}
          close={() => {
            if (!busy) setOpeningLink(false);
          }}
          dismissible={!busy}
        >
          <p>Et fillink åbner arbejdsrummet. Et mappelink viser filerne i mappen.</p>
          <ActionForm
            label={busy ? 'Åbner…' : 'Åbn link'}
            disabled={busy || auth.status !== 'connected'}
            submit={(form) => {
              const link = parseDriveLink(String(form.get('driveLink')));
              void openDriveLink(link);
            }}
          >
            <label>
              Link til fil eller mappe
              <input
                name="driveLink"
                type="url"
                required
                autoFocus
                disabled={busy}
                placeholder="https://drive.google.com/…"
              />
            </label>
            <p className="muted">Google kan bede dig bekræfte adgangen til filen eller mappen.</p>
            {busy && <p role="status">Åbner linket fra Google Drive…</p>}
            {error && (
              <p role="alert" className="notice">
                {error}
              </p>
            )}
          </ActionForm>
        </Dialog>
      )}
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Appens rod mangler.');
createRoot(root).render(<App />);
