import { expect, it } from 'vitest';
import { Fraction, formatPoints, sumFractions } from '@teamgym/domain';

it('bevarer 0,10/3 og gentagne mellemregninger præcist uden binær drift', () => {
  const part = Fraction.from('0.10').divide(3);
  expect(part.toString()).toBe('1/30');
  expect(sumFractions(Array.from({ length: 300 }, () => part)).toString()).toBe('10');
  expect(Fraction.from('127/30').panelFloor().toString()).toBe('423/100');
  expect(formatPoints(Fraction.from('127/30').panelFloor())).toBe('4,230');
  expect(Fraction.from('127/30').decimal(3)).toBe('4.233');
});

it('nedrunder efter præcis beregning til 0,005 og skelner nulgrænse fra rå negativ sum', () => {
  expect(Fraction.from('4.234999999').panelFloor().decimal(3)).toBe('4.230');
  expect(Fraction.from('4.235').panelFloor().decimal(3)).toBe('4.235');
  const raw = Fraction.from('0.20').subtract('0.70');
  expect(raw.toString()).toBe('-1/2');
  expect(raw.max(0).panelFloor().toString()).toBe('0');
  expect(Fraction.from('-1/3').floor()).toBe(-1n);
});

it('normaliserer store brøker, serialiserer som streng og afviser upræcise indgange', () => {
  expect(new Fraction(900719925474099300n, 300n).toString()).toBe('3002399751580331');
  expect(JSON.stringify({ points: Fraction.from('0.10') })).toBe('{"points":"1/10"}');
  expect(() => Fraction.from(0.1)).toThrow('streng');
  expect(() => Fraction.from('NaN')).toThrow();
  expect(() => new Fraction(1, 0)).toThrow('nul');
  expect(() => new Fraction(Number.MAX_SAFE_INTEGER + 1)).toThrow();
});
