import diff from '../lib/diff'
import {
  fromJS, is,
  Range as IRange,
  List as IList,
  Repeat as IRepeat
} from 'immutable'
import JSC from 'jscheck'
import assert from 'assert'

describe('Sequence diff', function() {
  var failure = null;

  before(function () {
    JSC.on_report(function (report) {
      console.log(report);
    });

    JSC.on_fail(function (jsc_failure) {
      failure = jsc_failure;
    });
  });

  afterEach(function () {
    if (failure) {
      console.error(failure);
      throw failure;
    }
  });

  it('check properties', function () {
    JSC.test(
      'returns [] when equal',
      function(veredict, array) {
        var list1 = fromJS(array);
        var list2 = fromJS(array);

        var result = diff(list1, list2);

        return veredict(result.count() === 0);
      },
      [
        JSC.array(5, JSC.integer())
      ]
    );
  });

  it('returns add operation', function () {
    var list1 = fromJS([1, 2, 3, 4]);
    var list2 = fromJS([1, 2, 3, 4, 5]);

    var result = diff(list1, list2);
    var expected = fromJS([{op: 'add', path: [4], value: 5}]);

    assert.ok(is(result, expected));
  });

  it('returns remove operation', function () {
    var list1 = fromJS([1, 2, 3, 4]);
    var list2 = fromJS([1, 2, 4]);

    var result = diff(list1, list2);
    var expected = fromJS([{op: 'remove', path: [2]}]);

    assert.ok(is(result, expected));
  });

  it('returns add/remove operations', function () {
    var list1 = fromJS([1, 2, 3, 4]);
    var list2 = fromJS([1, 2, 4, 5]);

    var result = diff(list1, list2);
    var expected = fromJS([
      {op: 'replace', path: [2], value: 4},
      {op: 'replace', path: [3], value: 5}
    ]);

    assert.ok(is(result, expected));
  });

  it('returns correct diff when removing sequenced items in large list', function() {
    var list1 = IRange(1, 1000);
    var list2 = IRange(1, 900);
    var expected = IRepeat(fromJS({ op: 'remove', path: [899] }), 100);
    var result = diff(list1, list2);
    assert.ok(is(result, expected));
  });

  it('returns correct diff when removing multiple sequenced items in large list', function() {
    var list1 = IRange(1, 1000);
    var list2 = IRange(1, 900).concat(IRange(950, 955));

    var expected = IList([
      fromJS({ op: "replace", path: [899], value: 950 }),
      fromJS({ op: "replace", path: [900], value: 951 }),
      fromJS({ op: "replace", path: [901], value: 952 }),
      fromJS({ op: "replace", path: [902], value: 953 }),
      fromJS({ op: "replace", path: [903], value: 954 })
    ]).concat(IRepeat(fromJS({ op: 'remove', path: [904] }), 95));

    var result = diff(list1, list2);

    assert.ok(is(result, expected));
  });

  it('JSCheck', function () {
    JSC.test(
      'returns add when value is inserted in the middle of sequence',
      function(veredict, array, addIdx, newValue) {
        var list1 = fromJS(array);
        var list2 = fromJS(array);
        var modifiedList = list2.splice(addIdx, 0, newValue);

        var result = diff(list1, modifiedList);
        var expected = fromJS([
          {op: 'add', path: [addIdx], value: newValue}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.array(10, JSC.integer()),
        JSC.integer(0, 9),
        JSC.integer()
      ]
    );

    JSC.test(
      'returns remove',
      function(veredict, array, removeIdx) {
        var list1 = fromJS(array);
        var list2 = fromJS(array);
        var modifiedList = list2.splice(removeIdx, 1);

        var result = diff(list1, modifiedList);
        var expected = fromJS([
          {op: 'remove', path: [removeIdx]}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.array(10, JSC.integer()),
        JSC.integer(0, 9)
      ]
    );

    JSC.test(
      'returns sequential removes',
      function(veredict, array, nRemoves) {
        var list1 = fromJS(array);
        var list2 = fromJS(array);
        var modifiedList = list2.skip(nRemoves);

        var result = diff(list1, modifiedList);
        var expected = IRepeat(fromJS({op: 'remove', path: [0]}), nRemoves);

        return veredict(is(result, expected));
      },
      [
        JSC.array(10, JSC.integer()),
        JSC.integer(1, 5)
      ]
    );

    JSC.test(
      'returns replace operations',
      function(veredict, array, replaceIdx, newValue) {
        var list1 = fromJS(array);
        var list2 = fromJS(array);
        var modifiedList = list2.set(replaceIdx, newValue);

        var result = diff(list1, modifiedList);
        var expected = fromJS([
          {op: 'replace', path: [replaceIdx], value: newValue}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.array(10, JSC.integer()),
        JSC.integer(0, 9),
        JSC.integer()
      ]
    );
  });

  it('large sequence diff', function() {
    JSC.test(
      'returns add',
      function(veredict, array, newValue) {
        var list1 = fromJS(array);
        var list2 = fromJS(array);
        var modifiedList = list2.push(newValue);

        var result = diff(list1, modifiedList);
        var expected = fromJS([
          {op: 'add', path: [array.length], value: newValue}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.array(150, JSC.integer()),
        JSC.integer()
      ]
    );

    JSC.test(
      'returns replace',
      function(veredict, array, newValue) {
        var list1 = fromJS(array);
        var list2 = fromJS(array);
        var idx = 100;
        var modifiedList = list2.set(idx, newValue);

        var result = diff(list1, modifiedList);
        var expected = fromJS([
          {op: 'replace', path: [idx], value: newValue}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.array(150, JSC.integer()),
        JSC.integer()
      ]
    );
  });
});
