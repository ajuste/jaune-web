{
  create
} = require '../'

{
  ok
} = require 'assert'

describe 'create', ->

  it 'checks create runs', ->
    ok create()
