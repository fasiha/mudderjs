var tape = require("tape");
var mudder = require("../");

tape("Fake test", function(test) {
  console.log(mudder.base62.mudder('cat','dog', null, 1));
  console.log(mudder.base62.mudder('002', 'yy', null, 5000).join('-'));
  test.true(true, "yay!");
  test.end();
});
