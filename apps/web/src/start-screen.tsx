import { useState } from 'react';
import { WelcomeArtwork } from './ui';
import type { RecentWorkspace } from '@teamgym/drive';

interface StartScreenProps {
  openChoice: boolean;
  setOpenChoice: (open: boolean) => void;
  startNew: () => void;
  openLocal: () => void;
  openDrive: () => void;
  openLink: () => void;
  configured: boolean;
  busy: boolean;
  remember: boolean;
  setRemember: (remember: boolean) => void;
  recent: RecentWorkspace[];
  recentError: string;
  rowErrors: Record<string, string>;
  openRecent: (entry: RecentWorkspace) => void;
  removeRecent: (entry: RecentWorkspace) => void;
}

function OpenOptions({ openLocal, openDrive, openLink, configured, busy, remember, setRemember }: Pick<StartScreenProps, 'openLocal' | 'openDrive' | 'openLink' | 'configured' | 'busy' | 'remember' | 'setRemember'>) {
  return <div id="start-open-options" className="start-open-options">
    <button onClick={openLocal} disabled={busy}>Lokal fil <span aria-hidden="true">↗</span></button>
    <button onClick={openDrive} disabled={busy || !configured}>Google Drive <span aria-hidden="true">↗</span></button>
    <button onClick={openLink} disabled={busy || !configured}>Drive-link <span aria-hidden="true">↗</span></button>
    {configured && <label className="start-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Husk Google-forbindelsen på denne enhed</label>}
  </div>;
}

function DataTrust({ details, setDetails }: { details: boolean; setDetails: (details: boolean) => void }) {
  return <div className="start-trust">
    <span className="start-trust-mark" aria-hidden="true">●</span>
    <div>
      <p>Du arbejder i browseren. Du vælger selv, om filen gemmes på din enhed eller i din Google Drive. Appen har ingen server, der opbevarer arbejdsrumsfiler.</p>
      <button className="start-details-toggle" aria-expanded={details} onClick={() => setDetails(!details)}>Sådan opbevares dine data <span aria-hidden="true">{details ? '−' : '↗'}</span></button>
      {details && <p className="start-details">Browseren kan huske referencer til filer, du har åbnet. Vælger du at huske Google-forbindelsen, gemmes den på denne enhed indtil den udløber. Når du vælger Drive, indlæses Googles login og filvælger; Google kan bruge egne cookies og vise egne valg. Deling af Drive-filer styrer du i Google Drive. Andre med adgang til din enhed eller Google-konto kan også have adgang til filerne.</p>}
    </div>
  </div>;
}

function RecentRow({ entry, busy, error, openRecent, removeRecent }: { entry: RecentWorkspace; busy: boolean; error?: string | undefined; openRecent: StartScreenProps['openRecent']; removeRecent: StartScreenProps['removeRecent'] }) {
  return <li>
    <button className="start-recent-open" onClick={() => openRecent(entry)} disabled={busy}>
      <span className="start-recent-name">{entry.name}</span>
      <span className="start-recent-meta">{entry.kind === 'drive' ? 'Google Drive' : 'Lokal fil'} · {new Date(entry.openedAt).toLocaleDateString('da-DK')}<span aria-hidden="true"> ↗</span></span>
      {entry.kind === 'local-fallback' && <span className="start-recent-reselect">Vælg fil igen</span>}
    </button>
    <button className="start-recent-remove" aria-label={`Fjern ${entry.name} fra Seneste`} onClick={() => removeRecent(entry)} disabled={busy}>Fjern</button>
    {error && <p className="start-recent-error" role="alert">{error}</p>}
  </li>;
}

export function StartScreen(props: StartScreenProps) {
  const { openChoice, setOpenChoice, startNew, configured, busy, recent, recentError, rowErrors, openRecent, removeRecent } = props;
  const [details, setDetails] = useState(false);
  const latest = recent[0];
  const openOptions = <OpenOptions {...props} />;

  if (latest) return <div className="start-layout has-recent">
    <section className="start-return-main" aria-labelledby="start-title">
      <div className="start-eyebrow"><span className="start-eyebrow-line" /> Dit arbejdsrum</div>
      <h1 id="start-title">Fortsæt, hvor<br />du slap<span className="start-stop">.</span></h1>
      <p className="start-lead">Dit seneste arbejdsrum er klar, når du er.</p>
      <section className="start-featured" aria-labelledby="recent-title">
        <div className="start-featured-heading"><h2 id="recent-title">Seneste</h2><span>{new Date(latest.openedAt).toLocaleDateString('da-DK')}</span></div>
        <button className="start-resume" onClick={() => openRecent(latest)} disabled={busy}>
          <span className="start-resume-name">{latest.name}</span>
          <span className="start-resume-meta">{latest.kind === 'drive' ? 'Google Drive' : 'Lokal fil'}</span>
          <span className="start-resume-action">{latest.kind === 'local-fallback' ? 'Vælg fil igen' : 'Fortsæt i arbejdsrummet'} <span aria-hidden="true">↗</span></span>
        </button>
        <button className="start-featured-remove" aria-label={`Fjern ${latest.name} fra Seneste`} onClick={() => removeRecent(latest)} disabled={busy}>Fjern fra Seneste</button>
        {rowErrors[latest.id] && <p className="start-recent-error" role="alert">{rowErrors[latest.id]}</p>}
      </section>
      <div className="start-return-actions">
        <button className="start-secondary" aria-expanded={openChoice} aria-controls="start-open-options" onClick={() => setOpenChoice(!openChoice)} disabled={busy}>
          <span>Åbn en anden fil</span><span aria-hidden="true">{openChoice ? '−' : '+'}</span>
        </button>
        {openChoice && openOptions}
        <button className="start-new-quiet" onClick={startNew} disabled={busy}>Start nyt arbejdsrum <span aria-hidden="true">↗</span></button>
      </div>
      {!configured && <p className="start-availability">Google Drive er ikke konfigureret i denne udgave. Lokale filer kan bruges.</p>}
      <DataTrust details={details} setDetails={setDetails} />
    </section>
    <aside className="start-return-side" aria-label="Flere arbejdsrum">
      {recent.length > 1 ? <>
        <div className="start-recent-heading"><h2>Andre filer</h2><span>{recent.length - 1}</span></div>
        <ul>{recent.slice(1).map((entry) => <RecentRow key={entry.id} entry={entry} busy={busy} error={rowErrors[entry.id]} openRecent={openRecent} removeRecent={removeRecent} />)}</ul>
      </> : <div className="start-return-aside-copy"><span>ÉT STED AT FORTSÆTTE</span><p>Dine valgte filer samles her, så du hurtigt kan finde tilbage til arbejdet.</p></div>}
      {recentError && <p className="start-recent-error" role="status">{recentError}</p>}
      <div className="start-return-art" aria-hidden="true"><WelcomeArtwork /></div>
    </aside>
  </div>;

  return <div className="start-layout">
    <section className="start-main" aria-labelledby="start-title">
      <div className="start-eyebrow"><span className="start-eyebrow-line" /> For trænerteamet</div>
      <h1 id="start-title">Planlæg dit<br />hold<span className="start-stop">.</span></h1>
      <p className="start-lead">Saml gymnaster, spring og træningsplaner ét sted. Begynd fra bunden, og gem arbejdet som en fil, når du er klar.</p>
      <div className="start-actions">
        <button className="start-primary" onClick={startNew} disabled={busy}><span>Start fra bunden</span><span aria-hidden="true">↗</span></button>
        <button className="start-secondary" aria-expanded={openChoice} aria-controls="start-open-options" onClick={() => setOpenChoice(!openChoice)} disabled={busy}>
          <span>Åbn en gemt fil</span><span aria-hidden="true">{openChoice ? '−' : '+'}</span>
        </button>
        {openChoice && openOptions}
      </div>
      {!configured && <p className="start-availability">Google Drive er ikke konfigureret i denne udgave. Lokale filer kan bruges.</p>}
      <DataTrust details={details} setDetails={setDetails} />
    </section>
    <div className="start-art" aria-hidden="true"><WelcomeArtwork /></div>
  </div>;
}
