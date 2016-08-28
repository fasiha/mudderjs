# Mudder.js

## Of numbers and digits
Let us begin by improving JavaScript’s built-in

- `Number.toString`, for converting numbers to strings, and
- `parseInt`, for converting strings to numbers,

because both of these are limited to radixes ≤36, and are limited to strings containing `0-9` and `a-z`. “Radix” here just means numeric base: here’s what these functions do, for the binary radix-2 and alphanumeric radix-36 cases:
~~~js
[ parseInt('1010', 2), (10).toString(2) ]
/* result:
[10,"1010"]
*/
[ parseInt('7PS', 36), (10000).toString(36) ]
/* result:
[10000,"7ps"]
*/
~~~

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

JSON.stringify(base36 === base10 && base10 === 10000);
/* result:
true
*/
~~~

We’ll inevitably have to describe the algorithms used by `parseInt` and `Number.toString` that convert between JavaScript `Number`s and their stringy representations, given a base and symbol table, but let’s specify how symbol tables ought to work in this library.

Relevant aside: it’s not a requirement that the entries in the symbol table be lexicographically-sorted, but that is super-important in some applications.

A symbol table can be provided as:

1. **a string** Great for those simple use-cases, the string can be split into characters using `String.split('')`, and each character is the symbol for its index number.
1. **an array of strings** Similar story, just skip `String.split`. This is nice because we can have multi-“character” symbols, such as emoji (which `String.split` will butcher), or words (in any language, even cuneiform—want to know how to write your age using your family members’ names as symbols? just wait…).
1. **an object mapping stringy symbols to numbers** This would let us specify fully-generic symbol tables like `parseInt`’s, where both `'A'` and `'a'` correspond to 10. When multiple symbols map to the same number, we need a way to know which of them is the “default” for converting numbers to stringy digits (like how `Number.toString` outputs only lowercase letters).

This discussion of `String.split` reminds me—how will this library’s `parseInt` break up stringy inputs into symbols? If we have a ternary radix-3 system where 0=🍌🍳☕️, 1=🍱, and 2=🍣🍮 (my three meals of the day),
~~~js
JSON.stringify('🍱🍱🍣🍮🍌🍳☕️'.split(''));
/* result:
["�","�","�","�","�","�","�","�","�","�","�","�","☕","️"]
*/
~~~
would be completely unsuitable. You know what…? Oh fine, let’s write some code to generate those tasty numbers:
~~~js
// We’d like to call `toEmoji(42, '🍌🍳☕️,🍱,🍣🍮'.split(','))`:
var toEmoji = (x, symbols) => symbols.reduce(
    (prev, curr, i) => prev.replace(new RegExp(i, 'g'), curr),
    x.toString(symbols.length));

var mealSymbols1 = '🍌🍳☕️,🍱,🍣🍮'.split(',');
JSON.stringify(toEmoji(42, mealSymbols1));
/* result:
"🍱🍱🍣🍮🍌🍳☕️"
*/
~~~
(42)<sub>10</sub> with this symbol table is (🍱🍱🍣🍮🍌🍳☕️)<sub>today’s meals</sub>. With some regular expression fanciness, we can extract the epicurean symbols and get back a number:
~~~js
var fromEmoji = (x, symbols) => parseInt(
    x.match(new RegExp(symbols.map(s => `(${s})`).join('|'), 'g'))
        .map(symbol => '' + symbols.findIndex(elt => elt === symbol))
        .join(''),
    symbols.length);

JSON.stringify(fromEmoji(toEmoji(42, mealSymbols1), mealSymbols1));
/* result:
42
*/
~~~
BUT WAIT! What happens if I have voluminous bento leftovers 🍱 for dinner? Then the symbol for 2 is 🍱🍮:
~~~js
var mealSymbolsBad = '🍌🍳☕️,🍱,🍱🍮'.split(',');
JSON.stringify(toEmoji(42, mealSymbolsBad))
/* result:
"🍱🍱🍱🍮🍌🍳☕️"
*/
JSON.stringify(fromEmoji(toEmoji(42, mealSymbolsBad), mealSymbolsBad));
/* result:
39
*/
~~~
We get the wrong answer. I’m writing this on the fly here, and it’s very possible I have a bug in `to/fromEmoji` but actually, there’s a real problem here: one of the symbols is another symbol’s prefix, so the regular expression snaps up the first 🍱=lunch=1 in 🍱🍮=dinner=2, fails to match the lone suffix ‘🍮’ so skips it, and generally makes a mess of things.

