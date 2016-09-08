# Mudder.js

## Of numbers and digits
Let us begin by improving JavaScript’s built-in

- `Number.toString`, for converting numbers to strings, and
- `parseInt`, for converting strings to numbers,

because both of these are limited to radixes ≤36, and are limited to strings containing `0-9` and `a-z`. “Radix” here just means numeric base: here’s what these functions do, for the binary radix-2 and alphanumeric radix-36 cases:
~~~js
console.log([ parseInt('1010', 2), (10).toString(2) ])
console.log([ parseInt('7PS', 36), (10000).toString(36) ])
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

console.log(base36 === base10 && base10 === 10000);
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
console.log(toEmoji(42, mealSymbols1));
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

console.log(fromEmoji(toEmoji(42, mealSymbols1), mealSymbols1));
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
var arrToSymbolMap = symbols => new Map(symbols.map((str, idx) => [str, idx]))
                                    .set('array', symbols)
                                    .set('base', symbols.length);
console.log(arrToSymbolMap('🍌🍳☕️,🍱,🍣🍮'.split(',')));
~~~
The map includes a key `'array'` with value of the initial array to serve as the opposite, a mapping from numbers to symbols.

(Aside: we could have been very modern and used ES2015 `Symbol.for('array')` instead of the string `'array'` as the key.)

With this `Map` representing the symbol table, and helper functions `replaceAll` and `symbolMapToRegexp`…
~~~js
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
      rem : newNum % den
    };
  }, {div : [], rem : 0});
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



function lexdist(a,b) {
  const minlen = Math.min(a.length, b.length);
  for (let i = 0; i < minlen; i++){
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
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
doStrings('95', '9501', nums,true)
doLong('89', '91', nums)
doLong('89', '91', nums, true)
doLong('95', null, nums,!true)
doLong('b', null, az)
doStrings('b', null, az)
doLong('0','0',nums)

var binary = arrToSymbolMap("01".split(''));
doStrings('101', '11', binary,true)
doLong('10101', '11', binary,true)


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


## Decimal?
~~~js


~~~

##References

Cuneiform: http://it.stlawu.edu/~dmelvill/mesomath/Numbers.html and https://en.wikipedia.org/wiki/Sexagesimal#Babylonian_mathematics and Cuneiform Composite from http://oracc.museum.upenn.edu/doc/help/visitingoracc/fonts/index.html
