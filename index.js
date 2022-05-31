function isPrefixCode(strings) {
  // Note: we skip checking for prefixness if two symbols are equal to each
  // other. This implies that repeated symbols in the input are *silently
  // ignored*!
  for (const i of strings) {
    for (const j of strings) {
      if (j === i) { // [🍅]
        continue;
      }
      if (i.startsWith(j)) {
        return false;
      }
    }
  }
  return true;
}
// < export mudder.js

function isPrefixCodeLogLinear(strings) {
  strings = Array.from(strings).sort(); // set->array or array->copy
  for (const [i, curr] of strings.entries()) {
    const prev = strings[i - 1]; // undefined for first iteration
    if (prev === curr) {         // Skip repeated entries, match quadratic API
      continue;
    }
    if (curr.startsWith(prev)) { // str.startsWith(undefined) always false
      return false;
    };
  }
  return true;
}
// < export mudder.js

isPrefixCode = isPrefixCodeLogLinear;
// < export mudder.js

/* Constructor:
symbolsArr is a string (split into an array) or an array. In either case, it
maps numbers (array indexes) to stringy symbols. Its length defines the max
radix the symbol table can handle.

symbolsMap is optional, but goes the other way, so it can be an object or Map.
Its keys are stringy symbols and its values are numbers. If omitted, the
implied map goes from the indexes of symbolsArr to the symbols.

When symbolsMap is provided, its values are checked to ensure that each number
from 0 to max radix minus one is present. If you had a symbol as an entry in
symbolsArr, then number->string would use that symbol, but the resulting
string couldn't be parsed because that symbol wasn't in symbolMap.
*/
function SymbolTable(symbolsArr, symbolsMap) {
  'use strict'; // [⛈]
  if (typeof this === 'undefined') {
    throw new TypeError('constructor called as a function')
  };

  // Condition the input `symbolsArr`
  if (typeof symbolsArr === 'string') {
    symbolsArr = symbolsArr.split('');
  } else if (!Array.isArray(symbolsArr)) {
    throw new TypeError('symbolsArr must be string or array');
  }

  // Condition the second input, `symbolsMap`. If no symbolsMap passed in, make
  // it by inverting symbolsArr. If it's an object (and not a Map), convert its
  // own-properties to a Map.
  if (typeof symbolsMap === 'undefined') {
    symbolsMap = new Map(symbolsArr.map((str, idx) => [str, idx]));
  } else if (symbolsMap instanceof Object && !(symbolsMap instanceof Map)) {
    symbolsMap = new Map(Object.entries(symbolsMap));
  } else if (!(symbolsMap instanceof Map) ){
    throw new TypeError('symbolsMap can be omitted, a Map, or an Object');
  }

  // Ensure that each integer from 0 to `symbolsArr.length - 1` is a value in
  // `symbolsMap`
  let symbolsValuesSet = new Set(symbolsMap.values());
  for (let i = 0; i < symbolsArr.length; i++) {
    if (!symbolsValuesSet.has(i)) {
      throw new RangeError(symbolsArr.length + ' symbols given but ' + i +
                           ' not found in symbol table');
    }
  }

  this.num2sym = symbolsArr;
  this.sym2num = symbolsMap;
  this.maxBase = this.num2sym.length;
  this.isPrefixCode = isPrefixCode(symbolsArr);
}
// < export mudder.js

SymbolTable.prototype.numberToDigits = function(num, base) {
  base = base || this.maxBase;
  let digits = [];
  while (num >= 1) {
    digits.push(num % base);
    num = Math.floor(num / base);
  }
  return digits.length ? digits.reverse() : [ 0 ];
};
// < export mudder.js

SymbolTable.prototype.digitsToString = function(digits) {
  return digits.map(n => this.num2sym[n]).join('');
};
// < export mudder.js

SymbolTable.prototype.stringToDigits = function(string) {
  if (!this.isPrefixCode && typeof string === 'string') {
    throw new TypeError(
        'parsing string without prefix code is unsupported. Pass in array of stringy symbols?');
  }
  if (typeof string === 'string') {
    const re =
        new RegExp('(' + Array.from(this.sym2num.keys()).join('|') + ')', 'g');
    string = string.match(re);
  }
  return string.map(symbol => this.sym2num.get(symbol));
};
// < export mudder.js

