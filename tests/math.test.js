import {test} from 'node:test';
import assert from 'node:assert/strict';
import {batch,dilution,scale} from '../math.js';
test('liquid and diffuser conserve volume',()=>{assert.deepEqual(batch(50,[20]),[10,40]);assert.deepEqual(batch(100,[20,10,5]),[20,10,5,65]);assert.deepEqual(batch(50,[0]),[0,50]);});
test('solid conserves mass',()=>assert.deepEqual(batch(15,[5,30,50]),[0.75,4.5,7.5,2.25]));
test('dilution accounts for stock strength',()=>{assert.deepEqual(dilution(10,100,10),[1,9]);assert.deepEqual(dilution(20,20,5),[5,15]);assert.deepEqual(dilution(10,10,10),[10,0]);});
test('parts scale proportionally',()=>assert.deepEqual(scale(10,[3,5,2]),[3,5,2]));
test('reject invalid inputs',()=>{for(const p of [[80,30],[-1],[NaN]])assert.throws(()=>batch(10,p));assert.throws(()=>batch(0,[10]));assert.throws(()=>dilution(10,10,20));assert.throws(()=>dilution(10,0,10));assert.throws(()=>scale(10,[]));assert.throws(()=>scale(10,[0,1]));});
