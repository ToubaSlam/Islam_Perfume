import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

test('Pages artifact includes browser entry points, imports and fetched data',()=>{
  const root=new URL('../',import.meta.url);
  const html=readFileSync(new URL('index.html',root),'utf8');
  const workflow=readFileSync(new URL('.github/workflows/pages.yml',root),'utf8');
  const copyLine=workflow.match(/^\s+cp (.+) public-site\/$/m);
  assert.ok(copyLine,'Deployment must stage browser assets');
  const copied=new Set(copyLine[1].split(/\s+/));
  const refs=[...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg))"/g)].map(m=>m[1]);
  for(const file of [...copied].filter(f=>f.endsWith('.js'))){
    const code=readFileSync(new URL(file,root),'utf8');
    refs.push(...[...code.matchAll(/(?:from\s*|fetch\()\s*['"](?:\.\/)?([^'":]+\.(?:js|json))['"]/g)].map(m=>m[1]));
  }
  for(const ref of new Set(refs)){
    assert.ok(existsSync(new URL(ref,root)),`Missing local dependency: ${ref}`);
    assert.ok(copied.has(ref),`Browser dependency excluded from Pages artifact: ${ref}`);
  }
});
