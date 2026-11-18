import { useId, useState } from 'react';
import type { PlanFinding, PlanFindingStatus, RulePackage } from '@teamgym/rules';
import { points, SourceLinks } from './components';
import { RuleUncertainty } from './rule-uncertainty';
import { Icon } from './ui';
import './round-findings.css';

const statusLabel: Record<PlanFindingStatus, string> = {
  deduction: 'Fradrag',
  preliminary: 'Foreløbig',
  unresolved: 'Uafklaret',
  missing: 'Mangler',
  invalid: 'Ugyldigt',
  opportunity: 'Mere tillæg',
};

function shortLabel(finding: PlanFinding): string {
  if (finding.id === 'mixed-apparatus') return 'Blandet redskab';
  if (finding.id.startsWith('C-ORDEN-')) return 'Rækkefølge';
  if (finding.id === 'C-HOLD') return 'Holdomgang';
  if (finding.id === 'C-GENTAG') return 'Gentagelse';
  if (finding.id === 'C-RETNING') return 'Rene retninger';
  if (finding.id === 'C-REDSKAB') return 'Med og uden Pegasus';
  if (finding.id.startsWith('missing-count:')) return 'Tællende pladser';
  return finding.label;
}

export function RoundFindings({ findings, rulePackage, action }: {
  findings: readonly PlanFinding[];
  rulePackage: RulePackage;
  action: (finding: PlanFinding) => { label: string; run: () => void };
}) {
  const id = useId();
  const [openId, setOpenId] = useState<string | null>(null);
  const active = findings.find((finding) => finding.id === openId);
  const next = active ? action(active) : null;
  if (!findings.length) return null;
  return <div className="round-findings">
    <div className="round-finding-triggers">
      {findings.map((finding) => <button key={finding.id} id={`${id}-${finding.id}`} type="button" className="round-finding"
        data-finding={finding.id} data-status={finding.status} aria-controls={id} aria-expanded={active === finding}
        onClick={() => setOpenId(active === finding ? null : finding.id)}>
        <span>{shortLabel(finding)}</span> <small>{finding.status === 'opportunity' && finding.amount ? `+${points(finding.amount)} mere` : statusLabel[finding.status]}</small>
        <Icon name="right" />
      </button>)}
    </div>
    <div id={id} hidden={!active} aria-labelledby={active ? `${id}-${active.id}` : undefined} role="region">
      {active && next && <div key={active.id} className="round-finding-detail" data-status={active.status}>
        <div className="round-finding-lead">
          {active.amount !== null && <div className="round-finding-score">
            <strong>{active.status === 'opportunity' ? '+' : '−'}{points(active.amount)}</strong>
            <small>{active.status === 'opportunity' ? 'Ekstra tillæg' : 'Samlet C-fradrag'}</small>
          </div>}
          <p>{active.detail}</p>
        </div>
        <RuleUncertainty ids={active.issues} knownIssues={rulePackage.knownIssues} />
        <div className="round-finding-footer">
          {active.sources.length > 0 && <SourceLinks sources={active.sources} rulePackage={rulePackage} />}
          <button type="button" className="finding-next" onClick={next.run}>{next.label}<Icon name="arrow" /></button>
        </div>
      </div>}
    </div>
  </div>;
}
