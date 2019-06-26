// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var Atom = require("atom");
var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var ElementRe = require("bs-webapi/lib/js/src/dom/nodes/ElementRe.js");
var ReactDOMRe = require("reason-react/lib/js/src/ReactDOMRe.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");
var Hook$AgdaMode = require("./Hook.bs.js");
var Util$AgdaMode = require("../Util.bs.js");

function observeFocus(setFocused, editor) {
  var observer = new MutationObserver((function (mutations, param) {
          return Curry._1(setFocused, Rebase.$$Array[/* exists */9]((function (m) {
                            return Rebase.$$Option[/* mapOr */18](Rebase.Fn[/* id */0], false, Rebase.$$Option[/* map */0]((function (elem) {
                                              return elem.classList.contains("is-focused");
                                            }), ElementRe.ofNode(m.target)));
                          }), mutations));
        }));
  var config = {
    attributes: true,
    childList: false,
    subtree: false
  };
  var element = atom.views.getView(editor);
  observer.observe(element, config);
  return (function (param) {
            observer.disconnect();
            return /* () */0;
          });
}

function MiniEditor(Props) {
  var match = Props.value;
  var value = match !== undefined ? match : "";
  var match$1 = Props.placeholder;
  var placeholder = match$1 !== undefined ? match$1 : "";
  var hidden = Props.hidden;
  var match$2 = Props.grammar;
  var grammar = match$2 !== undefined ? match$2 : "";
  var match$3 = Props.onConfirm;
  var onConfirm = match$3 !== undefined ? match$3 : (function (param) {
        return /* () */0;
      });
  var match$4 = Props.onCancel;
  var onCancel = match$4 !== undefined ? match$4 : (function (param) {
        return /* () */0;
      });
  var match$5 = Props.onFocus;
  var onFocus = match$5 !== undefined ? match$5 : (function (param) {
        return /* () */0;
      });
  var match$6 = Props.onBlur;
  var onBlur = match$6 !== undefined ? match$6 : (function (param) {
        return /* () */0;
      });
  var match$7 = Props.onEditorRef;
  var onEditorRef = match$7 !== undefined ? match$7 : (function (param) {
        return /* () */0;
      });
  var match$8 = Hook$AgdaMode.useState(false);
  var setFocused = match$8[1];
  var focused = match$8[0];
  var match$9 = Hook$AgdaMode.useState(undefined);
  var setEditorRef = match$9[1];
  var editorRef = match$9[0];
  var editorElem = React.useRef(undefined);
  React.useEffect((function () {
          return Rebase.$$Option[/* flatMap */5]((function (editor) {
                        Curry._1(setEditorRef, Caml_option.some(editor));
                        if (grammar === "agda") {
                          var agdaGrammar = atom.grammars.grammarForScopeName("source.agda");
                          try {
                            editor.setGrammar(agdaGrammar);
                          }
                          catch (exn){
                            
                          }
                        }
                        Curry._1(onEditorRef, editor);
                        var disposables = new Atom.CompositeDisposable();
                        disposables.add(atom.commands.add(atom.views.getView(editor), "core:confirm", (function (_event) {
                                    return Curry._1(onConfirm, editor.getText());
                                  })));
                        disposables.add(atom.commands.add(atom.views.getView(editor), "core:cancel", (function (_event) {
                                    return Curry._1(onCancel, /* () */0);
                                  })));
                        editor.setText(value);
                        editor.setPlaceholderText(placeholder);
                        return (function (param) {
                                  disposables.dispose();
                                  return /* () */0;
                                });
                      }), Rebase.$$Option[/* map */0]((function (r) {
                            return r.getModel();
                          }), editorElem.current));
        }), /* array */[]);
  React.useEffect((function () {
          return Rebase.$$Option[/* flatMap */5]((function (param) {
                        return observeFocus(setFocused, param);
                      }), editorRef);
        }), /* array */[editorRef]);
  React.useEffect((function () {
          if (focused) {
            Curry._1(onFocus, /* () */0);
          } else {
            Curry._1(onBlur, /* () */0);
          }
          return undefined;
        }), /* array */[focused]);
  var className = Curry._1(Util$AgdaMode.ClassName[/* serialize */2], Util$AgdaMode.ClassName[/* addWhen */1]("hidden", hidden, /* :: */Block.simpleVariant("::", [
              "mini-editor",
              /* [] */0
            ])));
  return ReactDOMRe.createElementVariadic("atom-text-editor", {
              class: className,
              mini: "true",
              ref: editorElem
            }, /* array */[]);
}

var make = MiniEditor;

exports.observeFocus = observeFocus;
exports.make = make;
/* atom Not a pure module */