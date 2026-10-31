import './rule-uncertainty.css';

const explanations: Record<string, string> = {
  Q01: 'Regelteksten giver 0,10 pr. forskelligt baneelement; eksemplet tæller først fra element nr. 2. Begge muligheder vises, indtil det er afklaret.',
  Q02: 'Trampettabellen giver 1,20; basisværdi plus en halv skrue giver 1,10. Springets D er derfor åbent.',
  Q04: 'Reglen forklarer ikke sikkert, hvordan blandede omgange med og uden Pegasus skal tælles.',
  Q05: 'Ingen serie har flertal i holdomgangen. Det er uklart, hvilken serie de øvrige skal sammenlignes med.',
  Q06: 'Rækkefølgen er ikke entydigt korrekt. Reglementet fastlægger ikke, om hver fejl tælles mod naboen eller mod tidligere højeste værdi.',
  'H-U06':
    'Appen runder den præcise værdi direkte ned til 0,005. Det er uafklaret, om dommernes tal først skal behandles til to decimaler.',
  'A71-U01':
    'Visse dobbeltspring kræver trænerlicens og særskilt vurdering. Bilaget dokumenterer ikke, hvilken licensgyldighed der gælder i 2026/27.',
  'A1DK-U06':
    'Den nyere tabel beskriver Gumbis startretning; et ældre svar beskriver et friere startvalg. Knælende start er endnu ikke bekræftet for denne udgave.',
  'A1DK-U03':
    'J822 står trykt i spagatrækken, men koden følger ikke de øvrige i rækken. Det er uklart, om momentet må kombineres med dem i et program.',
  'A1DK-U04':
    'For denne vandrette balance er det uafklaret, om 15° for overkroppen eller 30° for kropslinjen gælder ved genkendelse. Appen måler ikke vinklen.',
  K01: 'To forskellige rytmemomenter har begge den trykte kode DB804. Det er uafklaret, hvordan de må anmeldes sammen.',
  'A3-U01':
    'Startmarkeringen giver samme D som den almindelige salto. Vi tæller den som samme element; identiteten er endnu ikke bekræftet officielt.',
  'C-RETNING-VALG':
    'Samme blandede omgang er nærmest både forlæns- og baglænskravet. Det er uafklaret, om én omgang må bruges til begge.',
};

export function hasRuleUncertainty(ids: readonly string[]) {
  return ids.some((id) => explanations[id]);
}

export function rhythmUncertaintyIds(
  moment: { id: string; officialCode: string; category: string; rowRequirements: readonly string[] },
  variant: Readonly<Record<string, string | number | boolean>>,
) {
  return [
    ...(moment.officialCode === 'DB804' ? ['K01'] : []),
    ...(moment.officialCode === 'J822' ? ['A1DK-U03'] : []),
    ...(['HB', 'SB'].includes(moment.category) &&
    moment.rowRequirements.some((requirement) => /vandret overkrop/i.test(requirement))
      ? ['A1DK-U04']
      : []),
    ...(moment.id === 'rh-a-gumbi' && variant.startLevel === 'kneeling' ? ['A1DK-U06'] : []),
  ];
}

export function UncertaintyMark({ label = 'Usikkert regelgrundlag' }: { label?: string }) {
  return (
    <span className="rule-uncertainty-mark" role="img" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 3.5 21 19H3L12 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    </span>
  );
}

export function RuleUncertainty({
  ids,
  context,
  compact = false,
}: {
  ids: readonly string[];
  context?: string;
  compact?: boolean;
}) {
  const unique = [...new Set(ids)].filter((id) => explanations[id]);
  if (!unique.length) return null;
  return (
    <details className={`rule-uncertainty${compact ? ' rule-uncertainty-compact' : ''}`}>
      <summary>
        <UncertaintyMark />
        {compact ? (
          <span className="sr-only">{`Læs om usikkert ${context ?? 'regel'}grundlag`}</span>
        ) : (
          <span>
            {context ? `${context} · ` : ''}
            {unique.length === 1 ? 'Om denne usikkerhed' : `${unique.length} forhold kræver afklaring`}
          </span>
        )}
      </summary>
      {compact ? (
        <div className="rule-uncertainty-popover">
          <strong>{context ? `Om ${context}-tallet` : 'Om regelgrundlaget'}</strong>
          {unique.map((id) => (
            <p key={id}>{explanations[id]}</p>
          ))}
        </div>
      ) : (
        unique.map((id) => <p key={id}>{explanations[id]}</p>)
      )}
    </details>
  );
}
