import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

const ScenarioContext = createContext<{
  selected: Record<string, string>;
  select: (key: string, id: string) => void;
} | null>(null);

/** Kun navigation i den åbne appsession; ingen gymnastdata skrives til browserlager. */
export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  return (
    <ScenarioContext.Provider
      value={{ selected, select: (key, id) => setSelected((current) => ({ ...current, [key]: id })) }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenarioSelection(key: string, ids: string[]) {
  const context = useContext(ScenarioContext);
  if (!context) throw new Error('Scenariekonteksten mangler.');
  const selected = ids.includes(context.selected[key] ?? '') ? context.selected[key]! : ids[0]!;
  return [selected, (id: string) => context.select(key, id)] as const;
}
