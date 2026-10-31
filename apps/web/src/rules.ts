import { DK_V1, DK_V2, RuleRegistry } from '@teamgym/rules';
export const registry = new RuleRegistry();
registry.register(DK_V2);
// Udfaset: eksisterende hold kan beregnes og skiftes til 1.1.0, men nye valg tilbyder kun 1.1.0.
registry.register(DK_V1, { retired: true });
