# Immutable.js Diff

High Fidelity diffs for Immutable.JS objects

Forked from [immutable-diff](https://github.com/intelie/immutable-js-diff) which focuses more on RFC 6902 style patches, requiring string values for the paths.

#### Changes from [immutable-diff](https://github.com/intelie/immutable-js-diff):

- `op.path` is now an `Immutable.List` rather than a patch style path, usable for `.updateIn`
- Support for complex values as keys
- `null` & `undefined` are considered separate values
- Babel/ES6 codebase

### API:

#### diff(a, b)

Creates a diff between `a` and `b`

``` javascript
var Immutable = require('immutable');
var diff = require('immutable-diff');

var map1 = Immutable.Map({a:1, b:2, c:3});
var map2 = Immutable.Map({a:1, b:2, c:3, d: 4});

diff(map1, map2);
// List [ Map { op: "add", path: ["d"], value: 4 } ]

var map1 = Immutable.Map({a:1, b:2, c:3});
var map2 = Immutable.Map({a:1, b:2, c:3, d: 4});
```

### Operations

#### `add`

A new key was added

#### `remove`

An existing key was removed

#### `replace`

An existing key was replaced with a new value

# License

MIT
