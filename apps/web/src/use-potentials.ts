import { useEffect, useRef, useState } from 'react';
import { Fraction, workspacePayload } from '@teamgym/domain';
import type { Workspace, SpringDiscipline } from '@teamgym/domain';
import type { BonusPotential } from '@teamgym/rules';
function revive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') {
    if (
      'numerator' in value &&
      'denominator' in value &&
      typeof value.numerator === 'bigint' &&
      typeof value.denominator === 'bigint'
    )
      return new Fraction(value.numerator, value.denominator);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]));
  }
  return value;
}
export function usePotentials(workspace: Workspace, teamId: string, discipline: SpringDiscipline, scenarioId: string) {
  const worker = useRef<Worker | null>(null);
  const [result, setResult] = useState<BonusPotential[] | null>(null);
  const [error, setError] = useState('');
  const key = `${teamId}:${discipline}:${scenarioId}:${workspacePayload(workspace)}`;
  const [current, setCurrent] = useState('');
  useEffect(() => {
    const instance = new Worker(new URL('./potential.worker.ts', import.meta.url), { type: 'module' });
    worker.current = instance;
    return () => {
      instance.terminate();
      worker.current = null;
    };
  }, []);
  useEffect(() => {
    const instance = worker.current;
    if (!instance) return;
    const id = crypto.randomUUID();
    const handler = (event: MessageEvent<{ id: string; result?: BonusPotential[]; error?: string }>) => {
      if (event.data.id !== id) return;
      setCurrent(key);
      setResult(event.data.result ? (revive(event.data.result) as BonusPotential[]) : null);
      setError(event.data.error ?? '');
    };
    instance.addEventListener('message', handler);
    instance.postMessage({ id, workspace, teamId, discipline, scenarioId });
    return () => {
      instance.removeEventListener('message', handler);
      instance.postMessage({ cancel: true });
    };
  }, [key, workspace, teamId, discipline, scenarioId]);
  return {
    result: current === key ? result : null,
    error: current === key ? error : '',
    cancel: () => worker.current?.postMessage({ cancel: true }),
  };
}
