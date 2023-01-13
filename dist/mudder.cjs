function isPrefixCode(strings) {
  for (const i of strings) {
    for (const j of strings) {
      if (j === i) {
        continue;
      }
      if (i.startsWith(j)) {
        return false;
      }
    }
  }
  return true;
}
function isPrefixCodeLogLinear(strings) {
  strings = Array.from(strings).sort();
  for (const [i, curr] of strings.entries()) {
    const prev = strings[i - 1];
    if (prev === curr) {
      continue;
    }
    if (curr.startsWith(prev)) {
      return false;
    }
    ;
  }
  return true;
}
isPrefixCode = isPrefixCodeLogLinear;
function SymbolTable(symbolsArr, symbolsMap) {
  "use strict";
  if (typeof this === "undefined") {
    throw new TypeError("constructor called as a function");
  }
  ;
  if (typeof symbolsArr === "string") {
    symbolsArr = symbolsArr.split("");
  } else if (!Array.isArray(symbolsArr)) {
    throw new TypeError("symbolsArr must be string or array");
  }
  if (typeof symbolsMap === "undefined") {
    symbolsMap = new Map(symbolsArr.map((str, idx) => [str, idx]));
  } else if (symbolsMap instanceof Object && !(symbolsMap instanceof Map)) {
    symbolsMap = new Map(Object.entries(symbolsMap));
  } else if (!(symbolsMap instanceof Map)) {
    throw new TypeError("symbolsMap can be omitted, a Map, or an Object");
  }
  let symbolsValuesSet = new Set(symbolsMap.values());
  for (let i = 0; i < symbolsArr.length; i++) {
    if (!symbolsValuesSet.has(i)) {
      throw new RangeError(symbolsArr.length + " symbols given but " + i + " not found in symbol table");
    }
  }
  this.num2sym = symbolsArr;
  this.sym2num = symbolsMap;
  this.maxBase = this.num2sym.length;
  this.isPrefixCode = isPrefixCode(symbolsArr);
}
SymbolTable.prototype.numberToDigits = function(num, base) {
  base = base || this.maxBase;
  let digits = [];
  while (num >= 1) {
    digits.push(num % base);
    num = Math.floor(num / base);
  }
  return digits.length ? digits.reverse() : [0];
};
SymbolTable.prototype.digitsToString = function(digits) {
  return digits.map((n) => this.num2sym[n]).join("");
};
SymbolTable.prototype.stringToDigits = function(string) {
  if (!this.isPrefixCode && typeof string === "string") {
    throw new TypeError(
      "parsing string without prefix code is unsupported. Pass in array of stringy symbols?"
    );
  }
  if (typeof string === "string") {
    const re = new RegExp("(" + Array.from(this.sym2num.keys()).join("|") + ")", "g");
    string = string.match(re);
  }
  return string.map((symbol) => this.sym2num.get(symbol));
};
SymbolTable.prototype.digitsToNumber = function(digits, base) {
  base = base || this.maxBase;
  let currBase = 1;
  return digits.reduceRight((accum, curr) => {
    let ret = accum + curr * currBase;
    currBase *= base;
    return ret;
  }, 0);
};
SymbolTable.prototype.numberToString = function(num, base) {
  return this.digitsToString(this.numberToDigits(num, base));
};
SymbolTable.prototype.stringToNumber = function(num, base) {
  return this.digitsToNumber(this.stringToDigits(num), base);
};
function longDiv(numeratorArr, den, base) {
  return numeratorArr.reduce((prev, curr) => {
    let newNum = curr + prev.rem * base;
    return {
      res: prev.res.concat(Math.floor(newNum / den)),
      rem: newNum % den,
      den
    };
  }, { res: [], rem: 0, den });
}
function longSubSameLen(a, b, base, rem = [], den = 0) {
  if (a.length !== b.length) {
    throw new Error("same length arrays needed");
  }
  if (rem.length !== 0 && rem.length !== 2) {
    throw new Error("zero or two remainders expected");
  }
  a = a.slice();
  if (rem.length) {
    a = a.concat(rem[0]);
    b = b.slice().concat(rem[1]);
  }
  const ret = Array(a.length).fill(0);
  OUTER:
    for (let i = a.length - 1; i >= 0; --i) {
      if (a[i] >= b[i]) {
        ret[i] = a[i] - b[i];
        continue;
      }
      if (i === 0) {
        throw new Error("cannot go negative");
      }
      for (let j = i - 1; j >= 0; --j) {
        if (a[j] > 0) {
          a[j]--;
          for (let k = j + 1; k < i; ++k) {
            a[k] += base - 1;
          }
          ret[i] = a[i] + (rem.length > 0 && i === a.length - 1 ? den : base) - b[i];
          continue OUTER;
        }
      }
      throw new Error("failed to find digit to borrow from");
    }
  if (rem.length) {
    return { res: ret.slice(0, -1), rem: ret[ret.length - 1], den };
  }
  return { res: ret, rem: 0, den };
}
function longAddSameLen(a, b, base, rem, den) {
  if (a.length !== b.length) {
    throw new Error("same length arrays needed");
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
  return { res, carry, rem, den };
}
;
function rightpad(arr, finalLength, val) {
  const padlen = Math.max(0, finalLength - arr.length);
  return arr.concat(Array(padlen).fill(val || 0));
}
function longLinspace(a, b, base, N, M) {
  if (a.length < b.length) {
    a = rightpad(a, b.length);
  } else if (b.length < a.length) {
    b = rightpad(b, a.length);
  }
  if (a.length === b.length && a.every((a2, i) => a2 === b[i])) {
    throw new Error("Start and end strings lexicographically inseparable");
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
  const result = strings.slice(1).reduce(
    (accum, curr) => accum.concat(
      [chopDigits(accum[accum.length - 1], curr, placesToKeep)]
    ),
    [strings[0]]
  );
  if (reversed) {
    result.reverse();
  }
  return result;
}
function truncateLexHigher(lo, hi) {
  const swapped = lo > hi;
  if (swapped) {
    [lo, hi] = [hi, lo];
  }
  if (swapped) {
    return [hi, lo];
  }
  return [lo, hi];
}
SymbolTable.prototype.mudder = function(a, b, numStrings, base, numDivisions, placesToKeep = 0) {
  if (typeof a === "number") {
    numStrings = a;
    a = "";
    b = "";
  }
  a = a || this.num2sym[0];
  b = b || this.num2sym[this.num2sym.length - 1].repeat(a.length + 6);
  numStrings = typeof numStrings === "number" ? numStrings : 1;
  base = base || this.maxBase;
  numDivisions = numDivisions || numStrings + 1;
  [a, b] = truncateLexHigher(a, b);
  const ad = this.stringToDigits(a, base);
  const bd = this.stringToDigits(b, base);
  const intermediateDigits = longLinspace(ad, bd, base, numStrings, numDivisions);
  let finalDigits = intermediateDigits.map(
    (v) => v.res.concat(this.roundFraction(v.rem, v.den, base))
  );
  finalDigits.unshift(ad);
  finalDigits.push(bd);
  return chopSuccessiveDigits(finalDigits, placesToKeep).slice(1, finalDigits.length - 1).map((v) => this.digitsToString(v));
};
var iter = (char, len) => Array.from(
  Array(len),
  (_, i) => String.fromCharCode(char.charCodeAt(0) + i)
);
var base62 = new SymbolTable(iter("0", 10).concat(iter("A", 26)).concat(iter("a", 26)));
var base36arr = iter("0", 10).concat(iter("a", 26));
var base36keys = base36arr.concat(iter("A", 26));
function range(n) {
  return Array.from(Array(n), (_, i) => i);
}
var base36vals = range(10).concat(range(26).map((i) => i + 10)).concat(range(26).map((i) => i + 10));
function zip(a, b) {
  return Array.from(Array(a.length), (_, i) => [a[i], b[i]]);
}
var base36 = new SymbolTable(base36arr, new Map(zip(base36keys, base36vals)));
var alphabet = new SymbolTable(
  iter("a", 26),
  new Map(zip(
    iter("a", 26).concat(iter("A", 26)),
    range(26).concat(range(26))
  ))
);
module.exports = { SymbolTable, base62, base36, alphabet, longLinspace };
