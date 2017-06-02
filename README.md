# Mudder.js

Generate lexicographically-spaced strings between two strings from pre-defined alphabets.

## Quickstart

**Node.js** `yarn add mudder-js` (or `npm install --save mudder-js`), then `var mudder = require('mudder-js')`.

**Browser** Download [`mudder.min.js`](dist/mudder.min.js), then include it in your HTML: `<script src="mudder.min.js"></script>`. This loads the `mudder` object into the browser’s global namespace.

**Example usage** Create a new symbol table with the list of characters you want to use. In this example, we consider lowercase hexadecimal strings:
```js
var mudder = require('mudder-js'); // only in Node
var hex = new mudder.SymbolTable('0123456789abcdef');
var hexstrings = hex.mudder('ffff', 'fe0f', 3);
console.log(hexstrings);
// [ 'ff8', 'ff07', 'fe' ]
```
The three strings are guaranteed to be the shortest and as-close-to-evenly-spaced between the two original strings (`ffff` and `fe0f`, in this case) as possible.

As a convenience, the following pre-generated symbol table are provided:
- `base62`: `0-9A-Za-z`,
- `base36`: `0-9a-z` (lower- and upper-case accepted, to match `Number.toString`),
- `alphabet`: `a-z` (lower- and upper-case accepted).

```js
var mudder = require('mudder-js'); // only in Node
var strings = mudder.base62.mudder('alphaNUM341C', 'beta', 3);
console.log(strings);
// [ 'az', 'b', 'bR' ]
```

## API

### Constructor

`var m = new mudder.SymbolTable(string)` creates a new symbol table using the individual characters of `string`.

`var m = new mudder.SymbolTable(symbolsArr)` uses the stringy elements of `symbolsArr` as allowed symbols. This way you can get fancy, i.e., Roman numerals, Emoji, Chinese phrases, etc.

`var m = new mudder.SymbolTable(symbolsArr, symbolsMap)` allows the most flexibility in creating symbol tables. The stringy elements of `symbolsArr` are again the allowed symbols, while `symbolsMap` is a JavaScript object or [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), whose keys must include all the strings in `symbolsArr` while the corresponding values must be JavaScript numbers, running from 0 up without skips. `symbolsMap` can contain keys *not* found in `symbolsArr`: this allows you to let multiple strings represent the same value, i.e., lower- and upper-case hexadecimal values. Mudder.js *outputs* will contain only the strings found in `symbolsArr` but it can *consume* strings containing anything found among the keys of `symbolsMap`.

