"use strict";
var fs = require('fs');
var file = fs.readFileSync('README.md', 'utf8');
var exportStrings =
  file.match(/~~~js\n([\S\s]*?)~~~/g)
    .filter(s => s.indexOf('< export') >= 0)
    .map(s => s.replace(/~~~$/, '').replace(/^~~~[a-z]*\s/, ''));
fs.writeFileSync('out.js', exportStrings.join('\n'));

var m = require('./out')
console.log(m.base62.mudder('cat', 'doggie'))
