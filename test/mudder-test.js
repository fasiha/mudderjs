var tape = require("tape");
var mudder = require("../");

tape("Reasonable values", function(test) {
  const decimal = new mudder.SymbolTable('0123456789');
  const res = decimal.mudder('1', '2');
  test.equal(res[0], '15', "decimal");
  test.end();
});

tape("Reversing start/end reverses outputs: controlled cases", function(test) {
  const decimal = new mudder.SymbolTable('0123456789');
  for (let num of Array.from(Array(12), (_, i) => i + 1)) {
    const fwd = decimal.mudder('1', '2', num);
    const rev = decimal.mudder('2', '1', num);
    test.equal(rev.slice().reverse().join(''), fwd.join(''), "fwd = rev, " + num);
    test.ok(fwd.reduce((accum, curr, i, arr) => arr[i - 1] ? accum && (arr[i - 1] < curr) : true, true),
            'fwd all increasing');
    test.ok(rev.reduce((accum, curr, i, arr) => arr[i - 1] ? accum && (arr[i - 1] > curr) : true, true),
            'rev all decreasing');
  }
  test.end();
});

tape("Constructor with objects/maps", function(test) {
  var arr = '_,I,II,III,IV,V'.split(',');
  var obj = {_: 0, I: 1, i: 1, II: 2, ii: 2, III: 3, iii: 3, IV: 4, iv: 4, V: 5, v: 5};
  var map = new Map(Object.entries(obj));
  var romanObj = new mudder.SymbolTable(arr, obj);
  var romanMap = new mudder.SymbolTable(arr, map);
  test.equal(romanMap.mudder(['i'], ['ii'], 10).join(','), romanObj.mudder(['i'], ['ii'], 10).join(','));
  test.end();
})

tape("Matches parseInt/toString", function(test) {
  test.equal(mudder.base36.numberToString(123), (123).toString(36));
  test.equal(mudder.base36.stringToNumber('FE0F'), parseInt('FE0F', 36));
  test.end();
})

tape("Fixes #1: repeated recursive subdivision", function(test) {
  let right = 'z';
  for (let i = 0; i < 50; i++) {
    let newr = mudder.alphabet.mudder('a', right)[0];
    test.notEqual('a', newr);
    test.notEqual(right, newr);
    right = newr;
  }
  test.end();
});

tape('Fixes #2: throws when fed lexicographically-adjacent strings', function(test) {
  for (let i = 2; i < 10; i++) {
    test.throws(() => mudder.alphabet.mudder('x' +
                                                 'a'.repeat(i),
                                             'xa'));
    test.throws(() => mudder.alphabet.mudder('xa', 'x' +
                                                       'a'.repeat(i)));
  }
  test.end();
});

tape('Fixes #3: allow calling mudder with just number', function(test) {
  for (const abc of [mudder.alphabet.mudder(100), mudder.base36.mudder(100), mudder.base62.mudder(100)]) {
    test.ok(abc.every((c, i) => (!i) || (abc[i - 1] < c)));
  }
  test.ok(mudder.alphabet.mudder());
  test.end();
});

tape('More #3: no need to define start/end', function(test) {
  test.ok(mudder.base36.mudder('', 'foo', 30));
  test.ok(mudder.base36.mudder('foo', '', 30));
  test.end();
});

tape('Fix #7: specify number of divisions', t => {
  const decimal = new mudder.SymbolTable('0123456789');
  {
    const fine = decimal.mudder('9', undefined, 100);
    const partialFine = decimal.mudder('9', undefined, 5, undefined, 101);
    const coarse = decimal.mudder('9', undefined, 5);

    t.ok(allLessThan(fine));
    t.ok(allLessThan(partialFine));
    t.ok(allLessThan(coarse));
    t.deepEqual(fine.slice(0, 5), partialFine);
    t.equal(partialFine.length, coarse.length);
    t.notDeepEqual(partialFine, coarse);
  }
  // similarly working backwards
  {
    const fine = decimal.mudder('9', '8', 100);
    const partialFine = decimal.mudder('9', '8', 5, undefined, 101);
    const coarse = decimal.mudder('9', '8', 5);

    t.ok(allGreaterThan(fine));
    t.ok(allGreaterThan(partialFine));
    t.ok(allGreaterThan(coarse));

    // omit last because when going from high to low, the final might be rounded
    t.deepEqual(fine.slice(0, 4), partialFine.slice(0, 4));
  }
  t.end();
});

tape('Fix #8: better default end', t => {
  t.ok(mudder.base36.mudder('z'.repeat(10))[0] !== mudder.base36.mudder('z'.repeat(15))[0]);
  t.end();
});

function allLessThan(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) { return false; }
  }
  return true;
}
function allGreaterThan(arr) { return allLessThan(arr.slice().reverse()); }