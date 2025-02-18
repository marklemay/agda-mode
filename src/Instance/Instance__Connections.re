open Rebase;
open Async;

open Instance__Type;
open Atom;

let inquireAgdaPath =
    (error: option(Connection.Error.t), instance)
    : Async.t(string, MiniEditor.error) => {
  open View;
  instance.view.activate();
  instance.view.openSettings()
  |> then_(
       _ => {
         instance.view.navigateSettings(Settings.URI.Connection);
         instance.view.updateConnection(None, error);
         instance.view.inquireConnection();
       },
       _ => reject(MiniEditor.Cancelled),
     );
};

let getAgdaPath = (instance): Async.t(string, MiniEditor.error) => {
  let storedPath =
    Environment.Config.get("agda-mode.agdaPath") |> Parser.filepath;
  let searchedPath =
    if (storedPath |> String.isEmpty) {
      Connection.autoSearch("agda");
    } else {
      resolve(storedPath);
    };

  searchedPath
  |> thenError(err =>
       instance
       |> inquireAgdaPath(Some(Connection.Error.AutoSearchError(err)))
     );
};

let connectWithAgdaPath =
    (instance, path): Async.t(Connection.t, MiniEditor.error) => {
  /* validate the given path */
  let rec getMetadata =
          (instance, pathAndParams)
          : Async.t(Connection.metadata, MiniEditor.error) => {
    Connection.validateAndMake(pathAndParams)
    |> thenError(err =>
         instance
         |> inquireAgdaPath(
              Some(Connection.Error.ValidationError(pathAndParams, err)),
            )
         |> thenOk(getMetadata(instance))
       );
  };

  let persistConnection = (instance, connection: Connection.t) => {
    instance.connection = Some(connection);
    /* store the path in the config */
    let path =
      Array.concat(connection.metadata.args, [|connection.metadata.path|])
      |> List.fromArray
      |> String.joinWith(" ");
    Environment.Config.set("agda-mode.agdaPath", path);
    /* update the view */
    instance.view.updateConnection(Some(connection), None);
    /* pass it on */
    connection;
  };

  let rec getConnection =
          (instance, metadata): Async.t(Connection.t, MiniEditor.error) => {
    Connection.connect(metadata)
    |> thenError(err =>
         instance
         |> inquireAgdaPath(Some(Connection.Error.ConnectionError(err)))
         |> thenOk(getMetadata(instance))
         |> thenOk(getConnection(instance))
       );
  };
  let handleUnboundError = (instance, connection): Connection.t => {
    Connection.(connection.errorEmitter)
    |> Event.onOk(res => instance.handleResponse(instance, res) |> ignore)
    |> ignore;
    connection;
  };

  path
  |> getMetadata(instance)
  |> thenOk(getConnection(instance))
  |> mapOk(persistConnection(instance))
  |> mapOk(handleUnboundError(instance))
  |> mapOk(Connection.wire);
};

let connect = (instance): Async.t(Connection.t, MiniEditor.error) => {
  switch (instance.connection) {
  | Some(connection) => resolve(connection)
  | None => instance |> getAgdaPath |> thenOk(connectWithAgdaPath(instance))
  };
};

let disconnect = instance => {
  switch (instance.connection) {
  | Some(connection) =>
    Connection.disconnect(Connection.Error.DisconnectedByUser, connection);
    instance.connection = None;
    instance.view.updateConnection(None, None);
  | None => ()
  };
};

let get = instance => {
  switch (instance.connection) {
  | Some(connection) => resolve(connection)
  | None => connect(instance)
  };
};
