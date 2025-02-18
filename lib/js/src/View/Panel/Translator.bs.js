// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Js_dict = require("bs-platform/lib/js/js_dict.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");
var QueryJs = require("./../../../../../asset/query.js");
var KeymapJs = require("./../../../../../asset/keymap.js");

var rawKeymap = KeymapJs.default;

var rawTable = QueryJs.default;

function toTrie(obj) {
  var symbol = (
    obj[">>"] || ""
  );
  var subTrie = Js_dict.fromArray(Rebase.$$Array[/* map */0]((function (key) {
              return /* tuple */[
                      key,
                      toTrie((
      obj[key]
    ))
                    ];
            }), Rebase.$$Array[/* filter */10]((function (key) {
                  return key !== ">>";
                }), Object.keys(obj))));
  return /* record */Block.record([
            "symbol",
            "subTrie"
          ], [
            symbol,
            subTrie
          ]);
}

var keymap = toTrie(rawKeymap);

function toKeySuggestions(trie) {
  return Object.keys(trie[/* subTrie */1]);
}

function toCandidateSymbols(trie) {
  return trie[/* symbol */0];
}

function isInKeymap(input) {
  var _input = input;
  var _trie = keymap;
  while(true) {
    var trie = _trie;
    var input$1 = _input;
    var n = Rebase.$$String[/* length */1](input$1);
    if (n !== 0) {
      var key = Rebase.$$String[/* sub */9](0, 1, input$1);
      var rest = Rebase.$$String[/* sub */9](1, n - 1 | 0, input$1);
      var match = Js_dict.get(trie[/* subTrie */1], key);
      if (match !== undefined) {
        _trie = match;
        _input = rest;
        continue ;
      } else {
        return undefined;
      }
    } else {
      return trie;
    }
  };
}

function translate(input) {
  var match = isInKeymap(input);
  if (match !== undefined) {
    var trie = match;
    var keySuggestions = Object.keys(trie[/* subTrie */1]).sort();
    var candidateSymbols = trie[/* symbol */0];
    return /* record */Block.record([
              "symbol",
              "further",
              "keySuggestions",
              "candidateSymbols"
            ], [
              Rebase.$$Array[/* get */17](candidateSymbols, 0),
              Rebase.$$Array[/* length */16](keySuggestions) !== 0,
              keySuggestions,
              candidateSymbols
            ]);
  } else {
    return /* record */Block.record([
              "symbol",
              "further",
              "keySuggestions",
              "candidateSymbols"
            ], [
              undefined,
              false,
              [],
              []
            ]);
  }
}

var initialTranslation = translate("");

function lookup(symbol) {
  return Rebase.$$Option[/* flatMap */5]((function (param) {
                return Js_dict.get(rawTable, param);
              }), Rebase.$$Option[/* map */0]((function (prim) {
                    return String(prim);
                  }), Caml_option.undefined_to_opt(symbol.codePointAt(0))));
}

exports.rawKeymap = rawKeymap;
exports.rawTable = rawTable;
exports.toTrie = toTrie;
exports.keymap = keymap;
exports.toKeySuggestions = toKeySuggestions;
exports.toCandidateSymbols = toCandidateSymbols;
exports.isInKeymap = isInKeymap;
exports.translate = translate;
exports.initialTranslation = initialTranslation;
exports.lookup = lookup;
/* rawKeymap Not a pure module */
