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
    test.equal(rev.slice().reverse().join(''), fwd.join(''),
               "fwd = rev, " + num);
    test.ok(fwd.reduce((accum, curr, i, arr) =>
                         arr[i - 1] ? accum && (arr[i - 1] < curr) : true,
                       true),
            'fwd all increasing');
    test.ok(rev.reduce((accum, curr, i, arr) =>
                         arr[i - 1] ? accum && (arr[i - 1] > curr) : true,
                       true),
            'rev all decreasing');
  }
  test.end();
});

tape("Constructor with objects/maps", function(test) {
  var arr = '_,I,II,III,IV,V'.split(',');
  var obj = {
    _ : 0,
    I : 1,
    i : 1,
    II : 2,
    ii : 2,
    III : 3,
    iii : 3,
    IV : 4,
    iv : 4,
    V : 5,
    v : 5
  };
  var map = new Map(Object.entries(obj));
  var romanObj = new mudder.SymbolTable(arr, obj);
  var romanMap = new mudder.SymbolTable(arr, map);
  test.equal(romanMap.mudder([ 'i' ], [ 'ii' ], 10).join(','),
             romanObj.mudder([ 'i' ], [ 'ii' ], 10).join(','));
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
})