open ReasonReact;

module URI = Settings__Breadcrumb;
type uri = URI.uri;

let at = (x, y, classNames) => {
  Util.ClassName.(classNames |> addWhen("hidden", x != y) |> serialize);
};

[@react.component]
let make =
    (
      ~inquireConnection: Event.t(unit, unit),
      ~onInquireConnection: Event.t(string, MiniEditor.error),
      ~connection: option(Connection.t),
      ~connectionError: option(Connection.Error.t),
      ~navigate: Event.t(uri, unit),
      ~debug: Type.View.Debug.state,
      ~element: option(Webapi.Dom.Element.t),
    ) => {
  let (uri, setURI) = Hook.useState(URI.Root);

  React.useEffect1(() => Some(navigate |> Event.onOk(setURI)), [||]);

  let inDevMode = Atom.Environment.inDevMode();
  switch (element) {
  | None => null
  | Some(anchor) =>
    ReactDOMRe.createPortal(
      <section className="agda-settings" tabIndex=(-1)>
        <Settings__Breadcrumb uri onNavigate=setURI />
        <div className="agda-settings-pages">
          <ul className={at(URI.Root, uri, ["agda-settings-menu"])}>
            <li onClick={_ => setURI(URI.Connection)}>
              <span className="icon icon-plug"> {string("Connection")} </span>
            </li>
            <li onClick={_ => setURI(URI.UnicodeInput)}>
              <span className="icon icon-keyboard">
                {string("Unicode Input")}
              </span>
            </li>
            <li onClick={_ => setURI(URI.Protocol)}>
              <span className="icon icon-comment-discussion">
                {string("Protocol")}
              </span>
            </li>
            {inDevMode
               ? <li onClick={_ => setURI(URI.Debug)}>
                   <span className="icon icon-terminal">
                     {string("Debug")}
                   </span>
                 </li>
               : null}
          </ul>
          <Settings__Connection
            inquireConnection
            onInquireConnection
            connection
            error=connectionError
            hidden={uri != URI.Connection}
          />
          <Settings__Placeholder
            hidden={uri != URI.UnicodeInput && uri != URI.Protocol}
          />
          <Settings__Debug debug hidden={uri != URI.Debug} />
        </div>
      </section>,
      anchor,
    )
  };
};
