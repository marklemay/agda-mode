// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Js_dict = require("bs-platform/lib/js/js_dict.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");
var Util$AgdaMode = require("../../Util.bs.js");
var Emacs__Parser$AgdaMode = require("./Emacs__Parser.bs.js");
var Emacs__Component$AgdaMode = require("./Emacs__Component.bs.js");

function parse(raw) {
  var markGoal = function (param) {
    return Rebase.$$Option[/* map */0]((function (param) {
                  return "goal";
                }), Caml_option.null_to_opt(param[0].match((/^Goal:/))));
  };
  var markHave = function (param) {
    return Rebase.$$Option[/* map */0]((function (param) {
                  return "have";
                }), Caml_option.null_to_opt(param[0].match((/^Have:/))));
  };
  var markMetas = function (param) {
    return Rebase.$$Option[/* map */0]((function (param) {
                  return "metas";
                }), Caml_option.null_to_opt(param[0].match((/\u2014{60}/g))));
  };
  var partial_arg = Util$AgdaMode.Dict[/* partite */0];
  var partiteGoalTypeContext = function (param) {
    return partial_arg((function (line) {
                  return Rebase.$$Option[/* or_ */15](Rebase.$$Option[/* or_ */15](markGoal(line), markHave(line)), markMetas(line));
                }), param);
  };
  var partial_arg$1 = Util$AgdaMode.Dict[/* update */2];
  var removeDelimeter = function (param) {
    return partial_arg$1("metas", (function (param) {
                  return param.slice(1);
                }), param);
  };
  var lines = raw.split("\n");
  var dictionary = Emacs__Parser$AgdaMode.partiteMetas(Curry._1(removeDelimeter, Curry._1(partiteGoalTypeContext, lines)));
  var goal = Rebase.$$Option[/* flatMap */5]((function (line) {
          return Emacs__Component$AgdaMode.Expr[/* parse */0](Rebase.$$String[/* joinWith */11]("\n", Rebase.List[/* fromArray */12](line)).slice(5));
        }), Js_dict.get(dictionary, "goal"));
  var have = Rebase.$$Option[/* flatMap */5]((function (line) {
          return Emacs__Component$AgdaMode.Expr[/* parse */0](Rebase.$$String[/* joinWith */11]("\n", Rebase.List[/* fromArray */12](line)).slice(5));
        }), Js_dict.get(dictionary, "have"));
  var interactionMetas = Rebase.$$Option[/* mapOr */18]((function (metas) {
          return Rebase.$$Array[/* filterMap */23]((function (x) {
                        return x;
                      }), Rebase.$$Array[/* map */0](Emacs__Component$AgdaMode.Output[/* parseOutputWithoutRange */0], metas));
        }), /* array */[], Js_dict.get(dictionary, "interactionMetas"));
  var hiddenMetas = Rebase.$$Option[/* mapOr */18]((function (metas) {
          return Rebase.$$Array[/* filterMap */23]((function (x) {
                        return x;
                      }), Rebase.$$Array[/* map */0](Emacs__Component$AgdaMode.Output[/* parseOutputWithRange */1], metas));
        }), /* array */[], Js_dict.get(dictionary, "hiddenMetas"));
  return /* record */Block.record([
            "goal",
            "have",
            "interactionMetas",
            "hiddenMetas"
          ], [
            goal,
            have,
            interactionMetas,
            hiddenMetas
          ]);
}

function Emacs__GoalTypeContext(Props) {
  var body = Props.body;
  var parsed = parse(body);
  return React.createElement(React.Fragment, undefined, React.createElement("ul", undefined, Rebase.$$Option[/* mapOr */18]((function (expr) {
                        return React.createElement(Emacs__Component$AgdaMode.Labeled[/* make */0], {
                                    label: "Goal ",
                                    expr: expr
                                  });
                      }), null, parsed[/* goal */0]), Rebase.$$Option[/* mapOr */18]((function (expr) {
                        return React.createElement(Emacs__Component$AgdaMode.Labeled[/* make */0], {
                                    label: "Have ",
                                    expr: expr
                                  });
                      }), null, parsed[/* have */1])), Util$AgdaMode.React[/* manyIn */0]("ul")(Rebase.$$Array[/* map */0]((function (value) {
                        return React.createElement(Emacs__Component$AgdaMode.Output[/* make */3], {
                                    value: value
                                  });
                      }), parsed[/* interactionMetas */2])), Util$AgdaMode.React[/* manyIn */0]("ul")(Rebase.$$Array[/* map */0]((function (value) {
                        return React.createElement(Emacs__Component$AgdaMode.Output[/* make */3], {
                                    value: value
                                  });
                      }), parsed[/* hiddenMetas */3])));
}

var make = Emacs__GoalTypeContext;

exports.parse = parse;
exports.make = make;
/* react Not a pure module */
