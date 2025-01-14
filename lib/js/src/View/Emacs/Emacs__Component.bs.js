// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Util$AgdaMode = require("../../Util.bs.js");
var Parser$AgdaMode = require("../../Parser.bs.js");
var Type__Location$AgdaMode = require("../../Type/Type__Location.bs.js");
var Component__Link$AgdaMode = require("../Component__Link.bs.js");
var Component__Range$AgdaMode = require("../Component__Range.bs.js");

function Emacs__Component$Term(Props) {
  var term = Props.term;
  switch (term.tag | 0) {
    case 0 : 
        return React.createElement("span", {
                    className: "expr"
                  }, term[0]);
    case 1 : 
        var i = term[0];
        return React.createElement(Component__Link$AgdaMode.make, {
                    target: /* HoleLink */Block.variant("HoleLink", 1, [i]),
                    jump: true,
                    hover: true,
                    className: /* :: */Block.simpleVariant("::", [
                        "expr",
                        /* :: */Block.simpleVariant("::", [
                            "question-mark",
                            /* [] */0
                          ])
                      ]),
                    children: "?" + String(i)
                  });
    case 2 : 
        return React.createElement("span", {
                    className: "expr underscore"
                  }, term[0]);
    
  }
}

var Term = /* module */Block.localModule([
    "jump",
    "hover",
    "make"
  ], [
    true,
    true,
    Emacs__Component$Term
  ]);

function parse(raw) {
  return Rebase.$$Option[/* some */11](Rebase.$$Array[/* filterMap */23]((function (x) {
                    return x;
                  }), Rebase.$$Array[/* mapi */27]((function (token, i) {
                        var match = i % 3;
                        if (match !== 1) {
                          if (match !== 2) {
                            return Rebase.$$Option[/* map */0]((function (x) {
                                          return /* Plain */Block.variant("Plain", 0, [x]);
                                        }), token);
                          } else {
                            return Rebase.$$Option[/* map */0]((function (x) {
                                          return /* Underscore */Block.variant("Underscore", 2, [x]);
                                        }), token);
                          }
                        } else {
                          return Rebase.$$Option[/* map */0]((function (x) {
                                        return /* QuestionMark */Block.variant("QuestionMark", 1, [x]);
                                      }), Rebase.$$Option[/* flatMap */5](Parser$AgdaMode.$$int, Rebase.$$Option[/* map */0]((function (param) {
                                                return param.slice(1);
                                              }), token)));
                        }
                      }), Rebase.$$String[/* trim */8](raw).split((/(\?\d+)|(\_\d+[^\}\)\s]*)/)))));
}

function Emacs__Component$Expr(Props) {
  var expr = Props.expr;
  return Util$AgdaMode.React[/* manyIn */0]("span")(Rebase.$$Array[/* map */0]((function (term) {
                    return React.createElement(Emacs__Component$Term, {
                                term: term
                              });
                  }), expr));
}

var Expr = /* module */Block.localModule([
    "parse",
    "make"
  ], [
    parse,
    Emacs__Component$Expr
  ]);

var partial_arg = (/^([^\:]*) \: ((?:\n|.)+)/);

function parseOfType(param) {
  return Parser$AgdaMode.captures((function (captured) {
                return Rebase.$$Option[/* flatMap */5]((function (type_) {
                              return Rebase.$$Option[/* flatMap */5]((function (term) {
                                            return /* OfType */Block.variant("OfType", 0, [
                                                      term,
                                                      type_
                                                    ]);
                                          }), Parser$AgdaMode.at(1, parse, captured));
                            }), Parser$AgdaMode.at(2, parse, captured));
              }), partial_arg, param);
}

var partial_arg$1 = (/^Type ((?:\n|.)+)/);

function parseJustType(param) {
  return Parser$AgdaMode.captures((function (captured) {
                return Rebase.$$Option[/* map */0]((function (type_) {
                              return /* JustType */Block.variant("JustType", 1, [type_]);
                            }), Parser$AgdaMode.at(1, parse, captured));
              }), partial_arg$1, param);
}

