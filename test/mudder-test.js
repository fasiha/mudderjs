var tape = require("tape");
var mudder = require("../");

tape("Reasonable values", function(test) {
  const decimal = new mudder.SymbolTable('0123456789');
  const res = decimal.mudder('1', '2');
  test.equal(res[0], '15', "decimal");
  test.end();
});

tape("Reversing start/end reverses outputs", function(test) {
  const decimal = new mudder.SymbolTable('0123456789');
  for (let num of [1, 12]) {
    const fwd = decimal.mudder('1', '2', 12);
    const rev = decimal.mudder('2', '1', 12);
    test.equal(rev.slice().reverse().join(''), fwd.join(''), "fwd = rev");
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
