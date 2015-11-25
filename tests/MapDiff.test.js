import diff from '../lib/diff'
import {fromJS, is, Map as IMap} from 'immutable'
import JSC from 'jscheck'
import assert from 'assert'

describe('Map diff', function() {
  var failure = null;

  before(function() {
    JSC.on_report(function(report) {
      console.log(report);
    });

    JSC.on_fail(function(jsc_failure) {
      failure = jsc_failure;
    });
  });

  afterEach(function () {
    if (failure) {
      console.error(failure);
      throw failure;
    }
  });

  it('returns empty diff when both values are null', function() {
    var result = diff(null, null);

    assert.ok(result.count() === 0);
  });

  it('check properties', function() {
    JSC.test(
      'returns [] when equal',
      function(veredict, obj) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj);

        var result = diff(map1, map2);

        return veredict(result.count() === 0);
      },
      [
        JSC.object(5)
      ]
    );


    JSC.test(
      'returns add op when missing attribute',
      function(veredict, obj, obj2) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).set('key2', obj2.key2);

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'add', path: ['key2'], value: obj2.key2}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          key: JSC.integer()
        }),
        JSC.object({
          key2: JSC.integer()
        })
      ]
    );

    JSC.test(
      'returns replace op when same attribute with different values',
      function(veredict, obj, newValue) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).set('key', newValue);

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'replace', path: ['key'], value: newValue}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          key: JSC.integer(1, 100)
        }),
        JSC.integer(101, 200)
      ]
    );

    JSC.test(
      'returns remove op when attribute is missing',
      function(veredict, obj) {
        var map1 = fromJS(obj);
        var map2 = IMap();

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'remove', path: ['key']}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          key: JSC.integer()
        })
      ]
    );
  });

  it('check nested structures', function() {
    JSC.test(
      'returns add op when missing attribute in nested structure',
      function(veredict, obj, obj2) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).setIn(['b', 'd'], obj2.d);

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'add', path: ['b', 'd'], value: obj2.d}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          a: JSC.integer(),
          b: JSC.object({
            c: JSC.integer()
          })
        }),
        JSC.object({
          d: JSC.integer()
        })
      ]
    );

    JSC.test(
      'returns replace op when different value in nested structure',
      function(veredict, obj, obj2) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).setIn(['b', 'c'], obj2.c);

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'replace', path: ['b', 'c'], value: obj2.c}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          a: JSC.integer(),
          b: JSC.object({
            c: JSC.integer(1, 100)
          })
        }),
        JSC.object({
          c: JSC.integer(101, 200)
        })
      ]
    );

    JSC.test(
      'returns remove op when attribute removed in nested structure',
      function(veredict, obj, obj2) {
        var map1 = fromJS(obj).setIn(['b', 'd'], obj2.d);
        var map2 = fromJS(obj);

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'remove', path: ['b', 'd']}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          a: JSC.integer(),
          b: JSC.object({
            c: JSC.integer()
          })
        }),
        JSC.object({
          d: JSC.integer()
        })
      ]
    );

    JSC.test(
      'no replace in equal nested structure',
      function(veredict, obj, obj2) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).set('a', obj2.a);

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'replace', path: ['a'], value: obj2.a}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          a: JSC.integer(),
          b: JSC.object({
            c: JSC.integer()
          })
        }),
        JSC.object({
          a: JSC.integer()
        })
      ]
    );

    JSC.test(
      'add/remove when different nested structure',
      function(veredict, obj, obj2) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).set('b', fromJS(obj2));

        var result = diff(map1, map2);
        var expected = fromJS([
          {op: 'remove', path: ['b', 'c']},
          {op: 'add', path: ['b', 'e'], value: obj2.e},
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          a: JSC.integer(),
          b: JSC.object({
            c: JSC.integer()
          })
        }),
        JSC.object({
          e: JSC.integer()
        })
      ]
    );
  });

  it('check nested indexed sequences', function () {
    JSC.test(
      'add when value added in nested sequence',
      function(veredict, obj, newInt) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).updateIn(['b', 'c'], function(list) {
          return list.push(newInt);
        });

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'add', path: ['b', 'c', 5], value: newInt}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          a: JSC.integer(),
          b: JSC.object({
            c: JSC.array(5, JSC.integer())
          })
        }),
        JSC.integer()
      ]
    );

    JSC.test(
      'remove when value removed in nested sequence',
      function(veredict, obj, removeIdx) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).updateIn(['b', 'c'], function(list) {
          return list.splice(removeIdx, 1);
        });

        var result = diff(map1, map2);
        var expected = fromJS([{op: 'remove', path: ['b', 'c', removeIdx]}]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          a: JSC.integer(),
          b: JSC.object({
            c: JSC.array(10, JSC.integer())
          })
        }),
        JSC.integer(0, 9)
      ]
    );

    JSC.test(
      'replace when values are replaced in nested sequence',
      function(veredict, obj, replaceIdx, newValue) {
        var map1 = fromJS(obj);
        var map2 = fromJS(obj).updateIn(['b', 'c'], function(list) {
          return list.set(replaceIdx, newValue);
        });

        var result = diff(map1, map2);
        var expected = fromJS([
          {op: 'replace', path: ['b', 'c', replaceIdx], value: newValue}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.object({
          a: JSC.integer(),
          b: JSC.object({
            c: JSC.array(10, JSC.integer())
          })
        }),
        JSC.integer(0, 9),
        JSC.integer()
      ]
    );
  });

  it('check map in indexed sequence', function() {
    var array1 = [{a: 1}, {a: 2}, {a: 3}];
    var array2 = [{a: 1}, {a: 2, b:2.5}, {a: 3}];

    var list1 = fromJS(array1);
    var list2 = fromJS(array2);

    var result = diff(list1, list2);
    var expected = fromJS([{op: 'add', path: [1, 'b'], value: 2.5}]);

    assert.ok(is(result, expected));
  });

  describe('handling nulls', function() {
    it('replaces null for immutable value', function() {
      var map1 = null;
      var map2 = fromJS({a: 1});

      var result = diff(map1, map2);
      var expected = fromJS([{op: 'replace', path: [], value: map2}]);

      assert.ok(is(result, expected));
    });

    it('replaces value for null', function() {
      var map1 = fromJS({a: 1});
      var map2 = null;

      var result = diff(map1, map2);
      var expected = fromJS([{op: 'replace', path: [], value: map2}]);

      assert.ok(is(result, expected));
    });

    it('replaces null value in map', function() {
      var map1 = fromJS({a: null});
      var map2 = fromJS({a: 1});

      var result = diff(map1, map2);
      var expected = fromJS([{op: 'replace', path: ['a'], value: 1}]);

      assert.ok(is(result, expected));
    });

    it('replaces null value in map for empty map', function() {
      var map1 = fromJS({a: null});
      var map2 = fromJS({});

      var result = diff(map1, map2);
      var expected = fromJS([{op: 'remove', path: ['a']}]);

      assert.ok(is(result, expected));
    });
  });

  describe('path escaping', function() {
    it('add unescaped path', function() {
      var map1 = fromJS({'a': 1, 'b': {'c': 3}});
      var map2 = fromJS({'a': 1, 'b': {'c': 3, 'prop/prop': 4}});

      var result = diff(map1, map2);
      var expected = fromJS([
        {op: 'add', path: ['b', 'prop/prop'], value: 4}
      ]);

      assert.ok(is(result, expected));
    });

    it('replaces unescaped path', function() {
      var map1 = fromJS({'a': 1, 'b': {'c': 3, 'prop/prop': 4}});
      var map2 = fromJS({'a': 1, 'b': {'c': 3, 'prop/prop': 10}});

      var result = diff(map1, map2);
      var expected = fromJS([
        {op: 'replace', path: ['b', 'prop/prop'], value: 10}
      ]);

      assert.ok(is(result, expected));
    });

    it('removes unescaped path', function() {
      var map1 = fromJS({'a': 1, 'b': {'c': 3, 'prop/prop': 4}});
      var map2 = fromJS({'a': 1, 'b': {'c': 3}});

      var result = diff(map1, map2);
      var expected = fromJS([
        {op: 'remove', path: ['b', 'prop/prop']}
      ]);

      assert.ok(is(result, expected));
    });

    it('add unescaped path in nested map', function() {
      var map1 = fromJS({'a': 1, 'test/test': {'c': 3}});
      var map2 = fromJS({'a': 1, 'test/test': {'c': 3, 'prop/prop': 4}});

      var result = diff(map1, map2);
      var expected = fromJS([
        {op: 'add', path: ['test/test', 'prop/prop'], value: 4}
      ]);

      assert.ok(is(result, expected));
    });

    it('add unescaped path in nested sequence', function() {
      var map1 = fromJS({'a': 1, 'test/test': [0, 1, 2]});
      var map2 = fromJS({'a': 1, 'test/test': [0, 1, 2, 3]});

      var result = diff(map1, map2);
      var expected = fromJS([
        {op: 'add', path: ['test/test', 3], value: 3}
      ]);

      assert.ok(is(result, expected));
    });
  });

  it('replace primitive value for nested map', function() {
    var map1 = fromJS({a:false});
    var map2 = fromJS({a:{b:3}});

    var result = diff(map1, map2);
    var expected = fromJS([
      { op: 'replace', path: ['a'], value: fromJS({ b: 3 }) }
    ]);

    assert.ok(is(result, expected));
  });

  it('replace nested map with primitive value', function() {
    var map1 = fromJS({a:{b:3}});
    var map2 = fromJS({a:false});

    var result = diff(map1, map2);
    var expected = fromJS([
      { op: 'replace', path: ['a'], value: false }
    ]);

    assert.ok(is(result, expected));
  });
});
