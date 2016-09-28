var tape = require("tape");
var mudder = require("../");

tape("Fake test", function(test) {
  console.log(mudder.base62.mudder('cat','dog', null, 1));
  test.true(true, "yay!");
  test.end();
});
