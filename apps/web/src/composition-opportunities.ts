import type { BonusPotential, CompositionGuideRow, PlanFinding } from '@teamgym/rules';
import { points } from './components';

export function bonusName(row: CompositionGuideRow): string {
  if (row.id === 'T-DOBBELT-FRI') return 'Dobbeltsalto uden Pegasus';
  if (row.id === 'T-DOBBELT-REDSKAB') return 'Dobbeltsalto med Pegasus';
  return row.label;
}

/** Et forslag skal løfte selve tillægget i forhold til planens kendte bidrag. */
export function bonusIncrease(potential: BonusPotential | undefined) {
  if (!potential?.preview || !potential.documentedValue) return null;
  const increase = potential.documentedValue.subtract(potential.selected ?? potential.selectedKnownSubtotal);
  return increase.compare(0) > 0 ? increase : null;
}

export function bonusFindings(rows: readonly CompositionGuideRow[], potentials: readonly BonusPotential[] | null): PlanFinding[] {
  return potentials?.flatMap((potential) => {
    const amount = bonusIncrease(potential);
    const row = rows.find((item) => item.id === potential.id);
    if (!amount || !row || !potential.preview) return [];
    const { after, before, changes } = potential.preview;
    const currentCounts = before.contributions.find((item) => item.id === row.id)?.guideCounts?.[0] ?? [];
    const proposedCounts = after.contributions.find((item) => item.id === row.id)?.guideCounts?.[0] ?? [];
    const best = Math.max(0, ...proposedCounts);
    const roundIds = after.rounds.flatMap((round, index) => {
      if (!changes.some((change) => change.roundId === round.id)) return [];
      const proposed = proposedCounts[index] ?? 0;
      const improved = row.id === 'B-ELEMENT'
        ? proposed > (currentCounts[index] ?? 0)
        : proposed === best && best > Math.max(0, ...currentCounts);
      return improved ? [round.id] : [];
    });
    const current = potential.selected ?? potential.selectedKnownSubtotal;
    const detail = current.compare(0) > 0
      ? `Planen har ${potential.selected === null ? 'foreløbigt ' : ''}+${points(current)} i dette tillæg. En konkret opstilling med holdets registrerede spring giver +${points(potential.documentedValue)}.`
      : 'Holdets registrerede spring rækker til en konkret opstilling, der udløser tillægget.';
    return [{ id: row.id, contributionId: row.id, label: bonusName(row), detail, status: 'opportunity',
      amount, roundIds, entryIds: [], issues: [], sources: row.sources, action: 'guide' }];
  }) ?? [];
}
