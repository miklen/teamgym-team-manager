export const sources: string[];
export function sourceFingerprint(read?: (path: string) => Buffer): string;
export function verifyAiSkill(read?: (path: string) => Buffer): void;
