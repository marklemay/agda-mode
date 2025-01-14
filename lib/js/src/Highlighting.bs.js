// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Parser$AgdaMode = require("./Parser.bs.js");

function parse(param) {
  if (param.tag) {
    var xs = param[0];
    var len = xs.length;
    if (len >= 7) {
      return undefined;
    } else {
      switch (len) {
        case 3 : 
            var match = xs[0];
            if (match.tag) {
              return undefined;
            } else {
              var match$1 = xs[1];
              if (match$1.tag) {
                return undefined;
              } else {
                var end_$prime = match$1[0];
                var types = xs[2];
                return Rebase.$$Option[/* flatMap */5]((function (start) {
                              return Rebase.$$Option[/* flatMap */5]((function (end_) {
                                            return /* record */Block.record([
                                                      "start",
                                                      "end_",
                                                      "types",
                                                      "source"
                                                    ], [
                                                      start,
                                                      end_,
                                                      Parser$AgdaMode.SExpression[/* flatten */1](types),
                                                      undefined
                                                    ]);
                                          }), Parser$AgdaMode.$$int(end_$prime));
                            }), Parser$AgdaMode.$$int(match[0]));
              }
            }
        case 4 : 
            var match$2 = xs[0];
            if (match$2.tag) {
              return undefined;
            } else {
              var match$3 = xs[1];
              if (match$3.tag) {
                return undefined;
              } else {
                var end_$prime$1 = match$3[0];
                var types$1 = xs[2];
                return Rebase.$$Option[/* flatMap */5]((function (start) {
                              return Rebase.$$Option[/* flatMap */5]((function (end_) {
                                            return /* record */Block.record([
                                                      "start",
                                                      "end_",
                                                      "types",
                                                      "source"
                                                    ], [
                                                      start,
                                                      end_,
                                                      Parser$AgdaMode.SExpression[/* flatten */1](types$1),
                                                      undefined
                                                    ]);
                                          }), Parser$AgdaMode.$$int(end_$prime$1));
                            }), Parser$AgdaMode.$$int(match$2[0]));
              }
            }
        case 0 : 
        case 1 : 
        case 2 : 
        case 5 : 
            return undefined;
        case 6 : 
            var match$4 = xs[0];
            if (match$4.tag) {
              return undefined;
            } else {
              var match$5 = xs[1];
              if (match$5.tag) {
                return undefined;
              } else {
                var end_$prime$2 = match$5[0];
                var types$2 = xs[2];
                var match$6 = xs[5];
                if (match$6.tag) {
                  var match$7 = match$6[0];
                  if (match$7.length !== 3) {
                    return undefined;
                  } else {
                    var match$8 = match$7[0];
                    if (match$8.tag) {
                      return undefined;
                    } else {
                      var filepath = match$8[0];
                      var match$9 = match$7[2];
                      if (match$9.tag) {
                        return undefined;
                      } else {
                        var index$prime = match$9[0];
                        return Rebase.$$Option[/* flatMap */5]((function (start) {
                                      return Rebase.$$Option[/* flatMap */5]((function (end_) {
                                                    return Rebase.$$Option[/* flatMap */5]((function (index) {
                                                                  return /* record */Block.record([
                                                                            "start",
                                                                            "end_",
                                                                            "types",
                                                                            "source"
                                                                          ], [
                                                                            start,
                                                                            end_,
                                                                            Parser$AgdaMode.SExpression[/* flatten */1](types$2),
                                                                            /* tuple */[
                                                                              filepath,
                                                                              index
                                                                            ]
                                                                          ]);
                                                                }), Parser$AgdaMode.$$int(index$prime));
                                                  }), Parser$AgdaMode.$$int(end_$prime$2));
                                    }), Parser$AgdaMode.$$int(match$4[0]));
                      }
                    }
                  }
                } else {
                  return undefined;
                }
              }
            }
        
      }
    }
  }
  
}

function parseDirectHighlightings(tokens) {
  return Rebase.$$Array[/* filterMap */23]((function (x) {
                return x;
              }), Rebase.$$Array[/* map */0](parse, tokens.slice(2)));
}

function parseIndirectHighlightings(tokens) {
  return Rebase.$$Array[/* filterMap */23]((function (x) {
                return x;
              }), Rebase.$$Array[/* map */0](parse, tokens.slice(1)));
}

function shouldHighlight(annotation) {
  if (annotation[/* types */2].includes("unsolvedmeta") || annotation[/* types */2].includes("unsolvedconstraint") || annotation[/* types */2].includes("terminationproblem")) {
    return true;
  } else {
    return annotation[/* types */2].includes("coverageproblem");
  }
}

var Annotation = /* module */Block.localModule([
    "parse",
    "parseDirectHighlightings",
    "parseIndirectHighlightings",
    "shouldHighlight"
  ], [
    parse,
    parseDirectHighlightings,
    parseIndirectHighlightings,
    shouldHighlight
  ]);

var Token = 0;

exports.Token = Token;
exports.Annotation = Annotation;
/* No side effect */
