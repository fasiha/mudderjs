(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.mudder = global.mudder || {})));
}(this, (function (exports) { 'use strict';

var toStr$2 = Object.prototype.toString;

var __moduleExports$2 = function isArguments(value) {
	var str = toStr$2.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' && value !== null && typeof value === 'object' && typeof value.length === 'number' && value.length >= 0 && toStr$2.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

// modified from https://github.com/es-shims/es5-shim
var has = Object.prototype.hasOwnProperty;
var toStr$1 = Object.prototype.toString;
var slice = Array.prototype.slice;
var isArgs = __moduleExports$2;
var isEnumerable = Object.prototype.propertyIsEnumerable;
var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
var dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];
var equalsConstructorPrototype = function (o) {
	var ctor = o.constructor;
	return ctor && ctor.prototype === o;
};
var excludedKeys = {
	$console: true,
	$external: true,
	$frame: true,
	$frameElement: true,
	$frames: true,
	$innerHeight: true,
	$innerWidth: true,
	$outerHeight: true,
	$outerWidth: true,
	$pageXOffset: true,
	$pageYOffset: true,
	$parent: true,
	$scrollLeft: true,
	$scrollTop: true,
	$scrollX: true,
	$scrollY: true,
	$self: true,
	$webkitIndexedDB: true,
	$webkitStorageInfo: true,
	$window: true
};
var hasAutomationEqualityBug = function () {
	/* global window */
	if (typeof window === 'undefined') {
		return false;
	}
	for (var k in window) {
		try {
			if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
				try {
					equalsConstructorPrototype(window[k]);
				} catch (e) {
					return true;
				}
			}
		} catch (e) {
			return true;
		}
	}
	return false;
}();
var equalsConstructorPrototypeIfNotBuggy = function (o) {
	/* global window */
	if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
		return equalsConstructorPrototype(o);
	}
	try {
		return equalsConstructorPrototype(o);
	} catch (e) {
		return false;
	}
};

var keysShim = function keys(object) {
	var isObject = object !== null && typeof object === 'object';
	var isFunction = toStr$1.call(object) === '[object Function]';
	var isArguments = isArgs(object);
	var isString = isObject && toStr$1.call(object) === '[object String]';
	var theKeys = [];

	if (!isObject && !isFunction && !isArguments) {
		throw new TypeError('Object.keys called on a non-object');
	}

	var skipProto = hasProtoEnumBug && isFunction;
	if (isString && object.length > 0 && !has.call(object, 0)) {
		for (var i = 0; i < object.length; ++i) {
			theKeys.push(String(i));
		}
	}

	if (isArguments && object.length > 0) {
		for (var j = 0; j < object.length; ++j) {
			theKeys.push(String(j));
		}
	} else {
		for (var name in object) {
			if (!(skipProto && name === 'prototype') && has.call(object, name)) {
				theKeys.push(String(name));
			}
		}
	}

	if (hasDontEnumBug) {
		var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

		for (var k = 0; k < dontEnums.length; ++k) {
			if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
				theKeys.push(dontEnums[k]);
			}
		}
	}
	return theKeys;
};

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = function () {
			// Safari 5.0 bug
			return (Object.keys(arguments) || '').length === 2;
		}(1, 2);
		if (!keysWorksWithArguments) {
			var originalKeys = Object.keys;
			Object.keys = function keys(object) {
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				} else {
					return originalKeys(object);
				}
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

var __moduleExports$1 = keysShim;

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

var __moduleExports$3 = function forEach(obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};

var keys = __moduleExports$1;
var foreach = __moduleExports$3;
var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';

var toStr = Object.prototype.toString;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
};

var arePropertyDescriptorsSupported = function () {
	var obj = {};
	try {
		Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
		/* eslint-disable no-unused-vars, no-restricted-syntax */
		for (var _ in obj) {
			return false;
		}
		/* eslint-enable no-unused-vars, no-restricted-syntax */
		return obj.x === obj;
	} catch (e) {
		/* this is IE 8. */
		return false;
	}
};
var supportsDescriptors = Object.defineProperty && arePropertyDescriptorsSupported();

