open Rebase;
open Async;

open Instance__Type;

module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;

open TextEditors;

let handleCommandError = instance =>
  thenError((error: error) => {
    (
      switch (error) {
      | ParseError(errors) =>
        let intro =
          string_of_int(Array.length(errors))
          ++ " errors arisen when trying to parse the following text responses from agda:\n\n";
        let message =
          errors
          |> Array.map(Parser.Error.toString)
          |> List.fromArray
          |> String.joinWith("\n\n");
        instance.view.display(
          "Parse Error",
          Type.View.Header.Error,
          Emacs(PlainText(intro ++ message)),
        );
      | ConnectionError(error) =>
        let (header, body) = Connection.Error.toString(error);
        instance.view.display(
          "Connection-related Error: " ++ header,
          Type.View.Header.Error,
          Emacs(PlainText(body)),
        );
      | Cancelled =>
        instance.view.display(
          "Query Cancelled",
          Type.View.Header.Error,
          Emacs(PlainText("")),
        )
      | GoalNotIndexed =>
        instance.view.display(
          "Goal not indexed",
          Type.View.Header.Error,
          Emacs(PlainText("Please reload to re-index the goal")),
        )
      | OutOfGoal =>
        instance.view.display(
          "Out of goal",
          Type.View.Header.Error,
          Emacs(PlainText("Please place the cursor in a goal")),
        )
      }
    )
    |> ignore;
    instance.editors |> Editors.Focus.on(Editors.Source);
    resolve();
  });

let handleResponse = (instance, response: Response.t): Async.t(unit, error) => {
  let textEditor = instance.editors.source;
  let filePath = textEditor |> Atom.TextEditor.getPath;
  let textBuffer = textEditor |> Atom.TextEditor.getBuffer;
  switch (response) {
  | HighlightingInfoDirect(_remove, annotations) =>
    annotations
    |> Array.filter(Highlighting.Annotation.shouldHighlight)
    |> Array.forEach(annotation => instance |> Highlightings.add(annotation));
    resolve();
  | HighlightingInfoIndirect(filepath) =>
    instance
    |> Highlightings.addFromFile(filepath)
    |> mapOk(() => N.Fs.unlink(filepath, _ => ()))
    |> mapError(_ => Cancelled)
  | Status(displayImplicit, checked) =>
    if (displayImplicit || checked) {
      instance.view.display(
        "Status",
        Type.View.Header.PlainText,
        Emacs(
          PlainText(
            "Typechecked: "
            ++ string_of_bool(checked)
            ++ "\nDisplay implicit arguments: "
            ++ string_of_bool(displayImplicit),
          ),
        ),
      )
      |> ignore;
    };
    resolve();
  | JumpToError(targetFilePath, index) =>
    if (targetFilePath == filePath) {
      let point =
        textBuffer |> Atom.TextBuffer.positionForCharacterIndex(index - 1);
      Js.Global.setTimeout(
        _ => Atom.TextEditor.setCursorBufferPosition(point, textEditor),
        0,
      )
      |> ignore;
    };
    resolve();
  | InteractionPoints(indices) =>
    instance |> Goals.instantiateAll(indices);
    resolve();
  | GiveAction(index, give) =>
    switch (Goals.find(index, instance)) {
    | None =>
      Js.log("error: cannot find goal #" ++ string_of_int(index));
      resolve();
    | Some(goal) =>
      switch (give) {
      | Paren =>
        let content = Goal.getContent(goal);
        Goal.setContent("(" ++ content ++ ")", goal) |> ignore;
      | NoParen => () /* do nothing */
      | String(content) =>
        Goal.setContent(
          content |> Js.String.replaceByRe([%re "/\\\\n/g"], "\n"),
          goal,
        )
        |> ignore
      };
      Goal.removeBoundary(goal);
      Goal.destroy(goal);
      resolve();
    }
  | MakeCase(makeCaseType, lines) =>
    let pointed = pointingAt(instance);
    switch (pointed) {
    | Some(goal) =>
      switch (makeCaseType) {
      | Function => Goal.writeLines(lines, goal)
      | ExtendedLambda => Goal.writeLambda(lines, goal)
      };
      instance |> instance.dispatch(Command.Primitive.Load);
    | None => reject(OutOfGoal)
    };
  | DisplayInfo(info) =>
    // instance.view.activate();
    let (text, style, body) = Response.Info.handle(info);
    instance.view.display(text, style, body);
    resolve();
  | ClearHighlighting =>
    instance |> Highlightings.destroyAll;
    resolve();
  | NoStatus => resolve()
  | RunningInfo(verbosity, message) =>
    if (verbosity >= 2) {
      instance.runningInfo
      |> RunningInfo.add(Parser.agdaOutput(message))
      |> ignore;
    } else {
      instance.view.display(
        "Type-checking",
        Type.View.Header.PlainText,
        Emacs(PlainText(message)),
      )
      |> ignore;
    };

    resolve();
  | ClearRunningInfo => resolve()
  | DoneAborting =>
    instance.view.display(
      "Status",
      Type.View.Header.Warning,
      Emacs(PlainText("Done aborting")),
    )
    |> ignore;
    resolve();
  | SolveAll(solutions) =>
    let solve = ((index, solution)) => {
      switch (Goals.find(index, instance)) {
      | None => resolve()
      | Some(goal) =>
        goal |> Goal.setContent(solution) |> ignore;
        Goals.setCursor(goal, instance);
        instance.dispatch(Give, instance);
      };
    };

    // solve them one by one
    solutions
    |> Array.reduce(
         (promise, solution) =>
           promise |> thenOk(() => solve(solution) |> thenOk(() => resolve())),
         resolve(),
       )
    |> thenOk(() => {
         let size = Array.length(solutions);
         if (size == 0) {
           instance.view.display(
             "No solutions found",
             Type.View.Header.PlainText,
             Emacs(PlainText("")),
           );
         } else {
           instance.view.display(
             string_of_int(size) ++ " goals solved",
             Type.View.Header.Success,
             Emacs(PlainText("")),
           );
         };
         resolve();
       });
  };
};

