import {fromJS} from 'immutable'
import veryBigArray from './veryBigArray'
import immutableDiff from '../../src/diff'

var list1 = fromJS(veryBigArray);
var list2 = list1.concat({x: 10, y: 7000});
var diff = immutableDiff(list1, list2);

console.log(diff);