var defineProperty = function (object, name, value, predicate) {
	if (name in object && (!isFunction(predicate) || !predicate())) {
		return;
	}
	if (supportsDescriptors) {
		Object.defineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value;
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = keys(map);
	if (hasSymbols) {
		props = props.concat(Object.getOwnPropertySymbols(map));
	}
	foreach(props, function (name) {
		defineProperty(object, name, map[name], predicates[name]);
	});
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

var __moduleExports = defineProperties;

var __moduleExports$7 = Number.isNaN || function isNaN(a) {
	return a !== a;
};

var $isNaN$1 = Number.isNaN || function (a) {
  return a !== a;
};

var __moduleExports$8 = Number.isFinite || function (x) {
  return typeof x === 'number' && !$isNaN$1(x) && x !== Infinity && x !== -Infinity;
};

var has$2 = Object.prototype.hasOwnProperty;
var __moduleExports$9 = Object.assign || function assign(target, source) {
	for (var key in source) {
		if (has$2.call(source, key)) {
			target[key] = source[key];
		}
	}
	return target;
};

var __moduleExports$10 = function sign(number) {
	return number >= 0 ? 1 : -1;
};

var __moduleExports$11 = function mod(number, modulo) {
	var remain = number % modulo;
	return Math.floor(remain >= 0 ? remain : remain + modulo);
};

var __moduleExports$12 = function isPrimitive(value) {
	return value === null || typeof value !== 'function' && typeof value !== 'object';
};

var __moduleExports$14 = function isPrimitive(value) {
	return value === null || typeof value !== 'function' && typeof value !== 'object';
};

var fnToStr = Function.prototype.toString;

var constructorRegex = /^\s*class /;
var isES6ClassFn = function isES6ClassFn(value) {
	try {
		var fnStr = fnToStr.call(value);
		var singleStripped = fnStr.replace(/\/\/.*\n/g, '');
		var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, '');
		var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' ');
		return constructorRegex.test(spaceStripped);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionObject(value) {
	try {
		if (isES6ClassFn(value)) {
			return false;
		}
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$4 = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var __moduleExports$15 = function isCallable(value) {
	if (!value) {
		return false;
	}
	if (typeof value !== 'function' && typeof value !== 'object') {
		return false;
	}
	if (hasToStringTag) {
		return tryFunctionObject(value);
	}
	if (isES6ClassFn(value)) {
		return false;
	}
	var strClass = toStr$4.call(value);
	return strClass === fnClass || strClass === genClass;
};

var getDay = Date.prototype.getDay;
var tryDateObject = function tryDateObject(value) {
	try {
		getDay.call(value);
		return true;
	} catch (e) {
		return false;
	}
};

var toStr$5 = Object.prototype.toString;
var dateClass = '[object Date]';
var hasToStringTag$1 = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var __moduleExports$16 = function isDateObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	return hasToStringTag$1 ? tryDateObject(value) : toStr$5.call(value) === dateClass;
};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var __moduleExports$17 = createCommonjsModule(function (module) {
	'use strict';

	var toStr = Object.prototype.toString;
	var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';

	if (hasSymbols) {
		var symToStr = Symbol.prototype.toString;
		var symStringRegex = /^Symbol\(.*\)$/;
		var isSymbolObject = function isSymbolObject(value) {
			if (typeof value.valueOf() !== 'symbol') {
				return false;
			}
			return symStringRegex.test(symToStr.call(value));
		};
		module.exports = function isSymbol(value) {
			if (typeof value === 'symbol') {
				return true;
			}
			if (toStr.call(value) !== '[object Symbol]') {
				return false;
			}
			try {
				return isSymbolObject(value);
			} catch (e) {
				return false;
			}
		};
	} else {
		module.exports = function isSymbol(value) {
			// this environment does not support Symbols.
			return false;
		};
	}
});

var hasSymbols$2 = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';

var isPrimitive$1 = __moduleExports$14;
var isCallable = __moduleExports$15;
var isDate = __moduleExports$16;
var isSymbol = __moduleExports$17;

var ordinaryToPrimitive = function OrdinaryToPrimitive(O, hint) {
	if (typeof O === 'undefined' || O === null) {
		throw new TypeError('Cannot call method on ' + O);
	}
	if (typeof hint !== 'string' || hint !== 'number' && hint !== 'string') {
		throw new TypeError('hint must be "string" or "number"');
	}
	var methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
	var method, result, i;
	for (i = 0; i < methodNames.length; ++i) {
		method = O[methodNames[i]];
		if (isCallable(method)) {
			result = method.call(O);
			if (isPrimitive$1(result)) {
				return result;
			}
		}
	}
	throw new TypeError('No default value');
};

var GetMethod = function GetMethod(O, P) {
	var func = O[P];
	if (func !== null && typeof func !== 'undefined') {
		if (!isCallable(func)) {
			throw new TypeError(func + ' returned for property ' + P + ' of object ' + O + ' is not a function');
		}
		return func;
	}
};

// http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive
var __moduleExports$13 = function ToPrimitive(input, PreferredType) {
	if (isPrimitive$1(input)) {
		return input;
	}
	var hint = 'default';
	if (arguments.length > 1) {
		if (PreferredType === String) {
			hint = 'string';
		} else if (PreferredType === Number) {
			hint = 'number';
		}
	}

	var exoticToPrim;
	if (hasSymbols$2) {
		if (Symbol.toPrimitive) {
			exoticToPrim = GetMethod(input, Symbol.toPrimitive);
		} else if (isSymbol(input)) {
			exoticToPrim = Symbol.prototype.valueOf;
		}
	}
	if (typeof exoticToPrim !== 'undefined') {
		var result = exoticToPrim.call(input, hint);
		if (isPrimitive$1(result)) {
			return result;
		}
		throw new TypeError('unable to convert exotic object to primitive');
	}
	if (hint === 'default' && (isDate(input) || isSymbol(input))) {
		hint = 'string';
	}
	return ordinaryToPrimitive(input, hint === 'default' ? 'number' : hint);
};

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice$1 = Array.prototype.slice;
var toStr$6 = Object.prototype.toString;
var funcType = '[object Function]';

var __moduleExports$19 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$6.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice$1.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(this, args.concat(slice$1.call(arguments)));
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(that, args.concat(slice$1.call(arguments)));
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation$1 = __moduleExports$19;

var __moduleExports$18 = Function.prototype.bind || implementation$1;

var toStr$7 = Object.prototype.toString;

var isPrimitive$2 = __moduleExports$14;

var isCallable$1 = __moduleExports$15;

// https://es5.github.io/#x8.12
var ES5internalSlots = {
	'[[DefaultValue]]': function (O, hint) {
		var actualHint = hint || (toStr$7.call(O) === '[object Date]' ? String : Number);

		if (actualHint === String || actualHint === Number) {
			var methods = actualHint === String ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
			var value, i;
			for (i = 0; i < methods.length; ++i) {
				if (isCallable$1(O[methods[i]])) {
					value = O[methods[i]]();
					if (isPrimitive$2(value)) {
						return value;
					}
				}
			}
			throw new TypeError('No default value');
		}
		throw new TypeError('invalid [[DefaultValue]] hint supplied');
	}
};

// https://es5.github.io/#x9
var __moduleExports$21 = function ToPrimitive(input, PreferredType) {
	if (isPrimitive$2(input)) {
		return input;
	}
	return ES5internalSlots['[[DefaultValue]]'](input, PreferredType);
};

var $isNaN$2 = __moduleExports$7;
var $isFinite$1 = __moduleExports$8;

var sign$1 = __moduleExports$10;
var mod$1 = __moduleExports$11;

var IsCallable = __moduleExports$15;
var toPrimitive$1 = __moduleExports$21;

// https://es5.github.io/#x9
var ES5$1 = {
	ToPrimitive: toPrimitive$1,

	ToBoolean: function ToBoolean(value) {
		return Boolean(value);
	},
	ToNumber: function ToNumber(value) {
		return Number(value);
	},
	ToInteger: function ToInteger(value) {
		var number = this.ToNumber(value);
		if ($isNaN$2(number)) {
			return 0;
		}
		if (number === 0 || !$isFinite$1(number)) {
			return number;
		}
		return sign$1(number) * Math.floor(Math.abs(number));
	},
	ToInt32: function ToInt32(x) {
		return this.ToNumber(x) >> 0;
	},
	ToUint32: function ToUint32(x) {
		return this.ToNumber(x) >>> 0;
	},
	ToUint16: function ToUint16(value) {
		var number = this.ToNumber(value);
		if ($isNaN$2(number) || number === 0 || !$isFinite$1(number)) {
			return 0;
		}
		var posInt = sign$1(number) * Math.floor(Math.abs(number));
		return mod$1(posInt, 0x10000);
	},
	ToString: function ToString(value) {
		return String(value);
	},
	ToObject: function ToObject(value) {
		this.CheckObjectCoercible(value);
		return Object(value);
	},
	CheckObjectCoercible: function CheckObjectCoercible(value, optMessage) {
		/* jshint eqnull:true */
		if (value == null) {
			throw new TypeError(optMessage || 'Cannot call method on ' + value);
		}
		return value;
	},
	IsCallable: IsCallable,
	SameValue: function SameValue(x, y) {
		if (x === y) {
			// 0 === -0, but they are not identical.
			if (x === 0) {
				return 1 / x === 1 / y;
			}
			return true;
		}
		return $isNaN$2(x) && $isNaN$2(y);
	},

	// http://www.ecma-international.org/ecma-262/5.1/#sec-8
	Type: function Type(x) {
		if (x === null) {
			return 'Null';
		}
		if (typeof x === 'undefined') {
			return 'Undefined';
		}
		if (typeof x === 'function' || typeof x === 'object') {
			return 'Object';
		}
		if (typeof x === 'number') {
			return 'Number';
		}
		if (typeof x === 'boolean') {
			return 'Boolean';
		}
		if (typeof x === 'string') {
			return 'String';
		}
	}
};

var __moduleExports$20 = ES5$1;

var regexExec = RegExp.prototype.exec;
var tryRegexExec = function tryRegexExec(value) {
	try {
		regexExec.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$8 = Object.prototype.toString;
var regexClass = '[object RegExp]';
var hasToStringTag$2 = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var __moduleExports$22 = function isRegex(value) {
	if (typeof value !== 'object') {
		return false;
	}
	return hasToStringTag$2 ? tryRegexExec(value) : toStr$8.call(value) === regexClass;
};

var toStr$3 = Object.prototype.toString;
var hasSymbols$1 = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';
var symbolToStr = hasSymbols$1 ? Symbol.prototype.toString : toStr$3;

var $isNaN = __moduleExports$7;
var $isFinite = __moduleExports$8;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

var assign$1 = __moduleExports$9;
var sign = __moduleExports$10;
var mod = __moduleExports$11;
var isPrimitive = __moduleExports$12;
var toPrimitive = __moduleExports$13;
var parseInteger = parseInt;
var bind$1 = __moduleExports$18;
var strSlice = bind$1.call(Function.call, String.prototype.slice);
var isBinary = bind$1.call(Function.call, RegExp.prototype.test, /^0b[01]+$/i);
var isOctal = bind$1.call(Function.call, RegExp.prototype.test, /^0o[0-7]+$/i);
var nonWS = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex = new RegExp('[' + nonWS + ']', 'g');
var hasNonWS = bind$1.call(Function.call, RegExp.prototype.test, nonWSregex);
var invalidHexLiteral = /^[\-\+]0x[0-9a-f]+$/i;
var isInvalidHexLiteral = bind$1.call(Function.call, RegExp.prototype.test, invalidHexLiteral);

// whitespace from: http://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws = ['\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003', '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028', '\u2029\uFEFF'].join('');
var trimRegex = new RegExp('(^[' + ws + ']+)|([' + ws + ']+$)', 'g');
var replace = bind$1.call(Function.call, String.prototype.replace);
var trim = function (value) {
	return replace(value, trimRegex, '');
};

var ES5 = __moduleExports$20;

var hasRegExpMatcher = __moduleExports$22;

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-abstract-operations
var ES6$1 = assign$1(assign$1({}, ES5), {

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-call-f-v-args
	Call: function Call(F, V) {
		var args = arguments.length > 2 ? arguments[2] : [];
		if (!this.IsCallable(F)) {
			throw new TypeError(F + ' is not a function');
		}
		return F.apply(V, args);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toprimitive
	ToPrimitive: toPrimitive,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toboolean
	// ToBoolean: ES5.ToBoolean,

	// http://www.ecma-international.org/ecma-262/6.0/#sec-tonumber
	ToNumber: function ToNumber(argument) {
		var value = isPrimitive(argument) ? argument : toPrimitive(argument, 'number');
		if (typeof value === 'symbol') {
			throw new TypeError('Cannot convert a Symbol value to a number');
		}
		if (typeof value === 'string') {
			if (isBinary(value)) {
				return this.ToNumber(parseInteger(strSlice(value, 2), 2));
			} else if (isOctal(value)) {
				return this.ToNumber(parseInteger(strSlice(value, 2), 8));
			} else if (hasNonWS(value) || isInvalidHexLiteral(value)) {
				return NaN;
			} else {
				var trimmed = trim(value);
				if (trimmed !== value) {
					return this.ToNumber(trimmed);
				}
			}
		}
		return Number(value);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tointeger
	// ToInteger: ES5.ToNumber,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint32
	// ToInt32: ES5.ToInt32,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint32
	// ToUint32: ES5.ToUint32,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint16
	ToInt16: function ToInt16(argument) {
		var int16bit = this.ToUint16(argument);
		return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint16
	// ToUint16: ES5.ToUint16,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint8
	ToInt8: function ToInt8(argument) {
		var int8bit = this.ToUint8(argument);
		return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8
	ToUint8: function ToUint8(argument) {
		var number = this.ToNumber(argument);
		if ($isNaN(number) || number === 0 || !$isFinite(number)) {
			return 0;
		}
		var posInt = sign(number) * Math.floor(Math.abs(number));
		return mod(posInt, 0x100);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8clamp
	ToUint8Clamp: function ToUint8Clamp(argument) {
		var number = this.ToNumber(argument);
		if ($isNaN(number) || number <= 0) {
			return 0;
		}
		if (number >= 0xFF) {
			return 0xFF;
		}
		var f = Math.floor(argument);
		if (f + 0.5 < number) {
			return f + 1;
		}
		if (number < f + 0.5) {
			return f;
		}
		if (f % 2 !== 0) {
			return f + 1;
		}
		return f;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tostring
	ToString: function ToString(argument) {
		if (typeof argument === 'symbol') {
			throw new TypeError('Cannot convert a Symbol value to a string');
		}
		return String(argument);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toobject
	ToObject: function ToObject(value) {
		this.RequireObjectCoercible(value);
		return Object(value);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-topropertykey
	ToPropertyKey: function ToPropertyKey(argument) {
		var key = this.ToPrimitive(argument, String);
		return typeof key === 'symbol' ? symbolToStr.call(key) : this.ToString(key);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
	ToLength: function ToLength(argument) {
		var len = this.ToInteger(argument);
		if (len <= 0) {
			return 0;
		} // includes converting -0 to +0
		if (len > MAX_SAFE_INTEGER) {
			return MAX_SAFE_INTEGER;
		}
		return len;
	},

	// http://www.ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring
	CanonicalNumericIndexString: function CanonicalNumericIndexString(argument) {
		if (toStr$3.call(argument) !== '[object String]') {
			throw new TypeError('must be a string');
		}
		if (argument === '-0') {
			return -0;
		}
		var n = this.ToNumber(argument);
		if (this.SameValue(this.ToString(n), argument)) {
			return n;
		}
		return void 0;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-requireobjectcoercible
	RequireObjectCoercible: ES5.CheckObjectCoercible,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isarray
	IsArray: Array.isArray || function IsArray(argument) {
		return toStr$3.call(argument) === '[object Array]';
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-iscallable
	// IsCallable: ES5.IsCallable,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isconstructor
	IsConstructor: function IsConstructor(argument) {
		return typeof argument === 'function' && !!argument.prototype; // unfortunately there's no way to truly check this without try/catch `new argument`
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isextensible-o
	IsExtensible: function IsExtensible(obj) {
		if (!Object.preventExtensions) {
			return true;
		}
		if (isPrimitive(obj)) {
			return false;
		}
		return Object.isExtensible(obj);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isinteger
	IsInteger: function IsInteger(argument) {
		if (typeof argument !== 'number' || $isNaN(argument) || !$isFinite(argument)) {
			return false;
		}
		var abs = Math.abs(argument);
		return Math.floor(abs) === abs;
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ispropertykey
	IsPropertyKey: function IsPropertyKey(argument) {
		return typeof argument === 'string' || typeof argument === 'symbol';
	},

	// http://www.ecma-international.org/ecma-262/6.0/#sec-isregexp
	IsRegExp: function IsRegExp(argument) {
		if (!argument || typeof argument !== 'object') {
			return false;
		}
		if (hasSymbols$1) {
			var isRegExp = argument[Symbol.match];
			if (typeof isRegExp !== 'undefined') {
				return ES5.ToBoolean(isRegExp);
			}
		}
		return hasRegExpMatcher(argument);
	},

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevalue
	// SameValue: ES5.SameValue,

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
	SameValueZero: function SameValueZero(x, y) {
		return x === y || $isNaN(x) && $isNaN(y);
	},

	Type: function Type(x) {
		if (typeof x === 'symbol') {
			return 'Symbol';
		}
		return ES5.Type(x);
	},

	// http://www.ecma-international.org/ecma-262/6.0/#sec-speciesconstructor
	SpeciesConstructor: function SpeciesConstructor(O, defaultConstructor) {
		if (this.Type(O) !== 'Object') {
			throw new TypeError('Assertion failed: Type(O) is not Object');
		}
		var C = O.constructor;
		if (typeof C === 'undefined') {
			return defaultConstructor;
		}
		if (this.Type(C) !== 'Object') {
			throw new TypeError('O.constructor is not an Object');
		}
		var S = hasSymbols$1 && Symbol.species ? C[Symbol.species] : undefined;
		if (S == null) {
			return defaultConstructor;
		}
		if (this.IsConstructor(S)) {
			return S;
		}
		throw new TypeError('no constructor found');
	}
});

delete ES6$1.CheckObjectCoercible; // renamed in ES6 to RequireObjectCoercible

var __moduleExports$6 = ES6$1;

var ES6 = __moduleExports$6;
var assign = __moduleExports$9;

var ES7 = assign(ES6, {
	// https://github.com/tc39/ecma262/pull/60
	SameValueNonNumber: function SameValueNonNumber(x, y) {
		if (typeof x === 'number' || typeof x !== typeof y) {
			throw new TypeError('SameValueNonNumber requires two non-number values of the same type.');
		}
		return this.SameValue(x, y);
	}
});

var __moduleExports$5 = ES7;

var bind$2 = __moduleExports$18;

var __moduleExports$23 = bind$2.call(Function.call, Object.prototype.hasOwnProperty);

var ES = __moduleExports$5;
var has$1 = __moduleExports$23;
var bind = __moduleExports$18;
var isEnumerable$1 = bind.call(Function.call, Object.prototype.propertyIsEnumerable);

var __moduleExports$4 = function entries(O) {
	var obj = ES.RequireObjectCoercible(O);
	var entrys = [];
	for (var key in obj) {
		if (has$1(obj, key) && isEnumerable$1(obj, key)) {
			entrys.push([key, obj[key]]);
		}
	}
	return entrys;
};

var implementation$2 = __moduleExports$4;

var __moduleExports$24 = function getPolyfill() {
	return typeof Object.entries === 'function' ? Object.entries : implementation$2;
};

var getPolyfill$1 = __moduleExports$24;
var define$1 = __moduleExports;

var __moduleExports$25 = function shimEntries() {
	var polyfill = getPolyfill$1();
	define$1(Object, { entries: polyfill }, { entries: function () {
			return Object.entries !== polyfill;
		} });
	return polyfill;
};

var define = __moduleExports;

var implementation = __moduleExports$4;
var getPolyfill = __moduleExports$24;
var shim = __moduleExports$25;

define(implementation, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

var index = implementation;

function isPrefixCode(strings) {
  // Note: we skip checking for prefixness if two symbols are equal to each
  // other. This implies that repeated symbols in the input are *silently
  // ignored*!
  for (const i of strings) {
    for (const j of strings) {
      if (j === i) {
        // [🍅]
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

function isPrefixCodeLogLinear(strings) {
  strings = Array.from(strings).sort(); // set->array or array->copy
  for (const [i, curr] of strings.entries()) {
    const prev = strings[i - 1]; // undefined for first iteration
    if (prev === curr) {
      // Skip repeated entries, match quadratic API
      continue;
    }
    if (curr.startsWith(prev)) {
      // str.startsWith(undefined) always false
      return false;
    };
  }
  return true;
}
// < export mudder.js

isPrefixCode = isPrefixCodeLogLinear;
// < export mudder.js

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
    throw new TypeError('constructor called as a function');
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
    symbolsMap = new Map(Object.entries(symbolsMap)); // [🌪]
  } else {
    throw new TypeError('symbolsMap can be omitted, a Map, or an Object');
  }

  // Ensure that each integer from 0 to `symbolsArr.length - 1` is a value in
  // `symbolsMap`
  let symbolsValuesSet = new Set(symbolsMap.values());
  for (let i = 0; i < symbolsArr.length; i++) {
    if (!symbolsValuesSet.has(i)) {
      throw new RangeError(symbolsArr.length + ' symbols given but ' + i + ' not found in symbol table');
    }
  }

  this.num2sym = symbolsArr;
  this.sym2num = symbolsMap;
  this.maxBase = this.num2sym.length;
  this.isPrefixCode = isPrefixCode(symbolsArr);
}
// < export mudder.js

if (!Object.entries) {
  index.shim();
}
// < export mudder.js

SymbolTable.prototype.numberToDigits = function (num, base) {
  base = base || this.maxBase;
  let digits = [];
  while (num >= 1) {
    digits.push(num % base);
    num = Math.floor(num / base);
  }
  return digits.length ? digits.reverse() : [0];
};
// < export mudder.js

SymbolTable.prototype.digitsToString = function (digits) {
  return digits.map(n => this.num2sym[n]).join('');
};
// < export mudder.js

SymbolTable.prototype.stringToDigits = function (string) {
  if (!this.isPrefixCode && typeof string === 'string') {
    throw new TypeError('parsing string without prefix code is unsupported. Pass in array of stringy symbols?');
  }
  if (typeof string === 'string') {
    const re = new RegExp('(' + this.num2sym.join('|') + ')', 'g');
    string = string.match(re);
  }
  return string.map(symbol => this.sym2num.get(symbol));
};
// < export mudder.js

SymbolTable.prototype.digitsToNumber = function (digits, base) {
  base = base || this.maxBase;
  let currBase = 1;
  return digits.reduceRight((accum, curr) => {
    let ret = accum + curr * currBase;
    currBase *= base;
    return ret;
  }, 0);
};
// < export mudder.js

function longDiv(numeratorArr, den, base) {
  return numeratorArr.reduce((prev, curr) => {
    let newNum = curr + prev.rem * base;
    return {
      res: prev.res.concat(Math.floor(newNum / den)),
      rem: newNum % den, den
    };
  }, { res: [], rem: 0, den });
}
// < export mudder.js

function longAddSameLen(a, b, base, rem, den) {
  if (a.length !== b.length) {
    throw new Error('same length arrays needed');
  }
  let carry = rem >= den,
      res = b.slice();
  if (carry) {
    rem -= den;
  }
  a.reduceRight((_, ai, i) => {
    const result = ai + b[i] + carry;
    carry = result >= base;
    res[i] = carry ? result - base : result;
  }, null);
  return { res, carry, rem, den };
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
  aDiv = longDiv(a, N + 1, base);
  bDiv = longDiv(b, N + 1, base);
  let as = [aDiv];
  let bs = [bDiv];
  for (let i = 2; i <= N; i++) {
    as.push(longAddSameLen(as[i - 2].res, aDiv.res, base, aDiv.rem + as[i - 2].rem, N + 1));
    bs.push(longAddSameLen(bs[i - 2].res, bDiv.res, base, bDiv.rem + bs[i - 2].rem, N + 1));
  }
  as.reverse();
  return as.map((a, i) => longAddSameLen(a.res, bs[i].res, base, a.rem + bs[i].rem, N + 1));
}

function leftpad(arr, finalLength, val) {
  const padlen = Math.max(0, finalLength - arr.length);
  return Array(padlen).fill(val || 0).concat(arr);
}

SymbolTable.prototype.roundFraction = function (numerator, denominator, base) {
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
  return strings.slice(1).reduce((accum, curr) => accum.concat([chopDigits(accum[accum.length - 1], curr)]), [strings[0]]);
}

function truncateLexHigher(lo, hi) {
  const swapped = lo > hi;
  if (swapped) {
    [lo, hi] = [hi, lo];
  }
  hi = hi.slice(0, lo.length + 1);
  if (swapped) {
    return [hi, lo];
  }
  return [lo, hi];
}

SymbolTable.prototype.mudder = function (a, b, base, numStrings) {
  base = base || this.maxBase;
  [a, b] = truncateLexHigher(a, b);
  const ad = this.stringToDigits(a, base);
  const bd = this.stringToDigits(b, base);
  const intermediateDigits = longLinspace(ad, bd, base, numStrings || 1);
  let finalDigits = intermediateDigits.map(v => v.res.concat(this.roundFraction(v.rem, v.den, base)));
  finalDigits.unshift(ad);
  return chopSuccessiveDigits(finalDigits).slice(1).map(v => this.digitsToString(v));
};
// < export mudder.js

var base62 = new SymbolTable('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
var base36 = new SymbolTable('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
var alphaupper = new SymbolTable('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
var alphalower = new SymbolTable('abcdefghijklmnopqrstuvwxyz');

exports.SymbolTable = SymbolTable;
exports.base62 = base62;
exports.base36 = base36;
exports.alphaupper = alphaupper;
exports.alphalower = alphalower;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=mudder.js.map