There are very few restrictions on what symbols the `SymbolTable` constructor accepts. The symbols are permitted to be non-[prefix-free](https://en.wikipedia.org/wiki/Prefix_code). In fact the library won’t object if you have repeated symbols in the table, though this makes very little sense. But in either of these cases, the `mudder` function (below) can only be invoked with arrays, not strings—i.e., you’ve parsed strings into symbols somehow yourself.

### Generate strings

`m.mudder(start, end[, number[, base]])` for strings, or array-of-strings, `start` and `end`, returns a `number`-length (default one) array of strings. `base` is an integer defaulting to the size of the symbol table `m`, but can be less than it if you, for some reason, wish to use only a subset of the symbol table. `start` can be lexicographically less than or greater than `end`, but in either case, the returned array will be lexicographically sorted between them. If the symbol table was *not* prefix-free, the function will refuse to operate on *strings* `start`/`end` because, without the prefix-free criterion, a string can’t be parsed unambiguously: you have to split the string into an array of stringy symbols yourself. Invalid or unrecognized symbols are silently ignored.

### For fun: string–number conversion

`m.stringToNumber(string[, base])` returns the number encoded by `string` in our everyday base-10 number system using all or the first `base` symbols of the symbol table `m`.

`m.numberToString(int[, base])` returns the string representing a positive integer `int` in the number system defined by the symbol table. By default, all symbols are used but fewer can be specified with `base`.

## Hacking this library

This library is written as a literate document: in this `README.md`, prose explanations and code explanations surround the few bits of source code that actually make up the library. Fenced code blocks that contain the string `< export FOO` are appended to the file `FOO`.

The Markdown “literate source” `README.md` is “tangled” into actual source code by [`tangle.js`](tangle.js) and can be invoked by `yarn prebuild` (or `npm run prebuild`). This results in a [`index.js`](index.js). Google Closure Compiler (the JavaScript port) is used to optimize, minify, and transpile this to `dist/mudder.min.js` and can be invoked by `yarn build` (or `npm run build`).

## Literate source

**Requirement** A function that, given two strings, returns one or more strings lexicographically between them (see [Java’s `compareTo` docs](http://docs.oracle.com/javase/8/docs/api/java/lang/String.html#compareTo-java.lang.String-) for a cogent summary of lexicographical ordering).

That is, if `c = lexmid(a, b, 1)` a string, then `a ≶ c ≶ b`.

Similarly, if `cs = lexmid(a, b, N)` is an `N>1`-element array of strings, `a ≶ cs[0] ≶ cs[1]  ≶ … ≶ cs[N-1] ≶ b`.

**Use Case** Reliably ordering (or ranking) entries in a database. Such entries may be reordered (shuffled). New entries might be inserted between existing ones.

[My StackOverflow question](http://stackoverflow.com/q/39125091/500207) links to six other questions about this topic, all lacking convincing solutions. Some try to encode order using floating-point numbers, but a pair of numbers can only be subdivided so many times before losing precision. One “fix” to this is to renormalize all entries’ spacings periodically, but some NoSQL databases lack atomic operations and cannot modify multiple entries in one go. Such databases would have to stop accepting new writes, update each entry with a normalized rank number, then resume accepting writes.

Since many databases are happy to sort entries using stringy fields, let’s just use strings instead of numbers. This library aids in the creation of new strings that lexicographically sort between two other strings.

**Desiderata** I’d like to be able to insert thousands of documents between adjacent ones, so `lexmid()` must never return strings which can’t be “subdivided” further. But memory isn’t free, so shorter strings are preferred.

**Prior art** [@m69’s algorithm](http://stackoverflow.com/a/38927158/500207) is perfect: you give it two alphabetic strings containing just `a-z`, and you get back a short alphabetic string that’s “roughly half-way” between them.

I asked how to get `N` evenly-spaced strings ex nihilo, i.e., not between any two strings. [@m69’s clever suggestion](http://stackoverflow.com/questions/38923376/return-a-new-string-that-sorts-between-two-given-strings/38927158#comment65638725_38927158) was, for strings allowed to use `B` distinct characters, and `B^(m-1) < N < B^m`, evenly distribute `N` integers from 2 to `B^m - 2` (or some suitable start and end), and write them as radix-`B`.

This works! Here’s a quick example, generating 25 hexadcimal (`B=16`) strings:
~~~js
var N = 25; // How many strings to generate. Governs how long the strings are.
var B = 16; // Radix, or how many characters to use, < N

// Left and right margins
var start = 2;
var places = Math.ceil(Math.log(N) / Math.log(B)); // max length for N strings
var end = Math.pow(B, places) - 2;

// N integers between `start` and `end`
var ns = Array.from(Array(N), (_, i) => start + Math.round(i / N * end));

// JavaScript's toString can't pad numbers to a fixed length, so:
var leftpad = (str, desiredLen, padChar) =>
    padChar.repeat(desiredLen - str.length) + str;

var strings = ns.map(n => leftpad(n.toString(B), places, '0'));
console.log(strings);
// > [ '02',
// >  '0c',
// >  '16',
// >  '20',
// >  '2b',
// >  '35',
// >  '3f',
// >  '49',
// >  '53',
// >  '5d',
// >  '68',
// >  '72',
// >  '7c',
// >  '86',
// >  '90',
// >  '9a',
// >  'a5',
// >  'af',
// >  'b9',
// >  'c3',
// >  'cd',
// >  'd7',
// >  'e2',
// >  'ec',
// >  'f6' ]
~~~

This uses JavaScript’s `Number.prototype.toString` which works for bases up to `B=36`, but no more. A desire to use more than thirty-six characters led to [a discussion about representing integers in base-62](http://stackoverflow.com/a/2557508/500207), where @DanielVassallo showed a custom `toString`.

Meanwhile, [numbase](https://www.npmjs.com/package/numbase) supports arbitrary-radix interconversion, and, how delightful, lets you specify the universe of characters to use:
```js
// From https://www.npmjs.com/package/numbase#examples // no-hydrogen
// Setup an instance with custom base string
base = new NumBase('中国上海市徐汇区');
// Encode an integer, use default radix 8
base.encode(19901230); // returns '国国海区上徐市徐汇'
// Decode a string, with default radix 8
base.decode('国国海区上徐市徐汇'); // returns '19901230'
```

Finally, [@Eclipse’s observation](http://stackoverflow.com/a/2510928/500207) really elucidated the connection between strings and numbers, and explaining the mathematical vein that @m69’s algorithm was ad hocly tapping. @Eclipse suggested converting a string to a number and then *treating the result as a fraction between 0 and 1*. That is, just place a radix-point before the first digit (in the given base) and perform arithmetic on it. (In this document, I use “radix” and “base” interchangeably.)

**Innovations** Mudder.js (this dependency-free JavaScript/ES2015 library) is a generalization of @m69’s algorithm. It operates on strings containing *arbitrary substrings* instead of just lowercase `a-z` characters: your strings can contain, e.g., 日本語 characters or 🔥 emoji. (Like @m69’s algorithm, you do have to specify upfront the universe of stringy symbols to operate on.)

You can ask Mudder.js for `N ≥ 1` strings that sort between two input strings. These strings will be as short as possible.

These are possible because Mudder.js converts strings to non-decimal-radix (non-base-10), arbitrary-precision fractional numbers between 0 and 1. Having obtained numeric representations of strings, it’s straightforward to compute their average, or midpoint, `(a + b) / 2`, or even `N` intermediate points `a + (b - a) / N * i` for `i` going from 1 to `N - 1`, using the long addition and long division you learned in primary school. (By avoiding native floating-point, Mudder.js can handle arbitrarily-long strings, and generalizes @Eclipse’s suggestion.)

Because `numbase` made it look so fun, as a bonus, Mudder.js can convert regular JavaScript integers to strings. You may specify a multi-character string for each digit. Therefore, should the gastronome in you invent a ternary (radix-3) numerical system based on today’s meals, with 0=🍌🍳☕️, 1=🍱, and 2=🍣🍮, Mudder.js can help you rewrite (42)<sub>10</sub>, that is, 42 in our everyday base 10, as (🍱🍱🍣🍮🍌🍳☕️)<sub>breakfast, lunch, and dinner</sub>.

**This document** This document is a Markdown file that I edit in Atom. It contains code blocks that I can run in Node.js via Hydrogen, an Atom plugin that talks to Node over the Jupyter protocol (formerly IPython Notebook). I don’t have a terminal window open: all development, including scratch work and test snippets, happens in this Markdown file and goes through Hydrogen.

This workflow allows this document to be a heavily-edited diary of writing the library. You, the reader, can see not just the final code but also the experimentation, design choices and decisions and alternatives, opportunities for improvement, references, and asides.

The result of evaluating all code blocks is included at the bottom of each code block (using custom Atom [plugins](https://github.com/fasiha/atom-papyrus-sedge)).

Furthermore, all source code files and configuration files included in this repository are derived from code blocks in *this* Markdown file. This is done by another plugin that goes through this document and pipes code blocks to external files.

In this way, this document is a primitive (or futuristic?) riff on literate programming, the approach discovered and celebrated by Donald Knuth.

Besides reading this document passively on GitHub or npmjs.org, you will eventually be able to read it as an interactive, live-coding webapp, where each code block is editable and executable in your browser. This in turn makes it a riff on [Alan Kay’s vision](http://blog.klipse.tech/javascript/2016/06/20/blog-javascript.html) for interactive programming environments for *readers* as well as writers.

## Plan
Since we must convert strings to arbitrary-radix digits, and back again, this library includes enhanced versions of

- [`Number.prototype.toString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString) which converts JavaScript integers to strings for bases between base-2 (binary) and base-36 (alphanumeric),
- [`parseInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt) which inverts this operation by converting a string of digits in some base between 2 and 36 to a JavaScript number.

Specifically, we need versions of these functions that operate on bases >36, and that let the user specify the strings used to denote each digit in the arbitrary-radix numerical system. (Recall that I use “base” and “radix” interchangeably.)

We will create these library functions in the next section.

Once we can represent arbitrary strings as equivalent numbers, we will describe the very specific positional number system that lets us find lexicographic mid-points easily. This positional system involves mapping a given string’s numeric representation to a rational number between 0 and 1, and in this system, the lexicographic midpoint between two strings is the simple mean (average) between their two numbers.

This sounds fancy, but again, it’s quite pedestrian. We’ll implement long addition and long division (the two steps required to calculate the mean of two numbers) in a subsequent section.

Finally, with these preliminaries out of the way, we’ll implement the functions to help us paper over all this machinery and that just give us strings lexicographically between two other strings.

## Symbol tables, numbers, and digits
Let us remind ourselves what `toString` and `parseInt` do:
~~~js
console.log([ (200).toString(2), parseInt('11001000', 2) ])
console.log([ (200).toString(36), parseInt('5K', 36) ])
// > [ '11001000', 200 ]
// > [ '5k', 200 ]
// > undefined
~~~
(200)<sub>10</sub> = (1100 1000)<sub>2</sub> = (5K)<sub>36</sub>. One underlying number, many different representations. Each of these is a positional number system with a different base: base-10 is our everyday decimal system, base-2 is the binary system our computers operate on, and base-36 is an uncommon but valid alphanumeric system.

Recall from grade school that this way of writing numbers, as (digit 1, digit 2, digit 3)<sub>base</sub>, means each digit is a multiple of `Math.pow(B, i)` where `i=0` for the right-most digit (in the ones place), and going up for each digit to its left.
~~~js
var dec = 2 * 100 + // 100 = Math.pow(10, 2)
          0 * 10 +  // 10 = Math.pow(10, 1)
          0 * 1;    // 1 = Math.pow(10, 0)

var bin = 1 * 128 + // 128 = Math.pow(2, 7)
          1 * 64 +  // 64 = Math.pow(2, 6)
          0 * 32 +  // 32 = Math.pow(2, 5)
          0 * 16 +  // 16 = Math.pow(2, 4)
          1 * 8 +   // 8 = Math.pow(2, 3)
          0 * 4 +   // 4 = Math.pow(2, 2)
          0 * 2 +   // 2 = Math.pow(2, 1)
          0 * 1;    // 1 = Math.pow(2, 0)

var aln = 5 * 36 + // 36 = Math.pow(36, 1)
          20 * 1;  // 1 = Math.pow(36, 0)

console.log(dec === bin && dec === aln ? 'All same!' : 'all NOT same?');
// > All same!
~~~
That last example and its use of `K` as a digit might seem strange, but for bases >10, people just use letters instead of numbers. `A=10`, `F=15`, `K=20`, and `Z=36` using this convention.

Both these functions operate on what we’ll call a *symbol table*: a mapping between stringy symbols and the numbers from 0 to one less than the maximum base. Here’s the symbol table underlying `parseInt` and `Number.prototype.toString`, with stringy symbols on the left and numbers on the right:

- `0` ⇔ 0
- `1` ⇔ 1
- `2` ⇔ 2
- ⋮
- `8` ⇔ 8
- `9` ⇔ 9
- `a` ⇔ 10
- `A` ⇒ 10
- ⋮
- `z` ⇔ 35
- `Z` ⇒ 35

(Aside: `parseInt` accepts uppercase letters, treating them as lowercase. `Number.prototype.toString` outputs only lowercase letters. Therefore, uppercase letters above have a right-arrow, instead of bidirectional.)

For both the broader problem of lexicographically interior strings, as well as the sub-problem of converting between numbers and strings, we want to specify our own symbol tables. Here are a few ways we’d like to handle, in order of increasing complexity and flexibility:

1. **a string** Great for those simple use-cases: the string is `split` into individual characters, and each character is the symbol for its index number. Such a symbol table can handle bases as high as the number of characters in the input string. Example: `new SymbolTable('abcd')`.
1. **an array of strings** To specify multi-character symbols such as emoji (which `String.split` will butcher), or whole words. Quaternary (radix-4) Roman-numeral example: `new SymbolTable('_,I,II,III'.split(','))`.
1. **an array of strings, _plus_ a map of stringy symbols to numbers** This would let us specify fully-generic symbol tables like `parseInt`’s, where both `'F'` and `'f'` correspond to 15. The array uniquely sends numbers to strings, and the map sends ≥1 strings to numbers. The quaternary Roman-numeral example capable of ingesting lower-case letters:
~~~js
new SymbolTable('_,I,II,III'.split(','), new Map([
                  [ '_', 0 ],                // zero
                  [ 'I', 1 ], [ 'i', 1 ],    // 1, lower AND upper case!
                  [ 'II', 2 ], [ 'ii', 2 ],  // 2
                  [ 'III', 3 ], [ 'iii', 3 ] // 3
                ]));
// no-hydrogen
~~~

Let’s resist the temptation to be avant-garde: let’s agree that, to be valid, a symbol table must include symbols for *all* numbers between 0 and some maximum, with none skipped. `B` (for “base”) unique numbers lets the symbol table define number systems between radix-2 (binary) up to radix-`B`. JavaScript’s implicit symbol table handles `B≤36`, but as the examples above show, we don’t have to be restricted to base-36.

(Aside: radix-36 doesn’t seem to have a fancy name like the ancient Sumerians’ radix-60 “sexagesimal” system so I call it “alphanumeric”.)

(Aside²: While Sumerian and Babylonian scribes no doubt had astounding skills, they didn’t keep track of *sixty* unique symbols. Not even *fifty-nine*, since they lacked zero. Just two: “Y” for one and “&lt;” for ten. So 𒐘 was four and 𒐏 forty, so forty-four might be Unicodized as 𒐏𒐘?)

We will indulge the postmodern in one way: we’ll allow symbol tables that are no lexicographically-sorted. That is, the number systems we define are allowed to flout the conventions of lexicographical ordering, in which case interior strings produced by Mudder.js won’t sort. I can’t think of a case where this would be actually useful, instead of just playful, so if you think this should be banned, get in touch, but for now, caveat emptor.

### Some prefix problems

The discussion of the Roman numeral system reminds me of a subtle but important point. If `i`, `ii`, and `iii` are all valid symbols, how on earth can we tell if  (iii)<sub>Roman quaternary</sub> is

- (3)<sub>4</sub> = (3)<sub>10</sub>,
- (12)<sub>4</sub> = (6)<sub>10</sub>,
- (21)<sub>4</sub> = (9)<sub>10</sub>, or
- (111)<sub>4</sub> = (21)<sub>10</sub>?

We can’t. We cannot parse strings like `iii`, not without punctuation like spaces which splits a string into an array individual symbols.

At this stage one might recall reading about Huffman coding, or Dr El Gamal’s lecture on [prefix codes](https://en.wikipedia.org/wiki/Prefix_code) in information theory class. In a nutshell, a set of strings has the prefix property, or is prefix-free, if no string starts with another string—if no set member is *prefixed* by another set member.

I’ve decided to allow Mudder.js to parse raw strings only if the symbol table is prefix-free. If it is *not* prefix-free, then Mudder.js’s version of `parseInt` will throw an exception if fed a string—you must pass it an array, having resolved the ambiguity yourself, using punctuation perhaps.

#### Code to detect the prefix property
So, let’s write a dumb way to decide if a set or array of stringy symbols constitutes a prefix code. If any symbol is a prefix of another symbol (other than itself of course), the symbol table **isn’t** prefix-free, and we don’t have a prefix code.
~~~js
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
~~~
As with most mundane-seeming things, there’s some subtlety here. Do you see how, at `[🍅]` above, we skip comparing the same strings?—that part’s not tricky, that’s absolutely needed. But because of this, if the input set contains *repeats*, this function will implicitly treat those repeats as the *same* symbol.
~~~js
console.log(isPrefixCode('a,b,b,b,b,b'.split(',')) ? 'is prefix code!'
                                                   : 'NOT PREFIX CODE 😷');
// > is prefix code!
~~~
One alternative might be to throw an exception upon detecting repeat symbols. Or: instead of comparing the strings themselves at `[🍅]`, compare indexes—this will declare sets with repeats as non-prefix-free, but that would imply that there was some sense in treating `'b'` and `'b'` as different numbers.

So the design decision here is that `isPrefixFree` ignores repeated symbols in its calculation, and assumes repeats are somehow dealt with downstream. Please write if this is the wrong decision.

Making sure it works:
~~~js
console.log(isPrefixCode('a,b,c'.split(',')));
console.log(isPrefixCode('a,b,bc'.split(',')));
// > true
// > false
~~~

#### A faster `isPrefixCode`

But wait! This nested-loop has quadratic runtime, with `N*N` string equality checks and nearly `N*N` `startsWith()`s, for an `N`-element input. Can’t this be recast as an `N*log(N)` operation, by first *sorting* the stringy symbols lexicographically (`N*log(N)` runtime), and then looping through once to check `startsWith`? Try this:
~~~js
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
~~~
It was a bit of wild intuition to try this, but it has been confirmed to work: proof by internet, courtesy of [@KWillets on Computer Science StackExchange](http://cs.stackexchange.com/a/63313/8216).

To see why this works, recall that in [lexicographical ordering](http://docs.oracle.com/javase/8/docs/api/java/lang/String.html#compareTo-java.lang.String-), `'abc' < 'abc+anything else'`. The only way for a string to sort between a string `s` and `s + anotherString` is to be prefixed by `s` itself. This guarantees that prefixes sort adjacent to prefixeds.

(Aside: note that we’re use a lexicographical sort here just to find prefixes—our underlying symbol tables are allowed to be postmodern and lexicographically shuffled.)

But is it faster? Let’s test it on a big set of random numbers, which should be prefix-free so neither algorithm bails early:
~~~js
test = Array.from(Array(1000), () => '' + Math.random());
console.time('quad');
isPrefixCode(test);
console.timeEnd('quad');

console.time('log');
isPrefixCodeLogLinear(test);
console.timeEnd('log');
// > quad: 103.818ms
// > log: 1.758ms
~~~
Yes indeed, the log-linear approach using a sort is maybe ~100× faster than the quadratic approach using a double-loop. So let’s use the faster one:
~~~js
isPrefixCode = isPrefixCodeLogLinear;
// < export mudder.js
~~~

### Symbol table object constructor
With this out of the way, let’s write our `SymbolTable` object. Recall from the examples above that it should take

- a string or an array, which uniquely maps integers to strings—since an array element can contain only a single string!—and
- optionally a map (literally a `Map`, or an object) from strings to numbers (many-to-one acceptable).

If a string→number map is provided in addition to a `B`-length array, this map ought to be checked to ensure that its values include `B` numbers from 0 to `B - 1`.

The symbol table should also remember if it’s prefix-free. If it is, parsing strings to numbers is doable. If not, strings must be split into an array of sub-strings first (using out-of-band, non-numeric punctuation, perhaps).

Without further ado:
~~~js
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
~~~

A programmatic note: around `[⛈]` we’re making sure that forgetting `new` when calling `SymbolTable` will throw an exception. It’s a simple solution to the [JavaScript constructor problem](http://raganwald.com/2014/07/09/javascript-constructor-problem.html#solution-kill-it-with-fire)

Let’s make sure the constructor at least works:
~~~js
var binary = new SymbolTable('01');
var meals = new SymbolTable('🍌🍳☕️,🍱,🍣🍮'.split(','));
var romanQuat =
    new SymbolTable('_,I,II,III'.split(','),
                    {_ : 0, I : 1, i : 1, II : 2, ii : 2, III : 3, iii : 3});
console.log('Binary', binary);
console.log('Meals', meals);
console.log('Roman quaternary', romanQuat);
// > Binary SymbolTable {
// >  num2sym: [ '0', '1' ],
// >  sym2num: Map { '0' => 0, '1' => 1 },
// >  maxBase: 2,
// >  isPrefixCode: true }
// > Meals SymbolTable {
// >  num2sym: [ '🍌🍳☕️', '🍱', '🍣🍮' ],
// >  sym2num: Map { '🍌🍳☕️' => 0, '🍱' => 1, '🍣🍮' => 2 },
// >  maxBase: 3,
// >  isPrefixCode: true }
// > Roman quaternary SymbolTable {
// >  num2sym: [ '_', 'I', 'II', 'III' ],
// >  sym2num:
// >   Map {
// >     '_' => 0,
// >     'I' => 1,
// >     'i' => 1,
// >     'II' => 2,
// >     'ii' => 2,
// >     'III' => 3,
// >     'iii' => 3 },
// >  maxBase: 4,
// >  isPrefixCode: false }
~~~
A quick note: the quaternary Roman-numeral symbol table is indeed marked as a non-prefix-code.

### Conversion functions: numbers ↔︎ digits ↔︎ strings
We need four converters, two for numbers ↔︎ digits and two more for digits ↔︎ strings. (By numbers, I always mean positive integers in this document.) Let’s write those functions, and it should become clear what role “digits” play in this whole story.

Recall how, when we write “123”, we mean “1 * 100 + 2 * 10 + 3 * 1”. This is how positional number systems work.

To get this breakdown for any given number in base `B`, we repeatedly divide the integer by `B` and peel off the remainder each time to be a digit, giving you its digits from left to right. Here’s the idea in code:
~~~js
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
~~~
There’s a bit of incidental complexity here. In current JavaScript engines, [`push`ing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push) scalars to the end of an array is usually much faster than [`unshift`ing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift) scalars to its beginning. In my case:
~~~js
var v1 = [], v2 = [];
console.time('push');
for (let i = 0; i < 1e5; i++) {
  v1.push(i % 7907);
}
console.timeEnd('push');

console.time('unshift');
for (let i = 0; i < 1e5; i++) {
  v2.unshift(i % 7907);
}
console.timeEnd('unshift');
// > push: 5.277ms
// > unshift: 3051.876ms
~~~
So `SymbolTable.prototype.numberToDigits` calculates the left-most digit first and moves right, but `push`ing them onto the array leaves it reversed. So it reverses its final answer. It also has a special case that checks for 0.

Let’s make sure it works:
~~~js
var decimal = new SymbolTable('0123456789');
console.log(decimal.numberToDigits(123));
console.log(decimal.numberToDigits(0));
// > [ 1, 2, 3 ]
// > [ 0 ]
~~~
Let’s also make sure we don’t have any decimal/base-10 chauvinism:
~~~js
console.log(decimal.numberToDigits(123, 2), (123).toString(2));

var hex = new SymbolTable('0123456789abcdef');
console.log(hex.numberToDigits(123), (123).toString(16));
// > [ 1, 1, 1, 1, 0, 1, 1 ] '1111011'
// > [ 7, 11 ] '7b'
~~~
Note that each digit has to be `< B`, due to the modulo operation.

This makes me want to implement digits→string to get `Number.prototype.toString`-like functionality:
~~~js
SymbolTable.prototype.digitsToString = function(digits) {
  return digits.map(n => this.num2sym[n]).join('');
};
// < export mudder.js
~~~
This function doesn’t is independent of what base to operate on. It’s just blindly replacing numbers with strings using the one-to-one `SymbolTable.num2sym` array.

Confirming it works by going from number→digits→string:
~~~js
console.log(decimal.digitsToString(decimal.numberToDigits(123)));
console.log(hex.digitsToString(hex.numberToDigits(123)));
// > 123
// > 7b
~~~

Let’s just work backwards from strings to digits. We’ll build a big regular expressions to peel off each symbol if the symbol table is prefix-free. If it’s not, the “string” must actually be an array.
~~~js
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
~~~
Again, this operation is independent of the base. It’s just a table lookup, and involves no arithmetic.
~~~js
console.log(decimal.stringToDigits('123'));
console.log(decimal.stringToDigits('123'.split('')));
// > [ 1, 2, 3 ]
// > [ 1, 2, 3 ]
~~~

Finally, we achieve `parseInt`-parity with the digits→number converter. Each element in the digits array is multiplied by a power of base `B` and summed. In code:
~~~js
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
~~~
A programmatic note: I used `Array.prototype.reduceRight` to loop from the *end* of `digits` to the beginning and avoid manual management of the index-to-power relationship. Also, this let me replace an expensive `Math.pow` call each iteration with a cheap multiply.

Let’s test it, both with 123 = 0x7B (hexadecimal base-16 numbers are commonly prefixed by `0x`):
~~~js
console.log(decimal.digitsToNumber([1, 2, 3]), hex.digitsToNumber([7, 11]));
// > 123 123
~~~
We can trivially write non-stop number↔︎string functions:
~~~js
SymbolTable.prototype.numberToString = function(num, base) {
  return this.digitsToString(this.numberToDigits(num, base));
};
SymbolTable.prototype.stringToNumber = function(num, base) {
  return this.digitsToNumber(this.stringToDigits(num), base);
};
// < export mudder.js
~~~
With these, `SymbolTable` is `parseInt` and `Number.prototype.toString` super-charged.

Now for some silly fun.
~~~js
var oda = new SymbolTable('天下布武');
var meals = new SymbolTable('🍌🍳☕️,🍱,🍣🍮'.split(','));
var base62 = new SymbolTable(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
var kangxi = `一丨丶丿乙亅二亠人儿入八冂冖冫几凵刀力勹匕匚匸十卜卩厂厶又口囗土士
              夂夊夕大女子宀寸小尢尸屮山川工己巾干幺广廴廾弋弓彐彡彳心戈戶手支攴
              文斗斤方无日曰月木欠止歹殳毋比毛氏气水火爪父爻爿片牙牛犬玄玉瓜瓦甘
              生用田疋疒癶白皮皿目矛矢石示禸禾穴立竹米糸缶网羊羽老而耒耳聿肉臣自
              至臼舌舛舟艮色艸虍虫血行衣襾見角言谷豆豕豸貝赤走足身車辛辰辵邑酉釆
              里金長門阜隶隹雨青非面革韋韭音頁風飛食首香馬骨高髟鬥鬯鬲鬼魚鳥鹵鹿
              麥麻黃黍黑黹黽鼎鼓鼠鼻齊齒龍龜龠`.replace(/\s/g, '');
var rad = new SymbolTable(kangxi);

var v = [ 0, 1, 9, 10, 35, 36, 37, 61, 62, 63, 1945 ];
var v2 = [ 2e3, 2e4, 2e5, 2e6, 2e7, 2e8, 2e9 ];
console.log(v.map(x => [x, rad.numberToString(x), base62.numberToString(x),
                        oda.numberToString(x), meals.numberToString(x)]
                           .join(' ')));
console.log(v2.map(
    x => [x, rad.numberToString(x), base62.numberToString(x)].join(' ')));
// > [ '0 一 0 天 🍌🍳☕️',
// >  '1 丨 1 下 🍱',
// >  '9 儿 9 布下 🍱🍌🍳☕️🍌🍳☕️',
// >  '10 入 A 布布 🍱🍌🍳☕️🍱',
// >  '35 夕 Z 布天武 🍱🍌🍳☕️🍣🍮🍣🍮',
// >  '36 大 a 布下天 🍱🍱🍌🍳☕️🍌🍳☕️',
// >  '37 女 b 布下下 🍱🍱🍌🍳☕️🍱',
// >  '61 戈 z 武武下 🍣🍮🍌🍳☕️🍣🍮🍱',
// >  '62 戶 10 武武布 🍣🍮🍌🍳☕️🍣🍮🍣🍮',
// >  '63 手 11 武武武 🍣🍮🍱🍌🍳☕️🍌🍳☕️',
// >  '1945 儿勹 VN 下武布下布下 🍣🍮🍣🍮🍌🍳☕️🍌🍳☕️🍌🍳☕️🍌🍳☕️🍱' ]
// > [ '2000 儿木 WG',
// >  '20000 犬甘 5Ca',
// >  '200000 乙殳老 q1o',
// >  '2000000 尸行隶 8OI4',
// >  '20000000 丶人貝黑 1Luue',
// >  '200000000 匕父小玄 DXB8S',
// >  '2000000000 黽几黃水 2BLnMW' ]
~~~
Here, I made a few whimsical number systems to rewrite various interesting numbers in:

- a quaternary radix-4 number system based on Oda Nobunaga’s motto circa late-1560s, <ruby>天下<rp>(</rp><rt>tenka</rt><rp>)</rp>布武<rp>（</rp><rt>fubu</rt><rp>)</rp></ruby> (with 天下 meaning ‘all under heaven’ and 布武 roughly meaning ‘military order’).
- The epicurean ternary radix-3 number system using the day’s meals: 🍌🍳☕️ for breakfast, 🍱 for lunch, and 🍣🍮 for dinner.
- Base-62, using `0-9A-Za-z`, which is actually quite reasonable for database keys.
- a radix-214 number system using all 214 radicals of Chinese as promulgated in the 1716 Dictionary ordered by the Kangxi Emperor. Two billion, instead of ten digits in base-10, is rendered using just four radicals: 黽几黃水, traditionally meaning *frog, table, yellow, water*. Perhaps the next Joshua Foer will fashion this into a memory system for memory championships.

## Arithmetic on digits
In the previous section, we added methods to the `SymbolTable` object to convert positive integers ↔︎ digits ↔︎ strings, using the stringy symbols contained in the object, and a given radix `B`. By “digits” we meant an array of plain JavaScript numbers between 0 and `B - 1`. From this digits array you can:

- recover the number by multiplying sucessive digits with successive powers of `B` and summing, so `[1, 2, 3]` is 123 in base-10 but in hexadecimal base-16, 0x123 is 291;
- create a long string by mapping each digit to a unique stringy symbol, which is independent of base: `[1, 2, 3]` ↔︎ `'123'` using our Arabic symbols or `'一二三'` using Chinese symbols.

Now.

Here’s the way to get strings *between* two given strings.

1. Convert both strings to digits.
2. Instead of treating the sequence of digits as a number with the radix-point to the *right* of the last digit, let’s pretend that the radix point was to the *left of the first digit*. This gives you two numbers both between 0 and 1.
3. Still using the digits array, calculate their average. This new array of digits is readily mapped to a string that will be lexicographically “between” the original two strings.

This might seem confusing! Arbitrary! Over-complicated! But I think every piece of this scheme is necessary and as simple as possible to achieve the desiderata at the top of this document.

**Stupid example** Consider the base `B = 10` decimal system, and two strings, `'2'` and `'44'`. These strings map to digits `[2]` and `[4, 4]` respectively (and also to the numbers 2 and 44—stupid example to get you comfortable).

Instead of these two strings representing integers with the radix-point (decimal point) after them, shift your perspective so that the radix-point is on the left:

1. Not 2, but 0.2 (which is 2 ÷ 10).
1. Not 44, but 0.44 (which is 44 ÷ 100).

In other words, pretend both numbers have been divided by base `B` until they first drop below 1.

Why do this? Just look at the mean of these fractions: `(0.2 + 0.44) / 2 = 0.32`. Move the decimal point in 0.32 to the end to get an integer, 32. Map 32 to a string: `'32'`. Look at that: `'2' < '32' < '44'`.

The mean of two numbers comes from splitting the interval between them into two pieces. You can get `N` numbers by splitting the interval into `N + 1` pieces: `0.2 + (0.44 - 0.2) / (N + 1) * i` for `i` running from 1 to `N`. For `N = 5`, these are:
~~~js
var N = 5, a = 0.2, b = 0.44;
var intermediates =
    Array.from(Array(N), (_, i) => a + (b - a) / (N + 1) * (i + 1));
console.log(intermediates);
// > [ 0.24000000000000002, 0.28, 0.32, 0.36, 0.4 ]
~~~
Ignoring floating-point-precision problems, `'2' < '24' < '28' < '32' < '36' < '40' < '44'`.

Initially when developing this library, the `N > 1` case wasn’t important to me—I just wanted the average between two values: `(a + b) / 2`, so I only cared about adding two digits arrays (long-addition) and dividing by a scalar (long-division). However, the `N > 1` case is really useful, so Mudder.js finds `N ≥ 1` evenly-spaced numbers between `a` and `b` using the equation, `a + (b - a) / (N + 1) * i`, for `i` running from 1 to `N`.

(Example—from ranking database entries. I frequently want to insert not just one new entry between two currently-adjacent entries. I want to insert `N ≫ 1` new entries. This *could* be faked by recursively finding averages, splitting the `a`–`b` interval into power-of-two sub-intervals. For example, to get `N = 5` numbers between 0.1 and 0.2, evaluate `[0.1, 0.2]`→`[0.1, 0.15, 0.2]`→`[0.1, 0.125, 0.15, 0.175, 0.25]`→`[0.1, 0.1125, 0.125, 0.1375, 0.15, 0.1625, 0.175, 0.1875, 0.2]`, then pick 5 of the 7 interior numbers. If you just pick the first five interior points, `0.1125, 0.125, 0.1375, 0.15, 0.1625` to return, there will be a big gap between the last point 0.1625 and the upper-bound 0.2. For this reason, Mudder.js directly computes `N` evenly-spaced numbers between `a` and `b`.)

Evaluating `a + (b - a) / (N + 1) * i`, with `i = 1..N` and for `a` and `b` numbers in base-`B` between 0 and 1 represented by digits arrays (each element of which is between 0 and `B - 1`), as it’s written there, requires

- adding digits arrays (long-addition),
- subtracting digits arrays (long-subtraction),
- multiplying and/or dividing digits arrays by scalars (long-multiplication and/or long-division).

The mean, `(a + b) / 2`, can be achieved with just long-addition and long-division by 2. I did not want to do figure out much beyond this just to evaluate `a + (b - a) / (N + 1) * i`—if this expression was too much trouble, I could just recursively evaluate the mean.

Let’s do some arithmetic massaging of the expression for `N` evenly-spaced interior points between `a` and `b`:
```
a + (b - a) / (N + 1) * i = ((N + 1) * a + b * i - a * i) / (N + 1)
                          = (a / (N + 1)) * (N + 1 - i) + (b / (N + 1)) * i
```
The original expression can be written in several other ways that seem more attractive or less attractive than the original, but the last one is, I think, the simplest to implement: it needs long-division by arbitrary integers to divide `a / (N + 1)` and `b / (N + 1)`, then long-addition to generate the two sequences of `[a/(N+1), 2 * a/(N+1), 3 * a/(N+1), ..., , N * a/(N+1)]` and similarly for `b`.

Let’s implement long-division with remainders, and then show how to do long-addition in the presence of remainders.

---


The same idea works for bases other than `B = 10`. It’s just that adding and dividing becomes a *bit* more complicated in non-decimal bases. Let’s write routines that add two digits arrays, and that can divide a digit array by a scalar, both in base-`B`.





### Adding digits arrays
Let’s re-create the scene. We started with two strings. We use a symbol table containing `B` entries to convert the strings to two arrays of digits, each element of which is a regular JavaScript integer between 0 and `B - 1`. *We are going to pretend that the digits have a radix-point before the first element* and we want to *add* the two sets of digits.

Recall long addition from your youth. You add two base-10 decimal numbers by

1. lining up the decimal point,
1. adding the two rightmost numbers (filling in zeros if one number has fewer decimal places than the other),
1. then moving left,
1. taking care to carry the tens place of a sum if it was ≥10.

**Example base-10** Let’s add 0.12 + 0.456:
```
  0.12
+ 0.456
  -----
  0.576     ⟸ found 6 first, then 7, then finally 5.
```

An example complicated by carries: 0.12 + 0.999:
```
  [1 1]     ⟸ carries
  0.12
+ 0.999
  -----
  1.119    ⟸ found 9 first, then to the left
```

**Example base-16** Here’s a hexadecimal example: 0x0.12 + 0x0.9ab. Recall that the “0x” in the beginning tells you the following number is base-16, its digits going from 0 to ‘f’=15, so `0x1 + 0x9 = 0xa`, and `0xf + 0x1 = 0x10`. Other than that, it’s the same long-addition algorithm:
```
  0.12
+ 0.9ab
  -----
  0.acb    ⟸ found 0xb first, then 0xc, then finally 0xa
```
Let’s check that this is right:
~~~js
console.log((0x12 / 0x100 + 0x9ab / 0x1000).toString(16));
// > 0.acb
~~~

Here’s an example with carries, 0x0.12 + 0x0.ffd:
```
 [1 1]     ⟸ hexadecimal carries
  0.12
+ 0.ffd
  -----
  1.11d    ⟸ found 0xd first, then to the left
```
Checking this too:
~~~js
console.log((0x12 / 0x100 + 0xffd / 0x1000).toString(16));
// > 1.11d
~~~
The carry digit will be either 0 or 1. Why? Because the biggest carry would come from adding the biggest digits: `(B - 1) + (B - 1) = (1) * B + (B - 2) * 1` which would be written with two digits, 1 and `B - 2`. In hexadecimal, this means `0xf + 0xf = 0x1e = 16 + 14 = 30 ✓`. So if you had a column in long-addition of 0xf, 0xf, and a carry of 0x1, the sum will be 0x1f, and you’d write ‘f’ underneath the line and carry that ‘1’ to the column to the left.

**Code** Thinking about code to long-add two arrays of digits, assuming the radix-point to the left of the first element of both, and where each digit is a JavaScript integer between 0 and `B - 1`, I wanted to get three things right: (1) determining when a carry happens—when the sum of two elements was `≥B`; (2) tracking the carry as it moved leftwards; and (3) handling arrays of different lengths.

How do I want to deal with arrays of differing lengths? In the examples above, when a column lacked a number from one of the summands, we pretended it was zero. One option could be to pad a shorter digits array with zeros. But that’s just equivalent to *copying* the trailing elements of the longer array to the result array. My plan is to *make a copy* of the longer array, then update its elements with the result of adding each digit from the shorter array. Because we have to work from the *ends* of both arrays to the beginning, we’ll use `Array.prototype.reduceRight` again:
~~~js
function longAdd(long, short, base) {
  if (long.length < short.length) {
    [long, short] = [ short, long ];
  }
  let carry = false, sum = long.slice(); // `sum` = copy of `long`
  short.reduceRight((_, shorti, i) => {
    const result = shorti + long[i] + carry;
    carry = result >= base;
    sum[i] = carry ? result - base : result;
  }, null);
  return {sum, carry};
};
~~~
Programming note: I used `reduceRight`, a very functional-programming-y technique, in a very mutable way above, essentially as a `for`-loop, except `reduceRight` keeps track of the indexing starting at the end of arrays.

I use a single boolean to indicate whether there’s a carry digit. It’s returned, along with a new array of digits representing the sum. Just like long-addition by hand, the radix-point is to the left of the `sum` array of digits—but, again just like long-addition by hand, if the final `carry` is true, there’s a “1” to the left of that radix point!

An example will help clear this up. Again, I’d like to emphasize that, for purposes of this base-`B` long-addition, an array of digits, like `[1, 2]` or `[15, 15, 13]`, represents the number (0.12)<sub>`B`</sub> or (0.ffd)<sub>`B`</sub> respectively. Let’s check the hexadecimal base-16 answer from before:
~~~js
console.log([
  longAdd([ 1, 2 ], [ 0xf, 0xf, 0xd ], 16),
  longAdd([ 0xf, 0xf, 0xd ], [ 1, 2 ], 16),
]);
// > [ { sum: [ 1, 1, 13 ], carry: true },
// >  { sum: [ 1, 1, 13 ], carry: true } ]
~~~
Previously we’d shown that 0x0.12 + 0x0.ffd = 0x1.11d. Since the returned `carry` is true, `longAdd`’s final solution is 0x1.11d (since 0xd = 13).

### Dividing a digits array with a scalar
Consider two numbers, `a` and `b`. Their mean is `(a + b) / 2`. This mean comes from splitting the interval between `a` and `b` into two pieces. `N` evenly-spaced points between `a` and `b` (not including these) comes from splitting the interval into `N + 1` pieces: `a + (b - a) / (N + 1) * i`, where `i` runs from `1` to `N`.

Let’s do some arithmetic massaging:
```
a + (b - a) / (N + 1) * i = ((N + 1) * a + b * i - a * i) / (N + 1)
                          = (a / (N + 1)) * (N + 1 - i) + (b / (N + 1)) * i
```

We’d like the `N ≥ 1` evenly-spaced numbers between `a` and `b`, for our case where `0 ≤ a, b < 1` and both are expressed as arrays of digits. A key element of this is dividing an array of digits by a scalar, which can be quite large (`N + 1` potentially much larger than base-`B`).

~~~js
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
~~~
~~~js
longDiv([ 1, 0 ], 2, 10);
// > { res: [ 0, 5 ], rem: 0, den: 2 }
~~~

~~~js
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

function longLinspace(a, b, base, N) {
  if (a.length < b.length) {
    a = rightpad(a, b.length);
  } else if (b.length < a.length) {
    b = rightpad(b, a.length);
  }
  const aDiv = longDiv(a, N + 1, base);
  const bDiv = longDiv(b, N + 1, base);
  let as = [ aDiv ];
  let bs = [ bDiv ];
  for (let i = 2; i <= N; i++) {
    as.push(longAddSameLen(as[i - 2].res, aDiv.res, base,
                           aDiv.rem + as[i - 2].rem, N + 1));
    bs.push(longAddSameLen(bs[i - 2].res, bDiv.res, base,
                           bDiv.rem + bs[i - 2].rem, N + 1));
  }
  as.reverse();
  return as.map((a, i) => longAddSameLen(a.res, bs[i].res, base,
                                         a.rem + bs[i].rem, N + 1));
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

function chopDigits(rock, water) {
  for (let idx = 0; idx < water.length; idx++) {
    if (water[idx] && rock[idx] !== water[idx]) {
      return water.slice(0, idx + 1);
    }
  }
  return water;
}

function chopSuccessiveDigits(strings) {
  const reversed = strings[0] > strings[1];
  if (reversed) {
    strings.reverse();
  }
  const result = strings.slice(1).reduce(
      (accum, curr) =>
          accum.concat([ chopDigits(accum[accum.length - 1], curr) ]),
      [ strings[0] ]);
  if (reversed) {
    return result.reverse();
  }
  return result;
}

function truncateLexHigher(lo, hi) {
  const swapped = lo > hi;
  if (swapped) {
    [lo, hi] = [ hi, lo ];
  }
  hi = hi.slice(0, lo.length + 1);
  if (swapped) {
    return [ hi, lo ];
  }
  return [ lo, hi ];
}

SymbolTable.prototype.mudder = function(a, b, numStrings, base) {
  base = base || this.maxBase;
  [a, b] = truncateLexHigher(a, b);
  const ad = this.stringToDigits(a, base);
  const bd = this.stringToDigits(b, base);
  const intermediateDigits = longLinspace(ad, bd, base, numStrings || 1);
  let finalDigits = intermediateDigits.map(
      v => v.res.concat(this.roundFraction(v.rem, v.den, base)));
  finalDigits.unshift(ad);
  finalDigits.push(bd);
  return chopSuccessiveDigits(finalDigits)
      .slice(1, finalDigits.length - 1)
      .map(v => this.digitsToString(v));
};
// < export mudder.js
~~~

~~~js

var B = 6;
var N = 9;

Array.from(Array(N + 2), (_, i) => (i) / (N + 1) / B + 1 / B)
    .map(x => x.toString(B))

longLinspace([ 1 ], [ 2 ], B, N);
longLinspace([ 2 ], [ 1 ], B, N);
longLinspace([ 1 ], [ 2 ], B, N)
    .map(o => o.res.concat(decimal.roundFraction(o.rem, o.den, B)));

decimal.mudder('1', '2', B, N);
decimal.mudder('2', '1', B, N);

decimal.mudder('2', '34502105342105402154', B, 10)

~~~

Let’s make a few useful symbol tables;

~~~js
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
~~~

And make it an ES2015 module:

~~~js
export {SymbolTable, base62, base36, alphaupper, alphalower};
~~~

Actually, make it a standard Node module:

~~~js
module.exports = {SymbolTable, base62, base36, alphabet, longLinspace};
// < export mudder.js
~~~

##References

Cuneiform: http://it.stlawu.edu/~dmelvill/mesomath/Numbers.html and https://en.wikipedia.org/wiki/Sexagesimal#Babylonian_mathematics and Cuneiform Composite from http://oracc.museum.upenn.edu/doc/help/visitingoracc/fonts/index.html
