# Mudder.js

## Background

**Needed** A function that, given two strings, returns one or more strings lexicographically between them (see [Java’s `compareTo` docs](http://docs.oracle.com/javase/8/docs/api/java/lang/String.html#compareTo-java.lang.String-) for a cogent summary of lexicographical ordering).

That is, if `c = lexmid(a, b, 1)` a string, then `a ≶ c ≶ b`.

Similarly, if `cs = lexmid(a, b, N)` is an `N>1`-element array of strings, `a ≶ cs[0] ≶ cs[1]  ≶ … ≶ cs[N-1] ≶ b`.

**Use Case** For storing the relative rank of a document in CouchDB (a NoSQL database) without using numbers, since floating-point numbers can only be subdivided so many times before exhausting precision. That is, if two documents are numbered 1.0 and 2.0, and I keep inserting documents between them with intermediate numbers, after just 50 subdivisions, the space between adjacent documents becomes `2^-50 = 9e-16`, and documents’ numbers become indistinguishable.
~~~js
console.log(1 + Math.pow(2, -55) === 1);
~~~
Instead, store the ranks as strings, which CouchDB will happily lexicographically sort. (See [my CouchDB-specific question](http://stackoverflow.com/q/39125091/500207).)

**Desiderata** I’d like to be able to insert thousands of documents between adjacent ones, so the `lexmid` function must never return strings which can’t be themselves “subdivided” further. At the same time, I’m not made of memory so shorter strings are preferred.

**Prior art and innovations** [@m69’s algorithm](http://stackoverflow.com/a/38927158/500207) is perfect: you give it two alphabetic strings containing just `a-z`, and you get back a short, alphabetic string between them. Mudder.js (this library) is a generalization of the @m69 algorithm that operates on *arbitrary JavaScript strings* instead of strings containing lowercase `a-z` characters: your strings can contain, e.g., 日本語 characters or 🔥 emoji. As a small bonus, Mudder.js can give you multiple strings between two.


## Blah
I needed an algorithm that, given two strings, would return a third that would be lexicographically between the original two: `a < lexmid(a, b) < b` if `a < b` or, if `a > b`, then `a > lexmid(a, b) > b`. (Lexicographical ordering is the standard way of comparing and ordering strings: a cogent definition is in [documentation for Java’s `compareTo`](http://docs.oracle.com/javase/8/docs/api/java/lang/String.html#compareTo-java.lang.String-).) That was the core requirement but other desiderata included:

- any output string ought to be amenable to subsequently being piped back in, possibly for an indefinite number of nestings: `a < lexmid(a, b) < lexmid(lexmid(a, b), b) < lexmid(lexmid(lexmid(a, b), b), b) < b` (assuming `a < b`). In other words, I wanted to avoid the situation where *no* string between `a` and `lexmid(a, b)` existed even when `a < lexmid(a, b) < b`.
- I preferred shorter strings to longer strings.

> The specific use case was ordering database documents by rank in CouchDB, i.e., first place, second place, etc. See my [StackOverflow question](http://stackoverflow.com/q/39125091/500207) for the low-level details, but I needed to be able to move a document ahead or behind one place at a time, insert a document between two existing ones (i.e., insert a document between second and third place, so the latter becomes fourth place), delete a document, etc. A document’s rank wasn’t any function of its contents—think chapters in a book or levels in game (rather than a scoreboard). CouchDB lacks atomic operations, so while doing all the above, I’m restricted to modifying only one document. CouchDB indexes documents by a unique stringy primary key, which it sorts lexicographically. I resolved to use this primary key as the mechanism to record a document’s rank: the primary keys would be meaningless alphanumeric strings whose lexicographic ordering dictated rank. Inserting a new document between two existing ones (or before the first, or after the last) would be as easy as picking a new string lexicographically between two existing ones. Moving a document up in rank would mean moving a document to a new primary key, lexicographically between its two new neighbors (or before/after its one neighbor if it’s in first/last place).

It wasn't obvious initially, but a further desideratum was:

- a built-in diagnostic to warn that *no* such string could be found, given `a`≠`b`. This takes some thinking to understand. Suppose we’ve restricted our strings to contain numbers zero through nine (or any other subset of characters). There is no string of numbers that’s lexicographically between `'1'` and `'10'`. Or `'10'` and `'100'`. Sure, we could find an intermediate string by *expanding the set of acceptable characters* (e.g., `'1' < '1-0' < '10'`, since `'-'` is ASCII 45 while `'0'` is ASCII 48). But eventually this back door disappears after you use up all printable characters, or all 128 or 256 characters in ASCII, or all codepoints of whichever Unicode plane you restrict yourself to.

This dependency-free JavaScript library provides this functionality by representing a string as a sequence of arbitrary-radix digits—a number, essentially—and performing simple arithmetic on such numbers. This might sound fancy but it’s the positional number system (with base usually different than 10), long addition, and long division that you learned in primary school.

(Aside: if this is the first time since your pre-adolescence revisiting long addition/division, a most hearty welcome! I ran into these as an adult once before, in digital circuits class—a CPU implements division using long division, in base-2/binary rather than base-10/decimal.)

## Plan
Since we must convert strings to “sequences of arbitrary-radix digits”, i.e., numbers, and back again, this library includes enhanced versions of

- [`Number.prototype.toString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString) which converts JavaScript double-precision numbers to strings for bases between base-2 (binary) and base-36 (alphanumeric),
- [`parseInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt) which inverts this operation by converting a string of digits in some base between 2 and 36 to a JavaScript number.

Specifically, we need versions of these functions that operate on bases >36 (e.g., base-62, containing ten numbers, twenty-six uppsercase, and twenty-six lower case letters), and that are also flexible to the strings used to denote each number between 0 and the radix. (In this document, I will use “base” and “radix” interchangeably.)

We will create these library functions in the next section.

Once we can represent arbitrary strings as equivalent numbers, we will describe the very specific positional number system that lets us find lexicographic mid-points easily. This positional system involves mapping a given string’s numeric representation to a rational number between 0 and 1, and in this system, the lexicographic midpoint between two strings is the simple mean (average) between their two numbers.

This sounds fancy, but again, it’s quite pedestrian. We’ll implement long addition and long division (the two steps required to calculate the mean of two numbers) in a subsequent section.

Finally, with these preliminaries out of the way, we’ll implement the functions to help us paper over all this machinery and that just give us strings lexicographically between two other strings.

## Prior art

## Emoji numbers, or

## Of numbers and digits
Let us begin by improving JavaScript’s built-in

- `Number.toString`, for converting numbers to strings, and
- `parseInt`, for converting strings to numbers,

because both of these are limited to radixes ≤36, and are limited to strings containing `0-9` and `a-z`. “Radix” here just means numeric base: here’s what these functions do, for the binary radix-2 and alphanumeric radix-36 cases:
~~~js
console.log([ parseInt('1010', 2), (10).toString(2) ])
console.log([ parseInt('7PS', 36), (10000).toString(36) ])
~~~

## Symbol tables
How do these two interrelated functions work? Both share what we’ll call a *symbol table*, essentially a list of unique stringy symbols and the number they represent:

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

(Aside: `parseInt` accepts uppercase letters, treating them as lowercase, but `Number.toString` only outputs lowercase, so uppercase letters above have a right-arrow, instead of bidirectional.)

Let’s resist the temptation to be avant-garde and agree that, to be valid, a symbol table must include symbols for 0 up to some maximum *consecutively*—no skipped numbers. With `B` (for “base”) unique numbers, such a symbol table defines numeric systems starting at radix-2 (binary) up to radix-`B`. `parseInt` & `Number.toString`’s symbol table above has `B=36`.

(Aside: Alas radix-36 doesn’t seem to have a fancy name like the ancient Sumerians’ radix-60 “sexagesimal” system so I call it “alphanumeric”.)

(Aside²: While Sumerian and Babylonian scribes no doubt had astounding skills, they didn’t keep track of *sixty* unique symbols. Not even *fifty-nine*, since they lacked zero. Just two: “Y” for one and “&lt;” for ten. So 𒐘 was four and 𒐏 forty, so forty-four might be Unicodized as 𒐏𒐘?)

With a specific base `B` to work in, and a symbol table with ≥`B` rows, one has all one needs for a standard positional numeric system that one learns in school: one of Genghis Khan’s Tümen contained (7PS)<sub>36</sub> soldiers, that is, 10,000=(10000)<sub>10</sub>:
~~~js
var base10 = parseInt('10000', 10);
// 10000 = 0 * Math.pow(10, 0) +
//         0 * Math.pow(10, 1) +
//         0 * Math.pow(10, 2) +
//         0 * Math.pow(10, 3) +
//         1 * Math.pow(10, 4)

var base36 = parseInt('7PS', 36);
// 7PS = S * Math.pow(36, 0) +
//       P * Math.pow(36, 1) +
//       7 * Math.pow(36, 2)

console.log(base36 === base10 && base10 === 10000);
~~~

We’ll inevitably have to describe the algorithms used by `parseInt` and `Number.toString` that convert between JavaScript `Number`s and their stringy representations, given a base and symbol table, but let’s specify how symbol tables ought to work in this library.

Relevant aside: it’s not a requirement that the entries in the symbol table be lexicographically-sorted, but that is super-important in some applications.

Here are some possible ways to provide a symbol table:

1. **a string** Great for those simple use-cases, the string can be split into characters using `String.split('')`, and each character is the symbol for its index number.
1. **an array of strings** Similar story, just skip `String.split`. This is nice because we can have multi-“character” symbols, such as emoji (which `String.split` will butcher), or words (in any language, even cuneiform—want to know how to write your age using your family members’ names as symbols? just wait…).
1. **an object mapping stringy symbols to numbers** This would let us specify fully-generic symbol tables like `parseInt`’s, where both `'A'` and `'a'` correspond to 10. When multiple symbols map to the same number, we need a way to know which of them is the “default” for converting numbers to stringy digits (like how `Number.toString` outputs only lowercase letters).

## Strings to symbols—some prefix specifics
This discussion of `String.split` reminds me—how will this library’s `parseInt` break up stringy inputs into symbols?

Suppose we have a ternary radix-3 system where 0=🍌🍳☕️, 1=🍱, and 2=🍣🍮 (my three meals of the day). Here’s a quick-and-dirty way to represent numbers in this radix-3 numerical system with meals as symbols, so we can get to this question of how to go from strings back to numbers:
~~~js
// We’d like to call `toEmoji(42, '🍌🍳☕️,🍱,🍣🍮'.split(','))`:
var toEmoji = (x, symbols) => symbols.reduce(
    (prev, curr, i) => prev.replace(new RegExp(i, 'g'), curr),
    x.toString(symbols.length));

var mealSymbols1 = '🍌🍳☕️,🍱,🍣🍮'.split(',');
console.log(toEmoji(42, mealSymbols1));
/* result:
"🍱🍱🍣🍮🍌🍳☕️"
*/
~~~
Ok, seems to work: (42)<sub>10</sub> with this symbol table is (🍱🍱🍣🍮🍌🍳☕️)<sub>today’s meals</sub>.

Now, how would one convert this back to a number?—specifically, how would one find each digit in this epicurean radix-3 representation of a number? One option: with some regular expression fanciness:
~~~js
var fromEmoji = (x, symbols) => parseInt(
    x.match(new RegExp(symbols.map(s => `(${s})`).join('|'), 'g'))
        .map(symbol => '' + symbols.findIndex(elt => elt === symbol))
        .join(''),
    symbols.length);

console.log(fromEmoji(toEmoji(42, mealSymbols1), mealSymbols1));
/* result:
42
*/
~~~
The code is obscenely complicated but it does seem to work (we’ll make rewrite it more coherently shortly).

BUT WAIT! What happens if I have voluminous bento leftovers 🍱 for dinner? Then the symbol for 2 is 🍱🍮:
~~~js
var mealSymbolsBad = '🍌🍳☕️,🍱,🍱🍮'.split(',');
console.log(toEmoji(42, mealSymbolsBad))
/* result:
"🍱🍱🍱🍮🍌🍳☕️"
*/
console.log(fromEmoji(toEmoji(42, mealSymbolsBad), mealSymbolsBad));
/* result:
39
*/
~~~
*We get the wrong answer!* I’m writing this on the fly here, and it’s very possible I have a bug in `to/fromEmoji` but actually, there’s a real problem here: one of the symbols is another symbol’s prefix, so the regular expression snaps up the first 🍱=lunch=1 in 🍱🍮=dinner=2, therefore failing to match the lone suffix ‘🍮’ and skips 🍮 entirely, and generally makes a mess of things.

At this stage one might recall reading about Huffman coding, or Dr El Gamal’s lecture on [prefix codes](https://en.wikipedia.org/wiki/Prefix_code) in information theory class. One way or another, we decide that, if we consume a plain string without any ‘commas’ (non-numeric inter-symbol punctuation), the symbol table has to be prefix-free, i.e., *no complete symbol can serve as prefix to another symbol.*

(Aside: in this particular example, the presence of prefixing isn’t catastrophic—in fact, by constructing a regular expression with symbols arranged longest-to-shortest (in terms of number of characters), it would have worked—but only because the trailing suffix, 🍮 dessert, wasn’t itself a symbol. By choosing to parse strings into symbols only with prefix codes, we’re making life a little simpler for ourselves, but no doubt there are ways to deal with symbol tables with prefixes—if you really want them, write to me and we can work out the details.)

So if our super-`parseInt` is working with a _not_-prefix-free symbol table, it should only accept an array, each element of which is a single stringy symbol. If its symbol table _is_ prefix-free, then a string of symbols, like `'🍱🍱🍣🍮🍌🍳☕️'` is acceptable if hunger-inducing.

### A plea

Please, please don’t write code like the above except for throw-away explorations, like I was doing. While you may be able to cobble together nested map–reduce–finds that run in quadratic time yet get the job done in a relatively short amount of time because you can clearly visualize the inputs and desired outputs and the transform between them, it will take much longer to rebuild that visualization later, when it’s gone, by reading such code.

So, let’s write it.

## String ↔︎ (digits) ↔︎ JavaScript number

### Is it a prefix code?
I’ve decided—parsing a string to a number will only be attempted for prefix-free symbol tables. You can still use prefixed symbols but if you do, you have to split your string into an array of sub-strings yourself.

So, let’s write a dumb way to decide if a set or array of stringy symbols constitutes a prefix code. If any symbol is a prefix of another symbol (other than itself of course), the symbol table **isn’t** prefix-free, and we don’t have a prefix code.
~~~js
function isPrefixCode(strings) {
  // Note: we skip checking for prefixness if two symbols are equal to each
  // other. This implies that repeated symbols in the input are *silently
  // ignored*!
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
~~~
As with most mundane-seeming things, there’s some subtlety here: note how, inside the double-loop, we skip comparing the same *strings*. In the event that the input symbols set has *repeats*, this function will implicitly treat those repeats as the same symbol. The alternative—to ascribe some sort of meaning to repeated elements in the symbol set like it’d never be a good idea. Please advise if this decision was wrong.

Making sure it works:
~~~js
console.log(isPrefixCode('a,b,c'.split(',')));
console.log(isPrefixCode('a,b,bc'.split(',')));
~~~

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
~~~
A cogent definition of lexicographic ordering is in [documentation for Java’s `compareTo`](http://docs.oracle.com/javase/8/docs/api/java/lang/String.html#compareTo-java.lang.String-), but in a nutshell—to find the lex-distance between two strings, find the first position where they differ and subtract the the two characters at that position. If they’re the same and a string ends, return the difference in their lengths. Therefore:
~~~js
console.log('a,ba,bbbb,baaaa,baz,bz,z'.split(',').sort());
// Why 'ba', then 'baaaa', then 'baz'?
// 'ba' - 'baaaa' = length('ba') - length('baaaa') = -3
// 'ba' - 'baz' = length('ba') - length('baz') = -1
// 'baaaa' - 'baz' = 'a' - 'z' = -25
~~~
It certainly appears that, after sorting, a string will be preceded by its prefix, so a sequential scan through the sorted array, looking for prefixes, ought to do the trick. And indeed, it seems to work:
~~~js
console.log(isPrefixCodeLogLinear('a,b,c'.split(',')));
console.log(isPrefixCodeLogLinear('a,b,bc'.split(',')));

var foo = 'a b cqweasd def sa szb szq szbb'.split(/\s+/);
var s =
    'corrupt raspberry blockhead shop delicate discipline discipline-elegant liquid district sparkle';
var bar = s.split(/\s+/);
console.log(isPrefixCodeLogLinear(foo));

console.log(isPrefixCodeLogLinear(bar));
~~~
But is it faster? Let’s test it on a pile of very big random numbers, the set of which is likely to be prefix-free, so neither algorithm bails early after finding a prefix:
~~~js
test = Array.from(Array(1000), () => '' + Math.floor(Math.random() * 10000000));
console.time('quad');
isPrefixCode(test);
console.timeEnd('quad');

console.time('log');
isPrefixCodeLogLinear(test);
console.timeEnd('log');
~~~
Yes indeed, the log-linear approach using sorted strings is maybe ~100× faster than the quadratic approach using a double-loop. [@KWillets on Computer Science StackExchange](http://cs.stackexchange.com/q/63309/8216) was kind enough to confirm that this sort-based approach to determining the prefix property of a set of strings is legit—hooray 🙌! So let’s use this:
~~~js
isPrefixCode = isPrefixCodeLogLinear;
~~~

### Symbol table object constructor


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
  'use strict';
  if (typeof this === 'undefined') {
    throw new TypeError('constructor called as a function')
  };

  if (typeof symbolsArr === 'string') {
    symbolsArr = symbolsArr.split('');
    this.num2sym = symbolsArr;
    this.sym2num = new Map(symbolsArr.map((str, idx) => [str, idx]));
  } else if (Array.isArray(symbolsArr)) {
    this.num2sym = symbolsArr;
    if (typeof symbolsMap === 'undefined') {
      symbolsMap = new Map(symbolsArr.map((str, idx) => [str, idx]));
    } else if (symbolsMap instanceof Map) {
      symbolsMap = symbolsMap;
    } else if (symbolsMap instanceof Object) {
      symbolsMap = new Map(symbolsMap.entries());
    } else {
      throw new TypeError(
          'arguments: (string), (array), (array, map), or (array, object)');
    }
    let symbolsValuesSet = new Set(symbolsMap.values());
    for (let i = 0; i < symbolsArr.length; i++) {
      if (!symbolsValuesSet.has(i)) {
        throw new RangeError(symbolsArr.length + ' symbols given but ' + i +
                             ' not found in symbol table');
      }
    }
    this.sym2num = symbolsMap;
  } else {
    throw new TypeError(
        'arguments: (string), (array), (array, map), or (array, object)');
  }

  this.maxBase = this.num2sym.length;
  this.isPrefixCode = isPrefixCode(symbolsArr);
}

var binary = new SymbolTable('01');
var decimal = new SymbolTable('0123456789');
var meals = new SymbolTable('🍌🍳☕️,🍱,🍣🍮'.split(','));
console.log([ binary, decimal, meals ]);
~~~

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
console.log(decimal.numberToDigits(123));
console.log(decimal.numberToDigits(0));
~~~

~~~js
SymbolTable.prototype.digitsToString = function(digits) {
  return digits.map(n => this.num2sym[n]).join('');
};
decimal.digitsToString(decimal.numberToDigits(123))
~~~

~~~js
SymbolTable.prototype.stringToDigits = function(string) {
  if (!this.isPrefixCode && typeof string === 'string') {
    throw new TypeError(
        'parsing string without prefix code is unsupported. Pass in array of stringy symbols?');
  }
  if (typeof string === 'string') {
    const re = new RegExp('(' + this.num2sym.join('|') + ')', 'g');
    string = string.match(re);
  }
  return string.map(symbol => this.sym2num.get(symbol));
};
console.log(decimal.stringToDigits('123'));
console.log(decimal.stringToDigits('123'.split('')));
~~~

~~~js
SymbolTable.prototype.digitsToNumber = function(digits, base) {
  base = base || this.maxBase;
  return digits.reduce((prev, curr, i) =>
                           prev + curr * Math.pow(base, digits.length - i - 1),
                       0);
};
console.log(decimal.digitsToNumber(decimal.stringToDigits('123')));
console.log(decimal.digitsToNumber(decimal.stringToDigits(
    decimal.digitsToString(decimal.numberToDigits(123)))));

SymbolTable.prototype.numberToString = function(num, base) {
  return this.digitsToString(this.numberToDigits(num, base));
};
SymbolTable.prototype.stringToNumber = function(num, base) {
  return this.digitsToNumber(this.stringToDigits(num), base);
};
decimal.numberToString(decimal.stringToNumber('123'));

~~~

Now for some fun.
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
console.log(v.map(
    x =>
        `${x} ${rad.numberToString(x)} ${base62.numberToString(x)} ${oda.numberToString(x)} ${meals.numberToString(x)}`));
var v2 = [ 2e3, 2e4, 2e5, 2e6, 2e7, 2e8, 2e9 ];
console.log(
    v2.map(x => `${x} ${rad.numberToString(x)} ${base62.numberToString(x)}`));
~~~

## Misc…
Please don’t write code like the above, with chained `map`–`reduce`–`findIndex` insanity and quadratic searches—I’ve been thinking about these things for a bit and just wanted to throw something together. Here’s a more annotated version of both `toEmoji` and `fromEmoji`:

First, let’s make a symbol table `Map` (ES2015 hash table) to go from symbols to numbers ≤`B=3`. This lets us avoid the horrible `findIndex` in `fromEmoi`.
~~~js
var arrToSymbolMap = symbols => new Map(symbols.map((str, idx) => [str, idx]))
                                    .set('array', symbols)
                                    .set('base', symbols.length);
console.log(arrToSymbolMap('🍌🍳☕️,🍱,🍣🍮'.split(',')));
~~~
The map includes a key `'array'` with value of the initial array to serve as the opposite, a mapping from numbers to symbols.

(Aside: we could have been very modern and used ES2015 `Symbol.for('array')` instead of the string `'array'` as the key.)

With this `Map` representing the symbol table, and helper functions `replaceAll` and `symbolMapToRegexp`…
~~~js
function lexdist(a,b) {
  const minlen = Math.min(a.length, b.length);
  for (let i = 0; i < minlen; i++){
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
}

var mealMap = arrToSymbolMap('🍌🍳☕️,🍱,🍣🍮'.split(','));

var num2numDigitsInBase = (num, b) =>
    Math.max(1, Math.ceil(Math.log(num + 1) / Math.log(b)));

var num2digits = (num, base) => {
  var numDigits = num2numDigitsInBase(num, base);
  var digits = Array(numDigits);
  for (let i = numDigits - 1; i >= 0; i--) {
    digits[i] = num % base;
    num = Math.floor(num / base);
  }
  return digits;
};
num2digits(3 * 3 * 3 * 3, 2);

var digits2string = (digits, smap) =>
    digits.map(n => smap.get('array')[n]).join('');

digits2string(num2digits(3 * 3 * 3 * 3, 2), arrToSymbolMap('ab'.split('')));

var string2digits = (str, smap) => {
  var re = new RegExp('(' + smap.get('array').join('|') + ')', 'g');
  return str.match(re).map(symbol => smap.get(symbol));
};

var base62 = arrToSymbolMap(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(''));
var az = arrToSymbolMap("abcdefghijklmnopqrstuvwxyz".split(''));
digits2string(string2digits('abcakljafs', az), az);

string2digits('baaa', az);
string2digits('bcde', az);

var digits2num = (digits, smap) => {
  var base = smap.get('base');
  return digits.reduce((prev, curr, i) =>
                           prev + curr * Math.pow(base, digits.length - i - 1),
                       0);
};
digits2num([ 1, 25 ], az);


function longSub(big, small, base) {
  var dist = lexdist(big, small);
  if (dist < 0) {
    [big, small] = [ small, big ];
  } else if (dist === 0) {
    return [ 0 ];
  }
}



function longAdd(a, b, base) {
  // sum starts out as copy of longer
  const sum = a.length < b.length ? b.slice() : a.slice();
  // short is a reference to the shorter
  const short = !(a.length < b.length) ? b : a;

  let carry = 0;
  for (let idx = short.length - 1; idx >= 0; idx--) {
    let tmp = sum[idx] + short[idx] + carry;
    if (tmp >= base) {
      sum[idx] = tmp - base;
      carry = 1;
    } else {
      sum[idx] = tmp;
      carry = 0;
    }
  }
  return {sum : sum, overflow : carry};
}

function longDiv(numeratorArr, den, base) {
  return numeratorArr.reduce((prev, curr) => {
    let newNum = curr + prev.rem * base;
    return {
      div : prev.div.concat(Math.floor(newNum / den)),
      rem : newNum % den,
      den
    };
  }, {div : [], rem : 0, den});
}

function longMean(a, b, base) {
  const {sum, overflow} = longAdd(b, a, base);

  let {div : mean, rem} = longDiv(sum, 2, base);
  if (rem) {
    mean.push(Math.ceil(base / 2));
  }
  if (overflow) {
    mean[0] += Math.floor(base / 2);
  }

  return mean;
}



var Big = require('big.js');
digits2big = (digits, base) =>
    digits.reduce((prev, curr, i) => prev.plus(
                      Big(curr).times(Big(base).pow(digits.length - i - 1))),
                  Big(0));
digits2big(string2digits('aba', az), az.get('base'));

var big2digits1 = (num, base) => {
  var numDigits =
      Math.ceil(num.c.length / Math.log10(base)) + 1; // 'emmy'+'ammy'
  var digits = Array.from(Array(numDigits), x => 0);
  for (let i = numDigits - 1; i >= 0; i--) {
    digits[i] = Number(num.mod(base));
    num = num.div(base).round(null, 0);
  }
  return digits;
};
 var big2digits = (num, base) => {
  if (num.cmp(Big(0)) === 0) {
    return [ 0 ];
  }
  var digits = [];
  while (num >= 1) {
    digits.unshift(Number(num.mod(base)));
    num = num.div(base).round(null, 0);
  }
  return digits;
};
num2digits(0, 2);
num2digits(3 * 3 * 3 * 3, 2);
big2digits(Big(3 * 3 * 3 * 3), 2)
big2digits(Big(5.5), 2);
big2digits(Big(5), 2);
big2digits(Big(1), 26);
big2digits(Big(0), 26);

var zeros = n => Array.from(Array(Math.max(0, n)), _ => 0);


var doStrings = (s1, s2, smap, approximate) => {
  var d1, d2;
  if (s1) {
    d1 = string2digits(s1, smap);
  } else {
    d1 = [ 0 ];
  }
  if (s2) {
    d2 = string2digits(s2, smap);
  } else {
    d2 = zeros(d1.length);
    d2.unshift(1);
    d1.unshift(0);
  }
  var maxLen = Math.max(d1.length, d2.length);
  if (d2.length < maxLen) {
    d2.push(...zeros(maxLen - d2.length));
  } else if (d1.length < maxLen) {
    d1.push(...zeros(maxLen - d1.length));
  }
  var base = smap.get('base');
  var b1 = digits2big(d1, base);
  var b2 = digits2big(d2, base);
  var mean = b1.plus(b2).div(2);

  var round = mean.round(null, 0);
  var remainder = mean.minus(round);

  var whole = big2digits(round, base);
  whole.unshift(...zeros(maxLen - (s2 ? 0 : 1) - whole.length));
  var withremainder = whole.concat(Number(remainder) > 0 ? Math.ceil(base / 2)
                                                         : []); // ceil for 2

  if (approximate) {
    if (lexdist(d1, d2) > 0) {
      [d2, d1] = [ d1, d2 ];
    }
    for (var i = 0; i < d1.length; i++) {
      if (d1[i] < withremainder[i]) {
        return digits2string(withremainder.slice(0, i+1), smap);
      }
    }
    for (; i < withremainder.length; i++) {
      if (withremainder[i]) {
        break;
      }
    }
    return digits2string(withremainder.slice(0, i+1), smap);
  }

  return digits2string(withremainder, smap);; // replace trailing 0s
};
doStrings('b', 'bd', az)
doStrings('ba', 'b', az)
doStrings('cat', 'doggie', az)
doStrings('doggie', 'cat', az,true)
doStrings('ammy', 'emmy', az)
doStrings('aammy', 'aally', az)
doStrings('emmy', 'ally', az)
doStrings('bazi', 'ally', az)
doStrings('b','azz',az);
doStrings('a','b',az);
doStrings(null,'b',az);
doStrings('z','b',az);
doStrings('b', null, az)
doStrings(null, null, az)
doStrings('db', 'cz', az)
doStrings('asd', 'asdb', az,true);

string2digits('wqe', az)


function doLong(s1, s2, smap, approximate) {
  var d1, d2;
  if (s1) {
    d1 = string2digits(s1, smap);
  } else {
    d1 = [ 0 ];
  }
  if (s2) {
    d2 = string2digits(s2, smap);
  } else {
    d2 = [ 1 ];
    d1.unshift(0);
  }

  var mean = longMean(d1, d2, smap.get('base'));

  while(mean[mean.length-1]===0) {
    mean.pop();
  }
  if (mean.length===0){
    throw new RangeError("Couldn't find non-empty midpoint. Did you ask for "+
    "midpoint between two empty or zero-symbol strings?")
  }

  if (approximate) {
    if (lexdist(d1, d2) > 0) {
      [d2, d1] = [ d1, d2 ];
    }
    for (var i = 0; i < mean.length; i++) {
      if ((i < d1.length && d1[i] < mean[i]) || (i >= d1.length && mean[i])) {
        break;
      }
    }
    return digits2string(mean.slice(s2 ? 0 : 1, i + 1), smap);
  }
  if (!s2) {
    mean.shift();
  }
  return digits2string(mean, smap);
}
var nums = arrToSymbolMap('0123456789'.split(''));
var bin = arrToSymbolMap('01'.split(''));
var base36 = arrToSymbolMap('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
doStrings('95', '9501', nums,true)
doLong('89', '91', nums)
doLong('89', '91', nums, true)
doLong('95', null, nums,!true)
doLong('b', null, az)
doStrings('b', null, az)
doLong('0','0',nums)

console.log(Array.from(Array(1000)).reduce((prev,curr)=>doLong('A', prev, base62, true), 'y').length)
doLong('b','y', base62)


function subdivPow2(a, b, smap, n) {
  var sols = [a , b];
  for (let i=0; i<n;i++){
    var tmp = [];
    for (let j=0;j<sols.length-1;j++) {
      tmp.push(doLong(sols[j], sols[j+1], smap, true));
    }
    sols = sols.concat(tmp)
    sols.sort();
  }
  return sols;
}

var tern = arrToSymbolMap('012'.split(''));

subdivPow2('1','11',tern, 9)
doLong('1','1000002',tern,true)
([1,2,3].concat([10,20,30])).sort()

function range0f(n, f) { return Array.from(Array(n), (_, i) => f(i)); }
function range(n) { return Array.from(Array(n), (_, i) => i); }
function empty(n) { return Array.from(Array(n)); }
function zeros(n) { return Array.from(Array(n), () => 0); }
function longAddRem(a, b, base) {
  if (a.den !== b.den) {
    throw new Error(
        'unimplemented: adding fractions of different denominators');
  }
  var res = longAdd(a.div, b.div, base);
  if (res.overflow) {
    throw new Error('unsupported: overflow add');
  }
  var rem = a.rem + b.rem;
  while (rem >= a.den) {
    rem -= a.den;
    var tmp = zeros(res.sum.length);
    tmp[tmp.length - 1] = 1;
    res = longAdd(res.sum, tmp, base);
    if (res.overflow) {
      throw new Error('unsupported: overflow add');
    }
  }
  return {div: res.sum, rem, den:a.den};
}
console.log(longAddRem({div: [4,5], rem:7, den:12}, {div:[4,5], rem:7, den:12}, 10))

function roundQuotientRemainder(sol, base) {
  var places = Math.ceil(Math.log(sol.den) / Math.log(base));
  var scale = Math.pow(10, places);
  var a = sol.div;
  var rem = Math.round(sol.rem * scale / sol.den);
  var remDigits = num2digits(rem, base);
  return sol.div.concat(zeros(places - remDigits.length)).concat(remDigits);
}
.1 + .1/19
roundQuotientRemainder({div: [1], rem: 1, den:19}, 10)

function subdivLinear(a,b,smap, n) {
  var base = smap.get('base');
  var aN = longDiv(a, n, base);
  var bN = longDiv(b, n, base);
  var as = empty(n-1);
  var bs = empty(n-1);
  as[0] = aN;
  bs[0] = bN;
  for (var i = 1; i< n-1; i++) {
    as[i] = longAddRem(aN, as[i-1], base);
    bs[i] = longAddRem(bN, bs[i-1], base);
  }
  as.reverse();
  var res = empty(n-1);
  for (i = 0; i < n-1; i++) {
    res[i] = longAddRem(as[i], bs[i], base);
  }
  return res;
}
300/19
[3,20,101].map(x=>1+Math.ceil(Math.log10(x)))

subdivLinear([1], [2], nums, 19)

range(19).map(i=>.1 + .1/19*i).map(x=>Math.round(x*10000)/10000)
subdivLinear([1], [2], nums, 19).map(x=>roundQuotientRemainder(x, nums.get('base')))
subdivLinear([9], [1], nums, 4)



// A symbol map might contain an 'escape hatch' symbol, i.e., one that is only
// used to find midpoints between equal strings. Such an escape hatch symbol
// would be one that is not in the standard symbol list. Using this escape hatch
// would effectively increase the base of this string, and indeed all strings,
// so it would be added to the symbol list, and future midpoints ought to use
// it---if the escape hatch didn't become a regular symbol, how could the
// midpoint system translate a string containing it to a number?

'qwe' < 'qwea'
// the problem with 'ba' is that there’s no string that can go between it and 'b'. This kind of implies that they’re the same string, given a-z symbols. I mean, if two integers have no integer between them, they're the same too right? It just so happens that, in lexicographic distance, sure 'b' < 'ba', but that doesn't change the underlying fact---integer 5 and 005 don't stop being the same even though their lexicographic distance is different.

~~~



##References

Cuneiform: http://it.stlawu.edu/~dmelvill/mesomath/Numbers.html and https://en.wikipedia.org/wiki/Sexagesimal#Babylonian_mathematics and Cuneiform Composite from http://oracc.museum.upenn.edu/doc/help/visitingoracc/fonts/index.html