At this stage one might recall reading about Huffman coding, or Dr El Gamal’s lecture on [prefix codes](https://en.wikipedia.org/wiki/Prefix_code) in information theory class. One way or another, we decide that, if we consume a plain string without any ‘commas’ (non-numeric inter-symbol punctuation), the symbol table has to be prefix-free, i.e., *no complete symbol can serve as prefix to another symbol.*

(Aside: in this particular example, the presence of prefixing isn’t catastrophic—in fact, by constructing a regular expression with symbols arranged longest-to-shortest (in terms of number of characters), it would have worked—but only because the trailing suffix, 🍮 dessert, wasn’t itself a symbol. Prefix codes buy us simplicity of decoding, but if you really want symbol tables with prefixes, write to me and we can work out the details.)

So if our super-`parseInt` is working with a _not_-prefix-free symbol table, it should only accept an array, each element of which is a single stringy symbol. If its symbol table _is_ prefix-free, a string of symbols, like `'🍱🍱🍣🍮🍌🍳☕️'` is acceptable if hunger-inducing.

### Explaining code craziness

Please don’t write code like the above, with chained `map`–`reduce`–`findIndex` insanity and quadratic searches—I’ve been thinking about these things for a bit and just wanted to throw something together. Here’s a more annotated version of both `toEmoji` and `fromEmoji`:

First, let’s make a symbol table `Map` (ES2015 hash table) to go from symbols to numbers ≤`B=3`. This lets us avoid the horrible `findIndex` in `fromEmoi`.
~~~js
var arrToSymbolMap = symbols =>
  new Map(symbols.map((str, idx) => [str, idx])).set('array', symbols);
arrToSymbolMap('🍌🍳☕️,🍱,🍣🍮'.split(','));
/* result:
Map {
  '🍌🍳☕️' => 0,
  '🍱' => 1,
  '🍣🍮' => 2,
  'array' => [ '🍌🍳☕️', '🍱', '🍣🍮' ] }
*/
~~~
The map includes a key `'array'` with value of the initial array to serve as the opposite, a mapping from numbers to symbols.

(Aside: we could have been very modern and used ES2015 `Symbol.for('array')` instead of the string `'array'` as the key.)

With this `Map` representing the symbol table, and helper functions `replaceAll` and `symbolMapToRegexp`, we can rewrite `toEmoji` and `fromEmoji`—it still uses `Number.toString` underneath for now and converts `[0-2]` (a perfectly serviceable way to represent numbers in ternary) to emoji.
~~~js
var mealMap = arrToSymbolMap('🍌🍳☕️,🍱,🍣🍮'.split(','));

var replaceAll = (s, search, replace) =>
  s.replace(new RegExp(search, 'g'), replace);

var symbolMapToRegexp = symbolsMap =>
  new RegExp(symbolsMap.get('array').map(s => `(${s})`).join('|'), 'g');

var toEmoji = (x, symbolsMap) =>
  symbolsMap.get('array').reduce((prev, curr, i) => replaceAll(prev, i, curr),
                                 x.toString(symbolsMap.get('array').length));

var fromEmoji = (x, symbolsMap) =>
  parseInt(x.match(symbolMapToRegexp(symbolsMap))
             .map(symbol => symbolsMap.get(symbol))
             .join(''),
           symbolsMap.get('array').length);
~~~
Let’s make sure it still works:
~~~js
fromEmoji(toEmoji(42, mealMap), mealMap);
/* result:
42
*/
~~~

## References

Cuneiform: http://it.stlawu.edu/~dmelvill/mesomath/Numbers.html and https://en.wikipedia.org/wiki/Sexagesimal#Babylonian_mathematics and Cuneiform Composite from http://oracc.museum.upenn.edu/doc/help/visitingoracc/fonts/index.html
