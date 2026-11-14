import { ScenarioProvider } from './scenario-context';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { CURRENT_SCHEMA_VERSION, createWorkspace, skillNeedsTwistDistribution } from '@teamgym/domain';
import type { SkillDefinition } from '@teamgym/domain';
import { DriveError, openLocalHandle, overwriteDriveTarget, parseDriveLink, pickGoogleResource, prepareGoogle, readLocalFile, saveNewLocalHandle, serializeLocalWorkspace } from '@teamgym/drive';
import type { LoadedWorkspace, LocalHandle, LocalOrigin, RecentWorkspace } from '@teamgym/drive';
import type { Workspace } from '@teamgym/domain';
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
  recentWorkspaces,
  workspaceSession,
} from './runtime';
import { SpringPage } from './spring';
import { TeamProfilePage } from './team-profile';
import { RulesPage, Teams } from './teams';
import { Brand, Icon } from './ui';
import { StartScreen } from './start-screen';
import type { IconName } from './ui';
import './style.css';
import './repertoire.css';
import { reconcileWorkspace } from './inheritance-context';
import { ReviewRequestContext } from './review-context';
import { WorkspaceReview } from './workspace-review';
import { AiWorkspaceEntry } from './ai-workspace-entry';

const saveLabels = {
  loading: 'Indlæser',
  unchanged: 'Uændret',
  changed: 'Lokale ændringer',
  saving: 'Gemmer…',
  saved: 'Gemt',
  conflict: 'Nyere fil · kladde bevaret',
  error: 'Fejl · kladde bevaret',
};
function PickerLoginHelp() {
  return (
    <p className="picker-login-help">
      Virker Vælg ikke? Se efter et Google-loginvindue bag filvælgeren. Log ind dér med den samme konto,
      og prøv igen.
    </p>
  );
}
function App() {
  const auth = useSyncExternalStore(connection.subscribe, connection.snapshot);
  const data = useSyncExternalStore(workspaceSession.subscribe, workspaceSession.snapshot);
  const [route, setRoute] = useState(location.hash || '#/arbejdsrum');
  const [ready, setReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [pickerActive, setPickerActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openingLink, setOpeningLink] = useState(false);
  const [folderLink, setFolderLink] = useState('');
  const [remember, setRemember] = useState(false);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [reviewGuard, setReviewGuard] = useState(false);
  const [openChoice, setOpenChoice] = useState(false);
  const [saveChoice, setSaveChoice] = useState(false);
  const [recent, setRecent] = useState<RecentWorkspace[]>([]);
  const [recentError, setRecentError] = useState('');
  const [recentRowError, setRecentRowError] = useState<Record<string, string>>({});
  const [reselectRecent, setReselectRecent] = useState<Extract<RecentWorkspace, { kind: 'local-fallback' }> | null>(null);
  const [downloadNotice, setDownloadNotice] = useState('');
  const [driveTarget, setDriveTarget] = useState<{ target: LoadedWorkspace; sent: Workspace } | null>(null);
  const localInput = useRef<HTMLInputElement>(null);
  const [guardError, setGuardError] = useState('');
  const dirtyForms = useRef(new Set<HTMLFormElement>());
  const reviewTrigger = useRef<HTMLElement | null>(null);
  const reviewWasOpen = useRef(false);
  useEffect(() => {
    if (reviewWasOpen.current && !data.review)
      requestAnimationFrame(() => {
        const trigger = reviewTrigger.current;
        if (trigger?.isConnected) trigger.focus();
        else document.querySelector<HTMLButtonElement>('.header-actions > .quiet')?.focus();
      });
    reviewWasOpen.current = !!data.review;
  }, [data.review]);
  function showReview() {
    flushSync(() => {
      setReviewGuard(false);
      setSettings(false);
      setEditorEpoch((epoch) => epoch + 1);
    });
    dirtyForms.current.clear();
    void workspaceSession.beginReview();
  }
  function requestReview() {
    reviewTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if ([...dirtyForms.current].some((form) => form.isConnected)) {
      setGuardError('');
      setReviewGuard(true);
    } else showReview();
  }
  function commitForms() {
    for (const form of [...dirtyForms.current]) {
      if (!form.isConnected) {
        dirtyForms.current.delete(form);
        continue;
      }
      const before = workspaceSession.snapshot().draft;
      flushSync(() => form.requestSubmit());
      if (form.isConnected && workspaceSession.snapshot().draft === before) {
        setGuardError('Formularen kunne ikke opdateres. Kontrollér oplysningerne, eller vælg Bliv.');
        return false;
      }
      dirtyForms.current.delete(form);
    }
    return true;
  }
  function updateForms() {
    if (commitForms()) showReview();
  }
  const observedAccount = useRef<string | null>(null);
  async function refreshRecent() {
    try { setRecent(await recentWorkspaces.list()); setRecentError(''); }
    catch { setRecentError('Seneste kan ikke læses på denne enhed. Du kan stadig åbne en fil direkte.'); }
  }
  async function rememberLocal(name: string, workspaceId: string, handle: LocalHandle | null) {
    try { await recentWorkspaces.addLocal(name, workspaceId, handle); await refreshRecent(); }
    catch { setRecentError('Filen er åbnet, men kunne ikke tilføjes til Seneste.'); }
  }
  async function rememberDrive(fileId: string, name: string, folderIds: string[], resourceKey?: string) {
    const accountId = connection.snapshot().account?.permissionId;
    if (!accountId) return;
    try { await recentWorkspaces.addDrive(fileId, name, folderIds, accountId, resourceKey); await refreshRecent(); }
    catch { setRecentError('Filen er åbnet, men kunne ikke tilføjes til Seneste.'); }
  }
  useEffect(() => {
    if (restoring) return;
    const legacy = connection.rememberedReference();
    if (legacy) void recentWorkspaces.addDrive(legacy.file.id, legacy.file.name, legacy.file.folderIds, legacy.account.permissionId, legacy.file.resourceKey).then(refreshRecent).catch(() => setRecentError('Den tidligere Drive-reference kunne ikke flyttes til Seneste.'));
    else void refreshRecent();
  }, [restoring]);
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
      if (workspaceSession.dirty() || dirtyForms.current.size > 0 || workspaceSession.snapshot().state === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const focus = () => {
      if (connection.snapshot().status === 'connected') void workspaceSession.checkRemote();
    };
    window.addEventListener('beforeunload', before);
    window.addEventListener('focus', focus);
    // Google kræver et brugerklik for at åbne fornyelsesvinduet; selve klikket afventer ikke fornyelsen.
    const renew = () => connection.renewIfExpiring();
    document.addEventListener('click', renew, true);
    return () => {
      active = false;
      document.removeEventListener('click', renew, true);
      window.removeEventListener('hashchange', hash);
      window.removeEventListener('beforeunload', before);
      window.removeEventListener('focus', focus);
    };
  }, []);
  useEffect(() => {
    if (auth.status === 'disconnected') {
      if (observedAccount.current)
        void recentWorkspaces.removeDriveAccount(observedAccount.current).then(refreshRecent).catch(() => setRecentError('Drive-poster kunne ikke ryddes fra Seneste.'));
      if (workspaceSession.snapshot().loaded && workspaceSession.dirty()) setRecovery(workspaceSession.exportDraft());
      setSettings(false);
      setOpeningLink(false);
      setCreating(false);
      if (workspaceSession.snapshot().loaded) workspaceSession.clear();
      observedAccount.current = null;
      return;
    }
    if (auth.status !== 'connected' || !auth.account) return;
    if (observedAccount.current && observedAccount.current !== auth.account.permissionId) {
      void recentWorkspaces.removeDriveAccount(observedAccount.current).then(refreshRecent).catch(() => setRecentError('Den tidligere kontos poster kunne ikke ryddes.'));
      if (workspaceSession.dirty()) setRecovery(workspaceSession.exportDraft());
      workspaceSession.clear();
    }
    observedAccount.current = auth.account.permissionId;
    if (workspaceSession.snapshot().loaded) {
      void workspaceSession.checkRemote();
      return;
    }
    const fileFromLink = /^#\/arbejdsrum\/([\w-]+)/.exec(location.hash)?.[1];
    const fileId = fileFromLink;
    if (fileId && !['local', 'kladde'].includes(fileId)) void workspaceSession.open(fileId);
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
  async function ensureGoogle() {
    if (!configured) throw new Error('Google Drive er ikke konfigureret i denne udgave.');
    try { await prepareGoogle(); }
    catch (error) {
      setGoogleError(error instanceof Error ? error.message : 'Google kunne ikke indlæses.');
      throw error;
    }
    setGoogleError('');
    setReady(true);
    if (connection.snapshot().status === 'connected') return true;
    if (await connection.verifyRestored()) return true;
    await connection.connect(remember);
    return connection.snapshot().status === 'connected';
  }
  function startNew() {
    if (!confirmDiscard()) return;
    workspaceSession.startNew(createWorkspace(), true);
    location.hash = '#/arbejdsrum/kladde';
    setOpenChoice(false);
  }
  async function openLocal() {
    if (!confirmDiscard()) return;
    setReselectRecent(null);
    flushSync(() => setSettings(false));
    const picker = window as Window & { showOpenFilePicker?: (options?: unknown) => Promise<LocalHandle[]> };
    if (!picker.showOpenFilePicker) {
      localInput.current?.click();
      return;
    }
    await run(async () => {
      let handles: LocalHandle[];
      try { handles = await picker.showOpenFilePicker!({ multiple: false, types: [{ description: 'TeamGym JSON', accept: { 'application/json': ['.json'] } }] }); }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; throw error; }
      const handle = handles[0];
      if (!handle) return;
      workspaceSession.adoptLocal(await openLocalHandle(handle), true);
      if (!workspaceSession.snapshot().localMigration)
        await rememberLocal(handle.name, workspaceSession.snapshot().draft!.workspaceId, handle);
      location.hash = '#/arbejdsrum/lokal';
      setOpenChoice(false);
      setSettings(false);
    });
  }
  async function saveAsLocal() {
    if (!commitForms()) return;
    const draft = workspaceSession.snapshot().draft;
    if (!draft) return;
    const origin: LocalOrigin | null = workspaceSession.snapshot().local?.origin ??
      (workspaceSession.snapshot().loaded ? { fileId: workspaceSession.snapshot().loaded!.basis.fileId, base: workspaceSession.snapshot().loaded!.workspace } : null);
    const picker = window as Window & { showSaveFilePicker?: (options?: unknown) => Promise<LocalHandle> };
    if (!picker.showSaveFilePicker) {
      downloadCopy(serializeLocalWorkspace(draft, origin), 'teamgym-arbejdsrum.json');
      await rememberLocal('teamgym-arbejdsrum.json', draft.workspaceId, null);
      setDownloadNotice('En kopi er hentet. Den oprindelige fil er ikke opdateret; vælg filen igen ved næste besøg.');
      setSaveChoice(false);
      return;
    }
    await run(async () => {
      let handle: LocalHandle;
      try { handle = await picker.showSaveFilePicker!({ suggestedName: 'teamgym-arbejdsrum.json', types: [{ description: 'TeamGym JSON', accept: { 'application/json': ['.json'] } }] }); }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; throw error; }
      const saved = await saveNewLocalHandle(handle, draft, origin);
      workspaceSession.placeLocal(saved, draft);
      await rememberLocal(saved.name, saved.workspace.workspaceId, saved.handle);
      location.hash = '#/arbejdsrum/lokal';
      setSaveChoice(false);
    });
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
      (!workspaceSession.dirty() && dirtyForms.current.size === 0) ||
      window.confirm(
        'Din ugemte kladde bliver kasseret. Eksportér den først, hvis den skal bevares. Fortsæt?',
      )
    );
  }
  async function chooseFile() {
    await run(async () => {
      if (!confirmDiscard()) return;
      if (!(await ensureGoogle())) return;
      const fileId = await chooseGoogleResource(false);
      if (!fileId) return;
      await workspaceSession.open(fileId, true);
      const loaded = workspaceSession.snapshot().loaded;
      if (loaded?.basis.fileId === fileId) {
        await connection.rememberFile(loaded.metadata);
        await rememberDrive(fileId, loaded.metadata.name, loaded.metadata.folderIds, loaded.metadata.resourceKey);
        location.hash = `#/arbejdsrum/${fileId}`;
      }
    });
  }
  async function chooseOverwriteTarget() {
    if (!commitForms()) return;
    await run(async () => {
      if (!(await ensureGoogle())) return;
      const fileId = await chooseGoogleResource(false);
      if (!fileId) return;
      const target = await connection.client().read(fileId);
      const sent = structuredClone(workspaceSession.snapshot().draft!);
      setDriveTarget({ target, sent });
      setSaveChoice(false);
    });
  }
  async function overwriteTarget() {
    if (!driveTarget) return;
    await run(async () => {
      const currentDraft = workspaceSession.snapshot().draft;
      if (!currentDraft || JSON.stringify(currentDraft) !== JSON.stringify(driveTarget.sent))
        throw new Error('Kladden er ændret siden advarslen. Vælg målfilen igen.');
      const loaded = await overwriteDriveTarget(connection.client(), driveTarget.target, driveTarget.sent);
      workspaceSession.placeDrive(loaded, driveTarget.sent);
      await connection.rememberFile(loaded.metadata);
      await rememberDrive(loaded.basis.fileId, loaded.metadata.name, loaded.metadata.folderIds, loaded.metadata.resourceKey);
      location.hash = `#/arbejdsrum/${loaded.basis.fileId}`;
      setDriveTarget(null);
    });
  }
  function openRecent(entry: RecentWorkspace) {
    if (!confirmDiscard()) return;
    setRecentRowError((old) => ({ ...old, [entry.id]: '' }));
    if (entry.kind === 'local-fallback') {
      setReselectRecent(entry);
      flushSync(() => setSettings(false));
      localInput.current?.click();
      return;
    }
    void run(async () => {
      try {
        if (entry.kind === 'local-handle') {
          const opened = await openLocalHandle(entry.handle);
          if (opened.workspace.workspaceId !== entry.workspaceId)
            throw new Error('Den valgte fil er et andet arbejdsrum. Vælg den oprindelige fil igen.');
          workspaceSession.adoptLocal(opened, true);
          if (!workspaceSession.snapshot().localMigration)
            await rememberLocal(opened.name, opened.workspace.workspaceId, entry.handle);
          location.hash = '#/arbejdsrum/lokal';
          setSettings(false);
        } else {
          if (!(await ensureGoogle())) return;
          if (connection.snapshot().account?.permissionId !== entry.accountId)
            throw new Error('Denne Drive-fil hører til en anden Google-konto. Skift konto, og prøv igen.');
          const client = connection.client();
          if (entry.resourceKey) client.rememberResourceKey(entry.fileId, entry.resourceKey);
          const opened = await client.read(entry.fileId);
          workspaceSession.adopt(opened);
          await connection.rememberFile(opened.metadata);
          await rememberDrive(entry.fileId, opened.metadata.name, opened.metadata.folderIds, opened.metadata.resourceKey);
          location.hash = `#/arbejdsrum/${entry.fileId}`;
          setSettings(false);
        }
      } catch (error) {
        setRecentRowError((old) => ({ ...old, [entry.id]: error instanceof Error ? error.message : 'Filen kunne ikke åbnes.' }));
      }
    });
  }
  function removeRecent(entry: RecentWorkspace) {
    void recentWorkspaces.remove(entry.id).then(refreshRecent).catch(() => setRecentRowError((old) => ({ ...old, [entry.id]: 'Posten kunne ikke fjernes fra Seneste.' })));
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
      await rememberDrive(loaded.basis.fileId, loaded.metadata.name, loaded.metadata.folderIds, loaded.metadata.resourceKey);
      location.hash = `#/arbejdsrum/${loaded.basis.fileId}`;
      setOpeningLink(false);
      setSettings(false);
    });
  }
  const workspace = data.draft;
  const pendingFileId = /^#\/arbejdsrum\/([\w-]+)/.exec(route)?.[1];
  const deepLink = pendingFileId && !['kladde', 'lokal'].includes(pendingFileId) ? pendingFileId : null;
  const starting =
    !workspace &&
    (restoring ||
      (auth.status === 'connected' && !!deepLink && data.state === 'loading'));
  const fileId = data.loaded?.basis.fileId;
  const workspacePath = fileId ?? (data.local ? 'lokal' : 'kladde');
  const match = /\/hold\/([^/]+)(?:\/([^/]+))?/.exec(route);
  const teamId =
    match?.[1] && workspace?.teams.some((team) => team.id === match[1])
      ? match[1]
      : (workspace?.teams.find((team) => !team.archived)?.id ?? '');
  const team = workspace?.teams.find((item) => item.id === teamId);
  const page = route.endsWith('/gymnaster') ? 'gymnaster' : (match?.[2] ?? 'arbejdsrum');
  const writable = (!data.loaded || (data.loaded.metadata.writable && auth.status === 'connected')) && !team?.archived;
  function navigate(page: string, id = teamId) {
    const next =
      page === 'arbejdsrum' ? `#/arbejdsrum/${workspacePath}` : `#/arbejdsrum/${workspacePath}/hold/${id}/${page}`;
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
    { key: 'profil', label: 'Holdprofil', icon: 'profile' },
    { key: 'rytme', label: 'Rytme', icon: 'rhythm' },
    { key: 'reglement', label: 'Reglement', icon: 'rules' },
  ];
  const footerContent = (
    <>
      <span>{data.loaded?.metadata.name ?? data.local?.name ?? 'TeamGym Team Manager'}</span>
      <span>
        {workspace
          ? data.loaded ? `Revision ${data.loaded.workspace.revision} · kladde kun i denne side` : data.local ? 'Lokal fil · kladde kun i denne side' : 'Ugemt kladde · kun i denne side'
          : 'Vælg selv filplacering'}
      </span>
    </>
  );
  return (
    <ReviewRequestContext.Provider
      value={{ available: !!data.newer && !data.review && !reviewGuard, request: requestReview }}
    >
      <div
        className={`app-shell ${workspace ? 'has-workspace' : 'welcome-shell'}`}
        onChangeCapture={(event) => {
          const form = (event.target as HTMLElement).closest('form');
          if (form && !form.classList.contains('utility-form') && !data.review && !reviewGuard) dirtyForms.current.add(form);
        }}
        onClickCapture={(event) => {
          const target = event.target as HTMLElement;
          const form = target.closest('form');
          const button = target.closest('button');
          if (form && !form.classList.contains('utility-form') && button?.type === 'button' && !data.review && !reviewGuard) dirtyForms.current.add(form);
        }}
        onSubmitCapture={(event) => {
          const form = event.target as HTMLFormElement;
          const before = workspaceSession.snapshot().draft;
          queueMicrotask(() => {
            if (!form.isConnected || workspaceSession.snapshot().draft !== before)
              dirtyForms.current.delete(form);
          });
        }}
      >
        <input
          ref={localInput}
          type="file"
          accept=".json,application/json"
          hidden
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            void run(async () => {
              try {
                const opened = await readLocalFile(file);
                if (reselectRecent && opened.workspace.workspaceId !== reselectRecent.workspaceId)
                  throw new Error('Den valgte fil er et andet arbejdsrum. Vælg den oprindelige fil igen.');
                workspaceSession.adoptLocal(opened, true);
                if (!workspaceSession.snapshot().localMigration)
                  await rememberLocal(opened.name, opened.workspace.workspaceId, null);
                location.hash = '#/arbejdsrum/lokal';
                setOpenChoice(false);
                setSettings(false);
                setReselectRecent(null);
              } catch (error) {
                if (reselectRecent) {
                  const message = error instanceof Error ? error.message : 'Filen kunne ikke åbnes.';
                  setRecentRowError((old) => ({ ...old, [reselectRecent.id]: message }));
                  setError(message);
                }
                else throw error;
              }
            });
          }}
        />
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
                <Brand href={`#/arbejdsrum/${workspacePath}`} />
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
            {(workspace || deepLink) && <span className="connection-state">
              {starting
                ? 'Forbinder til Google Drive…'
                : auth.status === 'connected'
                  ? auth.account?.name
                  : auth.status === 'expired'
                    ? 'Google-adgang udløbet'
                    : 'Intet arbejdsrum åbent'}
            </span>}
            {workspace && (
              <button
                className="quiet"
                disabled={busy || data.state === 'saving' || !!data.review || !data.loaded || auth.status !== 'connected'}
                onClick={requestReview}
              >
                Gennemgå ændringer
              </button>
            )}
            {workspace && (
              <button
                className={`save-state state-${data.state}`}
                disabled={
                  data.state === 'saving' ||
                  (data.loaded ? !data.loaded.metadata.writable || auth.status !== 'connected' : false) ||
                  !!data.review ||
                  (!workspaceSession.dirty() && data.state !== 'error' && !!data.loaded)
                }
                onClick={() => {
                  if (!commitForms()) return;
                  if (!data.loaded && !data.local) setSaveChoice(true);
                  else if (data.local && !data.local.handle) setSaveChoice(true);
                  else void workspaceSession.save();
                }}
              >
                <Icon name={data.state === 'saved' || data.state === 'unchanged' ? 'check' : 'cloud'} />
                {saveLabels[data.state]}
                {data.state === 'changed' ? data.loaded ? ' · Gem på Drive' : data.local ? ' · Gem lokal fil' : ' · Vælg placering' : ''}
              </button>
            )}
            {workspace && <button className="quiet" disabled={starting} onClick={() => setSettings(true)}>
              <Icon name="settings" />
              <span>Arbejdsrum</span>
            </button>}
          </div>
        </header>
        {workspace && (
          <aside className="workspace-bar">
            <Brand href={`#/arbejdsrum/${workspacePath}`} />
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
              {navigation.map(({ key, label, icon }) => !teamId && key !== 'arbejdsrum' ? (
                <button key={key} type="button" disabled aria-describedby="team-setup-hint">
                  <Icon name={icon} />
                  {label}
                </button>
              ) : (
                <a
                  key={key}
                  aria-current={page === key ? 'page' : undefined}
                  onClick={(event) => {
                    if (
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    navigate(key);
                  }}
                  href={
                    key === 'arbejdsrum'
                      ? `#/arbejdsrum/${workspacePath}`
                      : `#/arbejdsrum/${workspacePath}/hold/${teamId}/${key}`
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
                <small id={!teamId ? 'team-setup-hint' : undefined}>
                  {binding?.status === 'known'
                    ? `${team?.rulesetBinding.rulesetId} ${team?.rulesetBinding.packageVersion}`
                    : team
                      ? 'Data er bevaret'
                      : 'Opret hold for at åbne siderne'}
                </small>
              </div>
            </div>
            <div className="rail-file">
              <Icon name={data.loaded ? 'cloud' : 'teams'} />
              <span>
                {data.loaded?.metadata.name ?? data.local?.name ?? 'Ugemt kladde'}
                <small>{data.loaded ? 'Fælles arbejdsrum på Drive' : data.local ? 'Lokal fil' : 'Vælg placering ved første gemning'}</small>
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
          {(error || data.message || auth.message || downloadNotice) && (
            <div className="notice" role="status">
              {error && <p>{error}</p>}
              {auth.message && <p>{auth.message}</p>}
              {data.message && <p>{data.message}</p>}
              {downloadNotice && <p>{downloadNotice}</p>}
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
          {workspace && data.loaded && (auth.status === 'expired' || auth.status === 'error') && (
            <section className="reconnect">
              <p>Kladden er i denne side. Genforbind for at kontrollere filversion og fortsætte.</p>
              <button
                disabled={busy || !configured}
                onClick={() => void ensureGoogle()}
              >
                Forbind til Google Drive
              </button>
            </section>
          )}
          <div key={editorEpoch}>
            {starting ? (
              <section className="startup-loading" aria-busy="true" aria-label="Indlæser arbejdsrum">
                <div className="startup-emblem" aria-hidden="true">
                  <Icon name="cloud" />
                </div>
                <div role="status">
                  <h1>
                    {auth.status === 'connected' ? 'Åbner dit arbejdsrum' : 'Forbinder til Google Drive'}
                  </h1>
                  <p>
                    {auth.status === 'connected'
                      ? 'Henter hold og færdigheder fra din Drive-fil…'
                      : 'Kontrollerer din forbindelse…'}
                  </p>
                </div>
              </section>
            ) : !workspace && deepLink ? (
              <section className="startup-loading" aria-label="Åbn Drive-arbejdsrum">
                <div className="startup-emblem" aria-hidden="true"><Icon name="cloud" /></div>
                <div>
                  <h1>Åbn arbejdsrum på Drive</h1>
                  <p>Forbind den Google-konto, der har adgang til filen i linket.</p>
                </div>
                <button disabled={busy || !configured} onClick={() => void run(async () => { await ensureGoogle(); })}>Forbind til Google Drive</button>
                {data.message && <p role="alert">{data.message}</p>}
              </section>
            ) : !workspace ? (
              <StartScreen
                openChoice={openChoice}
                setOpenChoice={setOpenChoice}
                startNew={startNew}
                openLocal={() => void openLocal()}
                openDrive={() => void chooseFile()}
                openLink={() => void run(async () => { if (await ensureGoogle()) setOpeningLink(true); })}
                configured={configured}
                busy={busy}
                remember={remember}
                setRemember={setRemember}
                recent={recent}
                recentError={recentError}
                rowErrors={recentRowError}
                openRecent={openRecent}
                removeRecent={removeRecent}
              />            ) : page === 'arbejdsrum' ? (
              <Teams
                workspace={workspace}
                change={(next) => workspaceSession.edit(reconcileWorkspace(next))}
                writable={!data.loaded || (data.loaded.metadata.writable && auth.status === 'connected')}
                select={(id) => navigate('spring', id)}
              />
            ) : page === 'gymnaster' ? (
              <Athletes
                key={teamId}
                workspace={workspace}
                change={(next) => workspaceSession.edit(reconcileWorkspace(next))}
                writable={!data.loaded || (data.loaded.metadata.writable && auth.status === 'connected')}
              />
            ) : !team ? (
              <Empty>Vælg eller opret et hold først.</Empty>
            ) : page === 'profil' ? (
              <TeamProfilePage
                key={teamId}
                workspace={workspace}
                teamId={teamId}
                openAthletes={() => navigate('gymnaster')}
              />
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
          </div>
          {workspace && data.loaded && !data.loaded.metadata.writable && (
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
        {reviewGuard && (
          <Dialog title="Formularændringer før gennemgang" close={() => setReviewGuard(false)}>
            <p>Du har ændret oplysninger i en formular. Vil du beholde dem, før du fortsætter?</p>
            {guardError && <p role="alert">{guardError}</p>}
            <div className="actions">
              <button onClick={updateForms}>Behold mine ændringer</button>
              <button className="quiet" onClick={showReview}>
                Kassér formularændringer
              </button>
              <button className="quiet" onClick={() => setReviewGuard(false)}>
                Bliv
              </button>
            </div>
          </Dialog>
        )}
        {saveChoice && (
          <Dialog title="Gem arbejdsrummet" suspended={pickerActive} close={() => setSaveChoice(false)}>
            <p>Vælg, hvor filen skal gemmes. Din kladde forbliver her, hvis du annullerer.</p>
            <label className="check"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Husk Google-forbindelsen på denne enhed</label>
            <div className="actions">
              <button disabled={busy} onClick={() => void saveAsLocal()}>Gem som lokal fil</button>
              <button disabled={busy || !configured} onClick={() => void run(async () => {
                if (await ensureGoogle()) { setSaveChoice(false); setCreating(true); }
              })}>Gem i Google Drive</button>
              {data.draft && <button className="quiet" disabled={busy || !configured} onClick={() => void chooseOverwriteTarget()}>Vælg eksisterende Drive-fil…</button>}
              <button className="quiet" onClick={() => setSaveChoice(false)}>Annuller</button>
            </div>
          </Dialog>
        )}
        {driveTarget && (
          <Dialog title="Erstat Drive-fil?" suspended={pickerActive} close={() => setDriveTarget(null)}>
            <p>Du har valgt <strong>{driveTarget.target.metadata.name}</strong> i Google Drive.</p>
            <p className="muted">Fil-id: <code>{driveTarget.target.basis.fileId}</code> · Mappe: {driveTarget.target.metadata.folderIds.join(', ') || 'Min Drive'}</p>
            <p role="alert">Overskriv erstatter hele indholdet i denne fil. Den fil, du arbejder i nu, bevares.</p>
            {driveTarget.target.workspace.workspaceId !== driveTarget.sent.workspaceId && <p role="alert">Målfilen er et andet arbejdsrum. Dets hold, gymnaster og planer bliver erstattet.</p>}
            <div className="actions">
              <button disabled={busy || !driveTarget.target.metadata.writable} onClick={() => void overwriteTarget()}>Overskriv valgt fil</button>
              {data.local?.origin?.fileId === driveTarget.target.basis.fileId && data.local.origin.base.workspaceId === driveTarget.sent.workspaceId && driveTarget.target.workspace.workspaceId === driveTarget.sent.workspaceId && (
                <button className="quiet" disabled={busy} onClick={() => void run(async () => {
                  await workspaceSession.beginCopyReview(driveTarget.target);
                  setDriveTarget(null);
                })}>Gennemgå og flet</button>
              )}
              <button className="quiet" onClick={() => setDriveTarget(null)}>Annuller</button>
            </div>
          </Dialog>
        )}
        {data.localMigration && (
          <Dialog title="Opgradér lokal fil" close={() => workspaceSession.cancelMigration()}>
            <p>Filen bruger format {data.localMigration.sourceSchemaVersion}. Den oprindelige fil bevares, indtil du vælger Gem.</p>
            <div className="actions">
              <button className="quiet" onClick={() => downloadCopy(workspaceSession.exportOriginal(), data.localMigration!.name)}>Eksportér original</button>
              <button className="quiet" onClick={() => workspaceSession.cancelMigration()}>Annuller</button>
              <button onClick={() => {
                if (!confirmDiscard()) return;
                const source = workspaceSession.snapshot().localMigration!;
                workspaceSession.acceptMigration(true);
                void rememberLocal(source.name, source.workspace.workspaceId, source.handle);
              }}>Opgradér lokal kladde</button>
            </div>
          </Dialog>
        )}
        {data.review && (
          <WorkspaceReview
            applied={() => {
              setEditorEpoch((epoch) => epoch + 1);
              const loaded = workspaceSession.snapshot().loaded;
              if (loaded) {
                location.hash = `#/arbejdsrum/${loaded.basis.fileId}`;
                void connection.rememberFile(loaded.metadata);
                void rememberDrive(loaded.basis.fileId, loaded.metadata.name, loaded.metadata.folderIds, loaded.metadata.resourceKey);
              }
            }}
          />
        )}
        {data.migration && (
          <Dialog title="Opgradér arbejdsrummet" close={() => workspaceSession.cancelMigration()}>
            <p>
              Filen bruger format {data.migration.sourceSchemaVersion}. Opgradér til format {CURRENT_SCHEMA_VERSION}, så
              alle dobbeltspring med skrue har en præcis skruefordeling
              {data.migration.sourceSchemaVersion !== undefined && data.migration.sourceSchemaVersion < 6
                ? ', og banespring får fælles godkendelse af præcise springkæder'
                : ''}
              .
            </p>
            <TwistMigrationList bytes={data.migration.originalBytes} />
            <p>
              {data.migration.sourceSchemaVersion !== undefined && data.migration.sourceSchemaVersion < 3
                ? 'Eksisterende planer bevares som Plan A i hver disciplin. '
                : 'Alle scenarier og reserver bevares. '}
              Personlige forbindelsesbekræftelser forbliver personlige. Vurderinger, arv og fravalg bevares, og alle pladser beholder deres gymnast. Originalen på Drive ændres
              først, når du vælger Gem på Drive. Ældre appudgaver kan ikke åbne format {CURRENT_SCHEMA_VERSION}.
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
          <Dialog title="Arbejdsrum og forbindelse" className="workspace-dialog" suspended={pickerActive} close={() => setSettings(false)}>
            <div className="workspace-dialog-overview">
              <span className="workspace-dialog-kicker">Aktiv fil</span>
              <strong className="workspace-dialog-name">{data.loaded?.metadata.name ?? data.local?.name ?? 'Ugemt kladde'}</strong>
              <span className="workspace-dialog-subtitle">{data.loaded ? `Google Drive · ${data.loaded.metadata.writable ? 'Skriveadgang' : 'Læseadgang'}` : data.local ? 'Lokal fil' : 'Vælg placering ved første gemning'}</span>
              <div className="workspace-dialog-primary-actions">
                {data.draft && <button disabled={busy || data.state === 'saving'} onClick={() => { if (commitForms()) { setSettings(false); setSaveChoice(true); } }}>Gem som…</button>}
                {auth.status === 'connected' && <button className="quiet" disabled={busy} onClick={() => {
                  if (data.loaded && !confirmDiscard()) return;
                  void run(async () => {
                    if (data.loaded) workspaceSession.clear();
                    await connection.disconnect();
                    setSettings(false);
                  });
                }}>Afbryd forbindelse / skift konto</button>}
              </div>
            </div>
            {error && !openingLink && !creating && <p className="notice" role="alert">{error}</p>}
            <p className="workspace-dialog-connection">{auth.account
              ? `${auth.account.name} · ${auth.account.email} · ${auth.remembered ? 'Forbindelsen huskes, til adgangen udløber' : 'Forbindelsen huskes ikke efter lukning'}`
              : 'Ingen Google-konto forbundet. Du kan stadig bruge lokale filer.'}</p>
            {data.local && <p className="workspace-dialog-guidance">{data.local.handle ? 'Gem skriver til denne fil efter ny adgangskontrol.' : 'Denne browser kan ikke skrive tilbage til den åbnede fil. Hent en ny kopi ved Gem.'}</p>}
            <section className="workspace-dialog-section" aria-labelledby="workspace-file-actions-title">
              <h3 id="workspace-file-actions-title">Filer og kopier</h3>
              <div className="workspace-dialog-file-groups">
                <div className="workspace-dialog-file-group">
                  <h4>Åbn en fil</h4>
                  <button className="quiet" disabled={busy || data.state === 'saving'} onClick={() => void openLocal()}>Åbn lokal fil</button>
                  {auth.status === 'connected' && <>
                    <button className="quiet" disabled={busy || data.state === 'saving'} onClick={() => void chooseFile()}>Vælg anden fil</button>
                    <button className="quiet" disabled={busy || data.state === 'saving'} onClick={() => { setError(''); setOpeningLink(true); }}>Åbn fra link</button>
                  </>}
                </div>
                <div className="workspace-dialog-file-group">
                  <h4>Andre valg</h4>
                  {(data.loaded || data.local) && <button className="quiet" onClick={downloadDraft}>{data.local ? 'Eksportér kladden som rå JSON' : 'Eksportér kladden'}</button>}
                  {data.draft && <button className="quiet" disabled={busy || data.state === 'saving'} onClick={() => {
                    if (!confirmDiscard()) return;
                    workspaceSession.clear();
                    setSettings(false);
                    location.hash = '#/arbejdsrum';
                  }}>Til startoverblik</button>}
                </div>
              </div>
            </section>
            {data.loaded && <details className="workspace-dialog-disclosure">
              <summary>Filoplysninger og link</summary>
              <div className="workspace-dialog-detail-content">
                <dl>
                  <div><dt>Fil-id</dt><dd><code>{data.loaded.basis.fileId}</code></dd></div>
                  <div><dt>Version</dt><dd>{data.loaded.basis.version}</dd></div>
                  <div><dt>Adgang</dt><dd>{data.loaded.metadata.writable ? 'Skriveadgang' : 'Læseadgang'}</dd></div>
                  <div><dt>Mappe</dt><dd>{data.loaded.metadata.folderIds.length ? data.loaded.metadata.folderIds.map((id) => <a key={id} href={`https://drive.google.com/drive/folders/${id}`} target="_blank" rel="noreferrer">{id}</a>) : 'Ingen mappe angivet'}</dd></div>
                </dl>
                <label>Link til arbejdsrummet<input readOnly value={`${location.origin}${location.pathname}#/arbejdsrum/${fileId}`} onFocus={(event) => event.target.select()} /></label>
                <p className="muted">Linket giver ingen adgang i sig selv. Åbn filen med din egen Google-konto.</p>
              </div>
            </details>}
            {recent.length > 0 && <details className="workspace-dialog-disclosure workspace-dialog-recent">
              <summary>Seneste filer <span>{recent.length}</span></summary>
              <ul>{recent.map((entry) => <li key={entry.id}>
                <button className="quiet" disabled={busy} onClick={() => openRecent(entry)}>{entry.name} · {entry.kind === 'drive' ? 'Google Drive' : 'Lokal fil'}{entry.kind === 'local-fallback' ? ' · Vælg fil igen' : ''}</button>
                {recentRowError[entry.id] && <p role="alert">{recentRowError[entry.id]}</p>}
              </li>)}</ul>
            </details>}
            {auth.status === 'connected' && <details className="workspace-dialog-disclosure workspace-dialog-advanced">
              <summary>Avanceret om Google-adgang</summary>
              <div className="workspace-dialog-detail-content">
                <button className="quiet" disabled={busy} onClick={() => {
                  if ((!data.loaded || confirmDiscard()) && window.confirm('Tilbagekald appens Google-adgang? Nyt samtykke kan blive nødvendigt.'))
                    void run(async () => {
                      if (data.loaded) workspaceSession.clear();
                      await connection.disconnect(true);
                      setSettings(false);
                    });
                }}>Tilbagekald Google-adgang</button>
                <p className="muted">Afbrydelse rydder lokal adgang og arbejdsdata i appens faner. En allerede afsendt upload kan stadig være gennemført.</p>
                <PickerLoginHelp />
              </div>
            </details>}
            {data.loaded && <AiWorkspaceEntry fileId={data.loaded.basis.fileId} dirty={workspaceSession.dirty() || [...dirtyForms.current].some((form) => form.isConnected)} />}
          </Dialog>
        )}
        {recovery && (
          <Dialog title="Kladde fra afbrudt forbindelse" close={() => {}} dismissible={false}>
            <p>
              Forbindelsen blev afbrudt eller kontoen ændret. Arbejdsrummet er lukket, og kladden er isoleret
              i denne side. Eksportér den før kassation, hvis arbejdet skal bevares.
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
              className="utility-form"
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
                  const draft = workspaceSession.snapshot().draft ?? createWorkspace();
                  const loaded = await connection.client().create(folder, name, draft);
                  if (workspaceSession.snapshot().draft) workspaceSession.placeDrive(loaded, draft);
                  else workspaceSession.adopt(loaded);
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
              className="utility-form"
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
    </ReviewRequestContext.Provider>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Appens rod mangler.');
createRoot(root).render(
  <ScenarioProvider>
    <App />
  </ScenarioProvider>,
);

/** Viser de spring, der får hele skruen på sidste salto ved opgraderingen. Afledt af originalen; gemmes ikke. */
function TwistMigrationList({ bytes }: { bytes: string | undefined }) {
  let names: string[] = [];
  try {
    const raw = JSON.parse(bytes ?? '{}') as { skills?: unknown };
    if (Array.isArray(raw.skills))
      names = (raw.skills as SkillDefinition[])
        .filter((skill) => !skill.archived && skillNeedsTwistDistribution(skill))
        .map((skill) => skill.name);
  } catch {
    /* Ugyldige bytes afvises allerede ved indlæsning. */
  }
  if (!names.length) return null;
  return (
    <div className="migration-twist">
      <p>
        {names.length === 1 ? 'Ét spring' : `${names.length} spring`} mangler skruefordeling og får hele skruen på
        sidste salto (out):
      </p>
      <ul>
        {names.map((name, index) => (
          <li key={`${name}:${index}`}>
            {name} <span>→ out</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
