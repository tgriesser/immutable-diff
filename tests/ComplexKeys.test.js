import {Map as IMap, List as IList, Set as ISet, is} from 'immutable';
import diff from '../lib/diff'
import JSC from 'jscheck'
import assert from 'assert'

describe('Complex keys diff', function() {
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

  it('supports Immutable.Map as keys', function() {
    var a = IMap({a: 1, b: 2});
    var b = IMap({a: 1, b: 2});
    var c = IMap([[a, 1]])
    var d = IMap([[b, 1]])
    var result = diff(c, d);
    assert.ok(result.count() === 0);
  });

  it('does proper equals Immutable.Set as keys', function() {
    var a = ISet([1, 2, 3]);
    var b = ISet([1, 2, 3]);
    var c = IMap([[a, 1]])
    var d = IMap([[b, 1]])
    var result = diff(c, d);
    assert.ok(result.count() === 0);
  });

  it('creates a diff with changed Immutable.Set as keys', function() {
    var a = ISet([1, 2, 3]);
    var b = ISet([1, 2]);
    var c = IMap([[a, 1]])
    var d = IMap([[b, 1]])
    var result = diff(c, d);

    assert.ok(is(result, IList([
      IMap({op: 'remove', path: IList([a])}),
      IMap({op: 'add', path: IList([b]), value: 1})
    ])))
  });

});
