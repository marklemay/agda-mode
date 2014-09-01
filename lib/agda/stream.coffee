{Transform} = require 'stream'
code = require './command-code'
Lex = require 'lex'

# concatenates outputs generated by Agda executable,
# "Agda2>" and newline as delimiter
class Rectify extends Transform
  constructor: ->
    super
      objectMode: true

  _buffer: ''
  _transform: (chunk, encoding, next) ->
    @_buffer += chunk.toString()

    # rips Agda2> prefix
    if @_buffer.startsWith 'Agda2>'
      @_buffer = @_buffer.substr 6

    lastIndex = @_buffer.lastIndexOf 'Agda2>'

    if lastIndex isnt -1
      block = @_buffer.substr 0, lastIndex
      for string in block.split '\n'
        if string.length isnt 0
          @push string
      @_buffer = @_buffer.substr (lastIndex + 6)
    next()


# make s-expression prettier
class Preprocess extends Transform
  constructor: ->
    super
      objectMode: true

  _transform: (chunk, encoding, next) ->

    # drop wierd prefix like ((last . 1))
    if chunk.startsWith '((last'
      index = chunk.indexOf '(agda'
      length = chunk.length
      chunk = chunk.substring index, length - 1



    @push chunk
    next()


class Lexer extends Transform

  constructor: ->
    super
      objectMode: true

  _transform: (chunk, encoding, next) ->
    @push chunk
    next()

class SExpression extends Transform

  constructor: ->
    super
      objectMode: true

  _transform: (chunk, encoding, next) ->
    [tokens, rest] = @takeList chunk
    @push tokens
    next()

  # helper function from Haskell
  head: (string) -> string.substr 0, 1
  tail: (string) -> string.substr 1
  take: (n, string) -> string.substr 0, n
  drop: (n, string) -> string.substr n

  # (a b "c" '(d r)) => [a, b, "c", [d, r]]
  takeList: (string) ->

    tokens = []

    # drop "("
    string = @tail string

    while string.length > 0
      switch @head string
        when ' '
          string = @tail string
          # console.log '[SPACE]', [string]
        when '('
          [token, string] = @takeList string
          # console.log '[List]', [token, string]
          tokens.push token, [string]
        when ')'
          string = @tail string
        when '\''
          [token, string] = @takeQuote string
          # console.log '[Quote]', [token, string]
          tokens.push token
        when '"'
          [token, string] = @takeString string
          # console.log '[String]', [token, string]
          tokens.push token
        else
          [token, string] = @takeAtom string
          # console.log '[Atom]', [token, string]
          tokens.push token

    # drop ")"
    rest = @tail string
    return [tokens, rest]

  takeAtom: (string) ->

    indexI = string.indexOf ' '
    indexP = string.indexOf ')'
    indexE = string.length

    if indexI isnt -1
      index = indexI
    else if indexP isnt -1
      index = indexP
    else
      index = indexE

    token = @take index, string
    rest = @drop index, string
    return [token, rest]

  takeQuote: (string) ->

    # drop '
    string = @tail string

    @takeList string

  takeString: (string) ->

    # drop "
    string = @tail string

    indexQ = string.indexOf '"'

    token = @take indexQ, string
    rest = @drop (indexQ + 1), string    # indexQ+1 to drop the closing "

    return [token, rest]


class ParseCommand extends Transform
  constructor: ->
    super
      objectMode: true

  _transform: (tokens, encoding, next) ->

    switch tokens[0]

      when "agda2-status-action" then command =
        type: code.STATUS_ACTION
        status: tokens[1]

      when "agda2-info-action" then command =
        type: code.INFO_ACTION
        header: tokens[1]
        content: tokens[2]

      when "agda2-goals-action" then command =
        type: code.GOALS_ACTION
        goals: tokens[1]

      when "agda2-highlight-clear" then command =
        type: code.HIGHLIGHT_CLEAR

      when "agda2-goto" then command =
        type: code.GOTO
        file: tokens[1]
        position: tokens[3]

      when "agda2-highlight-add-annotations" then command =
        type: code.HIGHLIGHT_ADD_ANNOTATIONS

      else
        throw 'wtf is this command? ' + JSON.stringify tokens
        command = type: UNKNOWN

    @push command
    next()

class Log extends Transform
  constructor: ->
    super
      objectMode: true

  _transform: (chunk, encoding, next) ->
    console.log chunk
    @push chunk
    next()

module.exports =
  Rectify:      Rectify
  Preprocess:   Preprocess
  SExpression:  SExpression
  ParseCommand: ParseCommand
  Log:          Log