var partial_arg$2 = (/^Sort ((?:\n|.)+)/);

function parseJustSort(param) {
  return Parser$AgdaMode.captures((function (captured) {
                return Rebase.$$Option[/* map */0]((function (sort) {
                              return /* JustSort */Block.variant("JustSort", 2, [sort]);
                            }), Parser$AgdaMode.at(1, parse, captured));
              }), partial_arg$2, param);
}

function parseOthers(raw) {
  return Rebase.$$Option[/* map */0]((function (raw$prime) {
                return /* Others */Block.variant("Others", 3, [raw$prime]);
              }), parse(raw));
}

var partial_arg$3 = /* array */[
  parseOfType,
  parseJustType,
  parseJustSort,
  parseOthers
];

function parse$1(param) {
  return Parser$AgdaMode.choice(partial_arg$3, param);
}

function Emacs__Component$OutputConstraint(Props) {
  var value = Props.value;
  var range = Props.range;
  switch (value.tag | 0) {
    case 0 : 
        return React.createElement("li", {
                    className: "output"
                  }, React.createElement(Emacs__Component$Expr, {
                        expr: value[0]
                      }), " : ", React.createElement(Emacs__Component$Expr, {
                        expr: value[1]
                      }), Rebase.$$Option[/* mapOr */18]((function (range) {
                          return React.createElement(Component__Range$AgdaMode.make, {
                                      range: range,
                                      abbr: true
                                    });
                        }), null, range));
    case 1 : 
        return React.createElement("li", {
                    className: "output"
                  }, "Type ", React.createElement(Emacs__Component$Expr, {
                        expr: value[0]
                      }), Rebase.$$Option[/* mapOr */18]((function (range) {
                          return React.createElement(Component__Range$AgdaMode.make, {
                                      range: range,
                                      abbr: true
                                    });
                        }), null, range));
    case 2 : 
        return React.createElement("li", {
                    className: "output"
                  }, "Sort ", React.createElement(Emacs__Component$Expr, {
                        expr: value[0]
                      }), Rebase.$$Option[/* mapOr */18]((function (range) {
                          return React.createElement(Component__Range$AgdaMode.make, {
                                      range: range,
                                      abbr: true
                                    });
                        }), null, range));
    case 3 : 
        return React.createElement("li", {
                    className: "output"
                  }, React.createElement(Emacs__Component$Expr, {
                        expr: value[0]
                      }), Rebase.$$Option[/* mapOr */18]((function (range) {
                          return React.createElement(Component__Range$AgdaMode.make, {
                                      range: range,
                                      abbr: true
                                    });
                        }), null, range));
    
  }
}

var OutputConstraint = /* module */Block.localModule([
    "parseOfType",
    "parseJustType",
    "parseJustSort",
    "parseOthers",
    "parse",
    "make"
  ], [
    parseOfType,
    parseJustType,
    parseJustSort,
    parseOthers,
    parse$1,
    Emacs__Component$OutputConstraint
  ]);

function Emacs__Component$Labeled(Props) {
  var label = Props.label;
  var expr = Props.expr;
  return React.createElement("li", {
              className: "labeled"
            }, React.createElement("span", {
                  className: "label"
                }, label), React.createElement(Emacs__Component$Expr, {
                  expr: expr
                }));
}

var Labeled = /* module */Block.localModule(["make"], [Emacs__Component$Labeled]);

function parseOutputWithoutRange(raw) {
  return Rebase.$$Option[/* map */0]((function (x) {
                return /* Output */Block.simpleVariant("Output", [
                          x,
                          undefined
                        ]);
              }), Curry._1(parse$1, raw));
}

var partial_arg$4 = (/((?:\n|.)*\S+)\s*\[ at ([^\]]+) \]/);

function parseOutputWithRange(param) {
  return Parser$AgdaMode.captures((function (captured) {
                return Rebase.$$Option[/* map */0]((function (oc) {
                              var r = Rebase.$$Option[/* flatMap */5](Type__Location$AgdaMode.$$Range[/* parse */0], Rebase.$$Option[/* flatten */20](Rebase.$$Array[/* get */17](captured, 2)));
                              return /* Output */Block.simpleVariant("Output", [
                                        oc,
                                        r
                                      ]);
                            }), Rebase.$$Option[/* flatMap */5](parse$1, Rebase.$$Option[/* flatten */20](Rebase.$$Array[/* get */17](captured, 1))));
              }), partial_arg$4, param);
}

