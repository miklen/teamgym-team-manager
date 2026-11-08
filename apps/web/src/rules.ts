import { DK_V1, DK_V2, REG_V1, RuleRegistry } from '@teamgym/rules';
export const registry = new RuleRegistry();
registry.register(DK_V2);
registry.register(REG_V1);
// Udfasede DK 1.0.0-hold kan fortsat beregnes og skiftes til 1.1.0.
registry.register(DK_V1, { retired: true });