SymbolTable.prototype.digitsToNumber = function(digits, base) {
  base = base || this.maxBase;
  let currBase = 1;
  return digits.reduceRight((accum, curr) => {
    let ret = accum + curr * currBase;
    currBase *= base;
    return ret;
  }, 0);
};
// < export mudder.js

SymbolTable.prototype.numberToString = function(num, base) {
  return this.digitsToString(this.numberToDigits(num, base));
};
SymbolTable.prototype.stringToNumber = function(num, base) {
  return this.digitsToNumber(this.stringToDigits(num), base);
};
// < export mudder.js

function longDiv(numeratorArr, den, base) {
  return numeratorArr.reduce((prev, curr) => {
    let newNum = curr + prev.rem * base;
    return {
      res : prev.res.concat(Math.floor(newNum / den)),
      rem : newNum % den, den
    };
  }, {res : [], rem : 0, den});
}
// < export mudder.js

/**
 *
 * @param {number[]} a larger number, as digits array
 * @param {number[]} b smaller number, as digits array
 * @param {number} base
 * @param {[number, number]} rem `a` and `b`'s remainders
 * @param {number} den denominator for the remainders
 * @returns {{res: number[], den: number, rem: number}}
 */
function longSubSameLen(a, b, base, rem = [], den = 0) {
  if (a.length !== b.length) { throw new Error('same length arrays needed'); }
  if (rem.length !== 0 && rem.length !== 2) { throw new Error('zero or two remainders expected'); }
  a = a.slice(); // pre-emptively copy
  if (rem.length) {
    a = a.concat(rem[0]);
    b = b.slice().concat(rem[1]);
  }
  const ret = Array(a.length).fill(0);

  // this is a LOOP LABEL! https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label
  OUTER: for (let i = a.length - 1; i >= 0; --i) {
    // console.log({a, ret})
    if (a[i] >= b[i]) {
      ret[i] = a[i] - b[i];
      continue;
    }
    if (i === 0) { throw new Error('cannot go negative'); }
    // look for a digit to the left to borrow from
    for (let j = i - 1; j >= 0; --j) {
      if (a[j] > 0) {
        // found a non-zero digit. Decrement it
        a[j]--;
        // increment digits to its right by `base-1`
        for (let k = j + 1; k < i; ++k) { a[k] += base - 1; }
        // until you reach the digit you couldn't subtract
        ret[i] = a[i] + (rem.length > 0 && i === a.length - 1 ? den : base) - b[i];
        continue OUTER;
      }
    }
    // should have `continue`d `OUTER` loop
    throw new Error('failed to find digit to borrow from');
  }
  if (rem.length) { return {res: ret.slice(0, -1), rem: ret[ret.length - 1], den}; }
  return {res: ret, rem: 0, den};
}

/**
 *
 * @param {number[]} a array of digits
 * @param {number[]} b array of digits
 * @param {number} base
 * @param {number} rem remainder
 * @param {number} den denominator under remainder
 */
function longAddSameLen(a, b, base, rem, den) {
  if (a.length !== b.length) {
    throw new Error('same length arrays needed');
  }
  let carry = rem >= den, res = b.slice();
  if (carry) {
    rem -= den;
  }
  a.reduceRight((_, ai, i) => {
    const result = ai + b[i] + carry;
    carry = result >= base;
    res[i] = carry ? result - base : result;
  }, null);
  return {res, carry, rem, den};
};

function rightpad(arr, finalLength, val) {
  const padlen = Math.max(0, finalLength - arr.length);
  return arr.concat(Array(padlen).fill(val || 0));
}

/**
 * Returns `(a + (b-a)/M*n)` for n=[1, 2, ..., N], where `N<M`.
 * @param {number[]} a left array of digits
 * @param {number[]} b right array of digits
 * @param {number} base
 * @param {number} N number of linearly-spaced numbers to return
 * @param {number} M number of subdivisions to make, `M>N`
 * @returns {{res: number[]; rem: number; den: number;}[]} `N` numbers
 */