function parse$2(raw) {
  var rangeRe = (/\[ at (\S+\:(?:\d+\,\d+\-\d+\,\d+|\d+\,\d+\-\d+)) \]$/);
  var hasRange = rangeRe.test(raw);
  if (hasRange) {
    return Curry._1(parseOutputWithRange, raw);
  } else {
    return parseOutputWithoutRange(raw);
  }
}

function Emacs__Component$Output(Props) {
  var value = Props.value;
  return React.createElement(Emacs__Component$OutputConstraint, {
              value: value[0],
              range: value[1]
            });
}

var Output = /* module */Block.localModule([
    "parseOutputWithoutRange",
    "parseOutputWithRange",
    "parse",
    "make"
  ], [
    parseOutputWithoutRange,
    parseOutputWithRange,
    parse$2,
    Emacs__Component$Output
  ]);

function parse$3(raw) {
  return Rebase.$$Option[/* some */11](Rebase.$$Array[/* mapi */27]((function (token, i) {
                    var match = i % 2;
                    if (match !== 1) {
                      return /* Text */Block.variant("Text", 0, [token]);
                    } else {
                      return Rebase.$$Option[/* mapOr */18]((function (x) {
                                    return /* Range */Block.variant("Range", 1, [x]);
                                  }), /* Text */Block.variant("Text", 0, [token]), Curry._1(Type__Location$AgdaMode.$$Range[/* parse */0], token));
                    }
                  }), Rebase.$$Array[/* filterMap */23]((function (x) {
                        return x;
                      }), raw.split((/(\S+\:(?:\d+\,\d+\-\d+\,\d+|\d+\,\d+\-\d+))/)))));
}

function Emacs__Component$PlainText(Props) {
  var value = Props.value;
  return Util$AgdaMode.React[/* manyIn */0]("span")(Rebase.$$Array[/* map */0]((function (token) {
                    if (token.tag) {
                      return React.createElement(Component__Range$AgdaMode.make, {
                                  range: token[0]
                                });
                    } else {
                      return token[0];
                    }
                  }), value));
}

var PlainText = /* module */Block.localModule([
    "parse",
    "make"
  ], [
    parse$3,
    Emacs__Component$PlainText
  ]);

function parse$4(isWarning, raw) {
  return Rebase.$$Option[/* map */0]((function (body) {
                if (isWarning) {
                  return /* WarningMessage */Block.variant("WarningMessage", 0, [body]);
                } else {
                  return /* ErrorMessage */Block.variant("ErrorMessage", 1, [body]);
                }
              }), parse$3(raw));
}

function parseWarning(param) {
  return parse$4(true, param);
}

function parseError(param) {
  return parse$4(false, param);
}

function Emacs__Component$WarningError(Props) {
  var value = Props.value;
  if (value.tag) {
    return React.createElement("li", {
                className: "warning-error"
              }, React.createElement("span", {
                    className: "error-label"
                  }, "error"), React.createElement(Emacs__Component$PlainText, {
                    value: value[0]
                  }));
  } else {
    return React.createElement("li", {
                className: "warning-error"
              }, React.createElement("span", {
                    className: "warning-label"
                  }, "warning"), React.createElement(Emacs__Component$PlainText, {
                    value: value[0]
                  }));
  }
}

var WarningError = /* module */Block.localModule([
    "parse",
    "parseWarning",
    "parseError",
    "make"
  ], [
    parse$4,
    parseWarning,
    parseError,
    Emacs__Component$WarningError
  ]);

exports.Term = Term;
exports.Expr = Expr;
exports.OutputConstraint = OutputConstraint;
exports.Labeled = Labeled;
exports.Output = Output;
exports.PlainText = PlainText;
exports.WarningError = WarningError;
/* partial_arg Not a pure module */
