import { DK_V1, DK_V2, RuleRegistry } from '@teamgym/rules';
export const registry = new RuleRegistry();
registry.register(DK_V2);
registry.register(DK_V1);
