import {test} from 'node:test';
import assert from 'node:assert/strict';
import {liquidPerfume} from '../math.js';

const defaults={batchML:50,concentration:20,trialDrops:30,dropsPerML:22,fragranceDensity:0.9,carrierDensity:0.8};

test('liquid perfume default volumes, trial scaling and weights',()=>{
  const result=liquidPerfume(defaults);
  assert.equal(result.fragranceML,10);
  assert.equal(result.carrierML,40);
  assert.equal(result.trialML.toFixed(4),'1.3636');
  assert.equal(result.multiplier.toFixed(4),'7.3333');
  assert.equal(result.fragranceG,9);
  assert.equal(result.carrierG,32);
  assert.deepEqual(result.warnings,[]);
});

test('empty and non-numeric values invalidate only their dependent results',()=>{
  for(const value of ['', ' ', 'oops', '10ml', null, undefined, NaN, Infinity, -Infinity]){
    const batch=liquidPerfume({...defaults,batchML:value});
    assert.equal(batch.fragranceML,null);assert.equal(batch.carrierML,null);assert.equal(batch.multiplier,null);
    assert.equal(batch.trialML,30/22);
    const trial=liquidPerfume({...defaults,trialDrops:value});
    assert.equal(trial.fragranceML,10);assert.equal(trial.carrierML,40);
    assert.equal(trial.trialML,null);assert.equal(trial.multiplier,null);
    const concentration=liquidPerfume({...defaults,concentration:value});
    assert.equal(concentration.fragranceML,null);assert.equal(concentration.carrierML,null);
  }
});

test('zero or negative batch warns; invalid drops never divide by zero',()=>{
  for(const value of [0,-1]){
    const batch=liquidPerfume({...defaults,batchML:value});
    assert.equal(batch.fragranceML,null);assert.ok(batch.warnings.includes('Finished batch must be greater than zero.'));
    for(const field of ['trialDrops','dropsPerML']){
      const result=liquidPerfume({...defaults,[field]:value});
      assert.equal(result.trialML,null);assert.equal(result.multiplier,null);assert.ok(result.warnings.length);
    }
  }
});

test('concentration boundaries preserve volume and reject values outside 0–100',()=>{
  for(const percent of [0,100]){
    const r=liquidPerfume({...defaults,concentration:percent});
    assert.equal(r.fragranceML+r.carrierML,50);assert.deepEqual(r.warnings,[]);
  }
  for(const percent of [-1,101]){
    const r=liquidPerfume({...defaults,concentration:percent});
    assert.equal(r.fragranceML,null);assert.equal(r.carrierML,null);assert.ok(r.warnings.length);
  }
});

test('invalid density hides its weight without changing volume or the other weight',()=>{
  for(const value of ['',0,-1,'invalid',Infinity]){
    const result=liquidPerfume({...defaults,fragranceDensity:value});
    assert.equal(result.fragranceG,null);assert.equal(result.carrierG,32);assert.equal(result.fragranceML,10);
  }
});

test('numeric strings work without mutating inputs; extreme values never return non-finite numbers',()=>{
  const input=Object.freeze(Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,String(value)])));
  assert.equal(liquidPerfume(input).multiplier,10/(30/22));
  for(const args of [{batchML:1e308,concentration:100,fragranceDensity:10},{trialDrops:1e308,dropsPerML:1e-308},{trialDrops:1e-308,dropsPerML:1e308}]){
    for(const value of Object.values(liquidPerfume({...defaults,...args}))){
      if(typeof value==='number')assert.ok(Number.isFinite(value));
    }
  }
});
