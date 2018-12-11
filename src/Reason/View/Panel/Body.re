open ReasonReact;

open Rebase;

open Type.Interaction;

let component = statelessComponent("JSONBody");

let make = (~body: body, ~hidden, ~mountAtBottom, _children) => {
  ...component,
  render: _self => {
    let {raw, maxHeight} = body;
    let comp =
      switch (raw) {
      | Unloaded => <Emacs__Error body="not loaded yet" />
      | RawJSON(raw) =>
        switch (Decoder.parseBody(raw)) {
        | AllGoalsWarnings(value) => <JSON__AllGoalsWarnings value />
        | ErrorMessage(value, rawString) => <JSON__Error value rawString />
        | PlainText(s) => <p> (string(s)) </p>
        }
      | RawEmacs(raw) =>
        let parsed = Emacs__Parser.Response.body(raw);
        let header = parsed.header;
        let body = parsed.body;
        switch (parsed.kind) {
        | AllGoalsWarnings => <Emacs__AllGoalsWarnings header body />
        | GoalTypeContext => <Emacs__GoalTypeContext body />
        | Context => <Emacs__Context body />
        | Constraints => <Emacs__Context body />
        | WhyInScope => <Emacs__WhyInScope body />
        | SearchAbout => <Emacs__SearchAbout body />
        | Error => <Emacs__Error body />
        | PlainText => String.isEmpty(body) ? null : <p> (string(body)) </p>
        };
      };
    let className =
      hidden ?
        ["agda-body", "native-key-bindings", "hidden"]
        |> String.joinWith(" ") :
        ["agda-body", "native-key-bindings"] |> String.joinWith(" ");
    let style =
      mountAtBottom ?
        Some(
          ReactDOMRe.Style.make(
            ~maxHeight=string_of_int(maxHeight) ++ "px",
            (),
          ),
        ) :
        None;
    <section className ?style tabIndex=(-1)> comp </section>;
  },
};
