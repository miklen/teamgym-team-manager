import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import sources from '../../packages/rules/data/reg/sources.json';
import { verifyRegSources } from '../../scripts/verify-sources.mjs';

const root = new URL('../../', import.meta.url);

describe('REG-kildegrundlag', () => {
  it('låser A1.2 med den kontrollerede SHA-256', () => {
    expect(sources.sources.find((source) => source.id === 'A1.2')?.sha256).toBe('90893B0BE3C8F0C08F636970DD8068E249E4158DB34A82FFDC9D02821657BE4A');
  });

  it('godkender de syv uændrede kilder', () => {
    expect(verifyRegSources()).toBe(7);
  });

  it('fejler, når én byte i A1.2 er ændret', () => {
    const read = (file: string) => {
      const bytes = new Uint8Array(readFileSync(new URL(file, root)));
      if (file.includes('A1.2')) bytes[1000] = bytes[1000]! ^ 1;
      return bytes;
    };
    expect(() => verifyRegSources(read)).toThrow(/REG-kilde A1\.2 afviger/);
  });
});
