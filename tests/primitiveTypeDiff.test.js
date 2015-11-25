import diff from '../lib/diff'
import {fromJS, is} from 'immutable'
import JSC from 'jscheck'

describe('Primitive types diff', function() {
  var failure = null;

  before(function () {
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

  it('check properties', function() {
    JSC.test(
      'returns [] when equal',
      function(veredict, int1) {
        var result = diff(int1, int1);
        var expected = fromJS([]);

        return veredict(is(result, expected));
      },
      [
        JSC.integer()
      ]
    );

    JSC.test(
      'replaces numbers',
      function(veredict, int1, int2) {
        var result = diff(int1, int2);
        var expected = fromJS([
          {op: 'replace', path: [], value: int2}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.integer(),
        JSC.integer()
      ]
    );

    JSC.test(
      'replaces strings',
      function(veredict, str1, str2) {
        var result = diff(str1, str2);
        var expected = fromJS([
          {op: 'replace', path: [], value: str2}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.string(),
        JSC.string()
      ]
    );

    JSC.test(
      'replaces arrays',
      function(veredict, array1, array2) {
        var result = diff(array1, array2);
        var expected = fromJS([
          {op: 'replace', path: [], value: array2}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.array(5),
        JSC.array(5)
      ]
    );

    JSC.test(
      'replaces objects',
      function(veredict, object1, object2) {
        var result = diff(object1, object2);
        var expected = fromJS([
          {op: 'replace', path: [], value: object2}
        ]);

        return veredict(is(result, expected));
      },
      [
        JSC.object(5),
        JSC.object(5)
      ]
    );
  });
});