function longLinspace(a, b, base, N, M) {
  if (a.length < b.length) {
    a = rightpad(a, b.length);
  } else if (b.length < a.length) {
    b = rightpad(b, a.length);
  }
  if (a.length === b.length && a.every((a, i) => a === b[i])) {
    throw new Error('Start and end strings lexicographically inseparable');
  }
  const aDiv = longDiv(a, M, base);
  const bDiv = longDiv(b, M, base);
  let aPrev = longSubSameLen(a, aDiv.res, base, [0, aDiv.rem], M);
  let bPrev = bDiv;
  const ret = [];
  for (let n = 1; n <= N; ++n) {
    const x = longAddSameLen(aPrev.res, bPrev.res, base, aPrev.rem + bPrev.rem, M);
    ret.push(x);
    aPrev = longSubSameLen(aPrev.res, aDiv.res, base, [aPrev.rem, aDiv.rem], M);
    bPrev = longAddSameLen(bPrev.res, bDiv.res, base, bPrev.rem + bDiv.rem, M);
  }
  return ret;
}
function leftpad(arr, finalLength, val) {
  const padlen = Math.max(0, finalLength - arr.length);
  return Array(padlen).fill(val || 0).concat(arr);
}

SymbolTable.prototype.roundFraction = function(numerator, denominator, base) {
  base = base || this.maxBase;
  var places = Math.ceil(Math.log(denominator) / Math.log(base));
  var scale = Math.pow(base, places);
  var scaled = Math.round(numerator / denominator * scale);
  var digits = this.numberToDigits(scaled, base);
  return leftpad(digits, places, 0);
};

function chopDigits(rock, water, placesToKeep = 0) {
  for (let idx = placesToKeep; idx < water.length; idx++) {
    if (water[idx] && rock[idx] !== water[idx]) {
      return water.slice(0, idx + 1);
    }
  }
  return water;
}

function lexicographicLessThanArray(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) {
      continue;
    }
    return a[i] < b[i];
  }
  return a.length < b.length;
}

function chopSuccessiveDigits(strings, placesToKeep = 0) {
  const reversed = !lexicographicLessThanArray(strings[0], strings[1]);
  if (reversed) {
    strings.reverse();
  }
  const result =
    strings.slice(1).reduce((accum, curr) => accum.concat(
                              [ chopDigits(accum[accum.length - 1], curr, placesToKeep ) ]),
                            [ strings[0] ]);
  if (reversed) {
    result.reverse();
  }
  return result;
}

function truncateLexHigher(lo, hi) {
  const swapped = lo > hi;
  if (swapped) {
    [lo, hi] = [ hi, lo ];
  }
  if (swapped) {
    return [ hi, lo ];
  }
  return [ lo, hi ];
}

SymbolTable.prototype.mudder = function(a, b, numStrings, base, numDivisions, placesToKeep = 0) {
  if (typeof a === 'number'){
    numStrings = a;
    a = '';
    b = '';
  }
  a = a || this.num2sym[0];
  b = b || this.num2sym[this.num2sym.length - 1].repeat(a.length + 6);
  numStrings = typeof numStrings === 'number' ? numStrings : 1;
  base = base || this.maxBase;
  numDivisions = numDivisions || numStrings + 1;

  [a, b] = truncateLexHigher(a, b);
  const ad = this.stringToDigits(a, base);
  const bd = this.stringToDigits(b, base);
  const intermediateDigits = longLinspace(ad, bd, base, numStrings, numDivisions);
  let finalDigits = intermediateDigits.map(
      v => v.res.concat(this.roundFraction(v.rem, v.den, base)));
  finalDigits.unshift(ad);
  finalDigits.push(bd);
  return chopSuccessiveDigits(finalDigits, placesToKeep)
      .slice(1, finalDigits.length - 1)
      .map(v => this.digitsToString(v));
};
// < export mudder.js

var iter = (char, len) => Array.from(
    Array(len), (_, i) => String.fromCharCode(char.charCodeAt(0) + i));

var base62 =
    new SymbolTable(iter('0', 10).concat(iter('A', 26)).concat(iter('a', 26)));

// Base36 should use lowercase since that’s what Number.toString outputs.
var base36arr = iter('0', 10).concat(iter('a', 26));
var base36keys = base36arr.concat(iter('A', 26));
function range(n) { return Array.from(Array(n), (_, i) => i); }
var base36vals = range(10)
                     .concat(range(26).map(i => i + 10))
                     .concat(range(26).map(i => i + 10));
function zip(a, b) {
  return Array.from(Array(a.length), (_, i) => [a[i], b[i]]);
}
var base36 = new SymbolTable(base36arr, new Map(zip(base36keys, base36vals)));

var alphabet = new SymbolTable(iter('a', 26),
                               new Map(zip(iter('a', 26).concat(iter('A', 26)),
                                           range(26).concat(range(26)))));

// < export mudder.js

module.exports = {SymbolTable, base62, base36, alphabet, longLinspace};
// < export mudder.js
