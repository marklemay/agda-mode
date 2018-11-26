// Generated by BUCKLESCRIPT VERSION 4.0.7, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var ReasonReact = require("reason-react/lib/js/src/ReasonReact.js");
var Js_primitive = require("bs-platform/lib/js/js_primitive.js");

var component = ReasonReact.reducerComponent("SizingHandle");

function setHandleRef(r, param) {
  param[/* state */1][/* handleRef */1][0] = (r == null) ? undefined : Js_primitive.some(r);
  return /* () */0;
}

function calculateBodyHeight(r, handleY) {
  var match = r[0];
  if (match !== undefined) {
    var top = Js_primitive.valFromOption(match).getBoundingClientRect().top + 51 | 0;
    return Rebase.Option[/* flatMap */5]((function (element) {
                  var bottom = element.getBoundingClientRect().top;
                  if (top > 0) {
                    return (bottom - handleY | 0) - 51 | 0;
                  }
                  
                }), Js_primitive.nullable_to_opt(document.querySelector("atom-panel-container.footer")));
  }
  
}

function make(onResizeStart, onResizeEnd, atBottom, _children) {
  return /* record */Block.record([
            "debugName",
            "reactClassInternal",
            "handedOffState",
            "willReceiveProps",
            "didMount",
            "didUpdate",
            "willUnmount",
            "willUpdate",
            "shouldUpdate",
            "render",
            "initialState",
            "retainedProps",
            "reducer",
            "jsElementWrapped"
          ], [
            component[/* debugName */0],
            component[/* reactClassInternal */1],
            component[/* handedOffState */2],
            component[/* willReceiveProps */3],
            component[/* didMount */4],
            component[/* didUpdate */5],
            component[/* willUnmount */6],
            component[/* willUpdate */7],
            component[/* shouldUpdate */8],
            (function (self) {
                if (atBottom) {
                  return React.createElement("div", {
                              className: "sizing-handle-anchor"
                            }, React.createElement("div", {
                                  ref: Curry._1(self[/* handle */0], setHandleRef),
                                  className: "sizing-handle native-key-bindings",
                                  draggable: true,
                                  tabIndex: -1,
                                  onDragEnd: (function (ev) {
                                      var clientY = ev.clientY;
                                      Curry._1(self[/* send */3], /* UpdateHeight */Block.simpleVariant("UpdateHeight", [clientY]));
                                      var match = calculateBodyHeight(self[/* state */1][/* handleRef */1], clientY);
                                      if (match !== undefined) {
                                        return Curry._1(onResizeEnd, match);
                                      } else {
                                        return /* () */0;
                                      }
                                    }),
                                  onDragStart: (function (ev) {
                                      var clientY = ev.clientY;
                                      Curry._1(self[/* send */3], /* UpdateHeight */Block.simpleVariant("UpdateHeight", [clientY]));
                                      var match = calculateBodyHeight(self[/* state */1][/* handleRef */1], clientY);
                                      if (match !== undefined) {
                                        return Curry._1(onResizeStart, match);
                                      } else {
                                        return /* () */0;
                                      }
                                    })
                                }));
                } else {
                  return null;
                }
              }),
            (function (param) {
                return /* record */Block.record([
                          "height",
                          "handleRef"
                        ], [
                          0,
                          Block.record(["contents"], [undefined])
                        ]);
              }),
            component[/* retainedProps */11],
            (function (param, state) {
                return /* Update */Block.variant("Update", 0, [/* record */Block.record([
                              "height",
                              "handleRef"
                            ], [
                              param[0],
                              state[/* handleRef */1]
                            ])]);
              }),
            component[/* jsElementWrapped */13]
          ]);
}

var jsComponent = ReasonReact.wrapReasonForJs(component, (function (jsProps) {
        return make(jsProps.onResizeStart, jsProps.onResizeEnd, jsProps.atBottom, /* array */[]);
      }));

exports.component = component;
exports.setHandleRef = setHandleRef;
exports.calculateBodyHeight = calculateBodyHeight;
exports.make = make;
exports.jsComponent = jsComponent;
/* component Not a pure module */