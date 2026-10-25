import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#/arbejdsrum"><span aria-hidden="true">T</span>TeamGym Team Manager</a>
        <span className="connection-state">Intet arbejdsrum åbent</span>
      </header>
      <main id="main-content">
        <p className="eyebrow">Arbejdsrum</p>
        <h1>Holdets fælles planlægning</h1>
        <p className="intro">Et arbejdsrum samler hold, gymnaster og opstillinger i en fælles fil på Google Drive.</p>
        <section className="setup-status" aria-labelledby="setup-heading">
          <h2 id="setup-heading">Google-forbindelsen er under opsætning</h2>
          <p>Du kan åbne et arbejdsrum, når Google-adgangen er sat op og fælles gemning er afprøvet.</p>
        </section>
      </main>
      <footer>TeamGym Team Manager <span>Projektopsætning · ingen trænerdata indlæst</span></footer>
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Appens rod mangler.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
