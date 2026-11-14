import { useState } from 'react';

export function aiWorkspaceLinks(fileId: string, origin: string, basePath: string) {
  const skill = new URL(`${basePath}teamgym-data-entry/SKILL.md`, origin).href;
  const guide = new URL(`${basePath}teamgym-data-entry/index.html`, origin).href;
  const drive = `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
  const prompt = `Læs TeamGym-inddata-skillen: ${skill}\nArbejd kun med denne valgte Drive-fil via min egen Google-forbindelse: ${drive}\nLæs og gennemgå ændringerne med mig før direkte skrivning. Følg skillens kontrol af format, sen genlæsning og efterkontrol. Optimer ikke opstillingen; registrér kun mine besluttede valg.`;
  return { skill, guide, drive, prompt };
}

export function AiWorkspaceEntry({ fileId, dirty }: { fileId: string; dirty: boolean }) {
  const [copyStatus, setCopyStatus] = useState('');
  const { guide, drive, prompt } = aiWorkspaceLinks(fileId, location.origin, import.meta.env.BASE_URL);
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus('Startteksten er kopieret.');
    } catch {
      setCopyStatus('Kopiér teksten manuelt fra feltet.');
    }
  }
  return <details className="ai-workspace-entry">
    <summary>Inddata med din egen AI-agent <span>Vejledning og starttekst</span></summary>
    <div className="ai-workspace-content">
      <p className="muted">Lad agenten læse vejledningen og registrere dine noter i netop denne Drive-fil.</p>
      <div className="ai-workspace-links">
        <a href={guide} target="_blank" rel="noreferrer">Læs inddata-skill</a>
        <a href={drive} target="_blank" rel="noreferrer">Åbn den valgte Drive-fil</a>
      </div>
      {dirty && <p className="ai-workspace-draft" role="status">Du har en ugemt kladde her. Agenten kan kun læse Drive-filen. Gem eller eksportér kladden, før agenten redigerer filen.</p>}
      <label htmlFor="ai-start-text">Starttekst til din agent</label>
      <textarea id="ai-start-text" readOnly value={prompt} onFocus={(event) => event.target.select()} rows={5} />
      <div className="actions">
        <button type="button" onClick={() => void copyPrompt()}>Kopiér starttekst</button>
        <span role="status" aria-live="polite" className="muted">{copyStatus}</span>
      </div>
      <p className="muted ai-workspace-limit">Direkte Google-skrivning kan overskrive en samtidig ændring mellem genlæsning og upload. Appens egen gemning bruger en stærkere versionskontrol.</p>
    </div>
  </details>;
}