let handleResponseAndRecoverCursor = (instance, response) =>
  instance
  |> recoverCursor(() => handleResponse(instance, response))
  |> mapOk(_ => ());

/* Primitive Command => Remote Command */
let rec handleLocalCommand =
        (command: Command.Primitive.t, instance)
        : Async.t(option(Command.Remote.t), error) => {
  let buff = (command, instance) => {
    Connections.get(instance)
    |> mapOk(connection => {
         instance.view.display(
           "Loading ...",
           Type.View.Header.PlainText,
           Emacs(PlainText("")),
         );

         Some(
           {
             connection,
             filepath: instance.editors.source |> Atom.TextEditor.getPath,
             command,
           }: Command.Remote.t,
         );
       })
    |> mapError(_ => Cancelled);
  };
  switch (command) {
  | Load =>
    /* force save before load */
    instance.editors.source
    |> Atom.TextEditor.save
    |> fromPromise
    |> mapError(_ => Cancelled)
    |> thenOk(() => {
         instance.isLoaded = true;
         instance.view.activate();
         instance.view.updateShouldDisplay(true);
         instance.view.display(
           "Connecting ...",
           Type.View.Header.PlainText,
           Emacs(PlainText("")),
         )
         |> ignore;
         instance |> buff(Load);
       })
  | Abort => instance |> buff(Abort)
  | Quit =>
    Connections.disconnect(instance);
    instance |> Goals.destroyAll;
    instance |> Highlightings.destroyAll;
    instance.view.deactivate();
    instance.isLoaded = false;
    instance.view.updateShouldDisplay(false);
    resolve(None);
  | Restart =>
    Connections.disconnect(instance);
    instance |> buff(Load);
  | Compile => instance |> buff(Compile)
  | ToggleDisplayOfImplicitArguments =>
    instance |> buff(ToggleDisplayOfImplicitArguments)
  | SolveConstraints => instance |> buff(SolveConstraints)
  | ShowConstraints => instance |> buff(ShowConstraints)
  | ShowGoals => instance |> buff(ShowGoals)
  | NextGoal =>
    let nextGoal = instance |> Goals.getNextGoalPosition;
    /* jump */
    nextGoal
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    resolve(None);
  | PreviousGoal =>
    let previousGoal = instance |> Goals.getPreviousGoalPosition;
    /* jump */
    previousGoal
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    resolve(None);

  | ToggleDocking =>
    instance.view.toggleDocking();
    resolve(None);
  | Give =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view.inquire("Give", "expression to give:", "")
           |> mapError(_ => Cancelled)
           |> thenOk(result => {
                goal |> Goal.setContent(result) |> ignore;
                instance |> buff(Give(goal, index));
              });
         } else {
           instance |> buff(Give(goal, index));
         }
       )

  | WhyInScope =>
    let selectedText =
      instance.editors.source |> Atom.TextEditor.getSelectedText;
    if (String.isEmpty(selectedText)) {
      instance.view.inquire("Scope info", "name:", "")
      |> mapError(_ => Cancelled)
      |> thenOk(expr =>
           instance
           |> getPointedGoal
           |> thenOk(getGoalIndex)
           |> thenOk(((_, index)) =>
                instance |> buff(WhyInScope(expr, index))
              )
         );
    } else {
      /* global */
      instance |> buff(WhyInScopeGlobal(selectedText));
    };

  | SearchAbout(normalization) =>
    instance.view.inquire(
      "Searching through definitions ["
      ++ Command.Normalization.of_string(normalization)
      ++ "]",
      "expression to infer:",
      "",
    )
    |> mapError(_ => Cancelled)
    |> thenOk(expr => instance |> buff(SearchAbout(normalization, expr)))

  | InferType(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    /* goal-specific */
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view.inquire(
             "Infer type ["
             ++ Command.Normalization.of_string(normalization)
             ++ "]",
             "expression to infer:",
             "",
           )
           |> mapError(_ => Cancelled)
           |> thenOk(expr =>
                instance |> buff(InferType(normalization, expr, index))
              );
         } else {
           instance |> buff(Give(goal, index));
         }
       )
    /* global  */
    |> handleOutOfGoal(_ =>
         instance.view.inquire(
           "Infer type ["
           ++ Command.Normalization.of_string(normalization)
           ++ "]",
           "expression to infer:",
           "",
         )
         |> mapError(_ => Cancelled)
         |> thenOk(expr =>
              instance |> buff(InferTypeGlobal(normalization, expr))
            )
       )

  | ModuleContents(normalization) =>
    instance.view.inquire(
      "Module contents ["
      ++ Command.Normalization.of_string(normalization)
      ++ "]",
      "module name:",
      "",
    )
    |> mapError(_ => Cancelled)
    |> thenOk(expr =>
         instance
         |> getPointedGoal
         |> thenOk(getGoalIndex)
         |> thenOk(((_, index)) =>
              instance |> buff(ModuleContents(normalization, expr, index))
            )
         |> handleOutOfGoal(_ =>
              instance |> buff(ModuleContentsGlobal(normalization, expr))
            )
       )

  | ComputeNormalForm(computeMode) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view.inquire(
             "Compute normal form",
             "expression to normalize:",
             "",
           )
           |> mapError(_ => Cancelled)
           |> thenOk(expr =>
                instance |> buff(ComputeNormalForm(computeMode, expr, index))
              );
         } else {
           let expr = Goal.getContent(goal);
           instance |> buff(ComputeNormalForm(computeMode, expr, index));
         }
       )
    |> handleOutOfGoal(_ =>
         instance.view.inquire(
           "Compute normal form",
           "expression to normalize:",
           "",
         )
         |> mapError(_ => Cancelled)
         |> thenOk(expr =>
              instance |> buff(ComputeNormalFormGlobal(computeMode, expr))
            )
       )

  | Refine =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) => instance |> buff(Refine(goal, index)))

  | Auto =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) => instance |> buff(Refine(goal, index)))

  | Case =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view.inquire("Case", "expression to case:", "")
           |> mapError(_ => Cancelled)
           |> thenOk(result => {
                goal |> Goal.setContent(result) |> ignore;
                instance |> buff(Case(goal, index));
              });
         } else {
           instance |> buff(Case(goal, index));
         }
       )

  | GoalType(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((_, index)) =>
         instance |> buff(GoalType(normalization, index))
       )
  | Context(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((_, index)) =>
         instance |> buff(Context(normalization, index))
       )
  | GoalTypeAndContext(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((_, index)) =>
         instance |> buff(GoalTypeAndContext(normalization, index))
       )

  | GoalTypeAndInferredType(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         instance
         |> buff(GoalTypeAndInferredType(normalization, goal, index))
       )

  | InputSymbol(symbol) =>
    let enabled = Atom.Environment.Config.get("agda-mode.inputMethod");
    if (enabled) {
      instance.view.updateShouldDisplay(true);
      switch (symbol) {
      | Ordinary =>
        instance.view.activate();
        instance.view.activateInputMethod(true);
      | CurlyBracket => instance.view.interceptAndInsertKey("{")
      | Bracket => instance.view.interceptAndInsertKey("[")
      | Parenthesis => instance.view.interceptAndInsertKey("(")
      | DoubleQuote => instance.view.interceptAndInsertKey("\"")
      | SingleQuote => instance.view.interceptAndInsertKey("'")
      | BackQuote => instance.view.interceptAndInsertKey("`")
      | Abort => instance.view.activateInputMethod(false)
      };
      ();
    } else {
      instance.editors
      |> Editors.Focus.get
      |> Atom.TextEditor.insertText("\\")
      |> ignore;
    };
    resolve(None);

  | QuerySymbol =>
    let selected = instance.editors |> Editors.getSelectedSymbol;
    let getSymbol =
      if (String.isEmpty(String.trim(selected))) {
        instance.view.updateShouldDisplay(true);
        instance.view.activate();
        instance.view.inquire(
          "Lookup Unicode Symbol Input Sequence",
          "symbol to lookup:",
          "",
        );
      } else {
        resolve(selected);
      };

    getSymbol
    |> finalOk(symbol =>
         symbol
         |> Translator.lookup
         |> Option.forEach(sequences =>
              instance.view.display(
                "Input sequence for " ++ symbol,
                Type.View.Header.PlainText,
                Emacs(
                  PlainText(
                    sequences |> List.fromArray |> String.joinWith("\n"),
                  ),
                ),
              )
            )
       )
    |> ignore;
    resolve(None);

  | Jump(Type.Location.Range.HoleLink(index)) =>
    let positions = instance |> Goals.getPositions;

    instance.editors |> Editors.Focus.on(Source);
    positions[index]
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    resolve(None);
  | Jump(Type.Location.Range.RangeLink(range)) =>
    open Type.Location.Range;
    let filePath = instance.editors.source |> Atom.TextEditor.getPath;
    let (shouldJump, otherFilePath) =
      switch (range) {
      | NoRange => (false, None)
      | Range(None, _) => (true, None)
      | Range(Some(path), _) => (
          true,
          path == filePath ? None : Some(path),
        )
      };
    if (shouldJump) {
      switch (otherFilePath) {
      | None =>
        let ranges = toAtomRanges(range);
        if (ranges[0] |> Option.isSome) {
          Js.Global.setTimeout(
            _ =>
              instance.editors.source
              |> Atom.TextEditor.setSelectedBufferRanges(ranges),
            0,
          )
          |> ignore;
        };
        resolve(None);
      | Some(uri) =>
        let (line, column) =
          switch (range) {
          | NoRange => (0, 0)
          | Range(_, is) =>
            switch (is[0]) {
            | None => (0, 0)
            | Some(i) => (i.start.line - 1, i.start.col - 1)
            }
          };
        let option = {
          "initialLine": line,
          "initialColumn": column,
          "split": "right",
          "activatePane": true,
          "activateItem": true,
          "pending": false,
          "searchAllPanes": true,
          "location": (None: option(string)),
        };

        Atom.Environment.Workspace.open_(uri, option)
        |> fromPromise
        |> then_(_ => resolve(None), _ => reject(Cancelled));
      };
    } else {
      resolve(None);
    };
  | GotoDefinition =>
    if (instance.isLoaded) {
      let name =
        instance
        |> recoverCursor(() => Editors.getSelectedTextNode(instance.editors));

      instance
      |> getPointedGoal
      |> thenOk(getGoalIndex)
      |> thenOk(((_, index)) =>
           instance |> buff(GotoDefinition(name, index))
         )
      |> handleOutOfGoal(_ => instance |> buff(GotoDefinitionGlobal(name)));
    } else {
      /* dispatch again if not already loaded  */
      instance
      |> instance.dispatch(Command.Primitive.Load)
      |> handleCommandError(instance)
      |> thenOk(_ =>
           instance |> handleLocalCommand(Command.Primitive.GotoDefinition)
         );
    }
  };
};

