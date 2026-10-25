import { globSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('holder domæne og regler fri af UI, Google, Node og netværksbiblioteker', () => {
  const allowedDependencies = new Set(['@teamgym/domain', '@teamgym/rules']);
  for (const path of globSync('packages/{domain,rules}/src/**/*.ts')) {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
        expect(ts.isStringLiteral(node.moduleSpecifier)).toBe(true);
        const dependency = (node.moduleSpecifier as ts.StringLiteral).text;
        expect(allowedDependencies.has(dependency) || /^\.\.?\//.test(dependency), `${path}: ${dependency}`).toBe(true);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});
