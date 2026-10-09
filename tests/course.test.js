import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lessons, families, concentrations } from '../course-data.js';
import { scale } from '../math.js';

const data = JSON.parse(readFileSync(new URL('../formulas.json', import.meta.url)));
const library = JSON.parse(readFileSync(new URL('../library.json', import.meta.url)));
test('all source recipes are represented with valid references', () => {
  assert.equal(data.formulas.length, 61);
  assert.equal(new Set(data.formulas.map(f=>f.id)).size,61);
  const source=library.items.find(i=>i.filename===data.source);
  for(const f of data.formulas){
    assert.ok(f.pdfPage>=1&&f.pdfPage<=source.pageCount);
    assert.equal(f.pdfPage,f.sourcePage+1);
    assert.ok(f.ingredients.length>0);
    assert.ok(f.ingredients.every(i=>i.name&&i.amount>0));
    assert.equal(f.total,f.ingredients.reduce((sum,i)=>sum+i.amount,0));
    assert.equal(f.unit,f.group==='Artisan'?'drops':'mL');
  }
});
test('reviewed artisan totals match the visually read pages, including split columns', () => {
  const expected=[55,24,24,22,24,75,24,19,13,51,8,10,9,12,7,6,8,12,11,14,12,9,10,9,9,10,23,11,25,25,25,25,8,13,11,8,10,10,10,8,9,8,10,18,12,10,11,11,12,30,30,30,30,20,11];
  assert.deepEqual(data.formulas.filter(f=>f.group==='Artisan').map(f=>f.total),expected);
  assert.ok(data.formulas.find(f=>f.id==='artisan-17').note.includes('unclear'));
});
test('professional concentrate totals exclude separately stated base quantities', () => {
  assert.deepEqual(data.formulas.filter(f=>f.group==='Professional').map(f=>f.total),[18.5,47,48,20,21,23.5]);
  const recipe=data.formulas.find(f=>f.id==='pro-1');
  assert.equal(scale(37,recipe.ingredients.map(i=>i.amount))[0],6);
  assert.equal(recipe.unit,'mL');
});
test('native references and lessons link to real source pages', () => {
  assert.equal(families.length,14);
  assert.equal(concentrations.length,5);
  assert.ok(lessons.length>=20);
  assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
  const book=library.items.find(i=>i.filename==='eBook 1 - Artisan Perfumery.pdf');
  for(const lesson of lessons){
    assert.ok(lesson.blocks.length>=3);
    assert.ok(lesson.pages.every(p=>p>0&&p<=book.pageCount));
  }
});
