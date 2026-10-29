'use strict';

const assert = require('node:assert/strict');
const { menu, safeCalc, numberInfo } = require('../index.js');

assert.equal(safeCalc('12+8*2'), '28');
assert.equal(safeCalc('(20-5)/3'), '5');
assert.equal(safeCalc('process.exit()'), null);
assert.equal(safeCalc(''), null);

assert.match(numberInfo('+2250700000000'), /format international valide/i);
assert.match(numberInfo('not-a-number'), /Format invalide/i);

assert.match(menu(), /DRACULA NOSFERA/);
assert.match(menu(), /\.menu/);

console.log('Smoke tests réussis : calcul, validation de numéro et menu.');
