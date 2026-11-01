import type { Locator, Page } from '@playwright/test';
import { expect } from './test';

type Scope = Page | Locator;

/** Række i springvælgeren. Navnet samler spring, status, retning, holdkendskab og D. */
export const springRow = (scope: Scope, name: string | RegExp) => scope.getByRole('listitem', { name });

/** Sikkerhedsknapperne for et spring: »Sikkerhed for X« (valgt/kandidat) eller »Vurdering for X« (fundament). */
export const ratingGroup = (scope: Scope, label: string) => scope.getByRole('group', { name: label, exact: true });

const ratingButton = (group: Locator, value: number | 'Arvet') =>
  value === 'Arvet'
    ? group.getByRole('button', { name: /^Arvet/ })
    : group.getByRole('button', { name: String(value), exact: true });

/** Vælg springet i rækken; med en værdi vælges og vurderes det i ét tryk. */
export async function chooseSpring(scope: Scope, row: string | RegExp, stability?: number) {
  const target = springRow(scope, row);
  await target
    .getByRole('button', { name: stability === undefined ? 'Vælg uden vurdering' : String(stability), exact: true })
    .click();
}

export async function rate(scope: Scope, label: string, value: number | 'Arvet') {
  await ratingButton(ratingGroup(scope, label), value).click();
}

export async function expectRating(scope: Scope, label: string, value: number | 'Arvet') {
  await expect(ratingButton(ratingGroup(scope, label), value)).toHaveAttribute('aria-pressed', 'true');
}

export async function expectIncluded(row: Locator, included = true) {
  await expect(row).toHaveAttribute('data-included', String(included));
}

/** Fravælg et fundament, fjern et valgt spring eller medtag et fravalgt fundament igen. */
export async function toggleSpring(scope: Scope, label: string) {
  await ratingGroup(scope, label)
    .getByRole('button', { name: /^(Fravælg|Fjern|Medtag igen|Vælg uden vurdering)$/ })
    .click();
}

export async function openDFilter(scope: Scope) {
  const details = scope.locator('details.picker-more');
  if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open)))
    await details.locator('summary').click();
}
