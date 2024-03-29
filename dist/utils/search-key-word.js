"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function SearchKeyWord(handleValue, typeOneNameArray, typeTwoNameArray, typeThreeNameArray, nameInputArrayArray, searchStart) {
  if (searchStart == 'typeOne') {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = typeOneNameArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var i = _step.value;
        var handleI = i.replace(/\s*/g, "");
        var reg = new RegExp("^".concat(handleI, "$"), 'ig');
        var result = reg.test(handleValue);

        if (result) {
          return {
            value: i,
            col: 'type_one'
          };
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  } else if (searchStart === 'typeThree') {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = typeThreeNameArray[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var j = _step2.value;
        var handleJ = j.replace(/\s*/g, "");

        var _reg = new RegExp("^".concat(handleJ, "$"), 'ig');

        var _result = _reg.test(handleValue);

        if (_result) {
          return {
            value: j,
            col: 'type_three'
          };
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
          _iterator2["return"]();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  } else if (searchStart == 'nameInput') {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = nameInputArrayArray[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var z = _step3.value;
        var handleZ = z.replace(/\s*/g, "");

        var _reg2 = new RegExp("^(w*)".concat(handleZ, "(w*)$"), 'ig');

        var _result2 = _reg2.test(handleValue);

        if (_result2) {
          return {
            value: z,
            col: 'name_input'
          };
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
          _iterator3["return"]();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = typeThreeNameArray[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var k = _step4.value;
        var handleK = k.replace(/\s*/g, "");

        var _reg3 = new RegExp("(w*)".concat(handleK, "(w*)"), 'ig');

        var _result3 = _reg3.test(handleValue);

        if (_result3) {
          return {
            value: k,
            col: 'type_three'
          };
        }
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
          _iterator4["return"]();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = typeTwoNameArray[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var _j = _step5.value;

        var _handleJ = _j.replace(/\s*/g, "");

        var _reg4 = new RegExp("(w*)".concat(_handleJ, "(w*)"), 'ig');

        var _result4 = _reg4.test(handleValue);

        if (_result4) {
          return {
            value: _j,
            col: 'type_two'
          };
        }
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
          _iterator5["return"]();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = typeOneNameArray[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var _i = _step6.value;

        var _handleI = _i.replace(/\s*/g, "");

        var _reg5 = new RegExp("(w*)".concat(_handleI, "(w*)"), 'ig');

        var _result5 = _reg5.test(handleValue);

        if (_result5) {
          return {
            value: _i,
            col: 'type_one'
          };
        }
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
          _iterator6["return"]();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }
  }

  return false;
}

var _default = SearchKeyWord;
exports["default"] = _default;