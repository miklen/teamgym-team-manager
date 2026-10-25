/** Eksakte rationelle point. BigInt forlader aldrig domænet som rå JSON. */
export class Fraction {
  readonly numerator: bigint;
  readonly denominator: bigint;

  constructor(numerator: bigint | number, denominator: bigint | number = 1n) {
    if (typeof numerator === 'number' && !Number.isSafeInteger(numerator)) throw new Error('Brug en decimal-/brøkstreng til point.');
    if (typeof denominator === 'number' && !Number.isSafeInteger(denominator)) throw new Error('Nævneren skal være et sikkert heltal.');
    let n = BigInt(numerator);
    let d = BigInt(denominator);
    if (d === 0n) throw new Error('Division med nul.');
    if (d < 0n) { n = -n; d = -d; }
    let a = n < 0n ? -n : n;
    let b = d;
    while (b !== 0n) { const next = a % b; a = b; b = next; }
    const divisor = a || 1n;
    this.numerator = n / divisor;
    this.denominator = d / divisor;
    Object.freeze(this);
  }

  static from(value: Fraction | string | number | bigint): Fraction {
    if (value instanceof Fraction) return value;
    if (typeof value !== 'string') return new Fraction(value);
    if (/^-?\d+\/[1-9]\d*$/.test(value)) {
      const [n, d] = value.split('/');
      return new Fraction(BigInt(n!), BigInt(d!));
    }
    if (!/^-?\d+(?:\.\d+)?$/.test(value)) throw new Error('Ugyldig decimal-/brøkstreng.');
    const negative = value.startsWith('-');
    const [integer, decimals = ''] = value.replace(/^-/, '').split('.');
    return new Fraction(BigInt(`${integer}${decimals}`) * (negative ? -1n : 1n), 10n ** BigInt(decimals.length));
  }

  add(other: Fraction | string | number | bigint) { const b = Fraction.from(other); return new Fraction(this.numerator * b.denominator + b.numerator * this.denominator, this.denominator * b.denominator); }
  subtract(other: Fraction | string | number | bigint) { const b = Fraction.from(other); return new Fraction(this.numerator * b.denominator - b.numerator * this.denominator, this.denominator * b.denominator); }
  multiply(other: Fraction | string | number | bigint) { const b = Fraction.from(other); return new Fraction(this.numerator * b.numerator, this.denominator * b.denominator); }
  divide(other: Fraction | string | number | bigint) { const b = Fraction.from(other); return new Fraction(this.numerator * b.denominator, this.denominator * b.numerator); }
  compare(other: Fraction | string | number | bigint): number { const b = Fraction.from(other); const value = this.numerator * b.denominator - b.numerator * this.denominator; return value < 0n ? -1 : value > 0n ? 1 : 0; }
  max(other: Fraction | string | number | bigint) { const b = Fraction.from(other); return this.compare(b) >= 0 ? this : b; }
  floor(): bigint { const quotient = this.numerator / this.denominator; return this.numerator < 0n && this.numerator % this.denominator !== 0n ? quotient - 1n : quotient; }
  panelFloor(): Fraction { return new Fraction(this.multiply(200).floor(), 200); }
  toString(): string { return this.denominator === 1n ? String(this.numerator) : `${this.numerator}/${this.denominator}`; }
  toJSON(): string { return this.toString(); }
  toNumber(): number { return Number(this.numerator) / Number(this.denominator); }
  decimal(places = 3): string {
    if (!Number.isInteger(places) || places < 0 || places > 12) throw new Error('Ugyldig visningspræcision.');
    const scale = 10n ** BigInt(places);
    const abs = this.numerator < 0n ? -this.numerator : this.numerator;
    const rounded = (abs * scale * 2n + this.denominator) / (this.denominator * 2n);
    const integer = String(rounded / scale);
    return `${this.numerator < 0n && rounded !== 0n ? '-' : ''}${integer}${places ? `.${String(rounded % scale).padStart(places, '0')}` : ''}`;
  }
}

export function sumFractions(values: readonly (Fraction | string | number | bigint)[]): Fraction { return values.reduce<Fraction>((sum, value) => sum.add(value), new Fraction(0)); }
export function formatPoints(value: Fraction | string, places = 3): string { return Fraction.from(value).decimal(places).replace('.', ','); }