/* Remote Command => Responses */
let handleRemoteCommand = (instance, remote) =>
  switch (remote) {
  | None => resolve()
  | Some(cmd) =>
    let handleResults = ref([||]);
    let parseErrors: ref(array(Parser.Error.t)) = ref([||]);
    /* send the serialized command */
    let serialized = Command.Remote.serialize(cmd);

    let onResponse = (resolve', reject') => (
      fun
      | Ok(Connection.Data(response)) => {
          let result =
            instance
            |> recoverCursor(() => handleResponse(instance, response));
          handleResults := Array.concat([|result|], handleResults^);
        }
      | Ok(Connection.Error(error)) =>
        parseErrors := Array.concat([|error|], parseErrors^)
      | Ok(Connection.End) =>
        if (Array.length(parseErrors^) > 0) {
          reject'(ParseError(parseErrors^)) |> ignore;
        } else {
          handleResults^ |> all |> mapOk(_ => resolve'()) |> ignore;
        }
      | Error(error) =>
        reject'(ConnectionError(Connection.Error.ConnectionError(error)))
        |> ignore
    );

    Async.make((resolve', reject') =>
      cmd.connection
      |> Connection.send(serialized)
      |> Event.on(onResponse(resolve', reject'))
      |> ignore
    );
  };

let dispatch = (command, instance): Async.t(unit, error) => {
  instance
  |> handleLocalCommand(command)
  |> pass(_ => startCheckpoint(command, instance))
  |> pass(_ => instance.view.updateIsPending(true))
  |> thenOk(handleRemoteCommand(instance))
  |> pass(_ => endCheckpoint(instance))
  |> pass(_ => instance.view.updateIsPending(false));
};
