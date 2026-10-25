import matrix from '../../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/rule-matrix.md?raw';
import { freezeData } from './catalog';

const coverage: Record<string, { code: string[]; tests: string[] }> = {
  P01: { code: ['dk-engine.ts', 'dk-numeric.ts', 'dk-data.ts'], tests: ['rule-fixtures.test.ts', 'potential.test.ts', 'workspace.test.ts'] },
  P02: { code: ['../domain/src/commands.ts', 'dk-engine.ts'], tests: ['workspace.test.ts'] },
  P03: { code: ['dk-engine.ts', 'dk-numeric.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  ID01: { code: ['dk-spring.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  ID02: { code: ['catalog.ts', 'dk-spring.ts'], tests: ['catalog.test.ts', 'spring-engine.test.ts'] },
  'D-BASIS': { code: ['catalog.ts', 'dk-spring.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'D-SKRUE': { code: ['dk-numeric.ts', 'dk-spring.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'D-BANE': { code: ['dk-numeric.ts', 'dk-spring.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'D-HOLD': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'D-MIDDEL': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  TAL: { code: ['../domain/src/fraction.ts'], tests: ['fraction.test.ts', 'rule-fixtures.test.ts'] },
  'C-GRUND': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'C-HOLD': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'C-GENTAG': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'C-RETNING': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts'] },
  'C-REDSKAB': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'C-ORDEN': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts'] },
  'C-FLOW': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'B-SKRUE': { code: ['dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'potential.test.ts'] },
  'B-DOBBELT': { code: ['dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'B-ELEMENT': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'spring-engine.test.ts'] },
  'T-SKRUE': { code: ['dk-numeric.ts', 'dk-engine.ts'], tests: ['rule-fixtures.test.ts'] },
  'T-DOBBELT-FRI': { code: ['dk-engine.ts'], tests: ['rule-fixtures.test.ts'] },
  'T-DOBBELT-REDSKAB': { code: ['dk-engine.ts'], tests: ['rule-fixtures.test.ts', 'potential.test.ts'] },
};

export const RULE_TRACE = freezeData(matrix.split(/\r?\n/).filter((line) => line.startsWith('| ') && line.split('|')[1]?.includes(';')).map((line) => {
  const fields = line.split('|').slice(1, -1).map((field) => field.trim());
  const [id, ...sourceParts] = fields[0]!.split(';');
  const details = coverage[id!.trim()];
  if (!details) throw new Error(`Regelmatrixpost uden sporbarhed: ${id}`);
  return { id: id!.trim(), sources: sourceParts.join(';').trim(), inputUniverseAndFormula: fields[1]!, statusAndFacit: fields[2]!, ...details };
}));

export const ADDITIONAL_TRACE = freezeData([
  { id: 'POT', status: 'K', source: 'Produktkrav: konkrete muligheder', code: ['potential.ts', 'dk-v1.ts'], tests: ['potential.test.ts', 'registry.test.ts'], note: 'Vidneopstillinger fra registreret kunnen; separate muligheder, ingen falsk samlet C.' },
  { id: 'rhythm', status: 'K/U', source: 'A1.1 side 1–13; fire G-felter udeladt', code: ['catalog.ts', 'rhythm.ts'], tests: ['catalog.test.ts', 'rhythm-commonality.test.ts', 'rule-fixtures.test.ts'], note: '94 individuelle felter; K01/K02 bevares og ukendte koblinger giver ingen sikker fællesnævner.' },
  { id: 'X', status: 'X', source: 'Regelmatrixens eksplicitte scope; A6 observationsgrænse', code: ['dk-engine.ts'], tests: ['rule-fixtures.test.ts'], note: 'Ingen E-bedømmelse, videogenkendelse, fuld rytmekarakter, G, licenskontrol eller automatisk konkurrenceberettigelse.' },
]);
