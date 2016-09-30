var tape = require("tape");
var mudder = require("../");

tape("Fake test", function(test) {
  console.log(mudder.base62.mudder('cat', 'dog', null, 1));
  console.log(mudder.base62.mudder('002', 'zzy', null, 5050).join('-'));
  const decimal = new mudder.SymbolTable('0123456789');
  const fwd = decimal.mudder('1', '2', null, 12);
  const rev = decimal.mudder('2', '1', null, 12);
  console.log(fwd);
  console.log(rev);
  test.true(rev.slice().reverse().join('') === fwd.join(''), "fwd = rev");
  test.end();
});
