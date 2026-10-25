export type IconName =
  'teams' | 'athletes' | 'spring' | 'rhythm' | 'rules' | 'cloud' | 'settings' | 'plus' | 'arrow' | 'check';

const paths: Record<IconName, string> = {
  teams: 'M3 4h7v7H3z M14 4h7v7h-7z M3 15h7v6H3z M14 15h7v6h-7z',
  athletes:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  spring: 'M3 19h18 M3 15c3 0 3-10 7-10s3 10 7 10h4 M17 11l4 4-4 4',
  rhythm: 'M4 12h3l3-8 4 16 3-8h3',
  rules: 'M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1v15',
  cloud: 'M7 18a5 5 0 1 1 0-10 6 6 0 0 1 11.5 1.5A4.5 4.5 0 0 1 18 18 M9 14l3 3 5-5',
  settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  check: 'M5 12l4 4L19 6',
};

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Brand({ href }: { href: string }) {
  return (
    <a className="brand" href={href} aria-label="TeamGym Team Manager">
      <svg className="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <path
          d="M7 31C13 31 12 11 22 11C33 11 27 33 37 33"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M7 22C13 22 16 33 24 33C32 33 31 20 37 14"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity=".48"
        />
      </svg>
      <span className="brand-type">
        TeamGym<small>Team Manager</small>
      </span>
    </a>
  );
}

export function Avatar({ name, team = false }: { name: string; team?: boolean }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
  return (
    <span className={`avatar ${team ? 'team-avatar' : ''}`} aria-hidden="true">
      {team ? <Icon name="teams" /> : initials}
    </span>
  );
}

export function WelcomeArtwork() {
  return (
    <div className="welcome-art" aria-hidden="true">
      <div className="art-heading">
        TeamGym
        <span>
          Fra individuel kunnen
          <br />
          til et stærkt fælles hold.
        </span>
      </div>
      <svg viewBox="0 0 600 620" fill="none">
        <path
          className="art-guide"
          d="M-40 490H640 M-40 370H640 M-40 250H640 M-40 130H640 M100 0V650 M220 0V650 M340 0V650 M460 0V650"
        />
        <path
          className="art-trail-back"
          d="M-30 480C95 480 70 180 207 180S288 480 420 480C516 480 502 275 625 275"
        />
        <path
          className="art-trail"
          d="M-30 430C110 430 93 120 230 120S290 430 422 430C512 430 505 220 625 220"
        />
        <circle cx="230" cy="120" r="10" fill="white" />
        <circle cx="422" cy="430" r="10" fill="white" />
      </svg>
      <div className="art-disciplines">
        <span>Bane</span>
        <span>Trampet</span>
        <span>Rytme</span>
      </div>
    </div>
  );
}
